import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Common/Header'
import Navigation from './components/Common/Navigation'
import GasFeeTracker from './pages/GasFeeTracker'
import TransactionAnalyzer from './pages/TransactionAnalyzer'
import RPCMonitor from './pages/RPCMonitor'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<GasFeeTracker />} />
              <Route path="/gas-tracker" element={<GasFeeTracker />} />
              <Route path="/transaction-analyzer" element={<TransactionAnalyzer />} />
              <Route path="/rpc-monitor" element={<RPCMonitor />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App