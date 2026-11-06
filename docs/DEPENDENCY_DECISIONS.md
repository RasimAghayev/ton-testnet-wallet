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
