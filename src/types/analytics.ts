export interface AnalyticsEvent {
  category: string
  action: string
  label?: string
  value?: number
  timestamp?: number
  userId?: string
  sessionId?: string
  metadata?: Record<string, unknown>
}

export interface AnalyticsPageView {
  path: string
  title: string
  referrer?: string
  timestamp?: number
  userId?: string
  sessionId?: string
}

export interface AnalyticsUserProperties {
  userId?: string
  walletAddress?: string
  preferredLanguage?: string
  theme?: string
  features?: string[]
}