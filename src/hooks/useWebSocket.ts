import { useEffect, useState, useCallback, useRef } from 'react'
import { webSocketService, WebSocketSubscription } from '../services/websocketService'

export interface UseWebSocketOptions {
  autoConnect?: boolean
  reconnectOnMount?: boolean
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<string>('disconnected')
  const [error, setError] = useState<Error | null>(null)
  const subscriptionsRef = useRef<Set<string>>(new Set())

  const { autoConnect = true, reconnectOnMount = true } = options

  // Update connection state
  const updateConnectionState = useCallback(() => {
    const connected = webSocketService.isConnected
    const state = webSocketService.connectionState
    
    setIsConnected(connected)
    setConnectionState(state)
  }, [])

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      setError(null)
      await webSocketService.connect()
      updateConnectionState()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Connection failed'))
      updateConnectionState()
    }
  }, [updateConnectionState])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    webSocketService.disconnect()
    updateConnectionState()
  }, [updateConnectionState])

  // Subscribe to WebSocket events
  const subscribe = useCallback((subscription: WebSocketSubscription) => {
    webSocketService.subscribe(subscription)
    subscriptionsRef.current.add(subscription.id)
  }, [])

  // Unsubscribe from WebSocket events
  const unsubscribe = useCallback((id: string) => {
    webSocketService.unsubscribe(id)
    subscriptionsRef.current.delete(id)
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect || reconnectOnMount) {
      connect()
    }

    // Cleanup on unmount
    return () => {
      // Unsubscribe all subscriptions created by this hook
      subscriptionsRef.current.forEach(id => {
        webSocketService.unsubscribe(id)
      })
      subscriptionsRef.current.clear()
    }
  }, [autoConnect, reconnectOnMount, connect])

  // Update connection state periodically
  useEffect(() => {
    const interval = setInterval(updateConnectionState, 1000)
    return () => clearInterval(interval)
  }, [updateConnectionState])

  return {
    isConnected,
    connectionState,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  }
}

// Hook for specific subscription types
export const useWebSocketSubscription = <T>(
  type: WebSocketSubscription['type'],
  params?: any,
  enabled = true
) => {
  const [data, setData] = useState<T | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number>(0)
  const { subscribe, unsubscribe, isConnected } = useWebSocket()

  useEffect(() => {
    if (!enabled || !isConnected) return

    const subscriptionId = `${type}-${Date.now()}-${Math.random()}`
    
    const subscription: WebSocketSubscription = {
      id: subscriptionId,
      type,
      params,
      callback: (newData: T) => {
        setData(newData)
        setLastUpdated(Date.now())
      },
    }

    subscribe(subscription)

    return () => {
      unsubscribe(subscriptionId)
    }
  }, [type, params, enabled, isConnected, subscribe, unsubscribe])

  return {
    data,
    lastUpdated,
    isConnected,
  }
}

// Hook for real-time block height updates
export const useRealtimeBlockHeight = () => {
  return useWebSocketSubscription<number>('blockHeight')
}

// Hook for real-time gas fee updates
export const useRealtimeGasFees = () => {
  return useWebSocketSubscription<any>('gasFees')
}

// Hook for real-time RPC health updates
export const useRealtimeRPCHealth = () => {
  return useWebSocketSubscription<any>('rpcHealth')
}