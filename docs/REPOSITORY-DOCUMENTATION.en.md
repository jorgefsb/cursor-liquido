# Family documentation

English · [Español](REPOSITORY-DOCUMENTATION.md)

For editing Cursor líquido documentation. Public visual reference: [Jorge Suárez official brandkit](https://brandkit.jorgesuarez.com.mx/). No private system access is required.

## Before editing

Read both READMEs and current guides. Preserve commands, paths, identifiers and APIs literally. Do not change code, dist, vendor, tests, versions or historical records to make docs pass. The approved engine and adapter are frozen.

## Content

Keep Spanish README.md and equivalent README.en.md with mutual links. Every current user guide needs an ES/EN counterpart; preserve historical CHANGELOG and release records. Answer what, who, why, how, when to use/avoid and where to try/download; include version, requirements, technical help, costs, privacy, limits and support. Put a person's first action before developer setup. Never promise unverified publication.

## Design and media

Background #0A0A0A, surface #161616, orange #FF6B35, amber #FFA500, text #FFFFFF, secondary #B7B3AD. Use #22211F over orange. Outfit 700 headings, Inter 400 body, from official fonts. Small official signature top-left, canonical Cursor líquido title, plain benefit, generous right-hand region for a real screenshot. No decorative gradients or invented UI. The light panel in screenshots belongs to the historical demo, not a new brand palette.

Render PNG covers with local fonts and a mobile variant. Use real screenshots/video, provenance, VTT and ES/EN explanations. State capture conditions; emulation does not certify hardware. Include no private data. Moki is not a dependency and must not be added to the module. Follow the [asset notice](ASSET-NOTICE.en.md).

## Check and deliver

Validate local links, six questions, ES/EN parity, dimensions, video metadata and baseline hashes. Run existing tests without changing assertions. Inspect desktop/mobile previews for overflow and broken images. Save evidence in `reports/docs-brandkit-verification.json`. Commit locally; publishing, releases and deployment require separate authorization.

## Reproduce the local sample

Artifacts are included and can be opened without installing tools. Regeneration needs Python with Pillow and Python-Markdown, the official kit snapshot in `BRAND_ASSET_ROOT` and installed Playwright at an absolute path. Product dependencies are unchanged.

```sh
python scripts/docs-render.py "$BRAND_ASSET_ROOT"
PLAYWRIGHT_MODULE="$PLAYWRIGHT_MODULE" node scripts/docs-browser.cjs
PLAYWRIGHT_MODULE="$PLAYWRIGHT_MODULE" python scripts/docs-verify.py "$BRAND_ASSET_ROOT"
```

The report separates documentation checks from product tests. Original tests have two conflicts with this work: the release manifest includes `docs/media/`, so new media make it stale; and the privacy denylist classifies the official public brandkit domain as private. Do not alter dist or hide the URL to pass them. See `reports/docs-brandkit-verification.json` and `reports/docs-existing-tests.json`.
