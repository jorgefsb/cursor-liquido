---
name: cursor-liquido
description: "Use when adding, configuring, testing or removing the Cursor líquido pointer trail (dots or WebGL2 fluid) on a web page."
version: 1.0.0
license: MIT
author: Jorge Suárez
---

# Cursor líquido

Portable instructions for any coding agent (Claude, Codex, ChatGPT or similar). They assume only a shell, a browser for testing and this repository. Intended source: `https://github.com/jorgefsb/cursor-liquido` (not yet confirmed as published, so prefer the checked-out copy).

## What it is

A pointer trail that sits behind the native cursor. Four intensities:

| Intensity | Juice `data-jz-level` | Output |
|---|---|---|
| `nada` | `off` | nothing |
| `poquito` | `subtle` | 7 px DOM dots, main colour (default `#FF6B35`) alternating with `#22211F` and `#F4E8D5`, no WebGL |
| `mucho` | `full` | multicolour WebGL2 fluid, 10 CSS px |
| `hardcore` | `hard` | multicolour WebGL2 fluid, 18 CSS px |

There is no fifth level. "Legendario" is only a proposal in `docs/roadmap.md`. Do not implement or advertise it.

## Before you change a page

1. Read the page's existing styles and scripts. Find any existing cursor trail. Keep one cursor owner: disable the old trail through its own documented switch, or stop and ask. Never patch a published vendor file to hide a duplicate.
2. Read `docs/api.md` for the exact options. Do not invent options. The accepted ones are `intensity`, `followJuice`, `touch`, `color`, `obstacleSelector` and `container`.
3. Decide the intensity with the page owner. Without a visible Juega control, set it in code (`intensity`) or in `<html data-liquid-intensity>`. Never show a `prompt()` or force the visitor to choose.

## Integrate

```html
<link rel="stylesheet" href="/vendor/cursor-liquido/cursor-liquido.css">
<script src="/vendor/cursor-liquido/cursor-liquido.js"></script>
<script>
  LiquidCursor.mount({ intensity: 'poquito' })
</script>
```

- Copy `dist/` to the site. Verify served files against `dist/manifest.json`. There is no npm package yet, so do not tell anyone to run `npm install cursor-liquido`.
- Mark solid blocks with `data-liquid-obstacle`. `data-fluid-obstacle` only counts if you pass it in `obstacleSelector`.
- With a Juice control use `LiquidCursor.mount({ followJuice: true })`. Never feed `data-jz-level` to `FluidCursor` directly: its own table maps `subtle`/`full` to 10/18 px and treats `hard` as `subtle`.
- Do not give any element `id="fluid-canvas"`: the engine auto-mounts there and you would get two owners.
- `color` only changes Poquito's main dot colour. The fluid stays multicolour. Say so honestly.

## Never

- Edit `src/approved-fluid-v3.1.js` or its shaders. Its sha256 must stay `3d478cc836969c216812c7e479724e0e204bbb76a26df24c2414568883021230`.
- Rewrite the renderer to make a test pass. If the output is wrong, stop and report with evidence.
- Hide the native pointer, capture clicks or block scrolling.
- Promise identical rendering on every GPU, browser or phone.
- Add Moki or any mascot. Cursor líquido does not need one.

## Verify

Run `npm test` and `npm run test:browser` in this repository. On the target page, check:

- every intensity you expose, plus reduced motion at load and after toggling it,
- keyboard focus, typing in fields, clicks and links,
- touch scrolling (touch trail is off unless `touch: true`),
- a real screenshot or recording: coloured, localized trail and no grey or white full-page wash,
- destroy and remount leave exactly two `.liquid-cursor-layer` elements.

Browser emulation is not a physical-device test. Report what you actually ran.

## Deliver

When asked to "download and try", deliver an offline HTML first. Integrating into a production page, publishing or changing a site are separate steps that need their own approval. Record the package version, the bundle sha256 and how to roll back (`docs/rollback.md`).

## Sibling skills

- Game Feel, intended source `https://github.com/jorgefsb/game-feel`: generic game feel for any brand. No mascot required.
- Papacito Juice, intended source `https://github.com/jorgefsb/papacito-juice`: the personal-brand profile. It always includes the authorised Moki. Moki's assets are not part of this repository and are not licensed by its MIT code.

Neither repository is confirmed as published yet. Cursor líquido works without both.
