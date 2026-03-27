# TON Testnet Wallet

A self-custodial TON Testnet wallet built with React, TypeScript, and TailwindCSS.
Runs entirely in the browser — no backend required.

> **Testnet only.** Do not use with real TON mainnet funds.

---

## Features

- Create or import a wallet via 24-word mnemonic
- View TON balance (auto-refreshes every 15s)
- Send TON with address validation and confirmation
- Receive TON with QR code and address copy
- Transaction history with real-time search
- Address substitution attack protection (clipboard hijacking detection)

---

## Tech Stack

| Layer | Technology | Reason |
| --- | --- | --- |
| UI | React 19 + TypeScript | Industry standard, strict typing |
| Styling | TailwindCSS v4 | Utility-first, zero runtime CSS |
| State | Zustand | Minimal boilerplate |
| Validation | Zod | Type-safe runtime validation |
| Blockchain | @ton/ton, @ton/crypto | Official TON SDK |
| Bundler | Vite | Fast DX, optimized builds |
| Routing | React Router v7 | SPA routing |
| Testing | Vitest | Same config as Vite, no extra setup |

---

## Architecture

Feature-Sliced Design (FSD):

```text
src/
├── app/          # Providers, router, entry point
├── features/     # wallet · send-ton · receive-ton · transactions
├── entities/     # wallet store (Zustand)
└── shared/       # services · hooks · utils · components · types · config
```

See [docs/architecture.md](docs/architecture.md) for the full layer diagram and design decisions.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Configure API key for higher RPC rate limits
cp .env.example .env
# Edit .env — set VITE_TON_API_KEY (get it from Telegram @tonapibot)

# 3. Start dev server
npm run dev
# Open http://localhost:5173
```

Get free testnet tokens: Telegram → **@testgiver_ton_bot**

See [docs/environments.md](docs/environments.md) for environment setup and
[docs/testing.md](docs/testing.md) for step-by-step test scenarios.

---

## Tests

```bash
npm run test:run   # run once
npm test           # watch mode
```

33 unit tests covering security service, storage service, and send-form validation.

---

## Docker

```bash
# Build and run production image
docker build -f docker/Dockerfile -t ton-wallet .
docker run -p 3000:80 ton-wallet
# Open http://localhost:3000

# Or with compose
docker compose -f docker/docker-compose.yml up wallet
```

Health check: `curl http://localhost:3000/health` → `ok`

---

## CI/CD

GitHub Actions pipeline on push to `main`:

1. Type-check + ESLint
2. Unit tests
3. Vite production build
4. Docker build and push to GHCR
5. SSH deploy to server

See [.github/workflows/deploy.yml](.github/workflows/deploy.yml) and
[docs/deployment.md](docs/deployment.md) for full setup instructions.

---

## Security

- All keys generated and stored client-side only
- Clipboard hijacking detection on address paste
- Address risk assessment before every transaction
- Confirmation modal with full address display
- HTTP security headers via nginx CSP

See [docs/security.md](docs/security.md) for the full threat model and mitigations.

---

## Repository Strategy

```text
main          # production branch, protected
feat/<name>   # feature branches
fix/<name>    # bug fixes
```

Commit style (Conventional Commits):

```text
feat: wallet creation flow
feat: transaction history with search
fix: address validation edge case
chore: update dependencies
docs: update deployment guide
```

---

## Future Improvements

- Encrypted mnemonic storage (AES-GCM + PBKDF2 with user password)
- Hardware wallet support (Ledger TON app)
- PWA / mobile support
- Multi-network support (mainnet toggle)
- Phishing domain detection
