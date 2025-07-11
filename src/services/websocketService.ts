import { ECLIPSE_RPC_CONFIG } from '../utils/constants'

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
          console.log('WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.resubscribeAll()
          resolve()
        }
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }
        
        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.isConnecting = false
          this.scheduleReconnect()
        }
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          reject(error)
        }
        
        // Connection timeout
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false
            reject(new Error('WebSocket connection timeout'))
          }
        }, 10000)
        
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.subscriptions.clear()
  }

  subscribe(subscription: WebSocketSubscription): void {
    this.subscriptions.set(subscription.id, subscription)
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscription(subscription)
    }
  }

  unsubscribe(id: string): void {
    const subscription = this.subscriptions.get(id)
    if (subscription && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendUnsubscription(subscription)
    }
    this.subscriptions.delete(id)
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data)
      
      // Find matching subscription and call callback
      for (const [, subscription] of this.subscriptions) {
        if (this.messageMatchesSubscription(message, subscription)) {
          subscription.callback(message.data)
        }
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private messageMatchesSubscription(message: WebSocketMessage, subscription: WebSocketSubscription): boolean {
    // Simple type matching - can be extended for more complex matching
    return message.type === subscription.type
  }

  private sendSubscription(subscription: WebSocketSubscription): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    
    const message = {
      jsonrpc: '2.0',
      id: subscription.id,
      method: this.getSubscriptionMethod(subscription.type),
      params: subscription.params || {},
    }
    
    this.ws.send(JSON.stringify(message))
  }

  private sendUnsubscription(subscription: WebSocketSubscription): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    
    const message = {
      jsonrpc: '2.0',
      id: subscription.id,
      method: this.getUnsubscriptionMethod(subscription.type),
      params: [subscription.id],
    }
    
    this.ws.send(JSON.stringify(message))
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
    for (const [, subscription] of this.subscriptions) {
      this.sendSubscription(subscription)
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      return
    }
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      this.connect().catch(error => {
        console.error('Reconnect failed:', error)
      })
    }, delay)
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