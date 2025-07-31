export const ECLIPSE_RPC_CONFIG = {
  MAINNET: {
    url: import.meta.env.VITE_ECLIPSE_RPC_URL || 'https://eclipse.helius-rpc.com/',
    websocketUrl: import.meta.env.VITE_ECLIPSE_WS_URL || 'wss://eclipse.helius-rpc.com/',
  },
  BACKUP_URLS: (import.meta.env.VITE_BACKUP_RPC_URLS || '').split(',').filter(Boolean),
  TIMEOUT: 5000,
  RETRY_COUNT: 3,
}

export const ECLIPSE_SYSTEM_PROGRAM_ID = '11111111111111111111111111111111'

export const UPDATE_INTERVALS = {
  GAS_FEE: parseInt(import.meta.env.VITE_GAS_FEE_UPDATE_INTERVAL || '15000'),
  RPC_HEALTH: parseInt(import.meta.env.VITE_RPC_HEALTH_CHECK_INTERVAL || '30000'),
}

export const CHART_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
}

export const GAS_FEE_LEVELS = {
  LOW: { min: 0, max: 1000, label: 'Low' },
  MEDIUM: { min: 1000, max: 5000, label: 'Medium' },
  HIGH: { min: 5000, max: 50000, label: 'High' },
  VERY_HIGH: { min: 50000, max: Infinity, label: 'Very High' },
}

export const DEFAULT_RPC_ENDPOINTS = [
  {
    id: 'helius-1',
    name: 'Helius Eclipse RPC',
    url: 'https://eclipse.helius-rpc.com/',
    isActive: true,
  },
  {
    id: 'mainnet-1',
    name: 'Eclipse Mainnet',
    url: 'https://mainnetbeta-rpc.eclipse.xyz',
    isActive: false,
  },
]