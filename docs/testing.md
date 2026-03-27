# Testing Guide

## Prerequisites

| Requirement | Details |
|---|---|
| Node.js | v20+ |
| npm | v10+ |
| Docker | v24+ (optional, for container test) |
| Telegram | For testnet faucet |
| Browser | Chrome / Firefox (latest) |

---

## 1. Local Setup

```bash
git clone <repo-url>
cd ton-testnet-wallet
npm install
npm run dev
# Open http://localhost:5173
```

---

## 2. Get Testnet TON (Faucet)

Before running functional tests you need testnet tokens.

1. Open Telegram → search **@testgiver_ton_bot**
2. Send `/start`
3. Select **"Receive test coins"**
4. Paste your wallet address (copied from the app)
5. Wait **15–30 seconds** → balance updates automatically

> Rate limit: 1 request per 30 minutes per address.

---

## 3. Functional Test Scenarios

### TC-01 — Create Wallet

| Step | Action | Expected Result |
|---|---|---|
| 1 | Open `/setup`, select **Create Wallet** tab | Setup page renders |
| 2 | Click **Generate Wallet** | Loading spinner shows |
| 3 | 24-word mnemonic grid appears | Words displayed in numbered grid |
| 4 | Click **I have saved my phrase — Continue** | Redirected to `/dashboard` |
| 5 | Dashboard shows wallet address | Address visible (truncated + copy button) |
| 6 | Balance shows spinner, then `0.0000 TON` | Balance fetched from testnet RPC |
| 7 | **"Get test TON"** banner is visible | Banner shows when balance = 0 |

---

### TC-02 — Import Wallet

| Step | Action | Expected Result |
|---|---|---|
| 1 | Open `/setup`, select **Import Wallet** tab | Textarea renders |
| 2 | Enter valid 24-word mnemonic | Word counter shows `24 / 24 words` |
| 3 | Click **Import Wallet** | Loading spinner |
| 4 | Success | Redirected to `/dashboard` with correct address |
| 5 | Enter 23 words | Import button stays **disabled** |
| 6 | Enter invalid mnemonic (wrong words) | Error: `Invalid mnemonic phrase.` |

---

### TC-03 — Receive TON

| Step | Action | Expected Result |
|---|---|---|
| 1 | Dashboard → click **Receive** | `/receive` page opens |
| 2 | QR code renders | White box with black QR pattern |
| 3 | Full address displayed below QR | Complete address visible |
| 4 | Click **Copy address** | Button changes to `✓ Copied!` for 2s |
| 5 | Paste in text editor | Address matches exactly |
| 6 | Click **Done** | Back to Dashboard |

---

### TC-04 — Send TON (Happy Path)

| Step | Action | Expected Result |
|---|---|---|
| 1 | Fund wallet via faucet (TC-01 + faucet) | Balance ≥ 0.5 TON |
| 2 | Dashboard → click **Send** | `/send` page opens |
| 3 | Enter valid recipient address (`UQ...`) | No error shown |
| 4 | Enter amount `0.1` | Amount field valid |
| 5 | Click **Review Transaction** | Confirmation modal opens |
| 6 | Modal shows full address + amount | All details correct |
| 7 | Click **Confirm Send** | Loading spinner on button |
| 8 | Success screen appears | "Transaction Sent" message |
| 9 | Click **Back to Dashboard** | Balance decreased by ~0.1 + fee |

---

### TC-05 — Send TON (Validation)

| Step | Action | Expected Result |
|---|---|---|
| 1 | Open Send page | Form visible |
| 2 | Leave address empty, click Review | Error: `Recipient address is required.` |
| 3 | Enter `abc123` (invalid address) | Error: `Invalid TON address format.` |
| 4 | Enter valid address, amount `0` | Error: `Amount must be a positive number.` |
| 5 | Enter amount `0.001` | Error: `Minimum amount is 0.01 TON.` |
| 6 | Enter amount `-1` | Error: `Amount must be a positive number.` |

---

### TC-06 — Address Substitution Attack Detection

| Step | Action | Expected Result |
|---|---|---|
| 1 | Open Send page | Address field visible |
| 2 | Copy a valid TON address to clipboard | — |
| 3 | Paste into address field | Address fills in, no warning |
| 4 | Manually type a different address | No warning (typed, not pasted) |
| 5 | Enter own wallet address in recipient | Warning: `You are sending funds to your own address.` |
| 6 | On confirmation modal with suspicious address | Button turns **red** → "Send Anyway" |
| 7 | Zero address input | Warning: `Sending to zero address.` |

---

### TC-07 — Transaction History

| Step | Action | Expected Result |
|---|---|---|
| 1 | After sending at least 1 TX, open Transactions | `/transactions` page |
| 2 | List loads | TX items show with date, address, amount |
| 3 | Outgoing TX | Red arrow ↑, amount in white |
| 4 | Incoming TX (from faucet) | Green arrow ↓, amount in green |
| 5 | Type amount in search box | List filters in real-time |
| 6 | Type partial address | List filters by address |
| 7 | Click a TX row | Opens `testnet.tonviewer.com` in new tab |
| 8 | Click **Refresh** | Reloads list from chain |

---

### TC-08 — Wallet Persistence

| Step | Action | Expected Result |
|---|---|---|
| 1 | Create wallet, note the address | — |
| 2 | Close browser tab | — |
| 3 | Reopen `http://localhost:5173` | Redirected to `/dashboard` (not `/setup`) |
| 4 | Address matches previous session | localStorage restored correctly |

---

### TC-09 — Disconnect

| Step | Action | Expected Result |
|---|---|---|
| 1 | Dashboard → click **Disconnect** | Confirmation dialog appears |
| 2 | Click **Cancel** | Nothing changes |
| 3 | Click **Disconnect** again → **OK** | Redirected to `/setup` |
| 4 | Refresh page | Stays on `/setup` (storage cleared) |

---

### TC-10 — Docker Container

```bash
# Build
docker build -f docker/Dockerfile -t ton-wallet:local .

# Run
docker run -d --name ton-wallet-test -p 3000:80 ton-wallet:local

# Health check
curl http://localhost:3000/health
# Expected: ok

# App
# Open http://localhost:3000 — full app works identical to dev

# Cleanup
docker stop ton-wallet-test && docker rm ton-wallet-test
```

| Check | Expected |
|---|---|
| `docker build` exits 0 | Build success |
| `GET /health` → `200 ok` | nginx healthy |
| `GET /` → `200` | index.html served |
| `GET /dashboard` → `200` | SPA fallback works |
| All TC-01..09 pass at `:3000` | Identical behaviour |

---

## 4. Known Constraints

| Constraint | Detail |
|---|---|
| Testnet RPC rate limit | Without API key: ~1 req/s. Set `VITE_TON_API_KEY` in `.env` for 10 req/s |
| Faucet cooldown | 30 min per address via @testgiver_ton_bot |
| TX finality | ~5s on testnet, balance refresh every 15s |
| Mnemonic storage | Stored as plaintext in localStorage (testnet scope) |

---

## 5. API Key Setup (Optional)

Get a free testnet API key from Telegram **@tonapibot**:

1. Open **@tonapibot** → `/start`
2. Select **"Get testnet key"**
3. Copy the key

```bash
# Create .env file in project root
echo "VITE_TON_API_KEY=your_key_here" > .env
npm run dev
```
