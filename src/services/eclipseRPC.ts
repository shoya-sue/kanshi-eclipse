import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { EclipseRPCConfig } from '../types/eclipse'
import { ECLIPSE_RPC_CONFIG } from '../utils/constants'
import { errorLogger } from './errorLogger'
import { toastService } from './toastService'
import { withBlockchainRetry, withNetworkRetry } from '../utils/retry'

export class EclipseRPCService {
  private connection: Connection
  private config: EclipseRPCConfig

  constructor(config?: Partial<EclipseRPCConfig>) {
    this.config = {
      url: config?.url || ECLIPSE_RPC_CONFIG.MAINNET.url,
      websocketUrl: config?.websocketUrl || ECLIPSE_RPC_CONFIG.MAINNET.websocketUrl,
      timeout: config?.timeout || ECLIPSE_RPC_CONFIG.TIMEOUT,
      retryCount: config?.retryCount || ECLIPSE_RPC_CONFIG.RETRY_COUNT,
    }

    this.connection = new Connection(this.config.url, {
      commitment: 'confirmed',
      wsEndpoint: this.config.websocketUrl,
    })
  }

  async getConnection(): Promise<Connection> {
    return this.connection
  }

  async getSlot(): Promise<number> {
    try {
      return await withBlockchainRetry(async () => {
        return await this.connection.getSlot()
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get slot: ${errorMessage}`), {
        category: 'RPC',
        context: { method: 'getSlot', endpoint: this.config.url },
        severity: 'medium'
      })
      toastService.showError('Failed to get current slot information')
      throw error
    }
  }

  async getBlockHeight(): Promise<number> {
    try {
      return await withBlockchainRetry(async () => {
        return await this.connection.getBlockHeight()
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get block height: ${errorMessage}`), {
        category: 'RPC',
        context: { method: 'getBlockHeight', endpoint: this.config.url },
        severity: 'medium'
      })
      toastService.showError('Failed to get current block height')
      throw error
    }
  }

  async getTransaction(signature: string) {
    try {
      return await withBlockchainRetry(async () => {
        return await this.connection.getTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        })
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get transaction: ${errorMessage}`), {
        category: 'RPC',
        context: { method: 'getTransaction', signature, endpoint: this.config.url },
        severity: 'medium'
      })
      toastService.showError('Failed to fetch transaction details')
      throw error
    }
  }

  async getAccountInfo(publicKey: PublicKey) {
    try {
      return await withBlockchainRetry(async () => {
        return await this.connection.getAccountInfo(publicKey)
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get account info: ${errorMessage}`), {
        category: 'RPC',
        context: { method: 'getAccountInfo', publicKey: publicKey.toString(), endpoint: this.config.url },
        severity: 'medium'
      })
      toastService.showError('Failed to fetch account information')
      throw error
    }
  }

  async getRecentPerformanceSamples(limit: number = 720) {
    try {
      return await withBlockchainRetry(async () => {
        return await this.connection.getRecentPerformanceSamples(limit)
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get performance samples: ${errorMessage}`), {
        category: 'RPC',
        context: { method: 'getRecentPerformanceSamples', limit, endpoint: this.config.url },
        severity: 'low'
      })
      toastService.showError('Failed to fetch performance data')
      throw error
    }
  }

  async getEpochInfo() {
    try {
      return await withBlockchainRetry(async () => {
        return await this.connection.getEpochInfo()
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get epoch info: ${errorMessage}`), {
        category: 'RPC',
        context: { method: 'getEpochInfo', endpoint: this.config.url },
        severity: 'medium'
      })
      toastService.showError('Failed to fetch epoch information')
      throw error
    }
  }

  async getVersion() {
    try {
      return await withBlockchainRetry(async () => {
        return await this.connection.getVersion()
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get version: ${errorMessage}`), {
        category: 'RPC',
        context: { method: 'getVersion', endpoint: this.config.url },
        severity: 'low'
      })
      toastService.showError('Failed to fetch version information')
      throw error
    }
  }

  async getHealth() {
    try {
      return await withNetworkRetry(async () => {
        const response = await fetch(`${this.config.url}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        return response.ok ? 'ok' : 'error'
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get health: ${errorMessage}`), {
        category: 'RPC',
        context: { method: 'getHealth', endpoint: this.config.url },
        severity: 'medium'
      })
      return 'error'
    }
  }

  async getMinimumLedgerSlot() {
    try {
      return await withBlockchainRetry(async () => {
        return await this.connection.getMinimumLedgerSlot()
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get minimum ledger slot: ${errorMessage}`), {
        category: 'RPC',
        context: { method: 'getMinimumLedgerSlot', endpoint: this.config.url },
        severity: 'medium'
      })
      toastService.showError('Failed to fetch minimum ledger slot')
      throw error
    }
  }

  async getSupply() {
    try {
      return await withBlockchainRetry(async () => {
        return await this.connection.getSupply()
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get supply: ${errorMessage}`), {
        category: 'RPC',
        context: { method: 'getSupply', endpoint: this.config.url },
        severity: 'medium'
      })
      toastService.showError('Failed to fetch supply information')
      throw error
    }
  }

  async estimateGasFee(transaction: Transaction | VersionedTransaction): Promise<number> {
    try {
      return await withBlockchainRetry(async () => {
        let message
        if (transaction instanceof Transaction) {
          message = transaction.compileMessage()
        } else {
          message = transaction.message
        }
        
        const feeCalculator = await this.connection.getFeeForMessage(message)
        return feeCalculator?.value || 0
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to estimate gas fee: ${errorMessage}`), {
        category: 'RPC',
        context: { method: 'estimateGasFee', endpoint: this.config.url },
        severity: 'medium'
      })
      toastService.showError('Failed to estimate transaction fee')
      throw error
    }
  }

  async checkRPCHealth(): Promise<{
    isHealthy: boolean
    responseTime: number
    blockHeight: number
    error?: string
  }> {
    const startTime = Date.now()
    
    try {
      const [health, blockHeight] = await Promise.all([
        this.getHealth(),
        this.getBlockHeight(),
      ])
      
      const responseTime = Date.now() - startTime
      
      return {
        isHealthy: health === 'ok',
        responseTime,
        blockHeight,
      }
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        blockHeight: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async getSignaturesForAddress(
    address: PublicKey,
    options?: {
      limit?: number
      before?: string
      until?: string
    }
  ) {
    try {
      return await withBlockchainRetry(async () => {
        return await this.connection.getSignaturesForAddress(address, options)
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get signatures for address: ${errorMessage}`), {
        category: 'RPC',
        context: { method: 'getSignaturesForAddress', address: address.toString(), options, endpoint: this.config.url },
        severity: 'medium'
      })
      toastService.showError('Failed to fetch transaction signatures')
      throw error
    }
  }

  switchEndpoint(newUrl: string, newWebsocketUrl?: string) {
    try {
      this.config.url = newUrl
      if (newWebsocketUrl) {
        this.config.websocketUrl = newWebsocketUrl
      }
      
      this.connection = new Connection(this.config.url, {
        commitment: 'confirmed',
        wsEndpoint: this.config.websocketUrl,
      })
      
      errorLogger.logInfo('RPC endpoint switched successfully', {
        context: { newUrl, newWebsocketUrl }
      })
      toastService.showSuccess('RPC endpoint switched successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to switch RPC endpoint: ${errorMessage}`), {
        category: 'RPC',
        context: { method: 'switchEndpoint', newUrl, newWebsocketUrl },
        severity: 'high'
      })
      toastService.showError('Failed to switch RPC endpoint')
      throw error
    }
  }
}

export const eclipseRPCService = new EclipseRPCService()