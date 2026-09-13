#!/usr/bin/env node
// Render the report to A4 PDF via the Chrome DevTools Protocol, so we get a
// running footer with page numbers (the --print-to-pdf CLI flag cannot do this).
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const input  = resolve(process.argv[2] ?? "report/crohn-retatrutide-review.html");
const output = resolve(process.argv[3] ?? "report/crohn-retatrutide-review.pdf");
const PORT   = 9333 + (process.pid % 300);

const footer = `<div style="width:100%;margin:0 16mm;font-family:Helvetica,Arial,sans-serif;
  font-size:7pt;color:#9aa7ae;display:flex;justify-content:space-between;align-items:center;
  border-top:0.5px solid #d8e0e3;padding-top:2mm;">
  <span>Crohn's disease and investigational retatrutide 4&nbsp;mg &middot; evidence review v2.0</span>
  <span>13 Sep 2026 &middot; <span class="pageNumber"></span>/<span class="totalPages"></span></span>
</div>`;

const profile = await mkdtemp(join(tmpdir(), "ccpdf-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
  "--disable-dev-shm-usage", "--hide-scrollbars", "--force-color-profile=srgb",
  `--user-data-dir=${profile}`, `--remote-debugging-port=${PORT}`, "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

let stderr = "";
chrome.stderr.on("data", (d) => (stderr += d));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function browserWs() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch {}
    await sleep(100);
  }
  throw new Error("chrome did not expose a debugging endpoint\n" + stderr);
}

function client(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id !== undefined && pending.has(m.id)) {
      const { resolve: ok, reject: no } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? no(new Error(m.error.message)) : ok(m.result);
    } else listeners.forEach((fn) => fn(m));
  });
  const ready = new Promise((ok, no) => {
    ws.addEventListener("open", ok, { once: true });
    ws.addEventListener("error", () => no(new Error("websocket failed")), { once: true });
  });
  return {
    ready,
    on: (fn) => listeners.push(fn),
    send: (method, params = {}, sessionId) =>
      new Promise((ok, no) => {
        const n = ++id;
        pending.set(n, { resolve: ok, reject: no });
        ws.send(JSON.stringify({ id: n, method, params, ...(sessionId && { sessionId }) }));
      }),
    close: () => ws.close(),
  };
}

let code = 0;
try {
  const c = client(await browserWs());
  await c.ready;

  const { targetId } = await c.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await c.send("Target.attachToTarget", { targetId, flatten: true });

  const loaded = new Promise((ok) =>
    c.on((m) => m.method === "Page.loadEventFired" && m.sessionId === sessionId && ok()));
  await c.send("Page.enable", {}, sessionId);
  await c.send("Page.navigate", { url: "file://" + input }, sessionId);
  await loaded;
  await c.send("Runtime.enable", {}, sessionId);
  await c.send("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true }, sessionId);
  await sleep(400);

  const { data } = await c.send("Page.printToPDF", {
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate: footer,
    marginTop: 0.67, marginBottom: 0.71, marginLeft: 0.63, marginRight: 0.63,
    scale: 1,
  }, sessionId);

  await writeFile(output, Buffer.from(data, "base64"));
  const kb = (Buffer.from(data, "base64").length / 1024).toFixed(0);
  console.log(`wrote ${output}  (${kb} KB)`);
  c.close();
} catch (err) {
  console.error("render failed:", err.message);
  code = 1;
} finally {
  chrome.kill("SIGKILL");
  await rm(profile, { recursive: true, force: true });
  process.exit(code);
}
