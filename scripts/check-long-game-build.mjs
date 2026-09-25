import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const routes = ['', 'priorities', 'a-workable-week', 'longevity-evidence', 'methods', 'evidence', 'changes'];
const root = '/guides/long-game/';
const registry = JSON.parse(readFileSync('src/data/long-game/registry.json','utf8'));
const pages = new Map();
const errors = [];
for (const route of routes) {
  const url = root + (route ? route + '/' : '');
  try {
    const html = readFileSync(resolve('dist', url.slice(1), 'index.html'), 'utf8');
    if (!html.includes('The Long Game')) errors.push(`${url}: guide identity missing`);
    if (!html.includes(registry.version)) errors.push(`${url}: version missing`);
    if (!html.includes('no independent clinical') && !html.includes('No independent clinical')) errors.push(`${url}: review-status disclosure missing`);
    pages.set(url, html);
  } catch (error) { errors.push(`${url}: build output unavailable (${error.message})`); }
}
for (const [url, html] of pages) {
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m)=>m[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${url}: duplicate HTML identifiers`);
  for (const match of html.matchAll(/\bhref=["']([^"']+)["']/g)) {
    const href = match[1];
    if (!href.startsWith(root) && !href.startsWith('#')) continue;
    const target = new URL(href, 'https://roughatsea.com'+url);
    const normalized = target.pathname.endsWith('/') ? target.pathname : target.pathname+'/';
    const page = pages.get(normalized);
    if (!page) { errors.push(`${url}: unresolved guide link ${href}`); continue; }
    if (target.hash) {
      const id = decodeURIComponent(target.hash.slice(1));
      const targetIds = [...page.matchAll(/\bid=["']([^"']+)["']/g)].map((m)=>m[1]);
      if (!targetIds.includes(id)) errors.push(`${url}: missing anchor ${href}`);
    }
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode=1; }
else console.log(`Long Game build verified: ${pages.size} routes, internal links and anchors, version and review disclosures. This is HTML verification, not a visual browser review.`);
