# Submission Notes

## What is implemented

All required functionality is covered:

| Requirement | Status | Notes |
|---|---|---|
| Create wallet | ✅ | BIP39 mnemonic, WalletContractV4 |
| Import wallet | ✅ | 24-word mnemonic, validated before import |
| Wallet address | ✅ | Dashboard + Receive screen |
| TON balance | ✅ | Fetched from testnet RPC, auto-refresh every 15s |
| Transaction history | ✅ | Last 20 TXs, real-time search |
| Receive screen | ✅ | Address + copy button + QR code (bonus) |
| Send screen | ✅ | Address, amount, comment, validation, status feedback |
| Risk warnings | ✅ | Address substitution protection (see Security section) |

---

## Architecture

The project uses **Feature-Sliced Design (FSD)**:

```
src/
├── app/          # Bootstrap, router, auth guard
├── features/     # wallet | send-ton | receive-ton | transactions
├── entities/     # wallet store (Zustand)
└── shared/       # services | components | hooks | types | config
```

Each feature owns its UI, hooks, and business logic. Shared utilities are in the shared layer. No circular dependencies between layers.

**Layer responsibilities:**

| Layer | Responsibility |
|---|---|
| UI (React) | Render, user interaction |
| Hooks | Local state, side effects, form logic |
| Services | Pure logic — wallet, blockchain, security, storage |
| Store (Zustand) | Cross-feature shared state |
| Storage (localStorage) | Persistence between sessions |

---

## Tech stack choices

| Tool | Why chosen |
|---|---|
| Vite + React + TypeScript | Fast build, minimal config, type safety |
| TailwindCSS | Utility-first, no CSS file sprawl, easy dark theme |
| Zustand | Minimal boilerplate, sufficient for this scope. Redux would be over-engineering |
| Zod | Type-safe runtime validation that integrates with react-hook-form |
| @ton/core + @ton/ton | Official TON SDK. No alternatives needed |
| Vitest | Same config as Vite, no Jest setup overhead |

---

## Security: Address Substitution Protection

The threat: malware intercepts clipboard content and replaces a legitimate TON address with an attacker-controlled one.

**Detection approach:**

1. **Paste event monitoring** — on every paste event, the `clipboardData.getData('text')` value is compared against the value that actually lands in the input field. If they differ, the user sees a warning: *"Pasted address differs from clipboard content. Possible clipboard hijacking detected."*

2. **Address format validation** — `Address.parse()` from `@ton/core` performs a full checksum validation. Invalid or truncated addresses are rejected immediately.

3. **Contextual risk checks** — before sending, `assessAddress()` checks for:
   - Zero address
   - Self-send (recipient = own address)

4. **Confirmation modal** — all sends require an explicit confirmation step showing the full recipient address. The confirmation button turns red for suspicious addresses.

**What this does NOT protect against:** a compromised OS-level clipboard manager that also intercepts the `clipboardData` API. That would require a browser extension or hardware wallet — out of scope for a testnet assignment.

---

## Compromises made

| Compromise | Reason | Production fix |
|---|---|---|
| Mnemonic stored in plaintext localStorage | Testnet only — task states "not production-grade security required" | Encrypt with user password (AES-256-GCM) |
| No session timeout | Testnet scope | Add inactivity lock after N minutes |
| Last 20 transactions only | Avoids pagination complexity for this scope | Add cursor-based pagination |
| No unit tests for UI components | Pure logic is tested; UI tests need render environment setup | Add @testing-library/react tests for forms |
| Single network (testnet) | Assignment requirement | Add network selector with mainnet support |

---

## Tests

33 unit tests across 3 test files:

| File | Coverage |
|---|---|
| `security.service.test.ts` | Address validation, clipboard hijack detection, risk assessment |
| `storage.service.test.ts` | Save, load, clear, malformed JSON recovery |
| `validation.test.ts` | All Zod schema rules for send form |

Run:
```bash
npm test
```

---

## How to run

```bash
# Development
npm install
npm run dev           # http://localhost:5173

# Tests
npm test

# Docker
docker build -f docker/Dockerfile -t ton-wallet:local .
docker run -p 3000:80 ton-wallet:local   # http://localhost:3000
```

Get testnet tokens: Telegram → **@testgiver_ton_bot**

Optional API key (higher rate limit): Telegram → **@tonapibot**
