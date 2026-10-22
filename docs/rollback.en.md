# Rollback

English · [Español](rollback.md)

## Turn off now, without a deployment

In the browser console or your code:

```js
LiquidCursor.current && LiquidCursor.current.destroy()
```

For support, `?fluid=off` in the URL disables the fluid engine for that load; Poquito is unaffected.

## Remove the package

Remove both tags (CSS `<link>` and JS `<script>`), the mount call and any Juice driver. `data-liquid-obstacle` and `data-liquid-intensity` can remain: they do nothing without the package.

## Return to an earlier version

1. Publish each version in its own directory, e.g. `/vendor/cursor-liquido/1.0.0/`, without overwriting it.
2. Point both tags back to the earlier directory.
3. Compare served bytes with that version's `manifest.json`:

```sh
curl -s https://tu-sitio.example/vendor/cursor-liquido/1.0.0/cursor-liquido.js | sha256sum
# compare with files["dist/cursor-liquido.js"].sha256 in the manifest
```

## Before each integration

Save the previous page and vendor directory, record the package version and `dist/cursor-liquido.js` SHA-256, and test the selected intensity, reduced motion and keyboard interaction.

## Grey or white fluid wash

This was the regression fixed before 1.0.0, recorded in [CHANGELOG](../CHANGELOG.md). First check the engine SHA-256 inside the bundle is `3d478cc836969c216812c7e479724e0e204bbb76a26df24c2414568883021230` (`npm test` checks it). If it matches but a specific GPU still fails, use `poquito` on that page and open an issue with browser, OS and GPU.
