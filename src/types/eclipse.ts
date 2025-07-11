export interface GasFeeData {
  timestamp: number
  fee: number
  feeType: 'transfer' | 'swap' | 'nft' | 'program'
  priority: 'low' | 'medium' | 'high'
}

export interface GasFeeStats {
  current: number
  average24h: number
  average7d: number
  min24h: number
  max24h: number
  recommended: {
    low: number
    medium: number
    high: number
  }
}

export interface EclipseRPCConfig {
  url: string
  websocketUrl?: string
  timeout?: number
  retryCount?: number
}