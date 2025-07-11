import { ECLIPSE_RPC_CONFIG } from '../utils/constants'
import { errorLogger } from './errorLogger'
import { toastService } from './toastService'
import { withNetworkRetry } from '../utils/retry'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}

export interface WebSocketSubscription {
  id: string
  type: 'blockHeight' | 'gasFees' | 'transactions' | 'rpcHealth'
  params?: any
  callback: (data: any) => void
}

export class WebSocketService {
  private ws: WebSocket | null = null
  private subscriptions: Map<string, WebSocketSubscription> = new Map()
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isConnecting = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(private url: string = ECLIPSE_RPC_CONFIG.MAINNET.websocketUrl) {}

  connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true
      
      try {
        this.ws = new WebSocket(this.url)
        
        this.ws.onopen = () => {
          errorLogger.logInfo('WebSocket connected successfully', {
            context: { url: this.url, reconnectAttempts: this.reconnectAttempts }
          })
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.resubscribeAll()
          toastService.showSuccess('WebSocket connected')
          resolve()
        }
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }
        
        this.ws.onclose = (event) => {
          const errorMessage = `WebSocket disconnected: ${event.code} ${event.reason}`
          errorLogger.logError(new Error(errorMessage), {
            category: 'WEBSOCKET',
            context: { code: event.code, reason: event.reason, url: this.url },
            severity: 'medium'
          })
          this.isConnecting = false
          this.scheduleReconnect()
        }
        
        this.ws.onerror = (error) => {
          const errorMessage = error instanceof Error ? error.message : 'WebSocket connection error'
          errorLogger.logError(new Error(`WebSocket error: ${errorMessage}`), {
            category: 'WEBSOCKET',
            context: { url: this.url, reconnectAttempts: this.reconnectAttempts },
            severity: 'high'
          })
          this.isConnecting = false
          toastService.showError('WebSocket connection failed')
          reject(error)
        }
        
        // Connection timeout
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false
            const timeoutError = new Error('WebSocket connection timeout')
            errorLogger.logError(timeoutError, {
              category: 'WEBSOCKET',
              context: { url: this.url, timeout: 10000 },
              severity: 'high'
            })
            toastService.showError('WebSocket connection timeout')
            reject(timeoutError)
          }
        }, 10000)
        
      } catch (error) {
        this.isConnecting = false
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errorLogger.logError(new Error(`Failed to create WebSocket: ${errorMessage}`), {
          category: 'WEBSOCKET',
          context: { url: this.url },
          severity: 'high'
        })
        toastService.showError('Failed to create WebSocket connection')
        reject(error)
      }
    })
  }

  disconnect(): void {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = null
      }
      
      if (this.ws) {
        this.ws.close()
        this.ws = null
      }
      
      this.subscriptions.clear()
      errorLogger.logInfo('WebSocket disconnected successfully', {
        context: { url: this.url }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to disconnect WebSocket: ${errorMessage}`), {
        category: 'WEBSOCKET',
        context: { url: this.url },
        severity: 'medium'
      })
    }
  }

  subscribe(subscription: WebSocketSubscription): void {
    try {
      this.subscriptions.set(subscription.id, subscription)
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendSubscription(subscription)
      }
      
      errorLogger.logInfo('WebSocket subscription added', {
        context: { subscriptionId: subscription.id, type: subscription.type }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to add WebSocket subscription: ${errorMessage}`), {
        category: 'WEBSOCKET',
        context: { subscriptionId: subscription.id, type: subscription.type },
        severity: 'medium'
      })
      toastService.showError('Failed to add WebSocket subscription')
    }
  }

  unsubscribe(id: string): void {
    try {
      const subscription = this.subscriptions.get(id)
      if (subscription && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendUnsubscription(subscription)
      }
      this.subscriptions.delete(id)
      
      errorLogger.logInfo('WebSocket subscription removed', {
        context: { subscriptionId: id }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to remove WebSocket subscription: ${errorMessage}`), {
        category: 'WEBSOCKET',
        context: { subscriptionId: id },
        severity: 'medium'
      })
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data)
      
      // Find matching subscription and call callback
      for (const [, subscription] of this.subscriptions) {
        if (this.messageMatchesSubscription(message, subscription)) {
          try {
            subscription.callback(message.data)
          } catch (callbackError) {
            const errorMessage = callbackError instanceof Error ? callbackError.message : 'Unknown error'
            errorLogger.logError(new Error(`WebSocket callback error: ${errorMessage}`), {
              category: 'WEBSOCKET',
              context: { subscriptionId: subscription.id, type: subscription.type },
              severity: 'medium'
            })
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to parse WebSocket message: ${errorMessage}`), {
        category: 'WEBSOCKET',
        context: { data: data.substring(0, 100) }, // Log first 100 chars
        severity: 'medium'
      })
    }
  }

  private messageMatchesSubscription(message: WebSocketMessage, subscription: WebSocketSubscription): boolean {
    // Simple type matching - can be extended for more complex matching
    return message.type === subscription.type
  }

  private sendSubscription(subscription: WebSocketSubscription): void {
    try {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
      
      const message = {
        jsonrpc: '2.0',
        id: subscription.id,
        method: this.getSubscriptionMethod(subscription.type),
        params: subscription.params || {},
      }
      
      this.ws.send(JSON.stringify(message))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to send WebSocket subscription: ${errorMessage}`), {
        category: 'WEBSOCKET',
        context: { subscriptionId: subscription.id, type: subscription.type },
        severity: 'medium'
      })
    }
  }

  private sendUnsubscription(subscription: WebSocketSubscription): void {
    try {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
      
      const message = {
        jsonrpc: '2.0',
        id: subscription.id,
        method: this.getUnsubscriptionMethod(subscription.type),
        params: [subscription.id],
      }
      
      this.ws.send(JSON.stringify(message))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to send WebSocket unsubscription: ${errorMessage}`), {
        category: 'WEBSOCKET',
        context: { subscriptionId: subscription.id, type: subscription.type },
        severity: 'medium'
      })
    }
  }

  private getSubscriptionMethod(type: string): string {
    switch (type) {
      case 'blockHeight':
        return 'slotSubscribe'
      case 'gasFees':
        return 'recentPerformanceSamplesSubscribe'
      case 'transactions':
        return 'signatureSubscribe'
      case 'rpcHealth':
        return 'healthSubscribe'
      default:
        return 'subscribe'
    }
  }

  private getUnsubscriptionMethod(type: string): string {
    switch (type) {
      case 'blockHeight':
        return 'slotUnsubscribe'
      case 'gasFees':
        return 'recentPerformanceSamplesUnsubscribe'
      case 'transactions':
        return 'signatureUnsubscribe'
      case 'rpcHealth':
        return 'healthUnsubscribe'
      default:
        return 'unsubscribe'
    }
  }

  private resubscribeAll(): void {
    try {
      for (const [, subscription] of this.subscriptions) {
        this.sendSubscription(subscription)
      }
      
      if (this.subscriptions.size > 0) {
        errorLogger.logInfo('WebSocket subscriptions reestablished', {
          context: { count: this.subscriptions.size }
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to resubscribe to WebSocket: ${errorMessage}`), {
        category: 'WEBSOCKET',
        context: { subscriptionCount: this.subscriptions.size },
        severity: 'medium'
      })
    }
  }

  private scheduleReconnect(): void {
    try {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        const maxAttemptsError = new Error(`Max reconnect attempts reached (${this.maxReconnectAttempts})`)
        errorLogger.logError(maxAttemptsError, {
          category: 'WEBSOCKET',
          context: { maxReconnectAttempts: this.maxReconnectAttempts, url: this.url },
          severity: 'high'
        })
        toastService.showError('WebSocket connection failed after multiple attempts')
        return
      }
      
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
      this.reconnectAttempts++
      
      errorLogger.logInfo(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`, {
        context: { delay, url: this.url }
      })
      
      this.reconnectTimeout = setTimeout(() => {
        errorLogger.logInfo(`Attempting WebSocket reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, {
          context: { url: this.url }
        })
        this.connect().catch(error => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errorLogger.logError(new Error(`WebSocket reconnect failed: ${errorMessage}`), {
            category: 'WEBSOCKET',
            context: { attempt: this.reconnectAttempts, url: this.url },
            severity: 'medium'
          })
        })
      }, delay)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to schedule WebSocket reconnect: ${errorMessage}`), {
        category: 'WEBSOCKET',
        context: { url: this.url },
        severity: 'medium'
      })
    }
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  get connectionState(): string {
    if (!this.ws) return 'disconnected'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'disconnected'
      default:
        return 'unknown'
    }
  }
}

// Global WebSocket service instance
export const webSocketService = new WebSocketService()