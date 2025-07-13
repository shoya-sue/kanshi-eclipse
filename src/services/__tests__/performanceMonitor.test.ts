import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { performanceMonitor, PerformanceCategory } from '../performanceMonitor'

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllTimers()
  })

  describe('recordMetric', () => {
    it('should record a metric successfully', async () => {
      const metric = {
        name: 'test_metric',
        value: 100,
        unit: 'ms',
        category: PerformanceCategory.API_CALL,
      }

      await performanceMonitor.recordMetric(metric)

      const stats = await performanceMonitor.getStats()
      expect(stats.totalMetrics).toBeGreaterThan(0)
      expect(stats.categories[PerformanceCategory.API_CALL]).toBeGreaterThan(0)
    })

    it('should include metadata in recorded metrics', async () => {
      const metric = {
        name: 'api_call',
        value: 200,
        unit: 'ms',
        category: PerformanceCategory.API_CALL,
        tags: { endpoint: '/api/test', method: 'GET' },
      }

      await performanceMonitor.recordMetric(metric)

      const stats = await performanceMonitor.getStats()
      const recentMetric = stats.recentMetrics.find(m => m.name === 'api_call')
      expect(recentMetric?.tags).toEqual({ endpoint: '/api/test', method: 'GET' })
    })

    it('should generate unique IDs for metrics', async () => {
      const metric1 = {
        name: 'test_metric_1',
        value: 100,
        unit: 'ms',
        category: PerformanceCategory.API_CALL,
      }

      const metric2 = {
        name: 'test_metric_2',
        value: 200,
        unit: 'ms',
        category: PerformanceCategory.API_CALL,
      }

      await performanceMonitor.recordMetric(metric1)
      await performanceMonitor.recordMetric(metric2)

      const stats = await performanceMonitor.getStats()
      const ids = stats.recentMetrics.map(m => m.id)
      const uniqueIds = [...new Set(ids)]
      expect(uniqueIds).toHaveLength(ids.length)
    })

    it('should store metrics with correct timestamps', async () => {
      const beforeTime = Date.now()
      
      const metric = {
        name: 'timestamp_test',
        value: 100,
        unit: 'ms',
        category: PerformanceCategory.API_CALL,
      }

      await performanceMonitor.recordMetric(metric)

      const afterTime = Date.now()
      const stats = await performanceMonitor.getStats()
      const recordedMetric = stats.recentMetrics.find(m => m.name === 'timestamp_test')

      expect(recordedMetric?.timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(recordedMetric?.timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      await performanceMonitor.clearMetrics()

      const metrics = [
        {
          name: 'api_call_1',
          value: 100,
          unit: 'ms',
          category: PerformanceCategory.API_CALL,
        },
        {
          name: 'api_call_2',
          value: 200,
          unit: 'ms',
          category: PerformanceCategory.API_CALL,
        },
        {
          name: 'memory_usage',
          value: 50000000,
          unit: 'bytes',
          category: PerformanceCategory.MEMORY,
        },
      ]

      for (const metric of metrics) {
        await performanceMonitor.recordMetric(metric)
      }

      const stats = await performanceMonitor.getStats()

      expect(stats.totalMetrics).toBe(3)
      expect(stats.categories[PerformanceCategory.API_CALL]).toBe(2)
      expect(stats.categories[PerformanceCategory.MEMORY]).toBe(1)
      expect(stats.averageValues.api_call_1).toBe(100)
      expect(stats.averageValues.api_call_2).toBe(200)
      expect(stats.averageValues.memory_usage).toBe(50000000)
    })

    it('should calculate averages correctly for multiple values', async () => {
      await performanceMonitor.clearMetrics()

      const metrics = [
        {
          name: 'repeated_metric',
          value: 100,
          unit: 'ms',
          category: PerformanceCategory.API_CALL,
        },
        {
          name: 'repeated_metric',
          value: 200,
          unit: 'ms',
          category: PerformanceCategory.API_CALL,
        },
        {
          name: 'repeated_metric',
          value: 300,
          unit: 'ms',
          category: PerformanceCategory.API_CALL,
        },
      ]

      for (const metric of metrics) {
        await performanceMonitor.recordMetric(metric)
      }

      const stats = await performanceMonitor.getStats()
      expect(stats.averageValues.repeated_metric).toBe(200) // (100 + 200 + 300) / 3
    })

    it('should limit recent metrics to 50 items', async () => {
      await performanceMonitor.clearMetrics()

      // Record more than 50 metrics
      for (let i = 0; i < 60; i++) {
        await performanceMonitor.recordMetric({
          name: `metric_${i}`,
          value: i,
          unit: 'ms',
          category: PerformanceCategory.API_CALL,
        })
      }

      const stats = await performanceMonitor.getStats()
      expect(stats.recentMetrics).toHaveLength(50)
    })
  })

  describe('measureUserAction', () => {
    it('should measure synchronous action duration', () => {
      const actionSpy = vi.fn()
      
      performanceMonitor.measureUserAction('test_action', actionSpy)
      
      expect(actionSpy).toHaveBeenCalled()
      expect(performance.mark).toHaveBeenCalledWith('test_action-start')
      expect(performance.mark).toHaveBeenCalledWith('test_action-end')
      expect(performance.measure).toHaveBeenCalledWith('test_action-duration', 'test_action-start', 'test_action-end')
    })

    it('should measure asynchronous action duration', async () => {
      const asyncAction = vi.fn(() => Promise.resolve())
      
      performanceMonitor.measureUserAction('async_test_action', asyncAction)
      
      await vi.runAllTimersAsync()
      
      expect(asyncAction).toHaveBeenCalled()
      expect(performance.mark).toHaveBeenCalledWith('async_test_action-start')
      expect(performance.mark).toHaveBeenCalledWith('async_test_action-end')
    })

    it('should handle errors in measured actions', () => {
      const errorAction = vi.fn(() => {
        throw new Error('Test error')
      })
      
      expect(() => {
        performanceMonitor.measureUserAction('error_action', errorAction)
      }).toThrow('Test error')
      
      expect(performance.mark).toHaveBeenCalledWith('error_action-start')
      expect(performance.mark).toHaveBeenCalledWith('error_action-end')
    })
  })

  describe('clearMetrics', () => {
    it('should clear all metrics', async () => {
      const metric = {
        name: 'test_metric',
        value: 100,
        unit: 'ms',
        category: PerformanceCategory.API_CALL,
      }

      await performanceMonitor.recordMetric(metric)
      
      let stats = await performanceMonitor.getStats()
      expect(stats.totalMetrics).toBeGreaterThan(0)

      await performanceMonitor.clearMetrics()
      
      stats = await performanceMonitor.getStats()
      expect(stats.totalMetrics).toBe(0)
    })
  })

  describe('threshold management', () => {
    it('should return default thresholds', () => {
      const thresholds = performanceMonitor.getThresholds()
      
      expect(thresholds).toHaveLength(4)
      expect(thresholds).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'api_response_time' }),
          expect.objectContaining({ name: 'memory_usage' }),
          expect.objectContaining({ name: 'render_time' }),
          expect.objectContaining({ name: 'bundle_size' }),
        ])
      )
    })

    it('should update existing threshold', () => {
      performanceMonitor.updateThreshold('api_response_time', { threshold: 10000 })
      
      const thresholds = performanceMonitor.getThresholds()
      const apiThreshold = thresholds.find(t => t.name === 'api_response_time')
      
      expect(apiThreshold?.threshold).toBe(10000)
    })

    it('should add new threshold', () => {
      const newThreshold = {
        name: 'custom_metric',
        threshold: 1000,
        operator: 'gt' as const,
        enabled: true,
        category: PerformanceCategory.USER_ACTION,
      }

      performanceMonitor.addThreshold(newThreshold)
      
      const thresholds = performanceMonitor.getThresholds()
      expect(thresholds).toContainEqual(newThreshold)
    })

    it('should remove threshold', () => {
      performanceMonitor.removeThreshold('api_response_time')
      
      const thresholds = performanceMonitor.getThresholds()
      expect(thresholds.find(t => t.name === 'api_response_time')).toBeUndefined()
    })
  })

  describe('fetch monitoring', () => {
    it('should monitor fetch requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      }
      
      global.fetch = vi.fn(() => Promise.resolve(mockResponse as any))
      
      await fetch('/api/test')
      
      const stats = await performanceMonitor.getStats()
      const apiMetric = stats.recentMetrics.find(m => m.name === 'api_response_time')
      
      expect(apiMetric).toBeDefined()
      expect(apiMetric?.category).toBe(PerformanceCategory.API_CALL)
      expect(apiMetric?.tags?.url).toBe('/api/test')
    })

    it('should monitor fetch errors', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
      
      try {
        await fetch('/api/error')
      } catch (error) {
        // Expected to fail
      }
      
      const stats = await performanceMonitor.getStats()
      const errorMetric = stats.recentMetrics.find(m => m.name === 'api_error')
      
      expect(errorMetric).toBeDefined()
      expect(errorMetric?.tags?.error).toBe('true')
    })
  })

  describe('memory monitoring', () => {
    it('should record memory metrics', async () => {
      // Mock performance.memory
      const mockMemory = {
        usedJSHeapSize: 50000000,
        totalJSHeapSize: 100000000,
        jsHeapSizeLimit: 200000000,
      }
      
      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        writable: true,
      })
      
      // Trigger memory monitoring
      vi.advanceTimersByTime(30000)
      
      const stats = await performanceMonitor.getStats()
      const memoryMetrics = stats.recentMetrics.filter(m => m.category === PerformanceCategory.MEMORY)
      
      expect(memoryMetrics.length).toBeGreaterThan(0)
      expect(memoryMetrics.find(m => m.name === 'memory_used')).toBeDefined()
      expect(memoryMetrics.find(m => m.name === 'memory_total')).toBeDefined()
      expect(memoryMetrics.find(m => m.name === 'memory_limit')).toBeDefined()
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

      const metric = {
        name: 'test_metric',
        value: 100,
        unit: 'ms',
        category: PerformanceCategory.API_CALL,
      }

      // Should not throw even if IndexedDB fails
      await expect(performanceMonitor.recordMetric(metric)).resolves.not.toThrow()
      
      // Restore IndexedDB
      global.indexedDB = originalIndexedDB
    })

    it('should handle PerformanceObserver errors', () => {
      // Mock PerformanceObserver to throw
      const originalPerformanceObserver = global.PerformanceObserver
      global.PerformanceObserver = vi.fn().mockImplementation(() => {
        throw new Error('PerformanceObserver not supported')
      }) as any

      // Should not throw when starting monitoring
      expect(() => {
        performanceMonitor.stopMonitoring()
        // Re-start monitoring to trigger observer creation
        new (performanceMonitor.constructor as any)()
      }).not.toThrow()
      
      // Restore PerformanceObserver
      global.PerformanceObserver = originalPerformanceObserver
    })
  })
})