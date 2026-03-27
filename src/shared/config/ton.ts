export const TON_CONFIG = {
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
  apiKey: import.meta.env.VITE_TON_API_KEY ?? '', // Optional: set in .env for higher rate limits
  network: 'testnet' as const,
  explorerBase: 'https://testnet.tonviewer.com',
} as const

export const TON_WORKCHAIN = 0
export const TX_FETCH_LIMIT = 20
