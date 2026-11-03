# Repository audit

Audited 2026-11-03 as repo #2 of `REPOS_INDEX.md`. Backup: `projects/info/backups/ton-testnet-wallet.git`. Working clone: `projects/ton-testnet-wallet/`.

This repo is a take-home technical assessment (`testovoe.md`, Russian-language brief) for a self-custodial TON testnet wallet, submitted with its own compromise log (`docs/evaluation-response.md`). Unlike repo #1, it arrived already mature: typed, tested, documented, containerized, and CI/CD-wired. The audit below reflects that — most findings are "already solid," not "needs fixing."

## Git history

43 commits on `main`, clean linear history, no force-pushes or rewritten history observed. No merge commits from long-lived feature branches — development happened directly on `main` plus short-lived bot branches.

## Branches

`main` + 13 bot branches (12 Renovate dependency-update branches, 1 Dependabot `npm_and_yarn` group update), each with a matching open PR (see Dependencies below). No stale human-authored feature branches.

## CI/CD

`.github/workflows/deploy.yml` — three jobs on push/PR to `main`:

1. **Lint & Build** (`needs:` none) — ESLint, `tsc --noEmit`, `vite build`, uploads `dist/` artifact. Runs on both `push` and `pull_request`.
2. **Docker Build & Push** (`needs: build`) — builds `docker/Dockerfile`, pushes to GHCR (`ghcr.io/RasimAghayev/ton-testnet-wallet`). Gated `if: push to main` only — correctly skips on PRs.
3. **Deploy** (`needs: docker`) — SSH (`appleboy/ssh-action`) into `secrets.DEPLOY_HOST` as `secrets.DEPLOY_USER`, pulls the GHCR image, restarts a `ton-wallet` container on port 80. Runs inside a `production` GitHub Environment. Gated `if: push to main` only.

**Finding (resolved):** the last several runs on `main`, including the most recent push before this audit, were failing at job 1 (`Lint & Build`) on two ESLint `no-useless-assignment` errors in `src/shared/services/ton.service.ts` (dead initial assignments to `amount`/`counterparty`, both unconditionally overwritten in every branch before use). Because jobs 2 and 3 are chained via `needs:`, this meant the Docker and Deploy jobs had not run at all on any recent push — not "running and failing," but never reached.

Fixed via PR #37 (`fix/ton-service-useless-assignment`): removed the dead initializers (behavior-unchanged — both variables are still assigned in every code path before being read). Verified locally (lint/typecheck/build/33 tests all green) and on GitHub Actions (`Lint & Build` passed on the PR; `Docker`/`Deploy` correctly skipped on the `pull_request` event). Merged to `main` 2026-11-03.

**Finding (informational, not a defect):** the `production` GitHub Environment exists but has **zero environment secrets configured** (`gh api .../environments/production/secrets` → `total_count: 0`), and no repo-level secrets either. Confirmed by observing the actual post-merge run on `main`: `Lint & Build` ✅ → `Docker Build & Push` ✅ (real image pushed to GHCR) → `Deploy` ❌ with `error: missing server host` — `drone-ssh` failed before attempting any network connection. The Deploy job is wired correctly but has no real target; it cannot reach or affect any actual server as currently configured. This is consistent with the repo being a take-home assessment rather than a live production service — flagged here per `CLAUDE.md` Approval Gate #9, and confirmed with the user before merging the fix that unblocked the pipeline.

## Docker / containerization

`docker/Dockerfile`, `docker/docker-compose.yml`, `docker/nginx.conf` — multi-stage build (Node build stage → nginx:alpine serve stage), health check at `/health`. Not rebuilt/re-verified in this audit beyond confirming the CI job now builds and pushes successfully (see above); the image's runtime behavior inside nginx was not independently re-tested.

## Tests

`npm run test:run` executed directly (not just trusted from docs): **33/33 passing**, 3 files (`security.service.test.ts`, `storage.service.test.ts`, `validation.test.ts`) — matches the claim in `README.md` / `docs/evaluation-response.md` exactly. The repo's own compromise log already discloses "no unit tests for UI components" (logic-only coverage) — an honest, pre-documented gap, not a hidden one.

## Configuration / secrets handling

- `.env` is gitignored and was never committed (confirmed via `git log --all -p` across full history, not just the current tree).
- The only `VITE_TON_API_KEY`-like string anywhere in history is the placeholder `your_key_here` in `.env.example`.
- The only `mnemonic`-adjacent string in test code is an obvious fake (`Array(24).fill('word')`), not a real seed phrase.
- No API keys, AWS-style credentials, or PEM blocks found anywhere in full git history.
- The app's own documented security model (`docs/evaluation-response.md`): mnemonic stored in **plaintext** localStorage, justified explicitly as testnet-only / out of scope for "production-grade security" per the assessment brief (`testovoe.md` line 50) — a disclosed compromise, not an oversight.

## Dead/placeholder code

None found beyond the two lint-flagged dead assignments in `ton.service.ts` (fixed, see CI/CD above). No `console.log` placeholders, no `href="#"` stubs, no TODO-and-abandoned code paths observed in the areas reviewed.

## IDE/editor artifacts

None tracked — no `.idea/`, no `.vscode/` (beyond what's normal), nothing to clean up.

## Dependencies

**Resolved 2026-11-03 (Phase 3).** All 13 open bot PRs triaged:

- Rebased each onto post-fix `main` via `gh pr update-branch` (all had gone stale against the pre-fix `main` and showed cached `Lint & Build` failures from the unrelated lint bug above, not real conflicts).
- 12 of 13 passed CI cleanly after rebase. PR #30 (`eslint-plugin-react-hooks` → v7.1.1) failed on a genuine new lint rule (`react-hooks/set-state-in-effect`) flagging the pre-existing fetch-on-address-change pattern in `useTransactions.ts` — fixed with a scoped inline disable (same convention already used on the adjacent line for `exhaustive-deps`), landed on `main` directly, confirmed as a no-op warning under the old plugin version and load-bearing once the new version installed.
- Merged in order: both `[security]`-labeled PRs first (zod #38, vite #36), then the 10 remaining single-package minor/patch bumps (zustand, @ton/ton, @types/node, @vitejs/plugin-react, eslint-plugin-react-hooks, globals, jsdom, react, react-dom, react-router-dom) one at a time.
- PR #25 (Dependabot `npm_and_yarn` group, 15 packages) hit a real `package-lock.json` conflict once the individually-targeted packages (notably `vite`, superseded at a newer version by #36) had already landed separately. Closed rather than hand-resolved — Dependabot auto-closed it on detecting the supersession, confirming the call; it will regenerate an accurate group PR on its next scan if anything is still outstanding.
- **0 open PRs remain.**
- Post-merge full local verification on updated `main`: `npm run lint` (0 errors), `tsc --noEmit` (clean), `npm run build` (succeeds), `npm run test:run` (33/33 passing).
- Each of the 7 individual merges to `main` independently re-triggered the full CI/CD pipeline (`push` event). Confirmed per-job on several: `Lint & Build` ✅ → `Docker Build & Push` ✅ (real image pushed to GHCR each time) → `Deploy` ❌ (`error: missing server host`, same harmless no-secrets failure documented above) — fully consistent across all runs, no surprises.
- GitHub Dependabot alerts dropped **69 → 40 → 8 open** (4 high, 3 medium, 1 low) across the full triage — the second drop came from PR #40, Dependabot's own regenerated 9-package group bump, merged after the Phase 2.6 plan (`IMPROVEMENT_ROADMAP.md`) was approved. Local `npm audit` after `npm ci` had reported 33 before the first round of bumps — the same kind of GitHub-advisory-count vs. npm-package-count discrepancy documented for repo #1 (`TECHNICAL_DEBT.md` #16 there), not a sign of inconsistent risk.
