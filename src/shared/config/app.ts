export const APP_CONFIG = {
  name: 'TON Testnet Wallet',
  version: '1.0.0',
  storageKeys: {
    wallet: 'ton_wallet_v1',
    settings: 'ton_settings_v1',
  },
  balanceRefreshInterval: 15_000, // ms
} as const
