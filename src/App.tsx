import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WalletContextProvider } from './contexts/WalletContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Header from './components/Common/Header'
import Navigation from './components/Common/Navigation'
import Dashboard from './pages/Dashboard'
import GasFeeTracker from './pages/GasFeeTracker'
import TransactionAnalyzer from './pages/TransactionAnalyzer'
import RPCMonitor from './pages/RPCMonitor'
import Wallet from './pages/Wallet'
import DEX from './pages/DEX'
import Settings from './pages/Settings'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WalletContextProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Header />
              <Navigation />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/gas-tracker" element={<GasFeeTracker />} />
                  <Route path="/transaction-analyzer" element={<TransactionAnalyzer />} />
                  <Route path="/rpc-monitor" element={<RPCMonitor />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/dex" element={<DEX />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </Router>
        </WalletContextProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App