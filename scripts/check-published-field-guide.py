#!/usr/bin/env python3
"""Read-only checks of the live published replacements; save evidence for review."""
from html.parser import HTMLParser
from pathlib import Path
import json
import time
from urllib.request import Request, urlopen

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.published = 0
        self.headings = 0
        self.noindex = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'article' and attrs.get('data-publication') == 'published':
            self.published += 1
        if tag == 'h1':
            self.headings += 1
        if tag == 'meta' and attrs.get('name') == 'robots' and 'noindex' in attrs.get('content', ''):
            self.noindex = True

slugs = ['open-closed-principle', 'switch-statements', 'deadlocks-and-lock-discipline']
out = Path('verification/field-guide/production')
out.mkdir(parents=True, exist_ok=True)
report = []
for slug in slugs:
    url = 'https://roughatsea.com/guides/software-engineering/' + slug + '/'
    request = Request(url + '?verify=' + str(int(time.time())), headers={'User-Agent': 'RoughAtSea-publication-check', 'Cache-Control': 'no-cache'})
    with urlopen(request, timeout=40) as response:
        body = response.read().decode('utf-8')
        status = response.status
        final_url = response.url
    (out / (slug + '.html')).write_text(body)
    page = Page()
    page.feed(body)
    assert status == 200 and page.published == 1 and page.headings == 1 and not page.noindex, (slug, status, page.__dict__)
    assert 'Recognize it when' not in body, slug
    report.append({'url': url, 'resolved_url': final_url, 'status': status, 'published_layout': True, 'indexable': True})
(out / 'report.json').write_text(json.dumps(report, indent=2))
print('PASS live production: all three canonical routes serve the indexable approved-article layout')
