export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  walletAddress?: string
  rpcEndpoint?: string
  transactionId?: string
  category?: string
  severity?: string
  errorId?: string
  url?: string
  context?: unknown
  errorInfo?: unknown
  metadata?: Record<string, unknown>
}