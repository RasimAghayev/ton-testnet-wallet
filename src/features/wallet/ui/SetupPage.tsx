import { useState } from 'react'
import { CreateWallet } from './CreateWallet'
import { ImportWallet } from './ImportWallet'

type Tab = 'create' | 'import'

export function SetupPage() {
  const [tab, setTab] = useState<Tab>('create')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">💎</div>
          <h1 className="text-2xl font-bold text-slate-100">TON Wallet</h1>
          <p className="text-sm text-slate-500 mt-1">Testnet</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex border-b border-slate-800">
            {(['create', 'import'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${
                  tab === t
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'create' ? 'Create Wallet' : 'Import Wallet'}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'create' ? <CreateWallet /> : <ImportWallet />}
          </div>
        </div>

        {/* Testnet helpers */}
        <div className="mt-4 space-y-2">
          <a
            href="https://t.me/testgiver_ton_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl hover:border-emerald-600 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-emerald-400">Get test TON</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                @testgiver_ton_bot — free testnet tokens
              </p>
            </div>
            <span className="text-emerald-600">↗</span>
          </a>

          <a
            href="https://t.me/tonapibot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-slate-300">Get API key</p>
              <p className="text-xs text-slate-500 mt-0.5">
                @tonapibot — set <code className="text-slate-400">VITE_TON_API_KEY</code> in .env for higher rate limit
              </p>
            </div>
            <span className="text-slate-500">↗</span>
          </a>
        </div>
      </div>
    </div>
  )
}
