import { useState, useEffect, useCallback } from 'react'
import { performanceMonitor, PerformanceStats, PerformanceMetric, PerformanceCategory, PerformanceThreshold } from '../services/performanceMonitor'

export const usePerformanceMonitor = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const newStats = await performanceMonitor.getStats()
      setStats(newStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance stats')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(refreshStats, 30000)
    
    return () => clearInterval(interval)
  }, [refreshStats])

  const measureAction = useCallback((name: string, action: () => void | Promise<void>) => {
    performanceMonitor.measureUserAction(name, action)
  }, [])

  const recordMetric = useCallback((metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => {
    performanceMonitor.recordMetric(metric)
  }, [])

  const clearMetrics = useCallback(async () => {
    try {
      await performanceMonitor.clearMetrics()
      await refreshStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear metrics')
    }
  }, [refreshStats])

  return {
    stats,
    isLoading,
    error,
    refreshStats,
    measureAction,
    recordMetric,
    clearMetrics
  }
}

export const usePerformanceThresholds = () => {
  const [thresholds, setThresholds] = useState<PerformanceThreshold[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshThresholds = useCallback(() => {
    try {
      setIsLoading(true)
      const currentThresholds = performanceMonitor.getThresholds()
      setThresholds(currentThresholds)
    } catch (err) {
      console.error('Failed to load thresholds:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshThresholds()
  }, [refreshThresholds])

  const updateThreshold = useCallback((name: string, threshold: Partial<PerformanceThreshold>) => {
    performanceMonitor.updateThreshold(name, threshold)
    refreshThresholds()
  }, [refreshThresholds])

  const addThreshold = useCallback((threshold: PerformanceThreshold) => {
    performanceMonitor.addThreshold(threshold)
    refreshThresholds()
  }, [refreshThresholds])

  const removeThreshold = useCallback((name: string) => {
    performanceMonitor.removeThreshold(name)
    refreshThresholds()
  }, [refreshThresholds])

  return {
    thresholds,
    isLoading,
    refreshThresholds,
    updateThreshold,
    addThreshold,
    removeThreshold
  }
}

export const usePerformanceAlert = () => {
  const [alerts, setAlerts] = useState<Array<{
    id: string
    metric: PerformanceMetric
    threshold: PerformanceThreshold
    timestamp: number
  }>>([])

  useEffect(() => {
    const handleThresholdExceeded = (event: CustomEvent) => {
      const { metric, threshold } = event.detail
      const alert = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metric,
        threshold,
        timestamp: Date.now()
      }
      
      setAlerts(prev => [alert, ...prev.slice(0, 49)]) // Keep last 50 alerts
    }

    window.addEventListener('performance-threshold-exceeded', handleThresholdExceeded as EventListener)
    
    return () => {
      window.removeEventListener('performance-threshold-exceeded', handleThresholdExceeded as EventListener)
    }
  }, [])

  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }, [])

  return {
    alerts,
    clearAlerts,
    dismissAlert
  }
}

// Custom hook for measuring component render time
export const useRenderTime = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      performanceMonitor.recordMetric({
        name: `${componentName}_render_time`,
        value: endTime - startTime,
        unit: 'ms',
        category: PerformanceCategory.RENDERING,
        tags: {
          component: componentName
        }
      })
    }
  })
}

// Custom hook for measuring API call performance
export const useApiCallMonitor = () => {
  const measureApiCall = useCallback(async <T>(
    name: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, string>
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await apiCall()
      const duration = performance.now() - startTime
      
      performanceMonitor.recordMetric({
        name: `${name}_success`,
        value: duration,
        unit: 'ms',
        category: PerformanceCategory.API_CALL,
        tags: {
          ...metadata,
          status: 'success'
        }
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      performanceMonitor.recordMetric({
        name: `${name}_error`,
        value: duration,
        unit: 'ms',
        category: PerformanceCategory.API_CALL,
        tags: {
          ...metadata,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      throw error
    }
  }, [])

  return { measureApiCall }
}

// Custom hook for measuring blockchain operations
export const useBlockchainMonitor = () => {
  const measureBlockchainOperation = useCallback(async <T>(
    operation: string,
    blockchainCall: () => Promise<T>,
    metadata?: Record<string, string>
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await blockchainCall()
      const duration = performance.now() - startTime
      
      performanceMonitor.recordMetric({
        name: `blockchain_${operation}`,
        value: duration,
        unit: 'ms',
        category: PerformanceCategory.BLOCKCHAIN,
        tags: {
          ...metadata,
          operation,
          status: 'success'
        }
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      performanceMonitor.recordMetric({
        name: `blockchain_${operation}_error`,
        value: duration,
        unit: 'ms',
        category: PerformanceCategory.BLOCKCHAIN,
        tags: {
          ...metadata,
          operation,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      throw error
    }
  }, [])

  return { measureBlockchainOperation }
}

// Custom hook for measuring wallet operations
export const useWalletMonitor = () => {
  const measureWalletOperation = useCallback(async <T>(
    operation: string,
    walletCall: () => Promise<T>,
    metadata?: Record<string, string>
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await walletCall()
      const duration = performance.now() - startTime
      
      performanceMonitor.recordMetric({
        name: `wallet_${operation}`,
        value: duration,
        unit: 'ms',
        category: PerformanceCategory.WALLET,
        tags: {
          ...metadata,
          operation,
          status: 'success'
        }
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      performanceMonitor.recordMetric({
        name: `wallet_${operation}_error`,
        value: duration,
        unit: 'ms',
        category: PerformanceCategory.WALLET,
        tags: {
          ...metadata,
          operation,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      throw error
    }
  }, [])

  return { measureWalletOperation }
}