export interface AnalyticsDataPayload {
  address?: string
  value?: number
  amount?: number
  [key: string]: unknown
}

export interface AnalyticsData {
  id: string
  timestamp: number
  type: AnalyticsType
  category: AnalyticsCategory
  data: AnalyticsDataPayload
  metadata?: Record<string, unknown>
}

export enum AnalyticsType {
  TRANSACTION = 'transaction',
  GAS_FEE = 'gas_fee',
  WALLET_ACTIVITY = 'wallet_activity',
  DEX_TRADE = 'dex_trade',
  RPC_CALL = 'rpc_call',
  USER_ACTION = 'user_action',
  PERFORMANCE = 'performance',
  ERROR = 'error'
}

export enum AnalyticsCategory {
  NETWORK = 'network',
  BLOCKCHAIN = 'blockchain',
  USER = 'user',
  SYSTEM = 'system',
  FINANCIAL = 'financial',
  TECHNICAL = 'technical'
}

export interface AnalyticsQuery {
  type?: AnalyticsType
  category?: AnalyticsCategory
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
  aggregation?: AggregationType
  groupBy?: string[]
  filters?: Record<string, unknown>
}

export enum AggregationType {
  COUNT = 'count',
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  MEDIAN = 'median',
  PERCENTILE = 'percentile'
}

export interface AnalyticsReport {
  id: string
  title: string
  description: string
  type: ReportType
  query: AnalyticsQuery
  data: AnalyticsData[]
  charts: ChartConfig[]
  createdAt: Date
  updatedAt: Date
}

export enum ReportType {
  TRANSACTION_ANALYSIS = 'transaction_analysis',
  GAS_FEE_TRENDS = 'gas_fee_trends',
  WALLET_PERFORMANCE = 'wallet_performance',
  DEX_VOLUME = 'dex_volume',
  RPC_HEALTH = 'rpc_health',
  USER_BEHAVIOR = 'user_behavior',
  SYSTEM_METRICS = 'system_metrics',
  FINANCIAL_SUMMARY = 'financial_summary'
}

export interface ChartConfig {
  id: string
  type: ChartType
  title: string
  xAxis: string
  yAxis: string
  series: ChartSeries[]
  options?: Record<string, unknown>
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  AREA = 'area',
  PIE = 'pie',
  SCATTER = 'scatter',
  HISTOGRAM = 'histogram',
  HEATMAP = 'heatmap',
  CANDLESTICK = 'candlestick'
}

export interface ChartDataPoint {
  x: string | number | Date | null
  y: string | number | Date | null
}

export interface ChartSeries {
  name: string
  data: ChartDataPoint[]
  color?: string
  type?: ChartType
}

export interface AnalyticsStats {
  totalRecords: number
  dateRange: {
    start: Date
    end: Date
  }
  categories: Record<AnalyticsCategory, number>
  types: Record<AnalyticsType, number>
  trends: Array<{
    date: Date
    count: number
    value: number
  }>
  topEntities: Array<{
    entity: string
    count: number
    percentage: number
  }>
}

class AnalyticsService {
  private dbName = 'AnalyticsData'
  private storeName = 'analytics'
  private reportsStoreName = 'reports'
  private db: IDBDatabase | null = null
  private maxRecords = 50000

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
        
        // Analytics data store
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp')
          store.createIndex('type', 'type')
          store.createIndex('category', 'category')
          store.createIndex('type_category', ['type', 'category'])
        }
        
        // Reports store
        if (!db.objectStoreNames.contains(this.reportsStoreName)) {
          const reportsStore = db.createObjectStore(this.reportsStoreName, { keyPath: 'id' })
          reportsStore.createIndex('type', 'type')
          reportsStore.createIndex('createdAt', 'createdAt')
        }
      }
    })
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  async track(
    type: AnalyticsType,
    category: AnalyticsCategory,
    data: AnalyticsDataPayload,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.initDB()
      
      const record: AnalyticsData = {
        id: this.generateId(),
        timestamp: Date.now(),
        type,
        category,
        data,
        metadata
      }

      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        await store.add(record)
      }

      await this.cleanup()
    } catch (error) {
      console.error('Failed to track analytics:', error)
    }
  }

  async query(query: AnalyticsQuery): Promise<AnalyticsData[]> {
    try {
      await this.initDB()
      
      if (!this.db) {
        return []
      }

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      let request: IDBRequest<AnalyticsData[]>
      
      if (query.type && query.category) {
        const index = store.index('type_category')
        request = index.getAll([query.type, query.category])
      } else if (query.type) {
        const index = store.index('type')
        request = index.getAll(query.type)
      } else if (query.category) {
        const index = store.index('category')
        request = index.getAll(query.category)
      } else {
        request = store.getAll()
      }

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          let results = request.result
          
          // Apply date filters
          if (query.startDate || query.endDate) {
            results = results.filter(item => {
              const itemDate = new Date(item.timestamp)
              if (query.startDate && itemDate < query.startDate) return false
              if (query.endDate && itemDate > query.endDate) return false
              return true
            })
          }
          
          // Apply custom filters
          if (query.filters) {
            results = results.filter(item => {
              return Object.entries(query.filters!).every(([key, value]) => {
                return this.matchFilter(item, key, value)
              })
            })
          }
          
          // Apply sorting
          results.sort((a, b) => b.timestamp - a.timestamp)
          
          // Apply pagination
          const offset = query.offset || 0
          const limit = query.limit || 100
          results = results.slice(offset, offset + limit)
          
          resolve(results)
        }
        
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to query analytics:', error)
      return []
    }
  }

  private matchFilter(item: AnalyticsData, key: string, value: unknown): boolean {
    const keys = key.split('.')
    let current: unknown = item
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = (current as Record<string, unknown>)[k]
      } else {
        return false
      }
    }
    
    if (Array.isArray(value)) {
      return value.includes(current)
    }
    
    return current === value
  }

  async getStats(query: AnalyticsQuery = {}): Promise<AnalyticsStats> {
    try {
      const data = await this.query({ ...query, limit: 10000 })
      
      if (data.length === 0) {
        return this.getEmptyStats()
      }
      
      const categories: Record<AnalyticsCategory, number> = {
        [AnalyticsCategory.NETWORK]: 0,
        [AnalyticsCategory.BLOCKCHAIN]: 0,
        [AnalyticsCategory.USER]: 0,
        [AnalyticsCategory.SYSTEM]: 0,
        [AnalyticsCategory.FINANCIAL]: 0,
        [AnalyticsCategory.TECHNICAL]: 0
      }
      
      const types: Record<AnalyticsType, number> = {
        [AnalyticsType.TRANSACTION]: 0,
        [AnalyticsType.GAS_FEE]: 0,
        [AnalyticsType.WALLET_ACTIVITY]: 0,
        [AnalyticsType.DEX_TRADE]: 0,
        [AnalyticsType.RPC_CALL]: 0,
        [AnalyticsType.USER_ACTION]: 0,
        [AnalyticsType.PERFORMANCE]: 0,
        [AnalyticsType.ERROR]: 0
      }
      
      const entityCounts: Record<string, number> = {}
      
      data.forEach(item => {
        categories[item.category]++
        types[item.type]++
        
        // Count entities (addresses, tokens, etc.)
        if (item.data.address) {
          entityCounts[item.data.address] = (entityCounts[item.data.address] || 0) + 1
        }
      })
      
      const sortedData = data.sort((a, b) => a.timestamp - b.timestamp)
      const startDate = new Date(sortedData[0]?.timestamp || Date.now())
      const endDate = new Date(sortedData[sortedData.length - 1]?.timestamp || Date.now())
      
      // Generate trends (daily aggregation)
      const trends = this.generateTrends(data)
      
      // Get top entities
      const topEntities = Object.entries(entityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([entity, count]) => ({
          entity,
          count,
          percentage: (count / data.length) * 100
        }))
      
      return {
        totalRecords: data.length,
        dateRange: { start: startDate, end: endDate },
        categories,
        types,
        trends,
        topEntities
      }
    } catch (error) {
      console.error('Failed to get analytics stats:', error)
      return this.getEmptyStats()
    }
  }

  private generateTrends(data: AnalyticsData[]): Array<{ date: Date; count: number; value: number }> {
    const dailyData: Record<string, { count: number; value: number }> = {}
    
    data.forEach(item => {
      const date = new Date(item.timestamp)
      const dateKey = date.toISOString().split('T')[0]
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { count: 0, value: 0 }
      }
      
      dailyData[dateKey].count++
      
      // Extract numeric value if available
      if (typeof item.data.value === 'number') {
        dailyData[dateKey].value += item.data.value
      } else if (typeof item.data.amount === 'number') {
        dailyData[dateKey].value += item.data.amount
      }
    })
    
    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: new Date(date),
        count: data.count,
        value: data.value
      }))
  }

  private getEmptyStats(): AnalyticsStats {
    return {
      totalRecords: 0,
      dateRange: { start: new Date(), end: new Date() },
      categories: {
        [AnalyticsCategory.NETWORK]: 0,
        [AnalyticsCategory.BLOCKCHAIN]: 0,
        [AnalyticsCategory.USER]: 0,
        [AnalyticsCategory.SYSTEM]: 0,
        [AnalyticsCategory.FINANCIAL]: 0,
        [AnalyticsCategory.TECHNICAL]: 0
      },
      types: {
        [AnalyticsType.TRANSACTION]: 0,
        [AnalyticsType.GAS_FEE]: 0,
        [AnalyticsType.WALLET_ACTIVITY]: 0,
        [AnalyticsType.DEX_TRADE]: 0,
        [AnalyticsType.RPC_CALL]: 0,
        [AnalyticsType.USER_ACTION]: 0,
        [AnalyticsType.PERFORMANCE]: 0,
        [AnalyticsType.ERROR]: 0
      },
      trends: [],
      topEntities: []
    }
  }

  async createReport(report: Omit<AnalyticsReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      await this.initDB()
      
      const reportData = await this.query(report.query)
      const charts = await this.generateCharts(reportData, report.charts)
      
      const newReport: AnalyticsReport = {
        id: this.generateId(),
        ...report,
        data: reportData,
        charts,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (this.db) {
        const transaction = this.db.transaction([this.reportsStoreName], 'readwrite')
        const store = transaction.objectStore(this.reportsStoreName)
        await store.add(newReport)
      }

      return newReport.id
    } catch (error) {
      console.error('Failed to create report:', error)
      throw error
    }
  }

  async getReports(): Promise<AnalyticsReport[]> {
    try {
      await this.initDB()
      
      if (!this.db) {
        return []
      }

      const transaction = this.db.transaction([this.reportsStoreName], 'readonly')
      const store = transaction.objectStore(this.reportsStoreName)
      const request = store.getAll()

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const reports = request.result
          reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          resolve(reports)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to get reports:', error)
      return []
    }
  }

  async getReport(id: string): Promise<AnalyticsReport | null> {
    try {
      await this.initDB()
      
      if (!this.db) {
        return null
      }

      const transaction = this.db.transaction([this.reportsStoreName], 'readonly')
      const store = transaction.objectStore(this.reportsStoreName)
      const request = store.get(id)

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to get report:', error)
      return null
    }
  }

  async deleteReport(id: string): Promise<void> {
    try {
      await this.initDB()
      
      if (this.db) {
        const transaction = this.db.transaction([this.reportsStoreName], 'readwrite')
        const store = transaction.objectStore(this.reportsStoreName)
        await store.delete(id)
      }
    } catch (error) {
      console.error('Failed to delete report:', error)
    }
  }

  private async generateCharts(data: AnalyticsData[], configs: ChartConfig[]): Promise<ChartConfig[]> {
    return configs.map(config => {
      const series = config.series.map(seriesConfig => {
        const seriesData = data.map(item => ({
          x: this.extractValue(item, config.xAxis),
          y: this.extractValue(item, config.yAxis)
        }))
        
        return {
          ...seriesConfig,
          data: seriesData
        }
      })
      
      return {
        ...config,
        series
      }
    })
  }

  private extractValue(item: AnalyticsData, path: string): string | number | Date | null {
    const keys = path.split('.')
    let current: unknown = item
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key]
      } else {
        return null
      }
    }
    
    return current as string | number | Date | null
  }

  private async cleanup(): Promise<void> {
    try {
      if (!this.db) return

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('timestamp')
      
      const request = index.getAll()
      request.onsuccess = () => {
        const records: AnalyticsData[] = request.result
        if (records.length > this.maxRecords) {
          const sortedRecords = records.sort((a, b) => b.timestamp - a.timestamp)
          const toDelete = sortedRecords.slice(this.maxRecords)
          
          toDelete.forEach(record => {
            store.delete(record.id)
          })
        }
      }
    } catch (error) {
      console.error('Failed to cleanup analytics data:', error)
    }
  }

  async clearData(): Promise<void> {
    try {
      await this.initDB()
      
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        await store.clear()
      }
    } catch (error) {
      console.error('Failed to clear analytics data:', error)
    }
  }

  async exportData(query: AnalyticsQuery = {}): Promise<string> {
    try {
      const data = await this.query(query)
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error('Failed to export analytics data:', error)
      return '[]'
    }
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData) as AnalyticsData[]
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format')
      }

      await this.initDB()
      
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        
        for (const item of data) {
          if (item.id && item.timestamp && item.type && item.category) {
            await store.add(item)
          }
        }
      }
    } catch (error) {
      console.error('Failed to import analytics data:', error)
      throw error
    }
  }
}

export const analyticsService = new AnalyticsService()