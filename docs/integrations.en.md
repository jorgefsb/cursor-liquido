# Integrations

English · [Español](integrations.md)

## One cursor owner

Each page has one trail. Identify existing Juice trails, a `FluidCursor` mounted on `#fluid-canvas`, or third-party trails; turn them off using their documented switch. If no switch exists, resolve ownership first rather than patching vendor files to hide duplicates. Within this package `LiquidCursor.mount` guarantees one live instance.

## Standalone page, no menu

```html
<link rel="stylesheet" href="/vendor/cursor-liquido/cursor-liquido.css">
<script src="/vendor/cursor-liquido/cursor-liquido.js"></script>
<script>
  LiquidCursor.mount({ intensity: 'mucho' })
</script>
```

Alternatively choose in HTML:

```html
<html data-liquid-intensity="poquito">
…
<script>LiquidCursor.mount()</script>
```

The page owner decides at integration time. Do not show `prompt()` or force visitors to choose.

## Juice (`data-jz-level`)

Juice is the four-level Juega control. It writes `data-jz-level` on `<html>`. Cursor líquido only reads it:

| Juega | `data-jz-level` | Cursor líquido | Radius |
|---|---|---|---|
| Nada | `off` | `nada` | 0 |
| Poquito | `subtle` | `poquito` | dots |
| Mucho | `full` | `mucho` | 10 CSS px |
| Hardcore | `hard` | `hardcore` | 18 CSS px |

```js
LiquidCursor.mount({ followJuice: true })
```

### Do not use the old engine directly

`FluidCursor` has a different table: `subtle` = 10 px, `full` = 18 px, and unknown `hard` becomes `subtle`. That would turn Poquito into fluid and Hardcore into 10 px. The adapter disconnects that reader and applies the table above. Never feed `data-jz-level` to `FluidCursor` or use `id="fluid-canvas"` on the same page.

### Separate page driver, no vendor edits

If the page already publishes Juice (and Moki in the personal-brand profile), leave those published files alone. Load a page-owned script after Juice that:

1. Disables the old trail via its documented switch, if present.
2. Calls `LiquidCursor.mount({ followJuice: true })`.

The cursor does not control Moki, audio, achievements or Hardcore unlocking. Those remain with Juice. To revert, remove the driver and the package's two tags.

## Game Feel and Papacito Juice

Sibling skills intended for their own repositories:

- Game Feel, intended `https://github.com/jorgefsb/game-feel`: generic interface feedback; no mascot required.
- Papacito Juice, intended `https://github.com/jorgefsb/papacito-juice`: personal-brand profile, always including authorized Moki from its brand library.

Publication of these repositories has not been verified here. Cursor líquido works without either and does not require Moki. No Moki assets are included or covered by this code's MIT license.

## Other brands

Use their primary `color` or `--liquid-cursor-color` for Poquito. Fluid is multicolored by design in this version; brand palettes do not configure it.

## Frameworks

The classic script defines `window.LiquidCursor`. For single-page apps, mount on the client after loading it; call `LiquidCursor.current.destroy()` on view teardown if the effect should not continue. No ES module build exists in this version.
