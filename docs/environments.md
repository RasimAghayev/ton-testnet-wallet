# Environment Guide

## Overview

This application runs in two modes depending on configuration:

| | Testnet | Mainnet (future) |
|---|---|---|
| Network | TON Testnet | TON Mainnet |
| RPC Endpoint | `testnet.toncenter.com` | `toncenter.com` |
| Explorer | `testnet.tonviewer.com` | `tonviewer.com` |
| Tokens | Free (faucet) | Real TON |
| Risk | Zero | Financial |

> **Current scope:** this assignment targets **Testnet only**. Mainnet column is listed for architectural awareness.

---

## Testnet Environment

### Configuration

```env
# .env
VITE_TON_API_KEY=        # optional — without key: 1 req/s limit
```

### Rate Limits

| Condition | Limit |
|---|---|
| No API key | 1 request / second |
| With API key | 10 requests / second |

Get a free testnet API key: Telegram → **@tonapibot** → "Get testnet key"

### Get Testnet Tokens

| Source | Link | Limit |
|---|---|---|
| Faucet bot | @testgiver_ton_bot | 2 tTON / 30 min |

### UI Indicators

- `Testnet` badge in header (amber)
- "Get test TON" banner on Dashboard when balance = 0
- "Get API key" link on Setup page

---

## Test Scenarios by Environment

### Testnet — Full Flow

```
1. Open /setup
2. Click "Get API key" → configure .env → restart app
3. Create or import wallet
4. Copy address from /receive
5. Open @testgiver_ton_bot → paste address → receive 2 tTON
6. Dashboard balance refreshes (~15s)
7. Send 0.1 TON to second wallet address
8. Verify in Transaction History
9. Click TX → opens testnet.tonviewer.com
```

### Testnet — Without API key

```
Expected behavior:
- Balance loads (may take up to 3s due to rate limit)
- TX history loads
- Sending works
- No errors, just slower response
```

### Testnet — With API key

```
Expected behavior:
- Balance loads in <1s
- TX history loads fast
- Sending is responsive
```

---

## Build Variants

### Development (local)

```bash
npm run dev
# Runs at http://localhost:5173
# Hot reload enabled
# Source maps available
```

### Production build (local preview)

```bash
npm run build
npm run preview
# Runs at http://localhost:4173
# Minified, no source maps
# Same as Docker output
```

### Docker (production container)

```bash
docker build -f docker/Dockerfile -t ton-wallet:local .
docker run -p 3000:80 ton-wallet:local
# Runs at http://localhost:3000
# Nginx serves static files
# Health check: GET /health → "ok"
```

---

## Environment Validation Checklist

Run these checks after each build or deploy:

| Check | Dev `:5173` | Preview `:4173` | Docker `:3000` |
|---|---|---|---|
| App loads without blank screen | ✓ | ✓ | ✓ |
| No `Buffer is not defined` console error | ✓ | ✓ | ✓ |
| Setup page renders tabs | ✓ | ✓ | ✓ |
| "Get test TON" link visible | ✓ | ✓ | ✓ |
| "Get API key" link visible | ✓ | ✓ | ✓ |
| Wallet creation works | ✓ | ✓ | ✓ |
| Address validation accepts `UQ...` | ✓ | ✓ | ✓ |
| Balance fetches from testnet | ✓ | ✓ | ✓ |
| `GET /health` returns `ok` | — | — | ✓ |
| SPA routing works on refresh | — | — | ✓ |

---

## Known Testnet Constraints

| Constraint | Detail |
|---|---|
| TX finality | ~5 seconds |
| Balance auto-refresh | Every 15 seconds |
| Mnemonic storage | Plaintext in localStorage (acceptable for testnet) |
| No real funds | All tokens have zero real-world value |
| Testnet stability | Occasional RPC downtime — not an app bug |
