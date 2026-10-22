# Accessibility and performance

English · [Español](accessibility-performance.md)

What version 1.0.1 does, and what is not promised.

## Accessibility

- Native pointer unchanged. The package neither sets `cursor` nor hides the system pointer.
- No input capture. Layers use `pointer-events: none` and `aria-hidden="true"`. Clicks, selection, focus, keyboard and scroll reach the page. Browser tests exercise keyboard, accented typing, clicks and links.
- No text changes. The effect adds no text; Poquito dots are empty `<i>` elements inside an `aria-hidden` container.
- With `prefers-reduced-motion: reduce`, no dots or fluid engine are created on load. Switching to reduced motion destroys the engine and clears dots; switching back recreates the engine on the next movement. CSS hides layers too.
- Fluid does not emit over links, buttons, fields, `[contenteditable]`, `iframe` or `.jz-panel`, so it does not obscure reading and typing controls.
- Touch is off by default (`touch: false`); fingers scroll normally. Enable only if requested by the page owner.
- Fluid uses `mix-blend-mode: screen`, adding light to dark backgrounds. Avoid text whose contrast is already marginal.

## Performance

- No work while idle. Poquito only animates while dots live (maximum 29, at most one per 38 ms, lifetime 480 ms). Fluid stops `requestAnimationFrame` 4.5 s after the last movement.
- Fluid pauses and clears on scroll, hidden tabs and WebGL context loss.
- Frame cap: at most 60 fps, 30 in `economy` or `reduced` mode.
- Budget: 12 consecutive frames above 45 ms switch to `reduced` (smaller simulation, fewer iterations). After 24 further frames above 65 ms, fluid pauses (`budget-paused`) and frees the GPU.
- Coarse pointers, `Save-Data` or at most 4 CPU cores start at `economy` quality.
- Without WebGL2 or `EXT_color_buffer_float`, `fluid.state` is `unsupported`; Mucho and Hardcore draw nothing. The page and Poquito still work.
- The unminified, uncompressed JS bundle is approximately 42 KB. No runtime dependencies.

## Not promised

Tests run in headless Chromium with software WebGL (ANGLE SwiftShader), not physical GPU, browser or OS certification. No physical phones or tablets have been tested. Playwright mobile emulation checks horizontal overflow, not real device performance.

Fluid can vary by GPU, driver and browser. See [rollback](rollback.en.md) if a platform fails.
