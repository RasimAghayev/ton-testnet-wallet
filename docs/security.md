# Security Architecture

## Threat Model

| Threat | Impact | Mitigation |
| --- | --- | --- |
| Clipboard hijacking | Funds sent to attacker address | Paste-event monitoring + visual warning |
| Address tampering | Same as above | Address checksum validation (TON format) |
| Self-send / zero-address | User error, funds locked | Address risk assessment before send |
| Mnemonic exposure | Full wallet takeover | Warning UI; never transmitted; stored locally |
| XSS | Key theft | CSP headers in nginx; no `eval` |
| Phishing | Mnemonic submission | Testnet-only badge; user education in UI |

---

## Address Substitution Attack

### How It Works

A malicious script or browser extension modifies the clipboard contents.
When the user pastes a recipient address, they see address `A` but the
wallet actually sends to attacker address `B`.

### Protection Implementation

```text
User pastes address
       │
       ▼
useClipboardGuard (onPaste handler)
       │
       ├── Extract pastedValue from ClipboardEvent.clipboardData
       │
       ├── Validate TON address format (Address.parse + trim)
       │
       ├── Compare pastedValue vs clipboardData.getData('text')
       │       └── If different → clipboard hijack warning
       │
       ├── assessAddress(pastedValue, ownAddress)
       │       ├── zero-address check
       │       └── self-send check
       │
       └── Show inline warning if risk !== 'safe'

User clicks "Review Transaction"
       │
       ▼
requestSend → re-runs assessAddress
       │
       ▼
ConfirmModal shows full address + risk banner
       │
       └── If suspicious: button changes to "Send Anyway" (red)
```

### Key Points

- Address is displayed **in full** in the confirmation modal — user can verify
  every character before confirming.
- Suspicious addresses show a persistent amber warning; the confirm button
  becomes red and says "Send Anyway".
- The paste event handler compares `ClipboardEvent.clipboardData.getData('text')`
  against the actual field value. If they differ, clipboard hijacking is flagged.
- `address.trim()` applied before `Address.parse()` — prevents whitespace
  injected around the address from causing false "invalid" errors.

---

## Mnemonic Handling

- Generated client-side using `@ton/crypto` (BIP39-compatible, 24 words).
- Stored in `localStorage` as plaintext JSON under key `ton_wallet_v1`.
- **Testnet only** — the task explicitly states production-grade security is
  not required for this assignment.
- **Production recommendation:** encrypt with user-supplied password via
  AES-GCM + PBKDF2 before writing to localStorage.
- Never sent over the network.
- Cleared from localStorage and Zustand state on `clearWallet()`.

---

## HTTP Security Headers (nginx)

Configured in `docker/nginx.conf`, applied to every response:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy
  "default-src 'self';
   connect-src 'self' https://testnet.toncenter.com;
   script-src 'self' 'unsafe-inline';
   style-src 'self' 'unsafe-inline';" always;
```

> `unsafe-inline` is required because Vite injects inline styles/scripts
> into the built bundle. For production hardening, replace with a nonce-based CSP.

---

## Future Hardening

- Encrypt mnemonic at rest (AES-GCM + PBKDF2 with user password)
- Replace `unsafe-inline` CSP with nonce-based policy
- Hardware wallet support (Ledger TON app)
- Phishing domain detection via known-bad list
- Session timeout / inactivity lock
