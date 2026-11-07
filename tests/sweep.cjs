// Owner: Engineering. The sweep: drives the whole built game at random for several
// rounds, the way no other gate does — every button, drag, item, lure, overlay,
// branding tap and phase — and fails on any page error or any "NaN"/"undefined"
// shown to the player. Carried over from Blacktop Aether's tools/sweep.cjs.
// Usage: node tests/sweep.cjs [rounds=4] [seed=1] [page=dist/index.html]
// Headless Chromium: this proves nothing about frame rate. Timings are printed, not judged.
const path = require('path');
const fs = require('fs');
function loadPlaywright() {
  for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright']) {
    try { return require(p); } catch (e) {}
  }
  throw new Error('Playwright not found. Install it with: npm i -D playwright');
}
const ROUNDS = +(process.argv[2] || 4), SEED = +(process.argv[3] || 1);
const FILE = path.resolve(process.argv[4] || path.join(__dirname, '..', 'dist', 'index.html'));
let s = SEED >>> 0;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = a => a[Math.floor(rnd() * a.length)];

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const sizes = [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 820, height: 1180 }];
  const errors = [], bad = [], log = [];
  for (const vp of sizes) {
    const page = await browser.newPage({ viewport: vp, hasTouch: false });
    page.on('pageerror', e => errors.push(`${vp.width}x${vp.height} ${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && !/ERR_|net::/.test(m.text())) errors.push(`${vp.width}x${vp.height} ${m.text()}`); });
    await page.route('**/*', r => (r.request().url().startsWith('data:') ? r.continue() : r.abort()));
    await page.setContent(fs.readFileSync(FILE, 'utf8'), { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const box = await page.locator('#pit').boundingBox();
    const at = () => [box.x + 8 + rnd() * (box.width - 16), box.y + 8 + rnd() * (box.height - 16)];
    const scanText = async where => {
      const t = await page.evaluate(() => ['#info', '#traits', '#itemRow', '#lureRow', '#card', '#detail', '#pill', '#phaseLbl']
        .map(q => document.querySelector(q)?.innerText || '').join(' | '));
      if (/\bNaN\b|\bundefined\b/.test(t)) bad.push(`${vp.width}x${vp.height} ${where}: ${t.match(/.{0,40}(NaN|undefined).{0,40}/)[0]}`);
    };
    for (let round = 1; round <= ROUNDS; round++) {
      // Camp: random lures, items, drags, taps, hovers, help.
      for (let i = 0; i < 14; i++) {
        const act = pick(['lure', 'item', 'drag', 'drag', 'tap', 'hover', 'help', 'trait', 'wait']);
        if (act === 'lure' || act === 'item' || act === 'trait') {
          const sel = { lure: '[data-lure]', item: '[data-item]', trait: '[data-trait]' }[act];
          const n = await page.locator(sel).count();
          if (n) await page.locator(sel).nth(Math.floor(rnd() * n)).click({ timeout: 1000 }).catch(() => {});
        } else if (act === 'drag') {
          const [x0, y0] = at(), [x1, y1] = at();
          await page.mouse.move(x0, y0); await page.mouse.down();
          await page.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 4 }); await page.mouse.move(x1, y1, { steps: 4 });
          await page.mouse.up();
        } else if (act === 'tap') {
          const [x, y] = at(); await page.mouse.click(x, y);
        } else if (act === 'hover') {
          const [x, y] = at(); await page.mouse.move(x, y);
        } else if (act === 'help') {
          await page.click('#helpBtn').catch(() => {}); await page.waitForTimeout(120);
          await page.click('#closeHelp', { timeout: 800 }).catch(() => {});
        } else await page.waitForTimeout(150);
        await scanText(`round ${round} camp ${act}`);
      }
      // Release anyone waiting so the Raid can start.
      while (await page.locator('[data-wait]').count()) await page.locator('[data-wait]').first().click().catch(() => {});
      const go = page.locator('#goBtn');
      if (await go.isDisabled()) { bad.push(`${vp.width}x${vp.height} round ${round}: Start Raid stayed disabled`); break; }
      const t0 = Date.now();
      await go.click();
      // Raid: brand-tap wildly, long-press for unit cards, until the results card shows.
      while (!(await page.locator('#card').innerText().catch(() => '')).includes('Raid over')) {
        if (Date.now() - t0 > 40000) { bad.push(`${vp.width}x${vp.height} round ${round}: Raid never finished`); break; }
        const [x, y] = at();
        if (rnd() < 0.25) { await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(450); await page.mouse.up(); }
        else await page.mouse.click(x, y);
        await page.waitForTimeout(150 + rnd() * 250);
        await scanText(`round ${round} raid`);
      }
      log.push(`${vp.width}x${vp.height} round ${round}: Raid ${(Date.now() - t0) / 1000}s`);
      await page.click('#goBtn').catch(() => {});
      await page.waitForTimeout(200);
    }
    await page.close();
  }
  await browser.close();
  log.forEach(l => console.log('      ' + l));
  console.log(`${errors.length ? 'FAIL' : 'PASS'}  sweep: ${errors.length} page errors`);
  errors.slice(0, 10).forEach(e => console.log('      ' + e));
  console.log(`${bad.length ? 'FAIL' : 'PASS'}  sweep: ${bad.length} NaN / undefined / stuck findings`);
  bad.slice(0, 10).forEach(e => console.log('      ' + e));
  process.exit(errors.length || bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
