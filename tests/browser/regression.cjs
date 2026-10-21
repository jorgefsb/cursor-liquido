'use strict';
// Real-browser regression suite for the packaged build (dist/), adapted from
// the restoration suite that approved the renderer. It checks physical output
// (coloured, localized, finite field, no neutral white flood) as well as the
// lifecycle. Chromium with SwiftShader WebGL: this is not a certification of
// any physical GPU, browser or phone.
//
// Playwright is resolved from node_modules, or from PLAYWRIGHT_MODULE when an
// existing installation should be reused (e.g. offline machines).
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const assert = require('assert/strict');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    if (process.env.PLAYWRIGHT_MODULE) return require(process.env.PLAYWRIGHT_MODULE);
    throw new Error('playwright not found: run npm ci, or set PLAYWRIGHT_MODULE to an installed playwright module');
  }
}
function playwrightVersion() {
  try { return require('playwright/package.json').version; } catch (e) { return require(path.join(process.env.PLAYWRIGHT_MODULE, 'package.json')).version; }
}
const playwright = loadPlaywright();
const { chromium } = playwright;

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'test-output');
const REPORT = path.join(ROOT, 'reports/browser-test-report.json');
const DEMO = 'demo/index.html';
const STANDALONE = 'tests/fixtures/standalone.html';
const ARCHIVE = 'examples/cursor-liquido.html';
const fileUrl = rel => 'file://' + path.join(ROOT, rel);
const LAUNCH = {
  headless: true,
  ignoreDefaultArgs: ['--hide-scrollbars'],
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
};
const DOT_PALETTE = ['rgb(34, 33, 31)', 'rgb(244, 232, 213)'];

fs.mkdirSync(OUT, { recursive: true });
const results = [], shots = [];
async function test(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, status: 'PASS', detail: detail === undefined ? null : detail });
    console.log('PASS', name);
  } catch (e) {
    results.push({ name, status: 'FAIL', detail: String(e && e.message || e).split(ROOT).join('.') });
    console.error('FAIL', name, '\n ', e && e.stack);
  }
}
async function shot(page, name, clip) {
  const file = path.join(OUT, name);
  const buf = await page.screenshot({ path: file, clip });
  shots.push({ file: 'test-output/' + name, sha256: crypto.createHash('sha256').update(buf).digest('hex'), bytes: buf.length });
  return buf;
}

// Ephemeral static server for the HTTP run. Closed in finally.
function serve() {
  const log = [];
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const abs = path.join(ROOT, rel);
    log.push(rel);
    if (!abs.startsWith(ROOT + path.sep) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': types[path.extname(abs)] || 'application/octet-stream' });
    fs.createReadStream(abs).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () =>
    resolve({ server, log, origin: 'http://127.0.0.1:' + server.address().port })));
}

// Watches a page for script errors and any network request.
function watch(page) {
  const w = { errors: [], requests: [] };
  page.on('pageerror', e => w.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') w.errors.push(m.text()); });
  page.on('request', r => { if (/^https?:/.test(r.url())) w.requests.push(r.url()); });
  return w;
}

// Deterministic pointer-coordinate fixture into the unchanged engine, then
// read the composited default framebuffer and the float dye field.
// Not a frame-rate benchmark.
function fieldMetrics(page) {
  return page.evaluate(() => {
    const e = LiquidCursor.current.engine; e.boot(); e.stop(true); e.collectWalls();
    const gl = e.gl, start = performance.now(), metrics = [];
    e.lastInput = start; e.lastTime = 0;
    for (let i = 0; i < 90; i++) {
      e.pending = { x: 210 + Math.sin(i * .19) * 95, y: 550 + Math.cos(i * .17) * 45, dx: Math.cos(i * .19) * 18, dy: -Math.sin(i * .17) * 8 };
      e.lastInput = start + i * 17; e.frame(start + i * 17); cancelAnimationFrame(e.raf); e.raf = 0;
      if (i % 30 === 29) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const a = new Uint8Array(e.canvas.width * e.canvas.height * 4);
        gl.readPixels(0, 0, e.canvas.width, e.canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, a);
        let active = 0, chromatic = 0, neutral = 0;
        for (let k = 0; k < a.length; k += 4) {
          const hi = Math.max(a[k], a[k + 1], a[k + 2]), lo = Math.min(a[k], a[k + 1], a[k + 2]);
          if (a[k + 3] > 8) { active++; if (hi - lo > 35) chromatic++; if (lo > 90 && hi - lo < 14) neutral++; }
        }
        metrics.push({ frame: i + 1, active, chromatic, neutral, pixels: a.length / 4, error: gl.getError() });
      }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, e.dye.read.framebuffer);
    const floats = new Float32Array(e.dye.read.width * e.dye.read.height * 4);
    gl.readPixels(0, 0, e.dye.read.width, e.dye.read.height, gl.RGBA, gl.FLOAT, floats);
    let nonfinite = 0, peak = 0;
    for (const f of floats) { if (!Number.isFinite(f)) nonfinite++; else peak = Math.max(peak, Math.abs(f)); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, e.velocity.read.framebuffer);
    const vel = new Float32Array(e.velocity.read.width * e.velocity.read.height * 4);
    gl.readPixels(0, 0, e.velocity.read.width, e.velocity.read.height, gl.RGBA, gl.FLOAT, vel);
    let velNonfinite = 0; for (const f of vel) if (!Number.isFinite(f)) velNonfinite++;
    const error = gl.getError();
    e.pass('display', null, { source: e.dye.read }, { opacity: e.options.opacity });
    return { metrics, nonfinite, velNonfinite, peak, error, radius: e.options.radius, originalShader: !e.programs.edge && !e.programs.fluid };
  });
}
function assertField(v, radius) {
  assert(v.originalShader); assert.equal(v.nonfinite, 0); assert.equal(v.velNonfinite, 0); assert.equal(v.error, 0);
  assert.equal(v.radius, radius);
  for (const m of v.metrics) {
    assert.equal(m.error, 0);
    assert(m.active > 50, 'field visible');
    assert(m.chromatic > 50, 'field coloured');
    assert(m.active / m.pixels < .25, 'field localized, not full screen');
    assert(m.neutral / m.pixels < .005, 'no neutral white/grey flood');
  }
}

// Colour analysis of a real screenshot, decoded in the page (no image deps).
function screenColour(page, png, region) {
  return page.evaluate(async ({ b64, region }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = region.w; c.height = region.h;
    const ctx = c.getContext('2d'); ctx.drawImage(img, region.x, region.y, region.w, region.h, 0, 0, region.w, region.h);
    const a = ctx.getImageData(0, 0, region.w, region.h).data;
    let chromatic = 0, brightNeutral = 0;
    for (let k = 0; k < a.length; k += 4) {
      const hi = Math.max(a[k], a[k + 1], a[k + 2]), lo = Math.min(a[k], a[k + 1], a[k + 2]);
      if (hi - lo > 35) chromatic++;
      if (lo > 90 && hi - lo < 14) brightNeutral++;
    }
    const n = a.length / 4;
    return { pixels: n, chromatic, brightNeutral, chromaticRatio: chromatic / n, neutralRatio: brightNeutral / n };
  }, { b64: png.toString('base64'), region });
}

// Fresh instance through the demo's own remount path (touch toggle twice), so
// a performance-budget pause from an earlier test does not carry over.
async function fresh(p) {
  const name = await p.evaluate(() => LiquidCursor.current.intensity);
  await p.locator('#touch').click(); await p.locator('#touch').click();
  await p.waitForFunction(n => LiquidCursor.current.intensity === n && !LiquidCursor.current.options.touch, name);
}

async function demoSuite(b, label, url, w) {
  const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
  const pw = w || watch(p);
  await p.goto(url);
  await test(label + ' / bundle boots with one owner and two layers', async () => {
    const v = await p.evaluate(() => ({
      version: LiquidCursor.version, engine: typeof FluidCursor, adapter: typeof FluidEngine,
      autoMounted: 'fluidCursor' in window, layers: document.querySelectorAll('.liquid-cursor-layer').length,
      dotHosts: document.querySelectorAll('.liquid-original-dots').length, source: LiquidCursor.current.stats.source
    }));
    assert.deepEqual(v, { version: '1.0.0', engine: 'function', adapter: 'function', autoMounted: false, layers: 2, dotHosts: 1, source: 'data-jz-level' });
    return v;
  });
  for (const [value, name, radius] of [['off', 'nada', 0], ['subtle', 'poquito', 0], ['full', 'mucho', 10], ['hard', 'hardcore', 18]]) {
    await test(label + ' / Juega control ' + name, async () => {
      await p.locator('input[name=juega][value="' + value + '"]').check();
      await p.waitForFunction(n => LiquidCursor.current.intensity === n, name);
      assert(await p.locator('input[value="' + value + '"]').isChecked());
      const s = await p.evaluate(() => LiquidCursor.current.stats);
      assert.equal(s.radius, radius);
      return { intensity: s.intensity, radius: s.radius };
    });
  }
  await test(label + ' / Poquito reference timing, size, drift and palette', async () => {
    await p.locator('input[value=subtle]').check(); await p.waitForTimeout(20);
    for (let i = 0; i < 6; i++) { await p.mouse.move(140 + i * 10, 560); await p.waitForTimeout(45); }
    const v = await p.evaluate(() => {
      // getAnimations() can omit an already-finished animation before its
      // onfinish callback removes the record. Inspect the actual native
      // Animation saved by the implementation instead of that timing window.
      const f = LiquidCursor.current, record = f.dots.dots.at(-1), el = record && record.dot, a = record && record.animation;
      return { alive: f.dots.stats.alive, max: f.dots.stats.max, width: el && getComputedStyle(el).width,
        duration: a && a.effect.getTiming().duration, keyframes: a && a.effect.getKeyframes().map(k => k.transform),
        colours: f.dots.dots.map(d => getComputedStyle(d.dot).backgroundColor), webgl: !!(f.engine && f.engine.raf) };
    });
    assert(v.alive > 0); assert.equal(v.width, '7px'); assert.equal(v.duration, 480);
    assert(v.keyframes[1].includes('14px')); assert.equal(v.max, 29); assert(!v.webgl);
    for (const c of v.colours) assert(['rgb(255, 107, 53)', ...DOT_PALETTE].includes(c), c);
    // Every dot removes itself when its 480 ms animation ends. Wall-clock
    // slack only, software GL can delay animation frames under load.
    await p.waitForFunction(() => LiquidCursor.current.dots.stats.alive === 0, null, { timeout: 3000 });
    return v;
  });
  for (const [value, name, radius] of [['full', 'mucho', 10], ['hard', 'hardcore', 18]]) {
    await test(label + ' / ' + name + ' field coloured, localized, finite, no flood', async () => {
      await p.locator('input[value="' + value + '"]').check();
      await p.waitForFunction(n => LiquidCursor.current.intensity === n, name);
      await fresh(p);
      const v = await fieldMetrics(p);
      assertField(v, radius);
      return { radius: v.radius, peak: v.peak, last: v.metrics[v.metrics.length - 1] };
    });
    await test(label + ' / ' + name + ' real pointer screenshot shows colour without white flood', async () => {
      await fresh(p);
      await p.mouse.move(5, 940); await p.waitForTimeout(50);
      const a = await p.locator('.arena').boundingBox();
      const region = { x: 0, y: Math.round(a.y), w: 700, h: 500 };
      const before = await screenColour(p, await p.screenshot(), region);
      for (let i = 0; i < 30; i++) { await p.mouse.move(110 + i * 14, a.y + 170 + Math.sin(i * .25) * 70); await p.waitForTimeout(12); }
      // A real Playwright pointer gesture feeds the unchanged input handler.
      // Drive only the final solver tick at a deterministic 1/60s, then pause
      // its RAF while encoding the PNG. This is an input/render snapshot, not
      // a live-cadence or performance test. Runtime safety is tested separately.
      await p.mouse.move(550, a.y + 190);
      await p.evaluate(() => {
        const e = LiquidCursor.current.engine;
        if (e.performancePaused || !e.gl) throw new Error('Snapshot setup reached the runtime safety stop');
        if (e.raf) cancelAnimationFrame(e.raf);
        e.raf = 0;
        const now = performance.now(); e.lastTime = 0; e.lastInput = now;
        e.frame(now);
        if (e.raf) cancelAnimationFrame(e.raf);
        e.raf = 0;
        e.pass('display', null, { source: e.dye.read }, { opacity: e.options.opacity });
      });
      const png = await shot(p, label.replace(/\W+/g, '-') + '-' + name + '.png');
      const after = await screenColour(p, png, region);
      const fluid = await p.evaluate(() => LiquidCursor.current.stats.fluid);
      assert(after.chromatic - before.chromatic > 500, 'visible coloured trail, fluid ' + JSON.stringify(fluid));
      assert(after.chromaticRatio < .35, 'trail localized');
      assert(after.neutralRatio - before.neutralRatio < .02, 'no neutral flood');
      return { before, after };
    });
  }
  await test(label + ' / advect samplers do not alias (white-flood regression)', async () => {
    await fresh(p);
    const v = await p.evaluate(() => {
      // A newly compiled, unused WebGL program has all samplers at zero by
      // specification. Exercise an actual solver frame before reading the
      // bindings; zero defaults are not a texture-alias regression.
      const e = LiquidCursor.current.engine; e.boot(); e.collectWalls();
      e.lastInput = performance.now(); e.lastTime = 0; e.frame(e.lastInput);
      if (e.raf) cancelAnimationFrame(e.raf); e.raf = 0;
      const a = e.programs.advect, gl = e.gl;
      return { boundary: gl.getUniform(a.program, a.uniforms.boundary), source: gl.getUniform(a.program, a.uniforms.source), velocity: gl.getUniform(a.program, a.uniforms.velocity) };
    });
    assert.notEqual(v.boundary, v.source); assert.notEqual(v.boundary, v.velocity);
    return v;
  });
  await test(label + ' / real pointer contacts the visible obstacle edge', async () => {
    await fresh(p);
    const r = await p.locator('.island').boundingBox();
    for (let i = 0; i < 15; i++) { await p.mouse.move(r.x - 130 + i * 9, r.y + r.height / 2); await p.waitForTimeout(15); }
    await p.mouse.move(r.x + 2, r.y + r.height / 2); await p.waitForTimeout(30);
    const v = await p.evaluate(() => ({ stats: LiquidCursor.current.engine.stats, edge: document.querySelector('.island').getBoundingClientRect().left }));
    assert(v.stats.impacts > 0); assert(v.stats.splats > 0); assert(v.stats.lastContact);
    assert(Math.abs(v.stats.lastContact.x - v.edge) < .01); assert.equal(v.stats.error, null);
    await shot(p, label.replace(/\W+/g, '-') + '-contact.png');
    return { impacts: v.stats.impacts, contact: v.stats.lastContact, edge: v.edge };
  });
  await test(label + ' / keyboard, typing, Clear, Nada and link work; no errors, no network', async () => {
    await p.locator('#texto').fill('Probando dist');
    assert.equal(await p.locator('#texto').inputValue(), 'Probando dist');
    await p.locator('#reset').focus(); await p.keyboard.press('Enter');
    assert.equal(await p.evaluate(() => LiquidCursor.current.engine.raf), 0);
    await p.locator('input[value=off]').focus(); await p.keyboard.press('Space');
    await p.waitForFunction(() => LiquidCursor.current.intensity === 'nada');
    await p.mouse.move(220, 500);
    assert.equal(await p.evaluate(() => LiquidCursor.current.engine.raf), 0);
    await p.locator('#test-link').focus(); await p.keyboard.press('Enter');
    assert.equal(await p.evaluate(() => location.hash), '#notas');
    const external = pw.requests.filter(u => !u.startsWith(new URL(p.url()).origin + '/'));
    assert.deepEqual(external, []); assert.deepEqual(pw.errors, []);
    return { requests: pw.requests.map(u => new URL(u).pathname) };
  });
  await test(label + ' / canvas matches inner viewport with a classic scrollbar', async () => {
    await p.addStyleTag({ content: 'html{overflow-y:scroll} ::-webkit-scrollbar{width:15px}' });
    await p.locator('input[value=hard]').check();
    await p.setViewportSize({ width: 1200, height: 951 });
    const v = await p.evaluate(() => { const e = LiquidCursor.current.engine; e.resize(); e.collectWalls(); return { inner: innerWidth, css: e.canvas.getBoundingClientRect().width, engine: e.width }; });
    assert.equal(v.css, v.inner); assert.equal(v.engine, v.css);
    return v;
  });
  await p.close();
  return pw;
}

(async () => {
  const b = await chromium.launch(LAUNCH);
  const srv = await serve();
  try {
    // 1. Packaged dist through the demo page, offline file:// and HTTP.
    const fileWatch = await demoSuite(b, 'dist file', fileUrl(DEMO));
    await test('dist file / offline run made zero HTTP requests', async () => { assert.deepEqual(fileWatch.requests, []); return true; });
    srv.log.length = 0;
    await demoSuite(b, 'dist http', srv.origin + '/' + DEMO);
    await test('dist http / served exactly the demo, CSS and JS bundle', async () => {
      assert.deepEqual([...new Set(srv.log)].sort(), ['/demo/index.html', '/dist/cursor-liquido.css', '/dist/cursor-liquido.js']);
      return [...new Set(srv.log)].sort();
    });

    // 2. Plain integration fixture, mounted by the tests.
    const page = async (opts) => {
      const p = await b.newPage(Object.assign({ viewport: { width: 1000, height: 800 } }, opts));
      const w = watch(p); await p.goto(fileUrl(STANDALONE)); p.w = w; return p;
    };
    await test('standalone / mount needs explicit intensity; unknown or Legendario rejected', async () => {
      const p = await page();
      const v = await p.evaluate(() => {
        const err = f => { try { f(); return null; } catch (e) { return e.message; } };
        const none = err(() => LiquidCursor.mount({}));
        const legend = err(() => LiquidCursor.mount({ intensity: 'legendario' }));
        const layers = document.querySelectorAll('.liquid-cursor-layer').length;
        document.documentElement.setAttribute('data-liquid-intensity', 'mucho');
        const c = LiquidCursor.mount({});
        const fromAttr = c.stats;
        document.documentElement.setAttribute('data-liquid-intensity', 'hardcore');
        return { none, legend, layers, keys: Object.keys(LiquidCursor.intensities), fromAttr };
      });
      await p.waitForFunction(() => LiquidCursor.current.intensity === 'hardcore');
      assert.match(v.none, /pass intensity/); assert.match(v.legend, /unknown intensity legendario/);
      assert.equal(v.layers, 0); assert.deepEqual(v.keys, ['nada', 'poquito', 'mucho', 'hardcore']);
      assert.equal(v.fromAttr.source, 'data-liquid-intensity'); assert.equal(v.fromAttr.radius, 10);
      assert.deepEqual(p.w.errors, []); await p.close();
      return { none: v.none, legend: v.legend, keys: v.keys };
    });
    await test('followJuice / maps data-jz-level to 0/0/10/18 px, read only', async () => {
      const p = await page();
      const rows = [];
      await p.evaluate(() => LiquidCursor.mount({ followJuice: true, intensity: 'poquito' }));
      for (const [attr, name, radius, engineRadius] of [['off', 'nada', 0, 0], ['subtle', 'poquito', 0, 0], ['full', 'mucho', 10, 10], ['hard', 'hardcore', 18, 18], ['mucho', 'mucho', 10, 10], ['nada', 'nada', 0, 0]]) {
        await p.evaluate(a => document.documentElement.setAttribute('data-jz-level', a), attr);
        await p.waitForFunction(n => LiquidCursor.current.intensity === n, name);
        const s = await p.evaluate(() => ({ s: LiquidCursor.current.stats, attr: document.documentElement.getAttribute('data-jz-level'), engine: LiquidCursor.current.engine && LiquidCursor.current.engine.options.radius }));
        assert.equal(s.s.radius, radius); assert.equal(s.attr, attr); assert.equal(s.s.sourcePending, false);
        if (radius) assert.equal(s.engine, engineRadius);
        rows.push({ attr, intensity: name, radius, engineRadius: s.engine });
      }
      await p.evaluate(() => document.documentElement.setAttribute('data-jz-level', 'loco'));
      await p.waitForFunction(() => LiquidCursor.current.stats.sourcePending);
      const fallback = await p.evaluate(() => LiquidCursor.current.intensity);
      assert.equal(fallback, 'poquito');
      assert.deepEqual(p.w.errors, []); await p.close();
      return { rows, unknownValueFallsBackTo: fallback };
    });
    await test('destroy / remount never duplicates layers, listeners or engines', async () => {
      const p = await page();
      const v = await p.evaluate(async () => {
        const counts = () => ({ layers: document.querySelectorAll('.liquid-cursor-layer').length, dotHosts: document.querySelectorAll('.liquid-original-dots').length, fluid: document.querySelectorAll('canvas[data-fluid]').length });
        const olds = [];
        for (const i of ['poquito', 'mucho', 'hardcore', 'poquito', 'hardcore']) olds.push(LiquidCursor.mount({ intensity: i }));
        const live = counts();
        const oldStates = olds.slice(0, -1).map(o => o.destroyed && (!o.engine || o.engine.stats.state === 'destroyed'));
        LiquidCursor.current.destroy();
        const after = counts();
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 400, pointerType: 'mouse', isPrimary: true }));
        return { live, oldStates, after, current: LiquidCursor.current, spawnedAfter: olds[3].dots.stats.spawned };
      });
      assert.deepEqual(v.live, { layers: 2, dotHosts: 1, fluid: v.live.fluid }); assert(v.live.fluid <= 1);
      assert(v.oldStates.every(Boolean)); assert.deepEqual(v.after, { layers: 0, dotHosts: 0, fluid: 0 });
      assert.equal(v.current, null); assert.equal(v.spawnedAfter, 0);
      // Pointer input after destroy: no dot spawns, no errors.
      await p.mouse.move(120, 420); await p.mouse.move(160, 430);
      assert.equal(await p.locator('.liquid-original-dot').count(), 0);
      assert.deepEqual(p.w.errors, []); await p.close();
      return v;
    });
    await test('options / color, container, obstacleSelector (data-fluid-obstacle not default)', async () => {
      const p = await page();
      const v = await p.evaluate(() => {
        const host = document.getElementById('mount-here');
        const c = LiquidCursor.mount({ intensity: 'mucho', color: '#00AAFF', container: host });
        const inHost = host.querySelectorAll('.liquid-cursor-layer').length;
        c.engine.boot(); c.engine.collectWalls(); const defaultWalls = c.engine.stats.wallCount;
        const c2 = LiquidCursor.mount({ intensity: 'mucho', obstacleSelector: '[data-liquid-obstacle], [data-fluid-obstacle]' });
        c2.engine.boot(); c2.engine.collectWalls();
        return { color: c.stats.color, inHost, defaultWalls, bothWalls: c2.engine.stats.wallCount };
      });
      assert.equal(v.color, '#00AAFF'); assert.equal(v.inHost, 2); assert.equal(v.defaultWalls, 1); assert.equal(v.bothWalls, 2);
      await p.evaluate(() => LiquidCursor.mount({ intensity: 'poquito', color: '#00AAFF' }));
      for (let i = 0; i < 8; i++) { await p.mouse.move(100 + i * 12, 420); await p.waitForTimeout(42); }
      const colours = await p.evaluate(() => [...document.querySelectorAll('.liquid-original-dot')].map(d => getComputedStyle(d).backgroundColor));
      assert(colours.length >= 3);
      for (const c of colours) assert(['rgb(0, 170, 255)', ...DOT_PALETTE].includes(c), c);
      assert(colours.includes('rgb(0, 170, 255)'));
      assert.deepEqual(p.w.errors, []); await p.close();
      return Object.assign(v, { dotColours: [...new Set(colours)] });
    });
    await test('touch / ignored by default, opt-in with touch:true', async () => {
      const p = await page({ hasTouch: true });
      const run = touch => p.evaluate(async touch => {
        const c = LiquidCursor.mount({ intensity: 'poquito', touch });
        const target = document.querySelector('.arena');
        for (let i = 0; i < 6; i++) {
          target.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 100 + i * 15, clientY: 420, pointerType: 'touch', isPrimary: true }));
          await new Promise(r => setTimeout(r, 45));
        }
        const dots = c.dots.stats.spawned;
        c.setIntensity('hardcore');
        for (let i = 0; i < 6; i++) {
          target.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 100 + i * 15, clientY: 440, pointerType: 'touch', isPrimary: true }));
          await new Promise(r => setTimeout(r, 20));
        }
        return { dots, splats: c.engine.stats.splats, layerPointerEvents: getComputedStyle(document.querySelector('.liquid-cursor-layer')).pointerEvents };
      }, touch);
      const off = await run(false), on = await run(true);
      assert.equal(off.dots, 0); assert.equal(off.splats, 0); assert(on.dots > 0); assert(on.splats > 0);
      assert.equal(off.layerPointerEvents, 'none');
      // Native touch scrolling still reaches the page.
      await p.evaluate(() => { document.body.style.height = '3000px'; });
      await p.touchscreen.tap(300, 400);
      await p.mouse.wheel(0, 400); await p.waitForTimeout(50);
      assert((await p.evaluate(() => scrollY)) > 0);
      assert.deepEqual(p.w.errors, []); await p.close();
      return { off, on };
    });
    await test('glyphs / text, typing and clicks unchanged under Hardcore', async () => {
      const p = await page();
      const glyphs = () => p.evaluate(() => [...(document.getElementById('title').textContent + document.getElementById('copy').textContent)].length);
      const before = await glyphs();
      await p.evaluate(() => LiquidCursor.mount({ intensity: 'hardcore' }));
      for (let i = 0; i < 20; i++) { await p.mouse.move(80 + i * 20, 300 + i * 5); await p.waitForTimeout(10); }
      const box = await p.locator('#counter').boundingBox();
      const hit = await p.evaluate(({ x, y }) => document.elementFromPoint(x, y).id, { x: box.x + 5, y: box.y + 5 });
      await p.locator('#counter').click(); await p.locator('#counter').click();
      await p.locator('#field').click(); await p.keyboard.type('Hola ñandú');
      await p.locator('#link').click();
      const v = await p.evaluate(() => ({ counter: document.getElementById('counter').textContent, field: document.getElementById('field').value, hash: location.hash, cursor: getComputedStyle(document.body).cursor, layerEvents: getComputedStyle(document.querySelector('.liquid-cursor-layer[data-liquid-layer=fluid]')).pointerEvents }));
      const after = await glyphs();
      assert.equal(after, before); assert.equal(hit, 'counter');
      assert.deepEqual(v, { counter: 'Clics: 2', field: 'Hola ñandú', hash: '#fin', cursor: 'auto', layerEvents: 'none' });
      assert.deepEqual(p.w.errors, []); await p.close();
      return Object.assign(v, { glyphs: after, elementUnderPointer: hit });
    });
    await test('reduced motion / initial and dynamic preference respected on dist', async () => {
      const q = await b.newPage({ reducedMotion: 'reduce' });
      const w = watch(q); await q.goto(fileUrl(DEMO));
      await q.mouse.move(100, 550); await q.mouse.move(130, 560);
      assert.equal(await q.evaluate(() => LiquidCursor.current.dots.stats.spawned), 0);
      await q.locator('input[value=hard]').check(); await q.mouse.move(160, 560);
      assert.equal(await q.evaluate(() => !!(LiquidCursor.current.engine && LiquidCursor.current.engine.gl)), false);
      assert.equal(await q.evaluate(() => getComputedStyle(document.querySelector('.liquid-cursor-layer')).display), 'none');
      await q.emulateMedia({ reducedMotion: 'no-preference' });
      // matchMedia.matches can change before its change listeners run. Wait
      // for the wrapper's lifecycle handler to create the new engine before
      // sending pointer input; otherwise a fast runner can lose both moves.
      await q.waitForFunction(() => !LiquidCursor.current.motion.matches && !!LiquidCursor.current.engine);
      await q.mouse.move(180, 560); await q.mouse.move(210, 580);
      await q.waitForFunction(() => !!(LiquidCursor.current.engine && LiquidCursor.current.engine.gl));
      await q.emulateMedia({ reducedMotion: 'reduce' });
      await q.waitForFunction(() => LiquidCursor.current.engine === null);
      assert.deepEqual(w.errors, []); await q.close();
      return true;
    });
    await test('no WebGL2 / Mucho reports unsupported, page and Poquito keep working', async () => {
      const p = await b.newPage({ viewport: { width: 1000, height: 800 } });
      const w = watch(p);
      await p.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, o) { return t === 'webgl2' ? null : g.call(this, t, o); }; });
      await p.goto(fileUrl(STANDALONE));
      await p.evaluate(() => LiquidCursor.mount({ intensity: 'mucho' }));
      for (let i = 0; i < 6; i++) await p.mouse.move(100 + i * 20, 420);
      const fluid = await p.evaluate(() => LiquidCursor.current.stats.fluid.state);
      await p.evaluate(() => LiquidCursor.current.setIntensity('poquito'));
      for (let i = 0; i < 6; i++) { await p.mouse.move(100 + i * 20, 440); await p.waitForTimeout(42); }
      const dots = await p.evaluate(() => LiquidCursor.current.dots.stats.spawned);
      await p.locator('#counter').click();
      assert.equal(fluid, 'unsupported'); assert(dots > 0);
      assert.equal(await p.locator('#counter').textContent(), 'Clics: 1');
      assert.deepEqual(w.errors, []); await p.close();
      return { fluid, dots };
    });
    await test('mobile / demo has no horizontal overflow', async () => {
      const q = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await q.goto(fileUrl(DEMO));
      const v = await q.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      assert(v.scroll <= v.client); await q.close();
      return v;
    });

    // 3. The archived, user-approved offline HTML still runs unchanged.
    await test('archive / approved offline HTML runs every level with no network', async () => {
      const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
      const w = watch(p); await p.goto(fileUrl(ARCHIVE));
      for (const [value, radius] of [['off', 0], ['subtle', 0], ['full', 10], ['hard', 18]]) {
        await p.locator('input[name=juega][value="' + value + '"]').check();
        await p.waitForFunction(r => LiquidCursor.current.stats.radius === r, radius);
      }
      const v = await fieldMetrics(p); assertField(v, 18);
      assert.deepEqual(w.requests, []); assert.deepEqual(w.errors, []); await p.close();
      return { version: '0.1.1-recovery', last: v.metrics[v.metrics.length - 1] };
    });
  } finally {
    await new Promise(r => srv.server.close(r));
    await b.close();
  }
  const report = {
    package: 'cursor-liquido',
    version: JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'))).version,
    golden_engine_sha256: JSON.parse(fs.readFileSync(path.join(ROOT, 'dist/manifest.json'))).golden_engine_sha256,
    dist_sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'dist/cursor-liquido.js'))).digest('hex'),
    environment: { runner: 'Playwright ' + playwrightVersion(), browser: 'Chromium ' + b.version(), gl: 'ANGLE SwiftShader (software)', node: process.version },
    scope: 'Packaged dist/ over file:// and an ephemeral local HTTP server, a plain integration fixture, and the archived approved HTML. Deterministic pointer-coordinate field checks plus real Playwright pointer input. Not a certification of physical GPUs, browsers or phones.',
    passed: results.filter(r => r.status === 'PASS').length,
    failed: results.filter(r => r.status === 'FAIL').length,
    results,
    screenshots: shots
  };
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, failed: report.failed }));
  if (report.failed) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
