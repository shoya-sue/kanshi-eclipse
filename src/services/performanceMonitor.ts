export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: number
  category: PerformanceCategory
  tags?: Record<string, string>
}

export enum PerformanceCategory {
  NETWORK = 'network',
  RENDERING = 'rendering',
  MEMORY = 'memory',
  STORAGE = 'storage',
  USER_ACTION = 'user_action',
  API_CALL = 'api_call',
  BLOCKCHAIN = 'blockchain',
  WALLET = 'wallet'
}

export interface PerformanceStats {
  totalMetrics: number
  averageValues: Record<string, number>
  categories: Record<PerformanceCategory, number>
  recentMetrics: PerformanceMetric[]
  trends: Array<{
    name: string
    trend: 'up' | 'down' | 'stable'
    change: number
  }>
}

export interface PerformanceThreshold {
  name: string
  threshold: number
  operator: 'gt' | 'lt' | 'eq'
  enabled: boolean
  category: PerformanceCategory
}

class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = []
  private thresholds: PerformanceThreshold[] = []
  private observers: PerformanceObserver[] = []
  private maxMetrics = 10000
  private isMonitoring = false
  private dbName = 'PerformanceMetrics'
  private storeName = 'metrics'
  private db: IDBDatabase | null = null

  constructor() {
    this.initDB()
    this.setupDefaultThresholds()
    this.startMonitoring()
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
          store.createIndex('name', 'name')
        }
      }
    })
  }

  private setupDefaultThresholds(): void {
    this.thresholds = [
      {
        name: 'api_response_time',
        threshold: 5000,
        operator: 'gt',
        enabled: true,
        category: PerformanceCategory.API_CALL
      },
      {
        name: 'memory_usage',
        threshold: 100 * 1024 * 1024, // 100MB
        operator: 'gt',
        enabled: true,
        category: PerformanceCategory.MEMORY
      },
      {
        name: 'render_time',
        threshold: 16.67, // 60fps
        operator: 'gt',
        enabled: true,
        category: PerformanceCategory.RENDERING
      },
      {
        name: 'bundle_size',
        threshold: 5 * 1024 * 1024, // 5MB
        operator: 'gt',
        enabled: true,
        category: PerformanceCategory.NETWORK
      }
    ]
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    
    // Monitor API calls
    this.monitorFetch()
    
    // Monitor memory usage
    this.monitorMemory()
    
    // Monitor navigation timing
    this.monitorNavigation()
    
    // Monitor resource timing
    this.monitorResources()
    
    // Monitor user timing
    this.monitorUserTiming()
    
    // Monitor long tasks
    this.monitorLongTasks()
    
    // Monitor layout shifts
    this.monitorLayoutShifts()
    
    // Monitor first paint
    this.monitorPaintTiming()
  }

  private monitorFetch(): void {
    const originalFetch = window.fetch
    
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const url = args[0] instanceof Request ? args[0].url : args[0]
      
      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - startTime
        
        this.recordMetric({
          name: 'api_response_time',
          value: duration,
          unit: 'ms',
          category: PerformanceCategory.API_CALL,
          tags: {
            url: url.toString(),
            status: response.status.toString(),
            method: args[1]?.method || 'GET'
          }
        })
        
        return response
      } catch (error) {
        const duration = performance.now() - startTime
        
        this.recordMetric({
          name: 'api_error',
          value: duration,
          unit: 'ms',
          category: PerformanceCategory.API_CALL,
          tags: {
            url: url.toString(),
            error: 'true',
            method: args[1]?.method || 'GET'
          }
        })
        
        throw error
      }
    }
  }

  private monitorMemory(): void {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        
        this.recordMetric({
          name: 'memory_used',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          category: PerformanceCategory.MEMORY
        })
        
        this.recordMetric({
          name: 'memory_total',
          value: memory.totalJSHeapSize,
          unit: 'bytes',
          category: PerformanceCategory.MEMORY
        })
        
        this.recordMetric({
          name: 'memory_limit',
          value: memory.jsHeapSizeLimit,
          unit: 'bytes',
          category: PerformanceCategory.MEMORY
        })
      }
    }
    
    checkMemory()
    setInterval(checkMemory, 30000) // Check every 30 seconds
  }

  private monitorNavigation(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigation) {
      this.recordMetric({
        name: 'page_load_time',
        value: navigation.loadEventEnd - navigation.navigationStart,
        unit: 'ms',
        category: PerformanceCategory.NETWORK
      })
      
      this.recordMetric({
        name: 'dom_ready_time',
        value: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        unit: 'ms',
        category: PerformanceCategory.RENDERING
      })
      
      this.recordMetric({
        name: 'first_byte_time',
        value: navigation.responseStart - navigation.navigationStart,
        unit: 'ms',
        category: PerformanceCategory.NETWORK
      })
    }
  }

  private monitorResources(): void {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming
          
          this.recordMetric({
            name: 'resource_load_time',
            value: resource.duration,
            unit: 'ms',
            category: PerformanceCategory.NETWORK,
            tags: {
              resource: resource.name,
              type: resource.initiatorType
            }
          })
          
          if (resource.transferSize) {
            this.recordMetric({
              name: 'resource_size',
              value: resource.transferSize,
              unit: 'bytes',
              category: PerformanceCategory.NETWORK,
              tags: {
                resource: resource.name,
                type: resource.initiatorType
              }
            })
          }
        }
      })
    })
    
    observer.observe({ entryTypes: ['resource'] })
    this.observers.push(observer)
  }

  private monitorUserTiming(): void {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure') {
          this.recordMetric({
            name: entry.name,
            value: entry.duration,
            unit: 'ms',
            category: PerformanceCategory.USER_ACTION
          })
        }
      })
    })
    
    observer.observe({ entryTypes: ['measure'] })
    this.observers.push(observer)
  }

  private monitorLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric({
            name: 'long_task',
            value: entry.duration,
            unit: 'ms',
            category: PerformanceCategory.RENDERING
          })
        })
      })
      
      try {
        observer.observe({ entryTypes: ['longtask'] })
        this.observers.push(observer)
      } catch (error) {
        console.warn('Long task monitoring not supported')
      }
    }
  }

  private monitorLayoutShifts(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'layout-shift') {
            this.recordMetric({
              name: 'layout_shift',
              value: (entry as any).value,
              unit: 'score',
              category: PerformanceCategory.RENDERING
            })
          }
        })
      })
      
      try {
        observer.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(observer)
      } catch (error) {
        console.warn('Layout shift monitoring not supported')
      }
    }
  }

  private monitorPaintTiming(): void {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'paint') {
          this.recordMetric({
            name: entry.name,
            value: entry.startTime,
            unit: 'ms',
            category: PerformanceCategory.RENDERING
          })
        }
      })
    })
    
    observer.observe({ entryTypes: ['paint'] })
    this.observers.push(observer)
  }

  async recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<void> {
    const fullMetric: PerformanceMetric = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...metric
    }
    
    this.metrics.push(fullMetric)
    
    // Store in IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        await store.add(fullMetric)
      } catch (error) {
        console.error('Failed to store performance metric:', error)
      }
    }
    
    // Check thresholds
    this.checkThresholds(fullMetric)
    
    // Cleanup old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.find(t => 
      t.name === metric.name && t.enabled && t.category === metric.category
    )
    
    if (threshold) {
      let exceeded = false
      
      switch (threshold.operator) {
        case 'gt':
          exceeded = metric.value > threshold.threshold
          break
        case 'lt':
          exceeded = metric.value < threshold.threshold
          break
        case 'eq':
          exceeded = metric.value === threshold.threshold
          break
      }
      
      if (exceeded) {
        console.warn(`Performance threshold exceeded: ${metric.name} = ${metric.value}${metric.unit} (threshold: ${threshold.threshold}${metric.unit})`)
        
        // You could emit an event or notification here
        window.dispatchEvent(new CustomEvent('performance-threshold-exceeded', {
          detail: { metric, threshold }
        }))
      }
    }
  }

  async getStats(): Promise<PerformanceStats> {
    const allMetrics = await this.getAllMetrics()
    
    const averageValues: Record<string, number> = {}
    const categories: Record<PerformanceCategory, number> = {
      [PerformanceCategory.NETWORK]: 0,
      [PerformanceCategory.RENDERING]: 0,
      [PerformanceCategory.MEMORY]: 0,
      [PerformanceCategory.STORAGE]: 0,
      [PerformanceCategory.USER_ACTION]: 0,
      [PerformanceCategory.API_CALL]: 0,
      [PerformanceCategory.BLOCKCHAIN]: 0,
      [PerformanceCategory.WALLET]: 0
    }
    
    // Calculate averages and categories
    const metricGroups: Record<string, number[]> = {}
    
    allMetrics.forEach(metric => {
      if (!metricGroups[metric.name]) {
        metricGroups[metric.name] = []
      }
      metricGroups[metric.name].push(metric.value)
      categories[metric.category]++
    })
    
    Object.entries(metricGroups).forEach(([name, values]) => {
      averageValues[name] = values.reduce((sum, val) => sum + val, 0) / values.length
    })
    
    // Calculate trends (simple comparison with previous period)
    const trends = this.calculateTrends(allMetrics)
    
    return {
      totalMetrics: allMetrics.length,
      averageValues,
      categories,
      recentMetrics: allMetrics.slice(-50),
      trends
    }
  }

  private calculateTrends(metrics: PerformanceMetric[]): Array<{
    name: string
    trend: 'up' | 'down' | 'stable'
    change: number
  }> {
    const now = Date.now()
    const oneHourAgo = now - 3600000
    const twoHoursAgo = now - 7200000
    
    const recent = metrics.filter(m => m.timestamp > oneHourAgo)
    const previous = metrics.filter(m => m.timestamp > twoHoursAgo && m.timestamp <= oneHourAgo)
    
    const trends: Array<{
      name: string
      trend: 'up' | 'down' | 'stable'
      change: number
    }> = []
    
    const recentAverages: Record<string, number> = {}
    const previousAverages: Record<string, number> = {}
    
    // Calculate recent averages
    recent.forEach(metric => {
      if (!recentAverages[metric.name]) {
        recentAverages[metric.name] = 0
      }
      recentAverages[metric.name] += metric.value
    })
    
    // Calculate previous averages
    previous.forEach(metric => {
      if (!previousAverages[metric.name]) {
        previousAverages[metric.name] = 0
      }
      previousAverages[metric.name] += metric.value
    })
    
    // Calculate trends
    Object.keys(recentAverages).forEach(name => {
      const recentCount = recent.filter(m => m.name === name).length
      const previousCount = previous.filter(m => m.name === name).length
      
      if (recentCount > 0 && previousCount > 0) {
        const recentAvg = recentAverages[name] / recentCount
        const previousAvg = previousAverages[name] / previousCount
        const change = ((recentAvg - previousAvg) / previousAvg) * 100
        
        let trend: 'up' | 'down' | 'stable' = 'stable'
        if (Math.abs(change) > 5) {
          trend = change > 0 ? 'up' : 'down'
        }
        
        trends.push({ name, trend, change })
      }
    })
    
    return trends
  }

  private async getAllMetrics(): Promise<PerformanceMetric[]> {
    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.getAll()
        
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => resolve(this.metrics)
      })
    }
    
    return this.metrics
  }

  measureUserAction(name: string, action: () => void | Promise<void>): void {
    const startMark = `${name}-start`
    const endMark = `${name}-end`
    const measureName = `${name}-duration`
    
    performance.mark(startMark)
    
    const finish = () => {
      performance.mark(endMark)
      performance.measure(measureName, startMark, endMark)
      
      performance.clearMarks(startMark)
      performance.clearMarks(endMark)
      performance.clearMeasures(measureName)
    }
    
    if (action instanceof Promise) {
      action.then(finish).catch(finish)
    } else {
      try {
        action()
        finish()
      } catch (error) {
        finish()
        throw error
      }
    }
  }

  async clearMetrics(): Promise<void> {
    this.metrics = []
    
    if (this.db) {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      await store.clear()
    }
  }

  stopMonitoring(): void {
    this.isMonitoring = false
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }

  getThresholds(): PerformanceThreshold[] {
    return [...this.thresholds]
  }

  updateThreshold(name: string, threshold: Partial<PerformanceThreshold>): void {
    const index = this.thresholds.findIndex(t => t.name === name)
    if (index !== -1) {
      this.thresholds[index] = { ...this.thresholds[index], ...threshold }
    }
  }

  addThreshold(threshold: PerformanceThreshold): void {
    this.thresholds.push(threshold)
  }

  removeThreshold(name: string): void {
    this.thresholds = this.thresholds.filter(t => t.name !== name)
  }
}

export const performanceMonitor = new PerformanceMonitorService()