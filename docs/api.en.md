# API · Cursor líquido 1.0.1

English · [Español](api.md) · [Start here](../README.en.md)

This page describes `src/`. Options not listed here are not implemented.

## Loading

`dist/cursor-liquido.js` is a classic script, not an ES module. In order it concatenates:

1. `src/approved-fluid-v3.1.js`: approved engine (`window.FluidCursor`), frozen SHA-256 `3d478cc836969c216812c7e479724e0e204bbb76a26df24c2414568883021230`.
2. `src/approved-engine-adapter.js`: radius and lifecycle adapter (`window.FluidEngine`).
3. `src/quality-input-guard.js`: external subclass retaining real queued input across the first quality resize. See [technical note](quality-input-candidate.md).
4. `src/liquid-cursor.js`: public API (`window.LiquidCursor`).

`dist/cursor-liquido.css` defines layers. Inline safety styles keep the effect functional without it, but you lose `--liquid-cursor-z`, fluid `screen` blending and CSS reduced-motion hiding.

## `LiquidCursor.mount(options)`

Creates and returns an instance. Only one live instance is allowed: a new `mount` destroys the previous instance first, avoiding duplicate layers and listeners.

### Intensity source, in order

1. `followJuice: true`: reads `<html data-jz-level>`. Missing or unknown values fall back to `intensity`, then `nada`. In that case `stats.sourcePending` is `true`.
2. `intensity`: fixed value.
3. `<html data-liquid-intensity="…">`: read at mount and observed afterward.
4. No source: throws `Error('LiquidCursor.mount: pass intensity …')`.

The module reads these attributes, never writes them.

### Options

| Option | Default | Actual effect |
|---|---|---|
| `intensity` | none | `'nada'`, `'poquito'`, `'mucho'`, `'hardcore'`. Also accepts `'off'`, `'subtle'`, `'full'`, `'hard'`. Case-insensitive, trims whitespace. Unknown values throw. |
| `followJuice` | `false` | Follows `<html data-jz-level>` as above. |
| `touch` | `false` | When false, touch pointer events create neither dots nor fluid. Mouse and pen count. |
| `color` | `<html>` `--liquid-cursor-color`, otherwise `#FF6B35` | Main Poquito dot color; does not change fluid. |
| `obstacleSelector` | `'[data-liquid-obstacle]'` | CSS selector for solid blocks the fluid flows around and collides with. |
| `container` | `document.body` | Layer parent. Layers use `position: fixed` and cover the viewport. |

No other mount options exist. Internal force, curl, palette and opacity are not exposed.

### Poquito palette

Each dot picks from `[color, '#22211F', '#F4E8D5']` at birth, on a 38 ms cycle. Default output alternates orange, near-black and cream; it is not all orange.

### Fluid color

The engine picks a random saturated hue every 100 ms (`arcade` mode). `color` does not affect it.

### Obstacles

- Default: only `data-liquid-obstacle`.
- The engine's own default includes `[data-fluid-obstacle]`, but mount replaces it. For existing markup pass `obstacleSelector: '[data-liquid-obstacle], [data-fluid-obstacle]'`.
- At most 12 visible obstacles. Zero-size, `display: none` and `visibility: hidden` blocks are ignored. Rounded corners (`border-radius`) are respected.
- Obstacles are measured each active fluid frame, never while idle.

### Emission exclusions

Fluid does not emit over `a, button, input, select, textarea, [contenteditable], iframe, .jz-panel`. Poquito dots can appear anywhere. Both layers use `pointer-events: none`; they do not intercept clicks, text selection or scrolling.

## Instance

| Member | Behavior |
|---|---|
| `setIntensity(value)` | Changes intensity, same accepted values; unknown values throw. Returns the instance. |
| `stop()` | Clears live dots and fluid, without changing intensity. |
| `destroy()` | Removes layers and listeners, frees WebGL; idempotent. |
| `stats` | State snapshot below. |
| `intensity` | Current canonical name. |
| `engine` | Engine instance, or `null` when not created (Poquito, Nada, reduced motion). |

### `stats`

```js
{
  intensity: 'mucho', layer: 'fluid', radius: 10,
  source: 'option' | 'data-jz-level' | 'data-liquid-intensity',
  sourcePending: false, color: '#FF6B35', touch: false,
  dots: { state, alive, spawned, frames, max },
  fluid: { state, frames, splats, impacts, wallCount, error, quality, play, radius, … }
}
```

`fluid.state`: `not-created`, `engine-missing`, `waiting`, `ready`, `running`, `idle`, `disabled`, `disabled-play`, `unsupported` (no WebGL2 or `EXT_color_buffer_float`), `failed`, `context-lost`, `budget-paused`, `destroyed`. `fluid.quality`: `normal`, `economy`, `reduced`.

## `LiquidCursor`

| Member | Meaning |
|---|---|
| `version` | `'1.0.1'` |
| `intensities` | Frozen `{ nada, poquito, mucho, hardcore }`, each with `layer` and `radius`. |
| `juiceLevels` | `{ off: 'nada', subtle: 'poquito', full: 'mucho', hard: 'hardcore' }` |
| `normalize(value)` | Canonical name or `null`. |
| `current` | Live instance or `null`. |
| `mount(options)` | Above. |
| `DotTrail` | Internal Poquito class exposed for testing. |

## Other bundle globals

- `window.FluidCursor`: unadapted engine. Use through `LiquidCursor` only. Its internal `subtle/full` mean 10/18 px; it treats `hard` as `subtle`.
- `window.FluidEngine`: adapter.
- The engine automatically mounts on `id="fluid-canvas"` if present. Do not use that ID alongside Cursor líquido, which would create two owners.
- `?fluid=off` disables the fluid engine for that load, useful for support.

## CSS

| Variable or rule | Use |
|---|---|
| `--liquid-cursor-z` | Layer z-index, default `30`. Dots use inline `z-index: 30`. |
| `--liquid-cursor-color` | Poquito main dot color if `color` is absent. Read at mount. |
| `[data-liquid-layer="fluid"]` | `mix-blend-mode: screen`, adds light on dark backgrounds; barely visible on light ones. |
| `prefers-reduced-motion: reduce` | Hides layers. |
