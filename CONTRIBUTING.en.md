# Contributing

English · [Español](CONTRIBUTING.md)

This package has already suffered a visual regression from attempts to improve the renderer. Keep changes reviewable.

## Approved engine and adapter

`src/approved-fluid-v3.1.js` is the approved renderer. Its SHA-256 is fixed in `scripts/build.cjs` and tests. Do not change its bytes, shaders or formatting. If a feature needs a different engine, open an issue first: a new engine needs its own golden hash and visual approval.

For this documentation rollout both the approved engine and `src/approved-engine-adapter.js` are frozen. Future code changes require separate approval, tests and a CHANGELOG entry; documentation work never changes runtime files or tests.

## Setup

```sh
npm ci
npx playwright install chromium
```

Offline, reuse installed Playwright with `PLAYWRIGHT_MODULE=/absolute/path/to/node_modules/playwright`.

## Before a code PR

```sh
npm run build
npm test
npm run test:browser
npm run test:quality
```

Ship regenerated `dist/` with approved code changes. `npm test` fails if it differs from a fresh build. For docs-only work leave `dist/` byte-identical.

## Visual tests

Event counts are insufficient. Rendering changes need physical-output checks (localized color, no neutral wash, finite field) and real, unretouched screenshots or video. Do not upload other sites, chats or personal data.

## Do not upload

Absolute machine paths, emails, internal hostnames, credentials, `.env` files or third-party brand assets, including Moki. Privacy tests cover common cases. Editorial brand compositions follow the [asset notice](docs/ASSET-NOTICE.en.md), never the code license.

## Style

Match neighboring code. Current documentation must have equivalent Spanish and English guides with mutual links. Follow [documentation rules](docs/REPOSITORY-DOCUMENTATION.en.md). Commits: `type: description` (`feat`, `fix`, `docs`, `test`, `build`, `refactor`).
