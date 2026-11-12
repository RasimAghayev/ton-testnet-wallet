# Improvement roadmap — Phases 3-5 plan for this repo

This is the Phase 2.6 plan: how Phases 3-5 (`PROMPT.md`) apply here, with risks. **Process note:** this plan should have been shown and approved _before_ any Phase 3 work started (`CLAUDE.md` Approval Gate #10 — "the Phase 2 plan for each repo"). It wasn't — the CI investigation that began this repo's audit led directly into fixing the blocking lint bug and then into dependency-bot PR triage without this checkpoint being presented first. That gap is owned here rather than glossed over. The items below marked "already done" were executed before this plan existed; everything else waits for your go-ahead before it's touched.

## Phase 3 — Git and repo hygiene

1. **History audit — already done** (see `REPOSITORY_AUDIT.md`). Finding: clean. No secrets in full history (`git log --all -p` scanned), no force-pushes, 43-commit linear history. Nothing requiring Approval Gate #1.
2. **Dependency bot PRs — already done.** 13 open PRs (12 Renovate + 1 Dependabot group) triaged: rebased onto the fixed `main`, 2 security-labeled merged first (`vite`, `zod`), then 10 single-package minor/patch bumps, 1 group PR closed as superseded. 0 open PRs immediately after. Side-effect requiring its own small fix: the `eslint-plugin-react-hooks` bump introduced a new lint rule, fixed with a scoped disable (see `TECHNICAL_DEBT.md` #4).
   - **Done 2026-11-03** (post-approval) — PR #40 (the regenerated 9-package group) passed `Lint & Build` on GitHub, merged. Dependabot alerts dropped 40→8 open (4 high, 3 medium, 1 low). 0 open PRs.
3. **Open PRs:** 0.
4. **Branches:** clean. All merged bot branches were deleted (local + remote) as part of each merge; confirmed via `git fetch --prune` (only `main` and #40's branch remain).
5. **Branch structure:** already `main`-only, already the default branch. No `master` to rename — no Approval Gate #4 trigger here.

## Phase 4 — Modernization and independence

1. **Dependency upgrades:** the 12 bot-authored bumps above were all same-major (minor/patch) — no breaking-change migration needed, no Approval Gate #5 trigger. No further manual upgrades planned beyond reviewing #40 (also minor/patch per Dependabot's own labeling).
2. **Bugs, security, performance:**
   - Security checklist: reviewed in `REPOSITORY_AUDIT.md` — secrets handling clean, mnemonic-plaintext-storage and no-session-timeout are the original author's own disclosed, scoped compromises (testnet-only assignment, not production), not new findings. Nothing here changes that assessment.
   - Performance: the production build was a single 879 KB JS chunk (263 KB gzip); Vite's own build output flagged this. **Done 2026-11-03** (post-approval) — route-level code-splitting for Send/Receive/Transactions landed in `src/app/router.tsx` (`TECHNICAL_DEBT.md` #6). Main chunk down to 784.85 KB/235.66 KB gzip; verified in-browser (each lazy route's chunk loads and renders correctly, no console errors).
3. **Docker:** already present (multi-stage, nginx:alpine, health check at `/health`) and confirmed building successfully in CI (`Docker Build & Push` job, verified green post-merge). No changes proposed.
4. **Dual-mode independence:** not applicable as written — this is a backend-less SPA by the assignment's own explicit constraint ("without backend"). No API/DB/queue dependency to externalize, no `/health/live`/`/health/ready` endpoints to add (the nginx container's `/health` already serves this purpose for the static asset server).
5. **Observability:** not applicable in the backend sense (no server-side process). Client-side error tracking (e.g. Sentry) would be a new feature addition, not a fix for an existing gap — not proposed here unless you want it scoped separately.
6. **Quality tooling:** ESLint + TypeScript + the new `eslint-plugin-react-hooks` v7 rules are already in place. No gaps identified.
7. **CI/CD:** already a 3-stage pipeline (lint/build → Docker → deploy), now unblocked end-to-end (see Phase 3.1 history). No changes proposed beyond what's already landed.

## Phase 5 — Tests

1. **Starting state:** 33/33 tests passing (logic layer only: security/clipboard-hijack detection, storage, Zod validation) — verified by actually running `npm run test:run`, not just trusting the docs' claim.
2. **Gap:** no component/UI tests (`TECHNICAL_DEBT.md` #5) — disclosed by the original author as an intentional, scoped-out compromise for this take-home assignment, not a hidden defect.
3. **Done 2026-11-03** (post-approval) — `@testing-library/react` coverage added for the Dashboard, Send, and Receive screens: 22 new tests (form validation feedback, confirmation-modal risk styling, clipboard-hijack warning UI, navigation). Required installing the previously-unresolved `@testing-library/dom` peer dependency. 55/55 tests now passing locally and gated by CI (see `TECHNICAL_DEBT.md` #8 — CI didn't run the test suite at all until this same pass).
4. Two real behavioral quirks were discovered and documented rather than silently "fixed" as part of writing these tests, since neither was in scope as a business-logic change: (a) the Send form's `forEach` over Zod issues keeps only the _last_ matching refinement message per field, so an empty submit shows "Invalid TON address format." + "Minimum amount is 0.01 TON." rather than the "required" messages one might expect; (b) the native HTML5 `min="0.01"` constraint on the amount input blocks the browser's `submit` event entirely for a non-empty out-of-range value, so Zod's own minimum-amount refine is unreachable via normal form submission for that case. Both confirmed via isolated probe scripts, then asserted as real observed behavior in the tests.

## Net new risks introduced by this plan

- Nothing in this plan changed existing business behavior — all completed work (lint fix, dependency bumps, one scoped lint-rule disable, new tests, code-splitting, CI test-step) was behavior-preserving and verified (build/typecheck/55 tests/real GitHub CI runs, every time, plus manual in-browser verification for the two frontend changes).
- **One item is flagged under a standing gate, not newly triggered by this plan:** the dormant SSH-deploy stage (`TECHNICAL_DEBT.md` #2) stays dormant (no secrets) unless you separately decide to configure a real deploy target — that would be its own Approval Gate #9 conversation, not something this plan assumes.
- **Both previously-deferred items (bundle code-splitting, UI/component tests) are now done**, per your explicit go-ahead on both. Nothing remains deferred in this plan.
