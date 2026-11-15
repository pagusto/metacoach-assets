// Capturas de prototipos: node shoot.cjs <carpeta>
// Para cada .html de la carpeta genera capturas de página completa en
// escritorio (1440) y móvil (390), en tema claro y oscuro, dentro de <carpeta>/shots/.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = path.resolve(process.argv[2] || '.');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
  fs.mkdirSync(path.join(dir, 'shots'), { recursive: true });
  const browser = await chromium.launch();
  for (const f of files) {
    for (const [vp, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
      for (const scheme of ['light', 'dark']) {
        const ctx = await browser.newContext({
          viewport: { width: w, height: h }, colorScheme: scheme, deviceScaleFactor: 1,
        });
        const page = await ctx.newPage();
        const errs = [];
        page.on('pageerror', (e) => errs.push(e.message));
        await page.goto('file://' + path.join(dir, f));
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
        await page.waitForTimeout(500);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth);
        const out = path.join(dir, 'shots', `${f.replace('.html', '')}-${vp}-${scheme}.png`);
        await page.screenshot({ path: out, fullPage: true });
        console.log(`${path.basename(out)}  overflowX=${overflow}px  errors=${errs.length ? errs.join(' | ') : 'none'}`);
        await ctx.close();
      }
    }
  }
  await browser.close();
})();
