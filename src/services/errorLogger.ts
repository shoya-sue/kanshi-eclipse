import { ErrorContext } from '../types/errorLogger'

export interface ErrorLog {
  id: string
  timestamp: number
  error: {
    name: string
    message: string
    stack?: string
  }
  context?: ErrorContext
  category: ErrorCategory
  userAgent?: string
  url?: string
  userId?: string
  severity: ErrorSeverity
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  BLOCKCHAIN = 'blockchain',
  USER_INPUT = 'user_input',
  SYSTEM = 'system',
  WALLET = 'wallet',
  DEX = 'dex',
  CACHE = 'cache'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorStats {
  totalErrors: number
  errorsByCategory: Record<ErrorCategory, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  recentErrors: ErrorLog[]
  topErrors: Array<{
    message: string
    count: number
    lastOccurred: number
  }>
}

class ErrorLoggerService {
  private readonly maxLogs = 1000
  private readonly dbName = 'ErrorLogs'
  private readonly storeName = 'errors'
  private db: IDBDatabase | null = null

  constructor() {
    this.initDB()
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp')
          store.createIndex('category', 'category')
          store.createIndex('severity', 'severity')
        }
      }
    })
  }

  private generateErrorId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorCategory.NETWORK
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION
    }
    if (message.includes('wallet') || message.includes('signature')) {
      return ErrorCategory.WALLET
    }
    if (message.includes('swap') || message.includes('dex')) {
      return ErrorCategory.DEX
    }
    if (message.includes('cache') || message.includes('storage')) {
      return ErrorCategory.CACHE
    }
    if (message.includes('blockchain') || message.includes('rpc')) {
      return ErrorCategory.BLOCKCHAIN
    }
    
    return ErrorCategory.SYSTEM
  }

  private getSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    const message = error.message.toLowerCase()
    
    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL
    }
    if (category === ErrorCategory.WALLET || category === ErrorCategory.BLOCKCHAIN) {
      return ErrorSeverity.HIGH
    }
    if (category === ErrorCategory.NETWORK || category === ErrorCategory.DEX) {
      return ErrorSeverity.MEDIUM
    }
    
    return ErrorSeverity.LOW
  }

  async logError(error: Error, context?: ErrorContext): Promise<void> {
    try {
      await this.initDB()
      
      const category = this.categorizeError(error)
      const severity = this.getSeverity(error, category)
      
      const errorLog: ErrorLog = {
        id: this.generateErrorId(),
        timestamp: Date.now(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context,
        category,
        userAgent: navigator.userAgent,
        url: window.location.href,
        severity
      }

      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        await store.add(errorLog)
      }

      // Console logging for development
      console.error('Error logged:', errorLog)
      
      // Cleanup old logs
      await this.cleanup()
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  async getErrorStats(): Promise<ErrorStats> {
    try {
      await this.initDB()
      
      if (!this.db) {
        return this.getEmptyStats()
      }

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const errors: ErrorLog[] = request.result
          const stats = this.calculateStats(errors)
          resolve(stats)
        }
        request.onerror = () => resolve(this.getEmptyStats())
      })
    } catch (error) {
      console.error('Failed to get error stats:', error)
      return this.getEmptyStats()
    }
  }

  private calculateStats(errors: ErrorLog[]): ErrorStats {
    const errorsByCategory: Record<ErrorCategory, number> = {
      [ErrorCategory.NETWORK]: 0,
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.BLOCKCHAIN]: 0,
      [ErrorCategory.USER_INPUT]: 0,
      [ErrorCategory.SYSTEM]: 0,
      [ErrorCategory.WALLET]: 0,
      [ErrorCategory.DEX]: 0,
      [ErrorCategory.CACHE]: 0
    }

    const errorsBySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    }

    const errorCounts: Record<string, number> = {}
    const errorLastOccurred: Record<string, number> = {}

    errors.forEach(error => {
      errorsByCategory[error.category]++
      errorsBySeverity[error.severity]++
      
      const message = error.error.message
      errorCounts[message] = (errorCounts[message] || 0) + 1
      errorLastOccurred[message] = Math.max(
        errorLastOccurred[message] || 0,
        error.timestamp
      )
    })

    const topErrors = Object.entries(errorCounts)
      .map(([message, count]) => ({
        message,
        count,
        lastOccurred: errorLastOccurred[message]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const recentErrors = errors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20)

    return {
      totalErrors: errors.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors,
      topErrors
    }
  }

  private getEmptyStats(): ErrorStats {
    return {
      totalErrors: 0,
      errorsByCategory: {
        [ErrorCategory.NETWORK]: 0,
        [ErrorCategory.VALIDATION]: 0,
        [ErrorCategory.BLOCKCHAIN]: 0,
        [ErrorCategory.USER_INPUT]: 0,
        [ErrorCategory.SYSTEM]: 0,
        [ErrorCategory.WALLET]: 0,
        [ErrorCategory.DEX]: 0,
        [ErrorCategory.CACHE]: 0
      },
      errorsBySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0
      },
      recentErrors: [],
      topErrors: []
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (!this.db) return

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('timestamp')
      
      const request = index.getAll()
      request.onsuccess = () => {
        const errors: ErrorLog[] = request.result
        if (errors.length > this.maxLogs) {
          const sortedErrors = errors.sort((a, b) => b.timestamp - a.timestamp)
          const toDelete = sortedErrors.slice(this.maxLogs)
          
          toDelete.forEach(error => {
            store.delete(error.id)
          })
        }
      }
    } catch (error) {
      console.error('Failed to cleanup error logs:', error)
    }
  }

  async clearLogs(): Promise<void> {
    try {
      await this.initDB()
      
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        await store.clear()
      }
    } catch (error) {
      console.error('Failed to clear error logs:', error)
    }
  }

  async exportLogs(): Promise<string> {
    try {
      const stats = await this.getErrorStats()
      return JSON.stringify(stats, null, 2)
    } catch (error) {
      console.error('Failed to export logs:', error)
      return '{}'
    }
  }

  logInfo(message: string, context?: ErrorContext): void {
    console.info(message, context)
  }
}

export const errorLogger = new ErrorLoggerService()