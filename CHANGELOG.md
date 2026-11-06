# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] - Phase 7 dead code cleanup (2026-11-06)

Dead-code audit per `PROMPT.md` Phase 7. No `docs/BASELINE.md` existed
to verify against (Phase 5 gap, already tracked as
`docs/TECHNICAL_DEBT.md` #12) - used a fresh Docker `npm ci && npm run
lint && npx tsc -b && npm run test:run && npm run build` run on the
pre-change tree as the regression baseline instead, then confirmed the
production bundle's chunk hashes/sizes are byte-identical after every
change below.

Tooling: `knip`, `ts-prune` (pointed at `tsconfig.app.json` - the root
`tsconfig.json` is solution-style with `"files": []` and silently
makes `ts-prune` report nothing against it), `depcheck`, and a
one-off `vitest run --coverage` pass, cross-validated against each
other and against manual `grep`/`npm ls` checks before deleting
anything.

### Removed

- **Unused scaffold assets** - `src/assets/hero.png`, `react.svg`,
  `vite.svg`. Zero references anywhere in the project; `react.svg`/
  `vite.svg` are Vite's default template placeholders, never wired
  into this app's UI. Vite only bundles `src/` files that are actually
  imported, so this has no effect on the production build.
- **`process` dependency** (`package.json`) - flagged by both `knip`
  and `depcheck`; confirmed via `grep` (zero references to the literal
  token anywhere in `src/`) and via `npm ls process` after removal,
  which shows it is still present, now purely as
  `vite-plugin-node-polyfills -> node-stdlib-browser -> process` - i.e.
  the top-level entry was always a redundant duplicate of what the
  polyfill plugin already carries internally. `vite.config.ts`'s
  `nodePolyfills({ include: [...], globals: { process: true } })`
  config was deliberately left untouched (it controls the plugin's own
  bundled polyfill, not this npm package - removing it would be a
  behavior change, not dead-code removal).
- **Dead/unnecessary type exports**, cross-validated by `knip` and
  `ts-prune`:
  - `WalletState` (`src/shared/types/wallet.ts`) - zero references
    anywhere, including its own file (the real wallet store,
    `entities/wallet/model/wallet.store.ts`, defines its own
    `WalletStore` interface instead). Deleted.
  - `TransactionType` (`src/shared/types/transaction.ts`) - used only
    within its own file; un-exported (kept, just no longer part of any
    external surface).
  - `AddressRisk` (`src/shared/services/security.service.ts`) - same
    pattern, used only within its own file (the type that IS consumed
    elsewhere, `AddressCheckResult`, is unaffected); un-exported.

`buffer` was also flagged by `knip`/`depcheck` as an unused dependency
but kept - `src/global.d.ts` imports it for real
(`import { Buffer as BufferType } from 'buffer'`, used to type the
global `Buffer` the polyfill plugin injects), a pattern both tools'
static import-graph analysis misses for ambient `.d.ts` files. Verified
`tailwindcss` is also a false positive from `depcheck` alone (used via
`@import "tailwindcss"` in `src/index.css`, which `depcheck` doesn't
parse) - `knip` correctly did not flag it.

No restructuring: the existing Feature-Sliced Design layout
(`app/entities/features/shared`) already matches current
Vite+React+TS conventions: nothing needed re-shaping.

## [Unreleased] - Phase 6 dependency upgrade (2026-11-06)

Full sweep to latest stable across runtime, framework, libraries, dev
tools, and CI actions, per `CLAUDE.md` standing decision 1 and
`PROMPT.md` Phase 6. Every version below was confirmed against the
real npm registry / GitHub releases at the time of the change, not
from memory or from `projects/info/deps/ton-testnet-wallet.md`'s
snapshot.

### Changed

- **Node runtime unified on 26.13.0 LTS** (`0cf34fd`) - `.nvmrc`,
  `docker/Dockerfile`, and CI's `actions/setup-node` had drifted across
  25/24/20; all three now pin the same current LTS.
- **`@types/node` 24 -> 26** (`37a1dc4`) - matches the Node 26.13.0
  runtime; type-only devDependency, no runtime impact.
- **`jsdom` 30 -> 31** (`fcf7bf1`) - breaking major (engines now
  requires Node >=26, already satisfied). No vitest peer/API impact
  (vitest's jsdom peer range is `*`).
- **`vite` lockfile bump to 8.3.6** (`c75cdd1`) - already covered by
  the existing `^8.3.5` range; no `package.json` change needed.
- **`tailwindcss` + `@tailwindcss/vite` lockfile bump to 4.3.4**
  (`c66885a`) - already covered by the existing `^4.2.2` range.
- **`vitest` 4 -> 5** (`8154414`) - breaking major. Vitest 5 changed
  its `Assertion<T>` type to a two-type-param shape. Migration:
  `src/test-setup.ts` now imports `@testing-library/jest-dom/vitest`
  (the library's dedicated vitest entry point) instead of the plain
  `@testing-library/jest-dom` import, which only ever augmented Jest's
  global `expect` and never vitest's `Assertion` interface. Same
  matcher set and runtime behavior; this only changes which type
  augmentation module loads. Without it, `tsc -b` (inside
  `npm run build`) fails with ~30 `TS2339` errors on
  `toBeInTheDocument`/`toHaveClass`/`toBeEmptyDOMElement` across the
  Dashboard/SendPage/ReceivePage component tests.
- **`minimatch` forced to `11.0.5` via `overrides`** - fixes
  GHSA-g3hv-75wg-m249 / CVE-2026-118764 (medium, glob-pattern
  amplification DoS), found live via `npm audit` rather than
  Dependabot (the advisory was ~1 week old at check time; Dependabot
  alerts hadn't caught up yet). The sole, already-deduped copy in the
  tree was pinned at `10.2.6` by `eslint`/`typescript-eslint` (both
  already their own latest release); `11.0.5`'s export shape and
  Node engine range are identical, so the override is low-risk.
- All other npm dependencies within their existing `package.json`
  semver ranges (`react`, `react-dom`, `zustand`, `zod`, `@ton/ton`,
  `@testing-library/jest-dom`, `@testing-library/react`,
  `@vitejs/plugin-react`, `eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`, `@eslint/js`, `globals`,
  `typescript-eslint`) were already resolved to their current latest
  stable release via previously merged Renovate PRs (confirmed live
  against the npm registry this phase) - no further action needed.
- GitHub Actions (`actions/checkout@v7`, `actions/setup-node@v7`,
  `actions/upload-artifact@v7`, `docker/login-action@v4`,
  `docker/metadata-action@v6`, `docker/setup-buildx-action@v4`,
  `docker/build-push-action@v7`) and the `nginx:1.31-alpine` base image
  are already pinned to their current latest major - confirmed via
  `gh api repos/<action>/releases/latest` and the Docker Hub tags API,
  no bump needed.

### Removed

- **`@types/qrcode.react`** (`820eedc`) - npm-deprecated stub types;
  `qrcode.react@4.2.0` ships its own type definitions.

### Added

- **`renovate.json`** (`5b2acf7`) - no Renovate/Dependabot config
  existed in this repo despite ~25 already-merged `renovate/*` PRs.
  Added grouped (non-major npm / GitHub Actions / Docker base images),
  scheduled (weekly), PR-capped (`prConcurrentLimit: 5`,
  `prHourlyLimit: 2`) configuration with `lockFileMaintenance` enabled
  and vulnerability alerts kept on an "any time" schedule.

### Known limitations (accepted blockers - see `docs/TECHNICAL_DEBT.md`)

- `zod` nested inside `@ton/ton@16.3.0`'s own `node_modules` stays on
  the `3.x` line (`3.25.76`) and carries a HIGH advisory
  (GHSA-mrhx-c7xc-m3w5) with no available fix: `@ton/ton` has no newer
  release, and zod's `3.x` line has no stable release past what's
  already installed. The top-level direct `zod` dependency is
  unaffected (already `4.6.7`, patched).
- `typescript` stays at `5.9.3` (two majors behind the published
  `7.0.2`): `typescript-eslint@8.72.1` (itself already latest)
  declares `peerDependencies.typescript: '>=4.8.4 <6.1.0'`, excluding
  both TS 6 and TS 7; TS 6 never shipped a stable release either.
- `elliptic` stays at `6.6.1` (current latest) with an unpatched LOW
  advisory (GHSA-848j-6mx2-7j84) nested inside
  `vite-plugin-node-polyfills`'s `crypto-browserify` chain -
  `first_patched_version` is `null`, no fix has ever existed for this
  advisory on any `elliptic` release.

### Out of scope (flagged for later phases, not fixed here)

- No `docker/Dockerfile` test stage and no `Makefile` (`make verify`
  etc.) - Phase 5 (container baseline) territory.
- No `.gitattributes` - Phase 4 (git hygiene) territory.
- CI's "Type check" step (`npx tsc --noEmit`) is a structural no-op
  against the solution-style root `tsconfig.json` (`files: []`,
  references only) - the real type-check only happens inside
  `npm run build`'s `tsc -b`. Not a coverage gap in practice (Build
  still fails on type errors), but the step name is misleading -
  Phase 10 (CI/CD) territory.
- GitHub Actions are pinned by major-version tag (`@v7` etc.), not by
  commit SHA as `CLAUDE.md`'s CI/CD standard calls for - that
  mechanism change is Phase 10's scope, not a version-currency gap.
