# Test Report

Date: 2026-11-13
Environment: Node v26.12.1, npm 12.0.2, Windows (host run; Docker image build verified separately)

## Result

| Metric     | Value |
| ---------- | ----- |
| Test files | 26    |
| Test cases | 247   |
| Passed     | 247   |
| Failed     | 0     |
| Skipped    | 0     |
| Wall clock | ~9 s  |

Commands and exit codes:

| Command                                  | Exit |
| ---------------------------------------- | ---- |
| `npx vitest run`                         | 0    |
| `npm run lint`                           | 0    |
| `npm run build` (`tsc -b && vite build`) | 0    |

## Per-file results

| File                                                                | Tests | Passed |
| ------------------------------------------------------------------- | ----- | ------ |
| `src/app/providers/__tests__/WalletProvider.test.tsx`               | 8     | 8      |
| `src/entities/wallet/model/__tests__/wallet.store.test.ts`          | 14    | 14     |
| `src/features/receive-ton/ui/__tests__/ReceivePage.test.tsx`        | 3     | 3      |
| `src/features/send-ton/hooks/__tests__/useSend.test.ts`             | 12    | 12     |
| `src/features/send-ton/lib/__tests__/sendSchema.edge.test.ts`       | 15    | 15     |
| `src/features/send-ton/lib/__tests__/validation.test.ts`            | 13    | 13     |
| `src/features/send-ton/ui/__tests__/ConfirmModal.test.tsx`          | 6     | 6      |
| `src/features/send-ton/ui/__tests__/SendPage.test.tsx`              | 10    | 10     |
| `src/features/transactions/hooks/__tests__/useTransactions.test.ts` | 9     | 9      |
| `src/features/transactions/ui/__tests__/TransactionItem.test.tsx`   | 4     | 4      |
| `src/features/transactions/ui/__tests__/TransactionList.test.tsx`   | 7     | 7      |
| `src/features/wallet/hooks/__tests__/useDashboard.test.ts`          | 6     | 6      |
| `src/features/wallet/hooks/__tests__/useWalletSetup.test.ts`        | 10    | 10     |
| `src/features/wallet/ui/__tests__/Dashboard.test.tsx`               | 9     | 9      |
| `src/features/wallet/ui/__tests__/SetupPage.test.tsx`               | 9     | 9      |
| `src/features/wallet/ui/__tests__/UnlockPage.test.tsx`              | 9     | 9      |
| `src/shared/components/ui/__tests__/ui.test.tsx`                    | 19    | 19     |
| `src/shared/hooks/__tests__/useClipboardGuard.test.ts`              | 3     | 3      |
| `src/shared/services/__tests__/security.service.test.ts`            | 14    | 14     |
| `src/shared/services/__tests__/storage.service.extra.test.ts`       | 12    | 12     |
| `src/shared/services/__tests__/storage.service.test.ts`             | 9     | 9      |
| `src/shared/services/__tests__/ton.service.test.ts`                 | 11    | 11     |
| `src/shared/services/__tests__/wallet.service.contract.test.ts`     | 2     | 2      |
| `src/shared/services/__tests__/wallet.service.test.ts`              | 9     | 9      |
| `src/shared/utils/__tests__/crypto.test.ts`                         | 18    | 18     |
| `src/shared/utils/__tests__/format.test.ts`                         | 6     | 6      |

## Defects found while writing the tests

Three test assertions were written against markup that does not exist, and were
corrected to assert the real rendered output:

- `TransactionItem` renders the direction label and the address as two text nodes
  inside one paragraph, so `getByText('From:')` could never match. The assertions now
  match the full paragraph text.
- `CopyButton` included its decorative icon glyph in the accessible name
  (`"⧉Copy"`). Fixed in the component (`aria-label` + `aria-hidden` on the icon)
  rather than by weakening the test.
- `useSend.checkAddress` state was read in the same tick as the state update; the
  assertion now runs inside `act()`.

## Known limitations

- No end-to-end test against TON testnet; the network layer is mocked. A real transfer
  is only exercised manually via the faucet flow.
- `prettier --check` reports style drift across the repository (pre-existing, unrelated
  to this change); formatting was not rewritten here to keep the diff reviewable.
- Chunk-size warning from Vite (single bundle > 500 kB) is pre-existing and not a test
  failure.
