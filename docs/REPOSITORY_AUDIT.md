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

13 open PRs, all bot-authored dependency bumps (12 Renovate, 1 Dependabot `npm_and_yarn` group of 15 updates) — none reviewed/merged yet. GitHub Dependabot alerts: **69 open** (24 high, 36 medium, 9 low) as of this audit; local `npm audit` after a fresh `npm ci` reports 33 (7 low, 15 moderate, 11 high) — the same kind of count discrepancy documented for repo #1 (`TECHNICAL_DEBT.md` #16 there), most likely GitHub's advisory-level count vs. npm's package-level count rather than a real mismatch in underlying risk. Not yet triaged package-by-package in this audit; that triage (and a decision on how many of the 13 bot PRs to merge vs. batch vs. close) is the natural next step for this repo, mirroring Phase 3 of repo #1.
