# Architecture

## Overview

This is a **self-custodial** TON Testnet wallet. It connects directly to the
TON testnet RPC, runs entirely in the browser, and has no backend.

---

## Layer Diagram

```text
┌───────────────────────────────────────────────┐
│              UI Layer (React)                 │
│  SetupPage · Dashboard · Send · Receive · Txs │
└─────────────────────┬─────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────┐
│          Application Layer (Hooks)            │
│  useWalletSetup · useDashboard · useSend ...  │
└──────┬───────────────┬──────────────┬─────────┘
       │               │              │
┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼─────────┐
│  Wallet     │ │ Blockchain  │ │  Security     │
│  Service    │ │  Adapter    │ │  Service      │
│ (ton/crypto)│ │  (ton/ton)  │ │ (validation)  │
└──────┬──────┘ └─────┬───────┘ └───────────────┘
       │              │
┌──────▼──────────────▼─────────────────────────┐
│              State Layer (Zustand)            │
│              wallet.store.ts                  │
└────────────────────┬──────────────────────────┘
                     │
┌────────────────────▼──────────────────────────┐
│           Storage Layer (localStorage)        │
│           storage.service.ts                  │
└───────────────────────────────────────────────┘
```

---

## Folder Structure

```text
src/
├── app/                   # Bootstrap: router, providers
│   ├── providers/         # WalletProvider (auth guard)
│   ├── router.tsx         # React Router routes
│   └── index.tsx          # App root component
│
├── features/              # Feature-Sliced Design
│   ├── wallet/            # Setup, Dashboard
│   ├── send-ton/          # Send form + confirmation
│   ├── receive-ton/       # QR + address display
│   └── transactions/      # TX list + search
│
├── entities/
│   └── wallet/
│       └── model/         # Zustand store
│
└── shared/
    ├── components/ui/     # Button, Input, Modal, Alert, Spinner, CopyButton
    ├── hooks/             # useClipboardGuard
    ├── services/          # wallet, ton, security, storage
    ├── utils/             # format.ts — truncateAddress and other helpers
    ├── types/             # wallet.ts, transaction.ts
    └── config/            # ton.ts, app.ts
```

---

## Key Design Decisions

| Decision | Reason |
| --- | --- |
| No backend | Self-custodial; keys never leave the browser |
| WalletContractV4 | Current standard TON wallet contract |
| Vite over CRA/Next.js | Fastest cold start, native ESM, no SSR needed for a wallet |
| Zustand over Redux | Minimal boilerplate, sufficient for this scope |
| Zod validation | Type-safe runtime validation without extra complexity |
| localStorage | Simple, no IndexedDB overhead for this use case |
| Feature-Sliced Design | Clear separation, each feature owns its own logic |
| Vitest over Jest | Same config as Vite — zero additional setup |
