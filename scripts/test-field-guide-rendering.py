#!/usr/bin/env python3
"""Browser checks against the real Astro build, not hand-rendered substitutes."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'verification/field-guide'
OUT.mkdir(parents=True, exist_ok=True)
PUBLISHED = ['open-closed-principle', 'switch-statements', 'deadlock']
REVIEW = ['single-responsibility-principle', 'liskov-substitution-principle', 'interface-segregation-principle', 'dependency-inversion-principle']
base = '/guides/software-engineering/'
routes = [(base + slug + '/', True) for slug in PUBLISHED]
review_base = base + 'review/solid-batch-1/'
for slug in REVIEW:
    if (ROOT / 'dist' / review_base.lstrip('/') / slug / 'index.html').exists():
        routes.append((review_base + slug + '/', False))
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT / 'dist')))
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
origin = f'http://127.0.0.1:{server.server_port}'
report = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        for path, published in routes:
            response = page.goto(origin + path, wait_until='networkidle')
            assert response.status == 200, path
            assert page.locator('h1').count() == 1, (path, 'one heading')
            assert page.locator('[data-field-guide-pilot]').count() == 1, (path, 'one layout')
            assert page.locator('.pilot-body').inner_text().strip(), path
            assert page.locator('.pilot-body pre').count() >= 2, path
            robots = page.locator('meta[name="robots"]')
            if published:
                assert not robots.count() or 'noindex' not in robots.get_attribute('content'), path
                assert page.locator('.pilot-status').count() == 0, path
                assert 'Review' not in page.title() and 'Pilot' not in page.title(), path
            else:
                assert 'noindex' in robots.get_attribute('content'), path
            assert page.locator('link[rel="canonical"]').get_attribute('href').endswith(path), path
            for language in ['csharp', 'python', 'both']:
                page.locator(f'[data-pilot-choice="{language}"]').click()
                assert page.locator(f'[data-pilot-choice="{language}"]').get_attribute('aria-pressed') == 'true'
                for example_language in ['csharp', 'python']:
                    sections = page.locator(f'.pilot-body [data-pilot-language="{example_language}"]')
                    assert sections.count() > 0, (path, example_language)
                    for section in sections.all():
                        assert section.is_visible() == (language in [example_language, 'both']), (path, language)
            page.locator('[data-pilot-choice="python"]').click()
            page.reload(wait_until='networkidle')
            assert page.locator('[data-pilot-choice="python"]').get_attribute('aria-pressed') == 'true'
            page.locator('[data-pilot-choice="csharp"]').click()
            page.evaluate('window.scrollTo(0, 0)')
            slug = path.rstrip('/').split('/')[-1]
            page.screenshot(path=str(OUT / (slug + '-desktop.png')))
            page.set_viewport_size({'width': 390, 'height': 844})
            page.screenshot(path=str(OUT / (slug + '-mobile.png')))
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), (path, 'page overflow')
            page.locator('.pilot-body pre').first.scroll_into_view_if_needed()
            page.screenshot(path=str(OUT / (slug + '-mobile-code.png')))
            page.set_viewport_size({'width': 1280, 'height': 900})
            # Every in-article fragment link must refer to a real ID.
            missing = page.locator('.pilot-body').evaluate('(root) => [...root.querySelectorAll("a[href^=\\\"#\\\"]")].map(a => a.getAttribute("href").slice(1)).filter(id => !document.getElementById(id))')
            assert not missing, (path, missing)
            report.append({'path': path, 'published': published, 'language_controls': 'pass', 'narrow_layout': 'pass', 'anchors': 'pass'})
        assert not errors, errors
        context.close()
        no_js = browser.new_context(java_script_enabled=False)
        page = no_js.new_page()
        for path, _ in routes:
            page.goto(origin + path)
            assert not page.locator('.language-controls').is_visible()
            assert page.locator('.pilot-body [data-pilot-language="csharp"]').first.is_visible()
            assert page.locator('.pilot-body [data-pilot-language="python"]').first.is_visible()
        no_js.close()
        browser.close()
    (OUT / 'report.json').write_text(json.dumps({'pages': report, 'javascript_disabled': 'pass', 'page_errors': []}, indent=2))
    print('PASS rendered pages, language controls, saved preference, metadata, anchors, narrow layouts, and no-JavaScript fallback')
finally:
    server.shutdown()
