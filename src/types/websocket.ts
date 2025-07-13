export interface WebSocketSubscriptionParams {
  method: string
  params?: Record<string, unknown>[]
}

export interface WebSocketMessageData {
  slot?: number
  value?: unknown
  type?: string
  [key: string]: unknown
}