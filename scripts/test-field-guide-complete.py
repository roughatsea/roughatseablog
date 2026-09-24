#!/usr/bin/env python3
"""Publication gate for all 206 field-guide entries.

This does not grade teaching quality or prove all behavior. It verifies inventory,
approved source preservation, source-to-rendered example identity, metadata,
local links, language controls, and browser layout. Optional live checks compare
production content with the built content rather than accepting any HTTP 200.

Requirements: beautifulsoup4, PyYAML; --browser also needs Playwright/Chromium.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import partial
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import threading
import time
from typing import Any
from urllib.parse import unquote, urljoin, urlsplit
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup
import yaml

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'verification/field-guide-complete'
BASE_PATH = '/guides/software-engineering/'
FENCE = re.compile(r'^```(csharp|python)[^\n]*\n(.*?)^```\s*$', re.M | re.S)
APPROVED_PATHS = {
    'open-closed-principle': 'src/pages/guides/software-engineering/pilot/open-closed-principle.mdx',
    'switch-statements': 'src/pages/guides/software-engineering/pilot/switch-statements.mdx',
    'deadlocks-and-lock-discipline': 'src/pages/guides/software-engineering/pilot/deadlock.mdx',
    **{slug: f'src/pages/guides/software-engineering/review/solid-batch-1/{slug}.mdx'
       for slug in ('single-responsibility-principle', 'liskov-substitution-principle',
                    'interface-segregation-principle', 'dependency-inversion-principle')},
}
SAMPLES = {
    'open-closed-principle', 'switch-statements', 'deadlocks-and-lock-discipline',
    'dependency-inversion-principle', 'extract-method', 'strategy', 'factory-method',
    'integration-contract-and-end-to-end-tests', 'retries-circuit-breakers-and-bulkheads',
    'metrics-traces-and-correlation-context', 'slis-slos-and-error-budgets',
    'threat-modeling-and-secure-design', 'secrets-encryption-and-password-hashing',
    'database-indexes-and-query-plans', 'load-stress-soak-and-capacity-testing',
}


def require(condition: Any, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def digest(value: bytes | str) -> str:
    return hashlib.sha256(value if isinstance(value, bytes) else value.encode()).hexdigest()


def save_report(name: str, value: Any) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def load_inventory() -> dict[str, dict[str, Any]]:
    text = (ROOT / 'src/data/code-guru/concept-slugs.js').read_text(encoding='utf-8')
    known = set(re.findall(r"\d+: '([^']+)'", text)) | {'singleton-lifetime'}
    require(len(known) == 206, f'Expected 206 canonical entries; found {len(known)}')
    paths = {p.stem: str(p.relative_to(ROOT))
             for p in (ROOT / 'src/content/field-guide').glob('*.mdx')}
    require(not (set(paths) & set(APPROVED_PATHS)), 'An approved article has a duplicate replacement')
    require(set(paths) == known - set(APPROVED_PATHS),
            f'Incomplete or unexpected rewrite: missing={sorted(known-set(APPROVED_PATHS)-set(paths))}; '
            f'unknown={sorted(set(paths)-known)}')
    manifest = json.loads((ROOT / 'experiments/field-guide-approved-manifest.json').read_text())
    require(set(manifest['files']) == set(APPROVED_PATHS.values()), 'Approved manifest does not cover the seven approved sources')
    inventory = {}
    for slug, filename in sorted({**paths, **APPROVED_PATHS}.items()):
        raw = (ROOT / filename).read_bytes()
        if filename in manifest['files']:
            require(digest(raw) == manifest['files'][filename], f'{slug}: reader-approved source changed')
        source = raw.decode('utf-8')
        front = re.match(r'\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)', source, re.S)
        require(front, f'{slug}: missing frontmatter')
        metadata = yaml.safe_load(front.group(1))
        for key in ('title', 'description', 'prerequisites'):
            require(isinstance(metadata.get(key), str) and metadata[key].strip(), f'{slug}: missing {key}')
        snippets = [(language, code.rstrip('\n')) for language, code in FENCE.findall(source)]
        require({language for language, _ in snippets} == {'csharp', 'python'}, f'{slug}: missing language examples')
        inventory[slug] = {
            'path': filename, 'sha256': digest(raw), 'title': metadata['title'],
            'description': metadata['description'], 'snippets': snippets,
            'approved': filename in manifest['files'],
        }
    save_report('inventory.json', {
        'canonical_articles': len(inventory), 'new_rewrites': len(paths),
        'approved_sources_hash_verified': len(APPROVED_PATHS), 'complete': True,
        'articles': [{k: v for k, v in item.items() if k != 'snippets'} |
                     {'slug': slug, 'displayed_snippets': len(item['snippets'])}
                     for slug, item in inventory.items()],
    })
    print('PASS source inventory: 199 rewrites + 7 hash-verified approved articles = 206')
    return inventory


def check_article(html: str, slug: str, source: dict[str, Any]) -> dict[str, Any]:
    soup = BeautifulSoup(html, 'html.parser')
    path = BASE_PATH + slug + '/'
    require(len(soup.select('h1')) == 1, f'{slug}: expected one article heading')
    require(soup.h1.get_text(' ', strip=True) == source['title'], f'{slug}: heading does not match source')
    require(len(soup.select('[data-field-guide-pilot][data-publication="published"]')) == 1,
            f'{slug}: missing published replacement layout')
    require(len(soup.select('.pilot-body')) == 1, f'{slug}: missing article body')
    body = soup.select_one('.pilot-body')
    require(len(body.get_text(strip=True)) > 300, f'{slug}: empty or incomplete article body')
    require('export const checks' not in body.get_text(), f'{slug}: test metadata leaked into prose')
    require(not soup.select('.pilot-status'), f'{slug}: review label on canonical page')
    require('Recognize it when' not in soup.get_text(), f'{slug}: legacy introductory label remains')
    require(soup.title and 'Field Guide Review' not in soup.title.get_text() and
            'Software Engineering Field Guide' in soup.title.get_text(), f'{slug}: wrong production title')
    description = soup.select_one('meta[name="description"]')
    require(description and description.get('content') == source['description'], f'{slug}: description mismatch')
    canonical = soup.select('link[rel="canonical"]')
    require(len(canonical) == 1, f'{slug}: expected one canonical URL')
    canonical_url = urlsplit(canonical[0].get('href', ''))
    require(canonical_url.scheme == 'https' and canonical_url.hostname in ('roughatsea.com', 'www.roughatsea.com')
            and canonical_url.path.rstrip('/') == path.rstrip('/'), f'{slug}: wrong canonical URL')
    robots = soup.select_one('meta[name="robots"]')
    require(not robots or 'noindex' not in robots.get('content', '').lower(), f'{slug}: production page is noindex')
    rendered = [(pre['data-language'], pre.get_text().rstrip('\n'))
                for pre in body.select('pre[data-language]') if pre['data-language'] in ('csharp', 'python')]
    require(rendered == source['snippets'], f'{slug}: displayed code differs from the tested source fences')
    for language in ('csharp', 'python'):
        sections = body.select(f'[data-pilot-language="{language}"]')
        require(sections, f'{slug}: missing {language} explanatory sections')
        for pre in body.select(f'pre[data-language="{language}"]'):
            require(pre.find_parent(attrs={'data-pilot-language': language}),
                    f'{slug}: code sits outside its language-specific teaching path')
    ids = [tag['id'] for tag in soup.select('[id]')]
    require(len(ids) == len(set(ids)), f'{slug}: duplicate element IDs')
    for link in body.select('a[href^="#"]'):
        fragment = unquote(link['href'][1:])
        require(not fragment or fragment in ids, f'{slug}: broken source/section link #{fragment}')
    require(body.select('a[href^="https://"]'), f'{slug}: missing external sources')
    normalized = re.sub(r'\s+', ' ', body.get_text(' ', strip=True))
    return {'slug': slug, 'title': source['title'], 'status': 'passed',
            'snippets_equal_to_source': len(rendered), 'body_sha256': digest(normalized),
            'canonical': canonical[0]['href']}


def check_index(html: str, inventory: dict[str, dict[str, Any]]) -> dict[str, Any]:
    soup = BeautifulSoup(html, 'html.parser')
    cards = soup.select('[data-guide-card]')
    require(len(cards) == 206, f'Index has {len(cards)} entries, not 206')
    require('Recognize it when' not in soup.get_text(), 'Index still labels definitions as recognition advice')
    found = set()
    for card in cards:
        link = card.select_one('h2 a[href]')
        require(link, 'Index card has no canonical article link')
        slug = urlsplit(link['href']).path.rstrip('/').split('/')[-1]
        require(slug in inventory and slug not in found, f'Unknown/duplicate index slug: {slug}')
        found.add(slug)
        require(link.get_text(' ', strip=True) == inventory[slug]['title'], f'{slug}: index title is stale')
        description = card.select_one('.definition-text')
        require(description and description.get_text(' ', strip=True) == inventory[slug]['description'],
                f'{slug}: index does not display the revised definition')
    require(found == set(inventory), 'Index omits canonical entries')
    return {'cards': len(cards), 'definitions_match': True, 'canonical_links_complete': True}


def check_built(inventory: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    pages = {}
    failures = []
    for slug, item in inventory.items():
        try:
            path = ROOT / 'dist' / (BASE_PATH + slug).lstrip('/') / 'index.html'
            html = path.read_text(encoding='utf-8')
            pages[slug] = check_article(html, slug, item)
            soup = BeautifulSoup(html, 'html.parser')
            for link in soup.select('[data-field-guide-pilot] a[href]'):
                target = urlsplit(urljoin('https://roughatsea.com' + BASE_PATH + slug + '/', link['href']))
                if target.hostname in ('roughatsea.com', 'www.roughatsea.com') and target.path.startswith(BASE_PATH):
                    destination = ROOT / 'dist' / unquote(target.path).lstrip('/')
                    require(destination.is_file() or (destination / 'index.html').is_file(),
                            f'{slug}: internal navigation target missing: {target.path}')
        except Exception as error:
            failures.append(f'{slug}: {error}')
    index = check_index((ROOT / 'dist' / BASE_PATH.lstrip('/') / 'index.html').read_text(), inventory)
    save_report('built.json', {'passed': not failures, 'pages': list(pages.values()), 'index': index, 'failures': failures})
    require(not failures, '\n'.join(failures))
    print(f'PASS built pages: {len(pages)} canonical replacements; every printed C#/Python fence matches source')
    return pages


def browser_checks(inventory: dict[str, dict[str, Any]]) -> None:
    from playwright.sync_api import sync_playwright

    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *args: Any) -> None:
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT / 'dist')))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    origin = f'http://127.0.0.1:{server.server_port}'
    screens = OUT / 'screenshots'
    screens.mkdir(parents=True, exist_ok=True)
    results, errors, network = [], [], []
    section_state = """() => [...document.querySelectorAll('.pilot-body [data-pilot-language]')].map(el =>
        ({language: el.dataset.pilotLanguage, visible: el.getClientRects().length > 0}))"""
    try:
        with sync_playwright() as engine:
            browser = engine.chromium.launch()
            context = browser.new_context(viewport={'width': 1280, 'height': 900})
            plain_context = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
            page, plain = context.new_page(), plain_context.new_page()
            page.set_default_timeout(15000)
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('requestfailed', lambda request: network.append({'url': request.url, 'failure': request.failure}))
            for slug in inventory:
                url = origin + BASE_PATH + slug + '/'
                response = page.goto(url, wait_until='domcontentloaded')
                require(response and response.status == 200, f'{slug}: browser page failed')
                page.wait_for_selector('[data-field-guide-pilot][data-ready="true"]')
                page.set_viewport_size({'width': 1280, 'height': 900})
                for language in ('csharp', 'python', 'both'):
                    page.locator(f'[data-pilot-choice="{language}"]').click()
                    states = page.evaluate(section_state)
                    require(states and all(item['visible'] == (language == 'both' or item['language'] == language)
                                          for item in states), f'{slug}: {language} selection leaks or hides explanations')
                    pressed = page.locator('[data-pilot-choice][aria-pressed="true"]')
                    require(pressed.count() == 1 and pressed.get_attribute('data-pilot-choice') == language,
                            f'{slug}: pressed state is inconsistent')
                page.locator('[data-pilot-choice="python"]').click()
                page.reload(wait_until='domcontentloaded')
                require(page.locator('[data-field-guide-pilot]').get_attribute('data-pilot-language') == 'python',
                        f'{slug}: preference did not persist')
                if slug in SAMPLES:
                    page.locator('[data-pilot-choice="csharp"]').click()
                    page.evaluate('document.fonts.ready')
                    page.screenshot(path=str(screens / f'{slug}-desktop.png'))
                page.set_viewport_size({'width': 390, 'height': 844})
                page.locator('[data-pilot-choice="both"]').click()
                width = page.evaluate('({page: document.documentElement.scrollWidth, viewport: innerWidth})')
                require(width['page'] <= width['viewport'] + 1, f'{slug}: horizontal page overflow at 390px: {width}')
                if slug in SAMPLES:
                    page.screenshot(path=str(screens / f'{slug}-mobile.png'))
                    page.locator('.pilot-body pre').first.scroll_into_view_if_needed()
                    page.screenshot(path=str(screens / f'{slug}-mobile-code.png'))
                response = plain.goto(url, wait_until='domcontentloaded')
                require(response and response.status == 200, f'{slug}: no-JavaScript page failed')
                require(not plain.locator('.language-controls').is_visible(), f'{slug}: nonfunctional no-JS controls visible')
                require(all(item['visible'] for item in plain.evaluate(section_state)), f'{slug}: no-JS example hidden')
                results.append({'slug': slug, 'three_language_modes': True, 'preference_reload': True,
                                'mobile_390px': True, 'no_javascript': True})
            # Exercise the real index, not a copied search algorithm.
            page.set_viewport_size({'width': 1280, 'height': 900})
            page.goto(origin + BASE_PATH, wait_until='domcontentloaded')
            page.wait_for_selector('[data-guide-index][data-ready="true"]')
            require(page.locator('[data-guide-card]').count() == 206, 'Browser index is incomplete')
            for query, slug in [('OCP', 'open-closed-principle'), ('DI', 'dependency-injection')]:
                page.locator('[data-guide-search]').fill(query)
                require(page.locator(f'[data-guide-card] h2 a[href="{BASE_PATH}{slug}/"]').is_visible(),
                        f'Index alias search {query} missed {slug}')
            page.locator('[data-guide-reset]').click()
            require(page.locator('[data-guide-card]:visible').count() == 206, 'Clearing filters lost entries')
            page.locator('[data-guide-filter="tier"]').select_option('CORE')
            require(0 < page.locator('[data-guide-card]:visible').count() < 206, 'Tier filter does not filter')
            page.locator('[data-guide-reset]').click()
            page.locator('[data-guide-search]').fill('xyz-no-such-guide-term')
            require(page.locator('[data-guide-empty]').is_visible(), 'No-results explanation missing')
            page.locator('[data-guide-reset]').click()
            page.locator('[data-language="python"]').click()
            page.locator(f'[data-guide-card] h2 a[href="{BASE_PATH}open-closed-principle/"]').click()
            require(page.locator('[data-field-guide-pilot]').get_attribute('data-pilot-language') == 'python',
                    'Index preference does not follow article navigation')
            page.emulate_media(color_scheme='dark')
            page.evaluate("localStorage.setItem('theme', 'dark')")
            page.reload(wait_until='domcontentloaded')
            page.screenshot(path=str(screens / 'open-closed-principle-dark.png'))
            context.close()
            plain_context.close()
            browser.close()
        require(not errors, f'Browser JavaScript errors: {errors}')
    finally:
        server.shutdown()
        server.server_close()
        save_report('browser.json', {
            'pages_verified': len(results), 'pages': results, 'javascript_errors': errors,
            'network_failures': network, 'screenshots': sorted(p.name for p in screens.glob('*.png')),
            'scope': 'Chromium desktop and 390px viewport, all language modes, reload, no-JS; not an accessibility certification.',
        })
    print(f'PASS browser: {len(results)} pages; language controls, persistence, mobile, and no-JS; index searches checked')


def live_checks(inventory: dict[str, dict[str, Any]], built: dict[str, dict[str, Any]]) -> None:
    target_dir = OUT / 'live'
    target_dir.mkdir(parents=True, exist_ok=True)

    def check_one(slug: str) -> dict[str, Any]:
        last_error = ''
        for attempt in range(4):
            try:
                path = BASE_PATH + (slug + '/' if slug else '')
                request = Request('https://roughatsea.com' + path + '?guide-verification=' + str(time.time_ns()),
                                  headers={'User-Agent': 'RoughAtSea-Complete-Guide-Verification', 'Cache-Control': 'no-cache'})
                with urlopen(request, timeout=25) as response:
                    require(response.status == 200, f'HTTP {response.status}')
                    require(urlsplit(response.url).hostname in ('roughatsea.com', 'www.roughatsea.com'), 'Unexpected redirect')
                    html = response.read().decode('utf-8')
                if slug:
                    result = check_article(html, slug, inventory[slug])
                    require(result['body_sha256'] == built[slug]['body_sha256'], 'Live body differs from this build')
                else:
                    result = check_index(html, inventory) | {'slug': 'index'}
                (target_dir / ((slug or 'index') + '.html')).write_text(html, encoding='utf-8')
                return result | {'attempts': attempt + 1}
            except Exception as error:
                last_error = str(error)
                if attempt < 3:
                    time.sleep(5)
        raise AssertionError(f'{slug or "index"}: {last_error}')

    # Fail closed if deployment has not caught up; never equate HTTP 200 with publication.
    results, failures = [], []
    with ThreadPoolExecutor(max_workers=4) as executor:
        pending = {executor.submit(check_one, slug): slug for slug in [*inventory, '']}
        for completed in as_completed(pending):
            try:
                results.append(completed.result())
            except Exception as error:
                failures.append(str(error))
    save_report('live.json', {'verified_articles_and_index': len(results), 'passed': not failures,
                              'results': sorted(results, key=lambda x: x['slug']), 'failures': failures})
    require(not failures, '\n'.join(failures))
    print('PASS live: all 206 canonical bodies and printed examples match this build; index complete')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-only', action='store_true')
    parser.add_argument('--browser', action='store_true')
    parser.add_argument('--live', action='store_true')
    args = parser.parse_args()
    try:
        inventory = load_inventory()
        if args.source_only:
            return
        built = check_built(inventory)
        if args.browser:
            browser_checks(inventory)
        if args.live:
            live_checks(inventory, built)
    except Exception as error:
        save_report('failure.json', {'error': str(error)})
        raise


if __name__ == '__main__':
    main()
