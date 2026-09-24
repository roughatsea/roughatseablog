#!/usr/bin/env python3
"""Validate all canonical guide pages in the actual built site, not a mock layout.

Requires the complete source inventory and preserved approved sources. Browser
checks cover both language modes, narrow layout, no-JavaScript fallback, links,
and index content. Live mode performs read-only checks on all published URLs.
These checks do not certify pedagogy or prove every program behavior.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from functools import partial
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import threading
import time
from urllib.parse import unquote, urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'verification/field-guide-release'
PREFIX = '/guides/software-engineering/'
REPRESENTATIVES = {
    'open-closed-principle', 'single-responsibility-principle', 'long-method',
    'extract-method', 'factory-method', 'decorator', 'observer', 'ports-and-adapters',
    'cqrs-and-event-sourcing', 'integration-contract-and-end-to-end-tests',
    'async-await', 'saga-and-transactional-outbox', 'slis-slos-and-error-budgets',
    'threat-modeling-and-secure-design', 'database-indexes-and-query-plans',
    'load-stress-soak-and-capacity-testing',
}


def inventory():
    source = (ROOT / 'src/data/code-guru/concept-slugs.js').read_text()
    slugs = set(re.findall(r"\d+: '([^']+)'", source)) | {'singleton-lifetime'}
    assert len(slugs) == 206, f'Unexpected catalog size: {len(slugs)}'
    reference = json.loads((ROOT / 'experiments/field-guide-approved-source-sha256.json').read_text())
    assert len(reference) == 7
    for path, expected in reference.items():
        actual = hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
        assert actual == expected, f'Approved source changed: {path}'
    approved = {'single-responsibility-principle', 'open-closed-principle',
                'liskov-substitution-principle', 'interface-segregation-principle',
                'dependency-inversion-principle', 'switch-statements',
                'deadlocks-and-lock-discipline'}
    additions = {p.stem for p in (ROOT / 'src/content/field-guide').glob('*.mdx')}
    assert additions == slugs - approved, f'Incomplete inventory: {sorted(slugs - approved - additions)}'
    return sorted(slugs)


def live(origin, slugs):
    """Read-only fetches: modest concurrency, bounded timeouts, transient retries."""
    def check(slug):
        path = PREFIX + slug + '/'
        error = None
        for attempt in range(3):
            try:
                request = Request(urljoin(origin, path), headers={'User-Agent': 'RoughAtSea-Guide-Release-Verification'})
                with urlopen(request, timeout=30) as response:
                    html = response.read().decode('utf-8')
                    assert response.status == 200
                    final_url = response.url
                assert 'data-publication="published"' in html, 'replacement missing'
                assert 'class="recognition-block"' not in html, 'legacy template returned'
                assert len(re.findall(r'<h1\b', html)) == 1, 'wrong h1 count'
                canonical = re.search(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', html)
                assert canonical and urlparse(canonical.group(1)).path.rstrip('/') == path.rstrip('/'), 'wrong canonical'
                assert not re.search(r'<meta[^>]+name="robots"[^>]+content="[^"]*noindex', html), 'noindex'
                assert 'data-pilot-language="csharp"' in html and 'data-pilot-language="python"' in html
                return {'slug': slug, 'status': 'passed', 'url': final_url,
                        'html_sha256': hashlib.sha256(html.encode()).hexdigest()}
            except Exception as exc:
                error = str(exc)
                if attempt < 2:
                    time.sleep(1 + attempt)
        return {'slug': slug, 'status': 'failed', 'error': error}
    with ThreadPoolExecutor(max_workers=4) as pool:
        rows = list(pool.map(check, slugs))
    report = {'origin': origin, 'canonical_pages': len(rows), 'passed': sum(r['status'] == 'passed' for r in rows), 'pages': rows}
    (OUT / 'live.json').write_text(json.dumps(report, indent=2))
    failed = [r for r in rows if r['status'] != 'passed']
    assert not failed, json.dumps(failed, indent=2)
    print(f'PASS LIVE: all {len(rows)} canonical replacements')


def built(slugs):
    from playwright.sync_api import sync_playwright
    dist = ROOT / 'dist'
    assert dist.is_dir(), 'Build the actual site before browser verification'
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(dist)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f'http://127.0.0.1:{server.server_port}'
    screenshots = OUT / 'screenshots'; screenshots.mkdir(parents=True, exist_ok=True)
    results = []
    expected_descriptions = {}
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            context = browser.new_context(viewport={'width': 1280, 'height': 900})
            page = context.new_page()
            page.set_default_timeout(10000)
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            for position, slug in enumerate(slugs, 1):
                path = PREFIX + slug + '/'
                response = page.goto(origin + path, wait_until='load')
                assert response and response.status == 200, path
                assert page.locator('h1').count() == 1, (slug, 'h1')
                root = page.locator('[data-field-guide-pilot]')
                assert root.count() == 1 and root.get_attribute('data-publication') == 'published', slug
                assert page.locator('.recognition-block').count() == 0, slug
                assert 'export const checks' not in root.inner_text(), (slug, 'unrendered metadata')
                assert urlparse(page.locator('link[rel="canonical"]').get_attribute('href')).path.rstrip('/') == path.rstrip('/'), slug
                robots = page.locator('meta[name="robots"]')
                assert robots.count() == 0 or 'noindex' not in (robots.get_attribute('content') or ''), slug
                description = page.locator('meta[name="description"]').get_attribute('content')
                assert description and len(description) > 20, slug
                expected_descriptions[slug] = description
                assert len(root.locator('.pilot-body').inner_text()) > 500, (slug, 'empty lesson')
                for language, other in [('csharp', 'python'), ('python', 'csharp')]:
                    page.locator(f'[data-pilot-choice="{language}"]').click()
                    shown = root.locator(f'.pilot-body [data-pilot-language="{language}"]')
                    hidden = root.locator(f'.pilot-body [data-pilot-language="{other}"]')
                    assert shown.count() and hidden.count(), (slug, 'missing language path')
                    assert all(shown.nth(i).is_visible() for i in range(shown.count())), (slug, language)
                    assert not any(hidden.nth(i).is_visible() for i in range(hidden.count())), (slug, other)
                    page.set_viewport_size({'width': 390, 'height': 844})
                    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), (slug, language, 'page overflow')
                page.reload(wait_until='load')
                assert root.get_attribute('data-pilot-language') == 'python', (slug, 'language persistence')
                page.locator('[data-pilot-choice="both"]').click()
                for language in ['csharp', 'python']:
                    assert root.locator(f'.pilot-body [data-pilot-language="{language}"]').first.is_visible()
                ids = page.locator('[id]').evaluate_all('(nodes) => nodes.map(node => node.id)')
                for href in root.locator('a[href]').evaluate_all('(nodes) => nodes.map(node => node.getAttribute("href"))'):
                    if href.startswith('#'):
                        assert unquote(href[1:]) in ids, (slug, 'broken anchor', href)
                    elif href.startswith(PREFIX):
                        target = urlparse(href).path.strip('/')
                        assert (dist / target / 'index.html').exists(), (slug, 'broken guide link', href)
                if slug in REPRESENTATIVES:
                    page.locator('[data-pilot-choice="csharp"]').click()
                    page.evaluate('window.scrollTo(0, 0)')
                    page.screenshot(path=str(screenshots / f'{slug}-mobile.png'))
                    root.locator('.pilot-body pre').first.scroll_into_view_if_needed()
                    page.screenshot(path=str(screenshots / f'{slug}-mobile-code.png'))
                    page.set_viewport_size({'width': 1280, 'height': 900})
                    page.evaluate('window.scrollTo(0, 0)')
                    page.screenshot(path=str(screenshots / f'{slug}-desktop.png'))
                results.append({'slug': slug, 'title': page.locator('h1').inner_text(), 'description': description, 'status': 'passed'})
                assert not errors, (slug, errors)
                if position % 20 == 0: print(f'PASS browser: {position}/{len(slugs)} canonical pages')

            no_js = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
            plain = no_js.new_page()
            for slug in slugs:
                plain.goto(origin + PREFIX + slug + '/', wait_until='load')
                assert not plain.locator('.language-controls').is_visible(), (slug, 'dead controls without JS')
                for language in ['csharp', 'python']:
                    sections = plain.locator(f'.pilot-body [data-pilot-language="{language}"]')
                    assert sections.count() and all(sections.nth(i).is_visible() for i in range(sections.count())), (slug, 'no-JS fallback', language)
            no_js.close()

            page.set_viewport_size({'width': 1280, 'height': 900})
            page.goto(origin + PREFIX, wait_until='load')
            cards = page.locator('[data-guide-card]')
            assert cards.count() == 206
            for slug in slugs:
                card = cards.filter(has=page.locator(f'a[href="{PREFIX}{slug}/"]'))
                assert card.count() == 1, (slug, 'index missing or duplicated')
                text = re.sub(r'\s+', ' ', card.inner_text()).strip()
                expected = re.sub(r'\s+', ' ', expected_descriptions[slug]).strip()
                assert expected in text, (slug, 'index still uses old explanation')
            search = page.locator('[data-guide-search]')
            search.fill('OCP')
            assert page.locator(f'[data-guide-card]:visible a[href="{PREFIX}open-closed-principle/"]').count() == 1
            search.fill('')
            assert page.locator('[data-guide-card]:visible').count() == 206
            assert not errors, errors
            context.close(); browser.close()
    finally:
        server.shutdown(); server.server_close()
    report = {'canonical_pages': len(results), 'approved_source_hashes_verified': 7,
              'language_modes': ['csharp', 'python', 'both'], 'mobile_width': 390,
              'no_javascript_pages': len(slugs), 'index_cards': 206,
              'representative_screenshots': len(list(screenshots.glob('*.png'))), 'pages': results}
    (OUT / 'browser.json').write_text(json.dumps(report, indent=2))
    print('PASS all canonical metadata, language paths, mobile layout, internal guide links, source anchors, no-JS fallback, and index descriptions')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--origin', help='Read-only verification of a deployed origin instead of the local build')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    slugs = inventory()
    if args.origin:
        live(args.origin, slugs)
    else:
        built(slugs)


if __name__ == '__main__':
    main()
