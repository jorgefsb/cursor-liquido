'use strict';
// Browser-only input regressions. The first case deliberately withholds one
// RAF delivery; it is a declared scheduler fixture, not a performance claim.
const assert = require('assert/strict');

async function delayedFrameTouch(p) {
  await p.evaluate(() => {
    const native = window.requestAnimationFrame.bind(window);
    window.__touchFrameFixture = { native, held: [], released: false };
    window.requestAnimationFrame = callback => native(time => {
      const f = window.__touchFrameFixture;
      if (!f.released) f.held.push(callback);
      else callback(time);
    });
    LiquidCursor.mount({ intensity: 'hardcore', touch: true });
  });
  const immediate = await p.evaluate(async () => {
    const target = document.querySelector('.arena');
    for (let i = 0; i < 6; i++) {
      target.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true, clientX: 100 + i * 15, clientY: 440,
        pointerType: 'touch', isPrimary: true
      }));
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    const e = LiquidCursor.current.engine;
    return { splats: e.stats.splats, frames: e.stats.frames, pending: e.pending && { ...e.pending } };
  });
  assert.equal(immediate.splats, 0);
  assert.equal(immediate.frames, 0);
  assert(immediate.pending, 'real touch input must be queued while the first RAF is held');
  await p.waitForFunction(() => window.__touchFrameFixture.held.length > 0, null, { timeout: 2000 });
  await p.evaluate(() => {
    const f = window.__touchFrameFixture;
    f.released = true;
    window.requestAnimationFrame = f.native;
    for (const callback of f.held.splice(0)) f.native(callback);
  });
  // No new pointer event, synthetic dye, frame call or counter mutation.
  await p.waitForFunction(() => LiquidCursor.current.engine.stats.splats > 0, null, { timeout: 2000 });
  const completed = await p.evaluate(() => {
    const e = LiquidCursor.current.engine, gl = e.gl;
    const f = e.dye.read, data = new Float32Array(f.width * f.height * 4);
    const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    gl.bindFramebuffer(gl.FRAMEBUFFER, f.framebuffer);
    gl.readPixels(0, 0, f.width, f.height, gl.RGBA, gl.FLOAT, data);
    gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
    let active = 0, peak = 0;
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.max(data[i], data[i + 1], data[i + 2]);
      if (value > .001) active++;
      peak = Math.max(peak, value);
    }
    return { splats: e.stats.splats, frames: e.stats.frames, active, peak, glError: gl.getError() };
  });
  assert.equal(completed.splats, 1, 'the single queued input must be consumed once');
  assert(completed.active > 0 && completed.peak > 0);
  assert.equal(completed.glError, 0);
  return { fixture: 'first RAF delivery held and released onto native RAF', immediate, completed };
}

async function nativeTouchPan(p) {
  const client = await p.context().newCDPSession(p);
  await p.evaluate(() => {
    window.__nativeTouchEvents = [];
    for (const type of ['pointerdown', 'pointermove', 'pointercancel', 'touchstart', 'touchmove']) {
      window.addEventListener(type, event => {
        const row = { type, trusted: event.isTrusted, pointerType: event.pointerType || null, prevented: false };
        window.__nativeTouchEvents.push(row);
        queueMicrotask(() => { row.prevented = event.defaultPrevented; });
      }, { capture: true, passive: true });
    }
    LiquidCursor.mount({ intensity: 'hardcore', touch: true });
  });
  const send = (type, points) => client.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  const point = (x, y) => [{ x, y, id: 1, radiusX: 1, radiusY: 1, force: .5 }];
  try {
    await send('touchStart', point(100, 440));
    // Below the browser's pan threshold, so native scrolling has not cancelled
    // this gesture. Native pointer events, not dispatchEvent, enter the engine.
    for (let i = 1; i <= 5; i++) {
      await send('touchMove', point(100 + i, 440));
      await p.waitForTimeout(50);
    }
    await p.waitForFunction(() => LiquidCursor.current.engine.stats.splats > 0, null, { timeout: 2000 });
    const splats = await p.evaluate(() => LiquidCursor.current.engine.stats.splats);
    await send('touchEnd', []);
    await p.evaluate(() => { document.body.style.height = '3000px'; window.scrollTo(0, 0); });
    await p.waitForTimeout(50);
    await send('touchStart', point(300, 650));
    for (let y = 600; y >= 300; y -= 50) {
      await send('touchMove', point(300, y));
      await p.waitForTimeout(35);
    }
    await send('touchEnd', []);
    await p.waitForFunction(() => scrollY > 0, null, { timeout: 2000 });
    const result = await p.evaluate(() => ({
      scrollY, events: window.__nativeTouchEvents,
      pending: LiquidCursor.current.engine.pending,
      pointer: LiquidCursor.current.engine.pointer
    }));
    assert(result.events.some(e => e.type === 'pointermove' && e.pointerType === 'touch' && e.trusted));
    assert(result.events.some(e => e.type === 'pointercancel' && e.trusted));
    assert(result.events.every(e => !e.prevented));
    assert(result.scrollY > 0);
    assert.equal(result.pending, null);
    assert.equal(result.pointer, null);
    return { nativeSplats: splats, ...result };
  } finally {
    await send('touchEnd', []).catch(() => {});
    await client.detach();
  }
}

module.exports = { delayedFrameTouch, nativeTouchPan };

if (require.main === module) {
  const fs = require('fs'), path = require('path');
  let playwright;
  try { playwright = require('playwright'); }
  catch (error) { playwright = require(process.env.PLAYWRIGHT_MODULE); }
  (async () => {
    const b = await playwright.chromium.launch({ headless: true, ignoreDefaultArgs: ['--hide-scrollbars'],
      args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const rows = [];
    try {
      for (const [name, run] of Object.entries({ delayedFrameTouch, nativeTouchPan })) {
        const p = await b.newPage({ viewport: { width: 1000, height: 800 }, hasTouch: true });
        try {
          await p.goto('file://' + path.resolve(__dirname, '../fixtures/standalone.html'));
          const detail = await run(p); rows.push({ name, status: 'PASS', detail });
          console.log('PASS', name, JSON.stringify(detail));
        } finally { await p.close(); }
      }
    } finally {
      await b.close();
      if (process.env.TOUCH_REPORT) fs.writeFileSync(process.env.TOUCH_REPORT, JSON.stringify(rows, null, 2));
    }
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
