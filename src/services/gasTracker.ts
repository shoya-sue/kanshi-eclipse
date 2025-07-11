import { eclipseRPCService } from './eclipseRPC'
import { GasFeeData, GasFeeStats } from '../types/eclipse'
import { errorLogger } from './errorLogger'
import { toastService } from './toastService'
import { withNetworkRetry } from '../utils/retry'

export class GasTrackerService {
  private gasFeeHistory: GasFeeData[] = []
  private updateInterval: NodeJS.Timeout | null = null

  constructor() {
    this.loadHistoryFromStorage()
  }

  private saveHistoryToStorage() {
    try {
      localStorage.setItem('gasFeeHistory', JSON.stringify(this.gasFeeHistory))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to save gas fee history: ${errorMessage}`), {
        category: 'GAS_TRACKER',
        context: { method: 'saveHistoryToStorage', historyLength: this.gasFeeHistory.length },
        severity: 'low'
      })
    }
  }

  private loadHistoryFromStorage() {
    try {
      const stored = localStorage.getItem('gasFeeHistory')
      if (stored) {
        this.gasFeeHistory = JSON.parse(stored)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to load gas fee history: ${errorMessage}`), {
        category: 'GAS_TRACKER',
        context: { method: 'loadHistoryFromStorage' },
        severity: 'low'
      })
    }
  }

  async getCurrentGasFees(): Promise<GasFeeData[]> {
    try {
      return await withNetworkRetry(async () => {
        const performanceSamples = await eclipseRPCService.getRecentPerformanceSamples(20)
        
        const gasFees: GasFeeData[] = performanceSamples.map((sample, index) => ({
          timestamp: Date.now() - (index * 60000), // Approximate timestamps
          fee: sample.numTransactions > 0 ? Math.floor(sample.numTransactions / 10) : 5000,
          feeType: 'transfer' as const,
          priority: this.determinePriority(sample.numTransactions),
        }))

        return gasFees
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get current gas fees: ${errorMessage}`), {
        category: 'GAS_TRACKER',
        context: { method: 'getCurrentGasFees' },
        severity: 'medium'
      })
      toastService.showInfo('Using estimated gas fees due to network issues')
      return this.generateMockGasFees()
    }
  }

  private determinePriority(transactionCount: number): 'low' | 'medium' | 'high' {
    if (transactionCount < 100) return 'low'
    if (transactionCount < 500) return 'medium'
    return 'high'
  }

  private generateMockGasFees(): GasFeeData[] {
    const now = Date.now()
    const fees: GasFeeData[] = []
    
    for (let i = 0; i < 20; i++) {
      const timestamp = now - (i * 60000)
      const baseFee = 5000 + Math.random() * 10000
      
      fees.push({
        timestamp,
        fee: Math.floor(baseFee),
        feeType: 'transfer',
        priority: baseFee > 10000 ? 'high' : baseFee > 7000 ? 'medium' : 'low',
      })
    }
    
    return fees.reverse()
  }

  async updateGasFeeHistory(): Promise<void> {
    try {
      const currentFees = await this.getCurrentGasFees()
      
      // Add new fees to history
      this.gasFeeHistory.push(...currentFees)
      
      // Keep only last 24 hours of data
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000)
      this.gasFeeHistory = this.gasFeeHistory.filter(fee => fee.timestamp > cutoffTime)
      
      this.saveHistoryToStorage()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to update gas fee history: ${errorMessage}`), {
        category: 'GAS_TRACKER',
        context: { method: 'updateGasFeeHistory', historyLength: this.gasFeeHistory.length },
        severity: 'medium'
      })
    }
  }

  getGasFeeStats(): GasFeeStats {
    try {
      if (this.gasFeeHistory.length === 0) {
        return {
          current: 5000,
          average24h: 5000,
          average7d: 5000,
          min24h: 5000,
          max24h: 5000,
          recommended: {
            low: 5000,
            medium: 7500,
            high: 10000,
          },
        }
      }

      const now = Date.now()
      const last24h = this.gasFeeHistory.filter(fee => fee.timestamp > now - 24 * 60 * 60 * 1000)
      const last7d = this.gasFeeHistory.filter(fee => fee.timestamp > now - 7 * 24 * 60 * 60 * 1000)
      
      const current = this.gasFeeHistory[this.gasFeeHistory.length - 1]?.fee || 5000
      const fees24h = last24h.map(fee => fee.fee)
      const fees7d = last7d.map(fee => fee.fee)
      
      const average24h = fees24h.length > 0 ? fees24h.reduce((a, b) => a + b, 0) / fees24h.length : 5000
      const average7d = fees7d.length > 0 ? fees7d.reduce((a, b) => a + b, 0) / fees7d.length : 5000
      const min24h = fees24h.length > 0 ? Math.min(...fees24h) : 5000
      const max24h = fees24h.length > 0 ? Math.max(...fees24h) : 5000

      return {
        current,
        average24h,
        average7d,
        min24h,
        max24h,
        recommended: {
          low: Math.floor(average24h * 0.8),
          medium: Math.floor(average24h * 1.2),
          high: Math.floor(average24h * 1.5),
        },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get gas fee stats: ${errorMessage}`), {
        category: 'GAS_TRACKER',
        context: { method: 'getGasFeeStats', historyLength: this.gasFeeHistory.length },
        severity: 'medium'
      })
      // Return default stats on error
      return {
        current: 5000,
        average24h: 5000,
        average7d: 5000,
        min24h: 5000,
        max24h: 5000,
        recommended: {
          low: 5000,
          medium: 7500,
          high: 10000,
        },
      }
    }
  }

  getHistoricalData(timeRange: '24h' | '7d' | '30d'): GasFeeData[] {
    try {
      const now = Date.now()
      let cutoffTime: number
      
      switch (timeRange) {
        case '24h':
          cutoffTime = now - 24 * 60 * 60 * 1000
          break
        case '7d':
          cutoffTime = now - 7 * 24 * 60 * 60 * 1000
          break
        case '30d':
          cutoffTime = now - 30 * 24 * 60 * 60 * 1000
          break
      }
      
      return this.gasFeeHistory.filter(fee => fee.timestamp > cutoffTime)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get historical data: ${errorMessage}`), {
        category: 'GAS_TRACKER',
        context: { method: 'getHistoricalData', timeRange, historyLength: this.gasFeeHistory.length },
        severity: 'medium'
      })
      return []
    }
  }

  startAutoUpdate(interval: number = 15000): void {
    try {
      this.stopAutoUpdate()
      
      this.updateInterval = setInterval(() => {
        this.updateGasFeeHistory()
      }, interval)
      
      // Initial update
      this.updateGasFeeHistory()
      
      errorLogger.logInfo('Gas fee auto-update started', {
        context: { interval }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to start auto-update: ${errorMessage}`), {
        category: 'GAS_TRACKER',
        context: { method: 'startAutoUpdate', interval },
        severity: 'medium'
      })
      toastService.showError('Failed to start gas fee tracking')
    }
  }

  stopAutoUpdate(): void {
    try {
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
        this.updateInterval = null
        errorLogger.logInfo('Gas fee auto-update stopped', {
          context: { method: 'stopAutoUpdate' }
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to stop auto-update: ${errorMessage}`), {
        category: 'GAS_TRACKER',
        context: { method: 'stopAutoUpdate' },
        severity: 'low'
      })
    }
  }

  async estimateTransactionFee(
    feeType: 'transfer' | 'swap' | 'nft' | 'program' = 'transfer'
  ): Promise<number> {
    try {
      const stats = this.getGasFeeStats()
      const multiplier = {
        transfer: 1,
        swap: 1.5,
        nft: 2,
        program: 3,
      }[feeType]
      
      return Math.floor(stats.current * multiplier)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to estimate transaction fee: ${errorMessage}`), {
        category: 'GAS_TRACKER',
        context: { method: 'estimateTransactionFee', feeType },
        severity: 'medium'
      })
      toastService.showError('Failed to estimate transaction fee')
      return 5000
    }
  }
}

export const gasTrackerService = new GasTrackerService()