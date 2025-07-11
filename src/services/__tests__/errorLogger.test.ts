import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { errorLogger, ErrorCategory, ErrorSeverity } from '../errorLogger'

describe('ErrorLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('logError', () => {
    it('should log error with correct categorization', async () => {
      const error = new Error('Network request failed')
      
      await errorLogger.logError(error, { component: 'TestComponent' })
      
      const stats = await errorLogger.getErrorStats()
      expect(stats.totalErrors).toBeGreaterThan(0)
      expect(stats.errorsByCategory[ErrorCategory.NETWORK]).toBeGreaterThan(0)
    })

    it('should categorize validation errors correctly', async () => {
      const error = new Error('Invalid input provided')
      
      await errorLogger.logError(error)
      
      const stats = await errorLogger.getErrorStats()
      expect(stats.errorsByCategory[ErrorCategory.VALIDATION]).toBeGreaterThan(0)
    })

    it('should categorize wallet errors correctly', async () => {
      const error = new Error('Wallet signature failed')
      
      await errorLogger.logError(error)
      
      const stats = await errorLogger.getErrorStats()
      expect(stats.errorsByCategory[ErrorCategory.WALLET]).toBeGreaterThan(0)
    })

    it('should categorize blockchain errors correctly', async () => {
      const error = new Error('RPC call failed')
      
      await errorLogger.logError(error)
      
      const stats = await errorLogger.getErrorStats()
      expect(stats.errorsByCategory[ErrorCategory.BLOCKCHAIN]).toBeGreaterThan(0)
    })

    it('should set correct severity levels', async () => {
      const criticalError = new Error('Critical system failure')
      const lowError = new Error('Minor issue')
      
      await errorLogger.logError(criticalError)
      await errorLogger.logError(lowError)
      
      const stats = await errorLogger.getErrorStats()
      expect(stats.errorsBySeverity[ErrorSeverity.CRITICAL]).toBeGreaterThan(0)
      expect(stats.errorsBySeverity[ErrorSeverity.LOW]).toBeGreaterThan(0)
    })

    it('should include context information', async () => {
      const error = new Error('Test error')
      const context = { userId: 'test-user', action: 'test-action' }
      
      await errorLogger.logError(error, context)
      
      const stats = await errorLogger.getErrorStats()
      const recentError = stats.recentErrors[0]
      expect(recentError.context).toEqual(context)
    })
  })

  describe('getErrorStats', () => {
    it('should return correct statistics', async () => {
      await errorLogger.clearLogs()
      
      const error1 = new Error('Network error')
      const error2 = new Error('Validation error')
      
      await errorLogger.logError(error1)
      await errorLogger.logError(error2)
      
      const stats = await errorLogger.getErrorStats()
      
      expect(stats.totalErrors).toBe(2)
      expect(stats.errorsByCategory[ErrorCategory.NETWORK]).toBe(1)
      expect(stats.errorsByCategory[ErrorCategory.VALIDATION]).toBe(1)
      expect(stats.recentErrors).toHaveLength(2)
    })

    it('should calculate top errors correctly', async () => {
      await errorLogger.clearLogs()
      
      const error1 = new Error('Common error')
      const error2 = new Error('Common error')
      const error3 = new Error('Rare error')
      
      await errorLogger.logError(error1)
      await errorLogger.logError(error2)
      await errorLogger.logError(error3)
      
      const stats = await errorLogger.getErrorStats()
      
      expect(stats.topErrors).toHaveLength(2)
      expect(stats.topErrors[0].message).toBe('Common error')
      expect(stats.topErrors[0].count).toBe(2)
      expect(stats.topErrors[1].message).toBe('Rare error')
      expect(stats.topErrors[1].count).toBe(1)
    })
  })

  describe('clearLogs', () => {
    it('should clear all logs', async () => {
      const error = new Error('Test error')
      await errorLogger.logError(error)
      
      let stats = await errorLogger.getErrorStats()
      expect(stats.totalErrors).toBeGreaterThan(0)
      
      await errorLogger.clearLogs()
      
      stats = await errorLogger.getErrorStats()
      expect(stats.totalErrors).toBe(0)
    })
  })

  describe('exportLogs', () => {
    it('should export logs as JSON string', async () => {
      await errorLogger.clearLogs()
      
      const error = new Error('Test error')
      await errorLogger.logError(error)
      
      const exported = await errorLogger.exportLogs()
      const parsed = JSON.parse(exported)
      
      expect(parsed).toHaveProperty('totalErrors')
      expect(parsed).toHaveProperty('errorsByCategory')
      expect(parsed).toHaveProperty('recentErrors')
      expect(parsed.totalErrors).toBe(1)
    })
  })

  describe('error categorization', () => {
    const testCases = [
      { message: 'fetch failed', expectedCategory: ErrorCategory.NETWORK },
      { message: 'network timeout', expectedCategory: ErrorCategory.NETWORK },
      { message: 'invalid input', expectedCategory: ErrorCategory.VALIDATION },
      { message: 'validation failed', expectedCategory: ErrorCategory.VALIDATION },
      { message: 'wallet connection failed', expectedCategory: ErrorCategory.WALLET },
      { message: 'signature rejected', expectedCategory: ErrorCategory.WALLET },
      { message: 'RPC error', expectedCategory: ErrorCategory.BLOCKCHAIN },
      { message: 'blockchain timeout', expectedCategory: ErrorCategory.BLOCKCHAIN },
      { message: 'swap failed', expectedCategory: ErrorCategory.DEX },
      { message: 'dex error', expectedCategory: ErrorCategory.DEX },
      { message: 'cache miss', expectedCategory: ErrorCategory.CACHE },
      { message: 'storage full', expectedCategory: ErrorCategory.CACHE },
      { message: 'unknown error', expectedCategory: ErrorCategory.SYSTEM },
    ]

    testCases.forEach(({ message, expectedCategory }) => {
      it(`should categorize "${message}" as ${expectedCategory}`, async () => {
        await errorLogger.clearLogs()
        
        const error = new Error(message)
        await errorLogger.logError(error)
        
        const stats = await errorLogger.getErrorStats()
        expect(stats.errorsByCategory[expectedCategory]).toBe(1)
      })
    })
  })

  describe('severity assessment', () => {
    const testCases = [
      { message: 'critical system failure', expectedSeverity: ErrorSeverity.CRITICAL },
      { message: 'fatal error', expectedSeverity: ErrorSeverity.CRITICAL },
      { message: 'wallet error', expectedSeverity: ErrorSeverity.HIGH },
      { message: 'blockchain error', expectedSeverity: ErrorSeverity.HIGH },
      { message: 'network timeout', expectedSeverity: ErrorSeverity.MEDIUM },
      { message: 'dex error', expectedSeverity: ErrorSeverity.MEDIUM },
      { message: 'validation error', expectedSeverity: ErrorSeverity.LOW },
    ]

    testCases.forEach(({ message, expectedSeverity }) => {
      it(`should assess "${message}" as ${expectedSeverity} severity`, async () => {
        await errorLogger.clearLogs()
        
        const error = new Error(message)
        await errorLogger.logError(error)
        
        const stats = await errorLogger.getErrorStats()
        expect(stats.errorsBySeverity[expectedSeverity]).toBe(1)
      })
    })
  })

  describe('error handling', () => {
    it('should handle IndexedDB errors gracefully', async () => {
      // Mock IndexedDB to fail
      const originalIndexedDB = global.indexedDB
      global.indexedDB = {
        ...originalIndexedDB,
        open: vi.fn(() => {
          throw new Error('IndexedDB not available')
        }),
      } as any

      const error = new Error('Test error')
      
      // Should not throw even if IndexedDB fails
      await expect(errorLogger.logError(error)).resolves.not.toThrow()
      
      // Restore IndexedDB
      global.indexedDB = originalIndexedDB
    })

    it('should handle malformed error objects', async () => {
      const malformedError = { message: 'Not a real error' } as any
      
      await expect(errorLogger.logError(malformedError)).resolves.not.toThrow()
    })
  })
})