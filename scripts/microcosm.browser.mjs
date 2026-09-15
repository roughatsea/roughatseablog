import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.MICRO_BROWSER_MODULE ? pathToFileURL(process.env.MICRO_BROWSER_MODULE).href : 'playwright');
const url = process.env.MICRO_BASE_URL || 'http://127.0.0.1:4321/microcosm/';
const dir = 'artifacts/microcosm';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const results=[];
try {
  const page=await browser.newPage({viewport:{width:1440,height:1050},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(url);await page.locator('#microcosm[data-ready="true"]').waitFor({timeout:30000});
  assert.ok(await page.locator('.mc-hotspot:visible').count()>0,'visible scene labels');
  assert.equal(await page.locator('[data-catalog]').count(),9);
  await page.screenshot({path:`${dir}/desktop-whole.png`,fullPage:true});
  for(const view of ['inside','scaffold']){await page.locator(`[data-view="${view}"]`).click();await page.waitForTimeout(150);assert.equal(await page.locator('#microcosm').getAttribute('data-view'),view);await page.screenshot({path:`${dir}/desktop-${view}.png`,fullPage:true});}
  for(const id of ['shape','membrane','hemoglobin','spectrin','ankyrin','band3','abo','rhd','no-nucleus']){await page.locator(`[data-catalog="${id}"]`).click();assert.ok(page.url().endsWith(`#rbc/${id}`));assert.ok(await page.locator('#mc-topic-content a').count()>0);}
  assert.match(await page.locator('#mc-progress').innerText(),/9 \/ 9/);
  await page.reload();await page.locator('#microcosm[data-ready="true"]').waitFor();assert.match(await page.locator('#mc-progress').innerText(),/9 \/ 9/);
  await page.locator('#mc-tour-start').click();for(let i=0;i<7;i++){assert.match(await page.locator('#mc-tour-position').innerText(),new RegExp(`${i+1} / 7`));await page.locator('#mc-tour-next').click();}assert.ok(await page.locator('#mc-tour').isHidden());
  await page.locator('#mc-reset').click();await page.locator('[data-camera="fly"]').click();assert.equal(await page.locator('#mc-canvas').getAttribute('data-camera'),'fly');
  await page.locator('#mc-canvas').focus();const before=await page.locator('#mc-canvas').screenshot();await page.keyboard.down('w');await page.waitForTimeout(200);await page.keyboard.up('w');const after=await page.locator('#mc-canvas').screenshot();assert.notDeepEqual(before,after,'flight changes rendered image');await page.keyboard.press('r');
  assert.deepEqual(errors,[]);results.push({test:'desktop, all topics, persistence, tour, flight',passed:true});
  for(const width of [390,320]){const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const mobile=await context.newPage();await mobile.goto(url);await mobile.locator('#microcosm[data-ready="true"]').waitFor();assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await mobile.locator('[data-catalog="hemoglobin"]').click();assert.ok(await mobile.locator('#mc-topic-content').isVisible());await mobile.screenshot({path:`${dir}/mobile-${width}.png`,fullPage:true});await context.close();results.push({test:`mobile ${width}`,passed:true});}
  const fallback=await browser.newContext({viewport:{width:390,height:844}});await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args);};});const fp=await fallback.newPage();await fp.goto(url);await fp.locator('#microcosm[data-ready="fallback"]').waitFor();assert.ok(await fp.locator('[data-view="inside"]').isDisabled());await fp.locator('[data-catalog="abo"]').click();assert.match(await fp.locator('#mc-topic-content').innerText(),/carbohydrate/i);await fp.screenshot({path:`${dir}/webgl-fallback.png`,fullPage:true});await fallback.close();
  const noJS=await browser.newContext({javaScriptEnabled:false});const np=await noJS.newPage();await np.goto(url);assert.match(await np.locator('body').innerText(),/works without 3D or JavaScript/);assert.equal(await np.locator('.mc-text-atlas article').count(),9);await noJS.close();results.push({test:'WebGL unavailable and JavaScript disabled',passed:true});
} finally {await writeFile(`${dir}/results.json`,JSON.stringify(results,null,2));await browser.close();}
console.log(JSON.stringify(results,null,2));
