export interface RPCEndpoint {
  id: string
  name: string
  url: string
  isActive: boolean
  lastChecked: number
  status: 'online' | 'offline' | 'checking'
  responseTime: number
  blockHeight: number
  version?: string
}

export interface RPCHealthData {
  endpoint: RPCEndpoint
  uptime: number
  avgResponseTime: number
  errorRate: number
  historicalData: {
    timestamp: number
    responseTime: number
    isOnline: boolean
  }[]
}

export interface NetworkStats {
  totalEndpoints: number
  onlineEndpoints: number
  averageResponseTime: number
  bestEndpoint: RPCEndpoint
  worstEndpoint: RPCEndpoint
}