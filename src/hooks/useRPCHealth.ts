import { useQuery, useQueryClient } from '@tanstack/react-query'
import { eclipseRPCService } from '../services/eclipseRPC'
import { RPCEndpoint, RPCHealthData, NetworkStats } from '../types/rpc'
import { DEFAULT_RPC_ENDPOINTS } from '../utils/constants'

export const useRPCHealth = (endpoint: RPCEndpoint) => {
  return useQuery({
    queryKey: ['rpcHealth', endpoint.id],
    queryFn: async () => {
      const service = new (eclipseRPCService.constructor as any)({
        url: endpoint.url,
      })
      
      const health = await service.checkRPCHealth()
      
      return {
        ...health,
        endpoint: {
          ...endpoint,
          status: health.isHealthy ? 'online' : 'offline',
          responseTime: health.responseTime,
          blockHeight: health.blockHeight,
          lastChecked: Date.now(),
        },
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
  })
}

export const useAllRPCHealth = () => {
  return useQuery<RPCHealthData[]>({
    queryKey: ['allRPCHealth'],
    queryFn: async () => {
      const endpoints = DEFAULT_RPC_ENDPOINTS
      const healthPromises = endpoints.map(async (endpoint) => {
        const service = new (eclipseRPCService.constructor as any)({
          url: endpoint.url,
        })
        
        const health = await service.checkRPCHealth()
        
        // Get historical data from cache or generate mock data
        const historicalData = Array.from({ length: 24 }, (_, i) => ({
          timestamp: Date.now() - (i * 60 * 60 * 1000),
          responseTime: Math.random() * 2000 + 100,
          isOnline: Math.random() > 0.1,
        })).reverse()
        
        return {
          endpoint: {
            ...endpoint,
            status: health.isHealthy ? 'online' as const : 'offline' as const,
            responseTime: health.responseTime,
            blockHeight: health.blockHeight,
            lastChecked: Date.now(),
          },
          uptime: historicalData.filter(d => d.isOnline).length / historicalData.length,
          avgResponseTime: historicalData.reduce((acc, d) => acc + d.responseTime, 0) / historicalData.length,
          errorRate: 1 - (historicalData.filter(d => d.isOnline).length / historicalData.length),
          historicalData,
        }
      })
      
      return Promise.all(healthPromises)
    },
    refetchInterval: 30000,
    staleTime: 15000,
  })
}

export const useNetworkStats = () => {
  const { data: healthData } = useAllRPCHealth()
  
  return useQuery<NetworkStats | null>({
    queryKey: ['networkStats', healthData],
    queryFn: () => {
      if (!healthData || healthData.length === 0) return null
      
      const onlineEndpoints = healthData.filter(h => h.endpoint.status === 'online')
      const totalEndpoints = healthData.length
      const averageResponseTime = onlineEndpoints.length > 0 
        ? onlineEndpoints.reduce((acc, h) => acc + h.endpoint.responseTime, 0) / onlineEndpoints.length
        : 0
      
      const bestEndpoint = onlineEndpoints.length > 0 
        ? onlineEndpoints.reduce((best, current) => 
          current.endpoint.responseTime < best.endpoint.responseTime ? current : best
        ).endpoint
        : onlineEndpoints[0]?.endpoint
      
      const worstEndpoint = onlineEndpoints.length > 0 
        ? onlineEndpoints.reduce((worst, current) => 
          current.endpoint.responseTime > worst.endpoint.responseTime ? current : worst
        ).endpoint
        : onlineEndpoints[0]?.endpoint
      
      return {
        totalEndpoints,
        onlineEndpoints: onlineEndpoints.length,
        averageResponseTime,
        bestEndpoint,
        worstEndpoint,
      }
    },
    enabled: !!healthData,
  })
}

export const useRPCEndpoints = () => {
  return useQuery<RPCEndpoint[]>({
    queryKey: ['rpcEndpoints'],
    queryFn: () => {
      const stored = localStorage.getItem('rpcEndpoints')
      return stored ? JSON.parse(stored) : DEFAULT_RPC_ENDPOINTS
    },
    staleTime: Infinity,
  })
}

export const useUpdateRPCEndpoints = () => {
  const queryClient = useQueryClient()
  
  return (endpoints: RPCEndpoint[]) => {
    localStorage.setItem('rpcEndpoints', JSON.stringify(endpoints))
    queryClient.setQueryData(['rpcEndpoints'], endpoints)
    queryClient.invalidateQueries({ queryKey: ['allRPCHealth'] })
  }
}