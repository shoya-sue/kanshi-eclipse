import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { WalletContextProvider } from '../contexts/WalletContext'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <WalletContextProvider>
            {children}
          </WalletContextProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Create a mock QueryClient for testing
export const createMockQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

// Mock data generators
export const mockWalletData = {
  address: '11111111111111111111111111111111',
  balance: 1000000,
  connected: true,
  publicKey: {
    toString: () => '11111111111111111111111111111111',
    toBase58: () => '11111111111111111111111111111111',
  },
}

export const mockTransactionData = {
  signature: '5j7s1QjNeQjCKvf8HqRv4qXUKHV7AKQg3YoKjWoLsP2WVzqBmfFr2Q9cYsxkJ4P1J2wdYdFJZqVdKYDe8Z5j7s1Q',
  blockTime: Date.now(),
  slot: 123456789,
  meta: {
    fee: 5000,
    preBalances: [100000000, 200000000],
    postBalances: [95000000, 205000000],
    err: null,
  },
  transaction: {
    message: {
      accountKeys: [
        { pubkey: '11111111111111111111111111111111', isSigner: true, isWritable: true },
        { pubkey: '22222222222222222222222222222222', isSigner: false, isWritable: true },
      ],
      recentBlockhash: '7j7s1QjNeQjCKvf8HqRv4qXUKHV7AKQg3YoKjWoLsP2W',
      instructions: [],
    },
    signatures: ['5j7s1QjNeQjCKvf8HqRv4qXUKHV7AKQg3YoKjWoLsP2WVzqBmfFr2Q9cYsxkJ4P1J2wdYdFJZqVdKYDe8Z5j7s1Q'],
  },
}

export const mockGasFeeData = {
  fast: 50000,
  medium: 30000,
  slow: 20000,
  timestamp: Date.now(),
}

export const mockRPCHealthData = {
  endpoint: 'https://api.eclipse.xyz',
  healthy: true,
  latency: 150,
  blockHeight: 123456789,
  lastUpdated: Date.now(),
}

export const mockDEXData = {
  tokens: [
    {
      address: '11111111111111111111111111111111',
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    },
    {
      address: '22222222222222222222222222222222',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    },
  ],
  pairs: [
    {
      address: '33333333333333333333333333333333',
      tokenA: '11111111111111111111111111111111',
      tokenB: '22222222222222222222222222222222',
      liquidity: 1000000,
    },
  ],
  swapQuote: {
    inputMint: '11111111111111111111111111111111',
    outputMint: '22222222222222222222222222222222',
    inputAmount: 1000000,
    outputAmount: 150000000,
    priceImpact: 0.1,
    slippage: 0.5,
  },
}

export const mockPerformanceData = {
  metrics: [
    {
      id: 'test-metric-1',
      name: 'api_response_time',
      value: 150,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'api_call',
    },
    {
      id: 'test-metric-2',
      name: 'memory_usage',
      value: 50000000,
      unit: 'bytes',
      timestamp: Date.now(),
      category: 'memory',
    },
  ],
  stats: {
    totalMetrics: 2,
    averageValues: {
      api_response_time: 150,
      memory_usage: 50000000,
    },
    categories: {
      api_call: 1,
      memory: 1,
      network: 0,
      rendering: 0,
      storage: 0,
      user_action: 0,
      blockchain: 0,
      wallet: 0,
    },
    recentMetrics: [],
    trends: [],
  },
}

export const mockErrorData = {
  error: {
    name: 'NetworkError',
    message: 'Failed to fetch',
    stack: 'NetworkError: Failed to fetch\n    at test:1:1',
  },
  errorLog: {
    id: 'test-error-1',
    timestamp: Date.now(),
    error: {
      name: 'NetworkError',
      message: 'Failed to fetch',
      stack: 'NetworkError: Failed to fetch\n    at test:1:1',
    },
    category: 'network',
    severity: 'medium',
  },
}

// Test utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock implementations for services
export const mockServices = {
  eclipseRPC: {
    getHealth: vi.fn(() => Promise.resolve(mockRPCHealthData)),
    getBlockHeight: vi.fn(() => Promise.resolve(123456789)),
    getBalance: vi.fn(() => Promise.resolve(1000000)),
    getTransaction: vi.fn(() => Promise.resolve(mockTransactionData)),
  },
  
  gasTracker: {
    getCurrentGasFees: vi.fn(() => Promise.resolve(mockGasFeeData)),
    getGasFeeHistory: vi.fn(() => Promise.resolve([mockGasFeeData])),
  },
  
  dexService: {
    getTokens: vi.fn(() => Promise.resolve(mockDEXData.tokens)),
    getSwapQuote: vi.fn(() => Promise.resolve(mockDEXData.swapQuote)),
    executeSwap: vi.fn(() => Promise.resolve({ signature: 'test-signature' })),
  },
  
  performanceMonitor: {
    getStats: vi.fn(() => Promise.resolve(mockPerformanceData.stats)),
    recordMetric: vi.fn(() => Promise.resolve()),
    clearMetrics: vi.fn(() => Promise.resolve()),
  },
  
  errorLogger: {
    logError: vi.fn(() => Promise.resolve()),
    getErrorStats: vi.fn(() => Promise.resolve({
      totalErrors: 1,
      errorsByCategory: { network: 1 },
      errorsBySeverity: { medium: 1 },
      recentErrors: [mockErrorData.errorLog],
      topErrors: [],
    })),
  },
}

// Re-export everything
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
export { customRender as render }