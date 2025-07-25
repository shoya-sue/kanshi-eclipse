import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WalletContextProvider } from './contexts/WalletContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Header from './components/Common/Header'
import Navigation from './components/Common/Navigation'
import ErrorBoundary from './components/Common/ErrorBoundary'
import SkipToContent from './components/Common/SkipToContent'
import { ToastContainer } from './components/Common/ToastContainer'
import AccessibilityButton from './components/Accessibility/AccessibilityButton'
import Dashboard from './pages/Dashboard'
import GasFeeTracker from './pages/GasFeeTracker'
import TransactionAnalyzer from './pages/TransactionAnalyzer'
import RPCMonitor from './pages/RPCMonitor'
import Wallet from './pages/Wallet'
import DEX from './pages/DEX'
import Settings from './pages/Settings'
import Performance from './pages/Performance'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (previously cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WalletContextProvider>
          <ErrorBoundary showErrorDetails>
            <Router>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <SkipToContent />
                <Header />
                <Navigation />
                <main 
                  className="container mx-auto px-4 py-8"
                  tabIndex={-1}
                  role="main"
                  aria-label="メインコンテンツ"
                >
                  <ErrorBoundary>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/gas-tracker" element={<GasFeeTracker />} />
                      <Route path="/transaction-analyzer" element={<TransactionAnalyzer />} />
                      <Route path="/rpc-monitor" element={<RPCMonitor />} />
                      <Route path="/wallet" element={<Wallet />} />
                      <Route path="/dex" element={<DEX />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/performance" element={<Performance />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </ErrorBoundary>
                </main>
                <ToastContainer />
                <AccessibilityButton />
              </div>
            </Router>
          </ErrorBoundary>
        </WalletContextProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App