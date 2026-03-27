import { BrowserRouter } from 'react-router-dom'
import { WalletProvider } from './providers/WalletProvider'
import { AppRouter } from './router'

export function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <AppRouter />
      </WalletProvider>
    </BrowserRouter>
  )
}
