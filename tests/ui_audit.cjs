// Owner: Engineering. UI audit: at three phone sizes, every visible control must sit
// fully on screen and be at least 44 x 44 CSS px to tap (Apple and Google guidance).
// Carried over from Blacktop Aether's tools/ui_audit.cjs.
// Usage: node tests/ui_audit.cjs [--report] [page=dist/index.html]
//   --report prints findings and exits 0 (the baseline mode until AUDIT_TECH.md B1 is fixed).
const path = require('path');
const fs = require('fs');
function loadPlaywright() {
  for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright']) {
    try { return require(p); } catch (e) {}
  }
  throw new Error('Playwright not found. Install it with: npm i -D playwright');
}
const args = process.argv.slice(2);
const REPORT = args.includes('--report');
const FILE = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, '..', 'dist', 'index.html'));
const MIN = 44;
(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const findings = [];
  for (const vp of [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 820, height: 1180 }]) {
    const page = await browser.newPage({ viewport: vp });
    await page.route('**/*', r => (r.request().url().startsWith('data:') ? r.continue() : r.abort()));
    await page.setContent(fs.readFileSync(FILE, 'utf8'), { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    for (const state of ['camp', 'help']) {
      if (state === 'help') { await page.click('#helpBtn'); await page.waitForTimeout(150); }
      const out = await page.evaluate(({ MIN, W, H }) => {
        const r = [];
        for (const el of document.querySelectorAll('button, [role=button], a[href], input, select')) {
          const b = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (!b.width || !b.height || cs.visibility === 'hidden' || el.closest('[hidden]')) continue;
          const name = (el.id ? '#' + el.id : '') + (el.dataset.lure ? `[lure ${el.dataset.lure}]` : '') +
            (el.dataset.item ? '[item]' : '') + (el.dataset.trait ? `[trait ${el.dataset.trait}]` : '') +
            (!el.id && !Object.keys(el.dataset).length ? `"${el.textContent.trim().slice(0, 20)}"` : '');
          if (b.width < MIN || b.height < MIN) r.push(`${name} is ${Math.round(b.width)}x${Math.round(b.height)} (under ${MIN})`);
          if (b.left < 0 || b.top < 0 || b.right > W + 0.5 || b.bottom > H + 0.5) r.push(`${name} runs off screen`);
        }
        if (document.documentElement.scrollWidth > W + 0.5) r.push('page scrolls sideways');
        return r;
      }, { MIN, W: vp.width, H: vp.height });
      out.forEach(f => findings.push(`${vp.width}x${vp.height} ${state}: ${f}`));
    }
    await page.close();
  }
  await browser.close();
  const unique = [...new Set(findings)];
  console.log(`${unique.length ? (REPORT ? 'REPORT' : 'FAIL') : 'PASS'}  ui audit: ${unique.length} findings`);
  unique.forEach(f => console.log('      ' + f));
  process.exit(unique.length && !REPORT ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
