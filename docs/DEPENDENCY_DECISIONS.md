# Dependency decisions

Per `CLAUDE.md` standing decision 3: a dependency change (add/remove/replace)
is recorded here with what it covers, maintenance status, license, known
vulnerabilities, size, and the latest stable version at decision time.

## 2026-11-05 — Remove `@types/qrcode.react`

- **Why removed:** `npm view @types/qrcode.react deprecated` returns: *"This
  is a stub types definition. qrcode.react provides its own type
  definitions, so you do not need this installed."* The actual runtime
  package, `qrcode.react@4.2.0` (already the direct dependency actually
  imported in `src/features/receive-ton/ui/ReceivePage.tsx`), ships its own
  `.d.ts` files since its own v3 rewrite. The stub package only ever
  resolved to `3.0.0` (frozen since deprecation) and added nothing beyond
  what `qrcode.react` already provides.
- **What already covers this:** `qrcode.react`'s own bundled types — no
  stdlib or existing dependency substitution needed, this is a straight
  removal of a redundant stub.
- **Maintenance status:** deprecated by its own maintainers (DefinitelyTyped
  convention for "this package now ships its own types").
- **License:** MIT (`@types/qrcode.react`, now removed) / `qrcode.react` is
  ISC, unaffected by this change.
- **Known vulnerabilities:** none directly; removal has no security impact
  either way, it was a types-only, build-time dependency.
- **Size impact:** negligible (one small package removed from the dev tree;
  `package-lock.json` shrank by the single resolved entry, 11 lines).
- **Verification:** `npx tsc --noEmit` and the full build still pass with
  zero new type errors after removal (`QRCodeSVG` from `qrcode.react` still
  resolves correctly) — confirmed in Docker, see Phase 6 handoff
  (`projects/info/state/handoff/6/ton-testnet-wallet.md`).

## 2026-11-05 — `zod` nested inside `@ton/ton` stays unpatched (accepted, documented blocker)

- **Context:** `npm audit` flags `zod < 4.6.6` (GHSA-mrhx-c7xc-m3w5, HIGH,
  "Zod can exhaust memory while validating oversized constrained
  collections", `vulnerable_version_range: "< 4.6.6"`, `first_patched_version:
  "4.6.6"`). The top-level direct `zod` dependency in this repo is already
  at `4.6.7` (patched). The flagged copy is a **separate, nested** install
  at `node_modules/@ton/ton/node_modules/zod@3.25.76`, pinned by `@ton/ton`'s
  own `package.json` (`"zod": "^3.21.4"`, confirmed via `npm view
  @ton/ton@16.3.0 dependencies`).
- **Why it can't be fixed from this repo:** `@ton/ton@16.3.0` is already the
  latest published version (`npm view @ton/ton versions` — no newer release
  exists). Zod's `3.x` line has no stable release newer than `3.25.76`
  (`npm view zod versions` — everything past that on the `3.x` line is an
  unpublished `3.26.0-canary.*` prerelease, never promoted to stable); the
  fix for this specific advisory only ever landed in the `4.x` line
  (`first_patched_version: "4.6.6"`). There is no stable `3.x` release this
  repo could pin to that would carry the fix, and we do not control
  `@ton/ton`'s own internal dependency pin.
- **What existing deps already cover this:** none — this is a transitive,
  vendor-pinned copy, not something an `overrides` entry can safely
  redirect without risking breaking `@ton/ton`'s own internal assumptions
  about the zod v3 API shape it was built against (v3 and v4 have a
  different core API).
- **Highest compatible version used meanwhile:** `@ton/ton@16.3.0` (current
  latest) with its bundled `zod@3.25.76` (current latest `3.x`), both
  already in place — no downgrade needed, there is simply nothing newer to
  move to.
- **Status:** accepted blocker per `CLAUDE.md` standing decision 1 ("an
  exception needs a written blocker ... with the highest compatible version
  used meanwhile"). Tracked in `docs/TECHNICAL_DEBT.md`. Re-check next time
  `@ton/ton` publishes a release, or the next time any dependency's
  vulnerability sweep runs.

## 2026-11-06 — `minimatch` forced to `11.0.5` via `overrides` (fix applied)

- **Context:** `npm audit` (live registry check, not the `deps/` snapshot)
  surfaced GHSA-g3hv-75wg-m249 / CVE-2026-118764 (medium, published
  2026-10-30 — about a week before this check, likely why GitHub's
  Dependabot alerts for this repo hadn't caught up yet): a glob-pattern
  amplification DoS in `minimatch`'s `firstPhasePreProcess()`,
  `vulnerable_version_range: ">= 7.0.0, < 11.0.1"`, `first_patched_version:
  "11.0.1"`.
- **What already covers this:** nothing — this is a transitive,
  single-copy dependency (`npm ls minimatch --all` / direct lockfile
  inspection confirm exactly one deduped copy in the whole tree, pinned at
  `10.2.6` by both `eslint@10.14.0` (via `@eslint/config-array`) and
  `typescript-eslint@8.72.1` (via `@typescript-eslint/typescript-estree`) —
  both already the latest published release of each tool, neither has
  bumped its own internal `minimatch` pin to `11.x` yet.
- **Why an override is safe here (unlike the `zod`/`elliptic` blockers):**
  `minimatch@11.0.5`'s package `exports` map and `engines.node` range are
  identical in shape to `10.2.6`'s (`npm view minimatch@11.0.5 exports` vs.
  `@10.2.6` — same dual ESM/CJS structure); there is exactly one copy in
  the tree, so the override can't collide with a second, differently
  consumed copy.
- **Maintenance status:** `minimatch` is actively maintained (isaacs);
  advisory was GitHub-reviewed the same day it was reported.
- **License:** ISC, unaffected by the version bump.
- **Known vulnerabilities:** the one above; patched by this change.
- **Size impact:** negligible (single transitive package, same major
  export surface).
- **Latest stable at decision time:** `11.0.5` (`npm view minimatch
  version`).
- **Verification:** `npm audit` moderate-severity count dropped `9 → 0`;
  `npm run lint` / `npm run test:run` (55/55) / `npm run build` all clean
  in Docker (`node:26.13.0-alpine3.24`) — see Phase 6 handoff.

## 2026-11-06 — `elliptic` nested inside `vite-plugin-node-polyfills`'s chain stays unpatched (accepted, documented blocker)

- **Context:** Dependabot alert #1 / `npm audit` flags GHSA-848j-6mx2-7j84
  ("Elliptic Uses a Cryptographic Primitive with a Risky Implementation",
  LOW, `vulnerable_version_range: "<= 6.6.1"`, `first_patched_version:
  null`). The flagged copy is nested four levels deep:
  `vite-plugin-node-polyfills@0.28.0` → `node-stdlib-browser@1.3.1` →
  `crypto-browserify@3.12.1` → `browserify-sign@4.2.6` / `create-ecdh@4.0.4`
  → `elliptic@6.6.1`. Dependabot marks its scope as `runtime` (bundled into
  the production browser build via the Vite node-polyfills plugin), unlike
  the dev-only `minimatch` fix above.
- **Why it can't be fixed from this repo:** `first_patched_version` is
  `null` — this advisory has **never** had a fix released on any
  `elliptic` version, including the current latest (`6.6.1`, confirmed via
  `npm view elliptic versions`). `vite-plugin-node-polyfills`,
  `node-stdlib-browser`, `crypto-browserify`, `browserify-sign`, and
  `create-ecdh` are all independently confirmed already at their own
  latest published version (`npm view <pkg> version` for each) and all
  still declare `elliptic` as a dependency — there is no newer release of
  anything in the chain that drops it.
- **What existing deps already cover this:** none — forcing an
  `overrides` entry wouldn't help since there is no newer `elliptic`
  version to force to; the installed `6.6.1` already *is* the latest.
- **Highest compatible version used meanwhile:** `elliptic@6.6.1`
  (current latest), already in place — no downgrade needed, nothing newer
  exists.
- **Status:** accepted blocker per `CLAUDE.md` standing decision 1.
  Tracked in `docs/TECHNICAL_DEBT.md` #15. Re-check whenever `elliptic`
  publishes a release, or `vite-plugin-node-polyfills`'s dependency chain
  moves off `crypto-browserify`.
