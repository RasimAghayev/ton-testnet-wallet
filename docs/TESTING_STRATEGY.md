# Testing Strategy

Scope: unit and component tests for the browser wallet. No integration tests against
TON testnet (network-dependent, non-deterministic); network calls are mocked at the
service boundary.

## Layers

| Layer     | Tool                            | Location                      | What it covers                                                                                   |
| --------- | ------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| Unit      | Vitest                          | `src/**/__tests__/*.test.ts`  | pure logic: validation schemas, risk assessment, crypto primitives, formatters, stores, services |
| Component | Vitest + @testing-library/react | `src/**/__tests__/*.test.tsx` | rendered behaviour of pages, hooks and shared UI primitives                                      |

## Rules

- Test behaviour, not implementation: query by role, label or visible text.
- No snapshot tests; assertions name the observable outcome.
- Test case IDs follow `TC_<MODULE>_<SCENARIO>_<NUMBER>` (e.g. `TC_AUTH_LOGIN_001`).
- External systems (`@ton/ton`, `@ton/core`, wallet service, storage service) are mocked
  at module level; the mocks are the only place that knows about the network.
- Timers are faked only where the component has a timed transition (copy confirmation),
  and always restored in `afterEach`.
- Tests must be deterministic: no real clipboard, no real clock, no real key material.

## Commands

```bash
npm run test        # watch mode
npm run test:run    # single pass (CI)
npm run lint        # eslint
npm run build       # tsc -b && vite build
```

## Coverage intent

Every module that contains a branch or a state transition has at least one test.
Modules intentionally left uncovered are listed in `TEST_REPORT.md` under "Known
limitations" with the reason.
