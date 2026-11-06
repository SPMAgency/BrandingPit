// Owner: Engineering. Boots the built game headless at phone size, plays one Raid,
// and fails on any script error or if the Raid produces no result screen.
// Usage: node tests/smoke.cjs [path/to/page.html]   (default dist/index.html)
// Headless Chromium renders in software: this proves the game runs, never that it is fast.
const path = require('path');
const fs = require('fs');
function loadPlaywright() {
  for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright']) {
    try { return require(p); } catch (e) {}
  }
  throw new Error('Playwright not found. Install it with: npm i -D playwright');
}
(async () => {
  const { chromium } = loadPlaywright();
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist', 'index.html'));
  const html = fs.readFileSync(file, 'utf8');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|net::/.test(m.text())) errors.push(m.text()); });
  // Fonts come from Google; block them so the test never depends on the network.
  await page.route('**/*', r => (r.request().url().startsWith('data:') ? r.continue() : r.abort()));
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const checks = [];
  const ok = (name, pass, detail) => checks.push({ name, pass, detail });

  ok('camp shows Start Raid', (await page.textContent('#goBtn')).includes('Start Raid'));
  // Hover a fighter: the unit card must open.
  const box = await page.locator('#pit').boundingBox();
  let card = false;
  for (let y = box.y + box.height * 0.3; y < box.y + box.height * 0.95 && !card; y += 12)
    for (let x = box.x + 20; x < box.x + box.width - 20; x += 14) {
      await page.mouse.move(x, y);
      if (await page.isVisible('#detail')) { card = true; break; }
    }
  ok('unit card opens on hover', card);
  await page.mouse.move(1, 1);

  await page.click('#goBtn');
  await page.waitForTimeout(19000);
  const results = (await page.textContent('#card')) || '';
  ok('Raid ends on the results card', results.includes('Raid over'), results.slice(0, 80));
  await page.click('#goBtn');
  await page.waitForTimeout(300);
  ok('back to camp, round 2', (await page.textContent('#phaseLbl')).includes('Round 2'));
  ok('no script errors', errors.length === 0, errors.join(' | '));

  await browser.close();
  for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail && !c.pass ? '  — ' + c.detail : ''}`);
  process.exit(checks.every(c => c.pass) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
