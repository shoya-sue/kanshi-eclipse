import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  withRetry, 
  withNetworkRetry, 
  withWalletRetry, 
  withBlockchainRetry, 
  RetryError,
  CircuitBreaker 
} from '../retry'

describe('Retry Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  describe('withRetry', () => {
    it('should execute function successfully on first try', async () => {
      const mockFn = vi.fn(() => Promise.resolve('success'))
      
      const result = await withRetry(mockFn)
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success')
      
      const resultPromise = withRetry(mockFn, { retries: 3, delay: 100 })
      
      // Advance timers to trigger retries
      await vi.advanceTimersByTimeAsync(300)
      
      const result = await resultPromise
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('should throw RetryError after max retries', async () => {
      const mockFn = vi.fn(() => Promise.reject(new Error('Always fails')))
      
      const resultPromise = withRetry(mockFn, { retries: 2, delay: 100 })
      
      await vi.advanceTimersByTimeAsync(300)
      
      await expect(resultPromise).rejects.toThrow(RetryError)
      expect(mockFn).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should use exponential backoff when enabled', async () => {
      const mockFn = vi.fn(() => Promise.reject(new Error('Network error')))
      const onRetry = vi.fn()
      
      const resultPromise = withRetry(mockFn, {
        retries: 3,
        delay: 100,
        exponentialBackoff: true,
        onRetry,
      })
      
      await vi.advanceTimersByTimeAsync(1000)
      
      await expect(resultPromise).rejects.toThrow(RetryError)
      expect(onRetry).toHaveBeenCalledTimes(3)
    })

    it('should not retry when shouldRetry returns false', async () => {
      const mockFn = vi.fn(() => Promise.reject(new Error('Validation error')))
      const shouldRetry = vi.fn(() => false)
      
      const resultPromise = withRetry(mockFn, {
        retries: 3,
        shouldRetry,
      })
      
      await expect(resultPromise).rejects.toThrow('Validation error')
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(shouldRetry).toHaveBeenCalledTimes(1)
    })

    it('should respect maxDelay limit', async () => {
      const mockFn = vi.fn(() => Promise.reject(new Error('Network error')))
      const onRetry = vi.fn()
      
      const resultPromise = withRetry(mockFn, {
        retries: 3,
        delay: 1000,
        exponentialBackoff: true,
        maxDelay: 2000,
        onRetry,
      })
      
      await vi.advanceTimersByTimeAsync(10000)
      
      await expect(resultPromise).rejects.toThrow(RetryError)
      expect(onRetry).toHaveBeenCalledTimes(3)
    })

    it('should call onRetry callback with correct parameters', async () => {
      const mockFn = vi.fn(() => Promise.reject(new Error('Test error')))
      const onRetry = vi.fn()
      
      const resultPromise = withRetry(mockFn, {
        retries: 2,
        delay: 100,
        onRetry,
      })
      
      await vi.advanceTimersByTimeAsync(300)
      
      await expect(resultPromise).rejects.toThrow(RetryError)
      expect(onRetry).toHaveBeenCalledTimes(2)
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error))
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error))
    })
  })

  describe('withNetworkRetry', () => {
    it('should retry on network errors', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success')
      
      const resultPromise = withNetworkRetry(mockFn)
      
      await vi.advanceTimersByTimeAsync(2000)
      
      const result = await resultPromise
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should not retry on non-network errors', async () => {
      const mockFn = vi.fn(() => Promise.reject(new Error('Validation error')))
      
      const resultPromise = withNetworkRetry(mockFn)
      
      await expect(resultPromise).rejects.toThrow('Validation error')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should log retry attempts', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')
      
      const resultPromise = withNetworkRetry(mockFn)
      
      await vi.advanceTimersByTimeAsync(2000)
      
      await resultPromise
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Network request failed, retrying'),
        expect.any(String)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('withWalletRetry', () => {
    it('should retry on connection errors', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValue('success')
      
      const resultPromise = withWalletRetry(mockFn)
      
      await vi.advanceTimersByTimeAsync(5000)
      
      const result = await resultPromise
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should not retry on user rejection', async () => {
      const mockFn = vi.fn(() => Promise.reject(new Error('User rejected transaction')))
      
      const resultPromise = withWalletRetry(mockFn)
      
      await expect(resultPromise).rejects.toThrow('User rejected transaction')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should use fixed delay (no exponential backoff)', async () => {
      const mockFn = vi.fn(() => Promise.reject(new Error('Connection failed')))
      
      const resultPromise = withWalletRetry(mockFn, 2)
      
      await vi.advanceTimersByTimeAsync(10000)
      
      await expect(resultPromise).rejects.toThrow(RetryError)
      expect(mockFn).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })
  })

  describe('withBlockchainRetry', () => {
    it('should retry on RPC errors', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('RPC call failed'))
        .mockResolvedValue('success')
      
      const resultPromise = withBlockchainRetry(mockFn)
      
      await vi.advanceTimersByTimeAsync(5000)
      
      const result = await resultPromise
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should retry on rate limit errors', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValue('success')
      
      const resultPromise = withBlockchainRetry(mockFn)
      
      await vi.advanceTimersByTimeAsync(5000)
      
      const result = await resultPromise
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should use exponential backoff with max delay', async () => {
      const mockFn = vi.fn(() => Promise.reject(new Error('Network timeout')))
      
      const resultPromise = withBlockchainRetry(mockFn, 3)
      
      await vi.advanceTimersByTimeAsync(20000)
      
      await expect(resultPromise).rejects.toThrow(RetryError)
      expect(mockFn).toHaveBeenCalledTimes(4) // Initial + 3 retries
    })
  })

  describe('RetryError', () => {
    it('should contain information about last error and attempts', async () => {
      const mockFn = vi.fn(() => Promise.reject(new Error('Original error')))
      
      const resultPromise = withRetry(mockFn, { retries: 2, delay: 100 })
      
      await vi.advanceTimersByTimeAsync(300)
      
      try {
        await resultPromise
      } catch (error) {
        expect(error).toBeInstanceOf(RetryError)
        expect((error as RetryError).lastError.message).toBe('Original error')
        expect((error as RetryError).attempts).toBe(3)
        expect((error as RetryError).message).toBe('Failed after 3 attempts')
      }
    })
  })

  describe('CircuitBreaker', () => {
    it('should execute function normally when closed', async () => {
      const circuitBreaker = new CircuitBreaker(3, 5000)
      const mockFn = vi.fn(() => Promise.resolve('success'))
      
      const result = await circuitBreaker.execute(mockFn)
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(circuitBreaker.getState()).toBe('closed')
    })

    it('should open circuit after threshold failures', async () => {
      const circuitBreaker = new CircuitBreaker(2, 5000)
      const mockFn = vi.fn(() => Promise.reject(new Error('Service error')))
      
      // First failure
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Service error')
      expect(circuitBreaker.getState()).toBe('closed')
      
      // Second failure - should open circuit
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Service error')
      expect(circuitBreaker.getState()).toBe('open')
      
      // Third attempt - should be rejected immediately
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is open')
      expect(mockFn).toHaveBeenCalledTimes(2) // Not called on third attempt
    })

    it('should transition to half-open after timeout', async () => {
      const circuitBreaker = new CircuitBreaker(1, 1000)
      const mockFn = vi.fn(() => Promise.reject(new Error('Service error')))
      
      // Trigger circuit to open
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Service error')
      expect(circuitBreaker.getState()).toBe('open')
      
      // Wait for timeout
      vi.advanceTimersByTime(1500)
      
      // Next call should be allowed (half-open state)
      const successFn = vi.fn(() => Promise.resolve('success'))
      const result = await circuitBreaker.execute(successFn)
      
      expect(result).toBe('success')
      expect(circuitBreaker.getState()).toBe('closed')
    })

    it('should reset circuit on success', async () => {
      const circuitBreaker = new CircuitBreaker(2, 5000)
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Service error'))
        .mockResolvedValue('success')
      
      // First failure
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Service error')
      
      // Success - should reset failure count
      const result = await circuitBreaker.execute(mockFn)
      expect(result).toBe('success')
      expect(circuitBreaker.getState()).toBe('closed')
      
      // Another failure - should not open circuit (count was reset)
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Service error')
      expect(circuitBreaker.getState()).toBe('closed')
    })

    it('should allow manual reset', async () => {
      const circuitBreaker = new CircuitBreaker(1, 5000)
      const mockFn = vi.fn(() => Promise.reject(new Error('Service error')))
      
      // Open circuit
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Service error')
      expect(circuitBreaker.getState()).toBe('open')
      
      // Reset manually
      circuitBreaker.reset()
      expect(circuitBreaker.getState()).toBe('closed')
      
      // Should be able to execute again
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Service error')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('pre-configured circuit breakers', () => {
    it('should have correct configurations', () => {
      const { networkCircuitBreaker, walletCircuitBreaker, blockchainCircuitBreaker } = require('../retry')
      
      expect(networkCircuitBreaker).toBeInstanceOf(CircuitBreaker)
      expect(walletCircuitBreaker).toBeInstanceOf(CircuitBreaker)
      expect(blockchainCircuitBreaker).toBeInstanceOf(CircuitBreaker)
    })
  })
})