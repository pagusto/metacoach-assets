// Renderiza una animación HTML a MP4, fotograma a fotograma (determinista).
//   node render.cjs <pagina.html> <salida.mp4> [--fps 30] [--audio pista.wav] [--desde 0] [--hasta 12]
// La página debe exponer window.__film = { ready: true, duration: <s>, seek(t) }.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

(async () => {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
  const html = path.resolve(args[0]);
  const out = path.resolve(args[1]);
  const fps = Number(opt('fps', 30));
  const audio = opt('audio', null);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + html + '?render=1');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
  await page.waitForFunction(() => window.__film && window.__film.ready, null, { timeout: 30000 });
  const total = await page.evaluate(() => window.__film.duration);
  const desde = Number(opt('desde', 0));
  const hasta = Math.min(Number(opt('hasta', total)), total);
  const frames = Math.round((hasta - desde) * fps);

  const ffArgs = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-'];
  if (audio) ffArgs.push('-ss', String(desde), '-i', path.resolve(audio));
  ffArgs.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps));
  if (audio) ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  ffArgs.push('-movflags', '+faststart', out);
  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => { window.__film.seek(t); }, desde + i / fps);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`fotograma ${i}/${frames}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log(`listo: ${out} · ${frames} fotogramas · ${((Date.now() - t0) / 1000).toFixed(1)} s · errores de página: ${errs.length ? errs.join(' | ') : 'ninguno'}`);
})();
