# Roadmap

English · [Español](roadmap.md)

These are undated ideas, not implemented in the local 1.0.1 code. The repository owner verified the v1.0.1 release download links listed in the [README](../README.en.md).

## Proposed Legendario level

A fifth level above Hardcore is only a proposal. `mount({ intensity: 'legendario' })` throws; there are still four levels (Nada, Poquito, Mucho, Hardcore).

Before implementation:

- Obtain explicit visual-behavior approval.
- Decide whether the approved engine can remain intact (e.g. another radius through the adapter), or a new engine needs a new golden hash and visual approval.
- Test physical output (localized color, no white wash, finite field) as for existing levels.
- Release a new minor version without changing the four existing levels.

## Other pending work

- A public GitHub Pages demo based on `demo/index.html`.
- Maintain and verify versioned downloads for future GitHub Releases.
- An npm package once a registry entry exists.
- An ES module build alongside the classic script.
- Tests on physical GPUs, browsers and phones. Current coverage is headless Chromium with software WebGL.
- Configurable fluid palettes for other brands without changing the default approved engine.
