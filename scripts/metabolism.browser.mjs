import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
const { chromium } = await import(
  process.env.METABOLISM_BROWSER_MODULE
    ? pathToFileURL(process.env.METABOLISM_BROWSER_MODULE).href
    : 'playwright'
);
const out =
  process.env.METABOLISM_ARTIFACTS ||
  resolve(tmpdir(), 'roughatsea-metabolism-check');
await mkdir(out, { recursive: true });
// Same-process preview is useful in isolated execution environments. It serves only build output.
let server;
if (process.env.METABOLISM_SERVE_DIST === '1') {
  const root = resolve('dist');
  const types = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  };
  server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(
        new URL(req.url, 'http://localhost').pathname,
      );
      let file = resolve(root, '.' + path);
      if (!file.startsWith(root + sep) && file !== root) {
        res.writeHead(403).end();
        return;
      }
      if (!extname(file)) file = resolve(file, 'index.html');
      res.setHeader(
        'Content-Type',
        types[extname(file)] || 'application/octet-stream',
      );
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
  await new Promise((r) => server.listen(4322, '127.0.0.1', r));
}
const base =
  process.env.METABOLISM_BASE_URL || 'http://127.0.0.1:4322/metabolism/';
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.METABOLISM_BROWSER_EXECUTABLE || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote'],
});
const results = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base);
  await page.locator('#metabolism[data-ready="true"]').waitFor();
  assert.deepEqual(errors, [], 'no hydration/runtime errors');
  assert.equal(await page.locator('.ml-line').count(), 2);
  assert.equal(await page.locator('.ml-error').count(), 0);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  const original = await page.locator('[data-result="weight-0"]').innerText();
  await page.locator('#a-carbs').fill('275');
  assert.notEqual(
    await page.locator('[data-result="weight-0"]').innerText(),
    original,
  );
  await page.getByRole('button', { name: /Copy A into B/ }).click();
  assert.equal(
    await page.locator('[data-result="weight-0"]').innerText(),
    await page.locator('[data-result="weight-1"]').innerText(),
  );
  await page.getByRole('button', { name: 'Body fat', exact: true }).click();
  assert.match(
    await page.locator('#ml-chart-title').textContent(),
    /Body fat mass/,
  );
  await page.getByRole('button', { name: 'Energy use', exact: true }).click();
  assert.match(
    await page.locator('#ml-chart-title').textContent(),
    /energy expenditure/,
  );
  await page.locator('#day-slider').fill('30');
  assert.match(await page.locator('.ml-scrubber').innerText(), /day 30/);
  await page.locator('#day-slider').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#day-slider').inputValue(), '31');
  await page.getByRole('button', { name: 'kg', exact: true }).click();
  assert.match(
    await page.locator('[data-result="weight-0"]').innerText(),
    /kg/,
  );
  await page.locator('#a-carbs').fill('');
  assert.ok(await page.locator('[role="alert"]').isVisible());
  assert.equal(
    await page.locator('.ml-line').count(),
    0,
    'invalid inputs never leave stale projections visible',
  );
  await page.locator('#a-carbs').fill('275');
  await page.getByRole('button', { name: 'Save setup', exact: true }).click();
  await page.reload();
  await page.locator('#metabolism[data-ready="true"]').waitFor();
  assert.equal(await page.locator('#a-carbs').inputValue(), '275');
  assert.match(await page.locator('.ml-status').innerText(), /restored/);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export CSV/ }).click();
  const download = await downloadEvent;
  await download.saveAs(resolve(out, 'projections.csv'));
  const csv = await readFile(resolve(out, 'projections.csv'), 'utf8');
  assert.match(csv, /"A","180"/);
  assert.match(csv, /"B","180"/);
  await page
    .getByRole('button', { name: 'Reset example', exact: true })
    .click();
  assert.equal(await page.locator('#a-carbs').inputValue(), '220');
  assert.equal(
    await page.evaluate(() => localStorage.getItem('roughatsea-metabolism-v1')),
    null,
  );
  await page.locator('.ml-plan-a summary').click();
  await page.locator('#a-weekend').fill('700');
  await page.locator('#a-change-day').fill('56');
  await page.locator('#a-later').fill('200');
  assert.equal(await page.locator('.ml-error').count(), 0);
  await page.locator('.ml-plan-a summary').click();
  await page
    .getByRole('button', { name: 'Reset example', exact: true })
    .click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: resolve(out, 'desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.locator('.ml-data summary').click();
  assert.ok(await page.locator('table').isVisible());
  await page.locator('.ml-data summary').click();
  await page
    .getByRole('button', { name: 'Switch to dark mode', exact: true })
    .click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.waitForFunction(
    () => getComputedStyle(document.body).backgroundColor === 'rgb(10, 10, 10)',
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: resolve(out, 'desktop-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page
    .getByRole('button', { name: 'Switch to light mode', exact: true })
    .click();
  assert.deepEqual(errors, []);
  results.push({
    test: 'hydration, inputs, comparison, metric tabs, keyboard slider, units, invalid inputs, save/reload/reset, calendar settings, CSV, table, both themes',
    passed: true,
  });
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(base);
    await page.locator('#metabolism[data-ready="true"]').waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `no horizontal overflow at ${width}px`,
    );
    await page.locator('#a-carbs').fill('250');
    assert.equal(await page.locator('.ml-error').count(), 0);
    await page.getByRole('button', { name: 'Body fat', exact: true }).click();
    await page.locator('.ml-baseline summary').click();
    await page.locator('#sensitivity').fill('5');
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.locator('.ml-baseline summary').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: resolve(out, `mobile-${width}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    await page
      .locator('.ml-projection')
      .screenshot({
        path: resolve(out, `chart-${width}.png`),
        animations: 'disabled',
      });
    const labelSize = await page
      .locator('.ml-axis')
      .first()
      .evaluate((el) => {
        const scale = el.getScreenCTM().a;
        return parseFloat(getComputedStyle(el).fontSize) * scale;
      });
    assert.ok(labelSize >= 10, 'chart labels remain readable in screen pixels');
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page
      .locator('.nav-group summary')
      .filter({ hasText: 'Explorations' })
      .click();
    assert.ok(
      await page.getByRole('link', { name: /Metabolism Lab Food/ }).isVisible(),
    );
    await page.getByRole('link', { name: /Metabolism Lab Food/ }).click();
    await page.locator('#metabolism[data-ready="true"]').waitFor();
    results.push({
      test: `mobile ${width}px, live inputs, assumptions and navigation`,
      passed: true,
    });
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto(base);
  assert.ok(await staticPage.locator('.ml-nojs').isVisible());
  assert.ok(await staticPage.locator('#ml-method').isVisible());
  await noJs.close();
  const denied = await browser.newContext();
  await denied.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage denied');
    };
    Storage.prototype.setItem = () => {
      throw new Error('Storage denied');
    };
  });
  const privatePage = await denied.newPage();
  await privatePage.goto(base);
  await privatePage.locator('#metabolism[data-ready="true"]').waitFor();
  await privatePage.locator('#a-carbs').fill('250');
  assert.equal(await privatePage.locator('.ml-line').count(), 2);
  await denied.close();
  results.push({
    test: 'JavaScript-disabled explanation and simulator operation with storage denied',
    passed: true,
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto(new URL('/', base).href);
  await page
    .locator('.nav-group summary')
    .filter({ hasText: 'Explorations' })
    .click();
  await page.getByRole('link', { name: /Metabolism Lab Food/ }).click();
  await page.locator('#metabolism[data-ready="true"]').waitFor();
  results.push({
    test: 'homepage Explorations navigation reaches the simulator',
    passed: true,
  });
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  if (server) await new Promise((r) => server.close(r));
  await writeFile(
    resolve(out, 'results.json'),
    JSON.stringify(results, null, 2),
  );
}
console.log(JSON.stringify({ results, artifacts: out }, null, 2));
