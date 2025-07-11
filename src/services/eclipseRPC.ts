import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { EclipseRPCConfig } from '../types/eclipse'
import { ECLIPSE_RPC_CONFIG } from '../utils/constants'

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
      return await this.connection.getSlot()
    } catch (error) {
      console.error('Failed to get slot:', error)
      throw error
    }
  }

  async getBlockHeight(): Promise<number> {
    try {
      return await this.connection.getBlockHeight()
    } catch (error) {
      console.error('Failed to get block height:', error)
      throw error
    }
  }

  async getTransaction(signature: string) {
    try {
      return await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      })
    } catch (error) {
      console.error('Failed to get transaction:', error)
      throw error
    }
  }

  async getAccountInfo(publicKey: PublicKey) {
    try {
      return await this.connection.getAccountInfo(publicKey)
    } catch (error) {
      console.error('Failed to get account info:', error)
      throw error
    }
  }

  async getRecentPerformanceSamples(limit: number = 720) {
    try {
      return await this.connection.getRecentPerformanceSamples(limit)
    } catch (error) {
      console.error('Failed to get performance samples:', error)
      throw error
    }
  }

  async getEpochInfo() {
    try {
      return await this.connection.getEpochInfo()
    } catch (error) {
      console.error('Failed to get epoch info:', error)
      throw error
    }
  }

  async getVersion() {
    try {
      return await this.connection.getVersion()
    } catch (error) {
      console.error('Failed to get version:', error)
      throw error
    }
  }

  async getHealth() {
    try {
      const response = await fetch(`${this.config.url}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return response.ok ? 'ok' : 'error'
    } catch (error) {
      console.error('Failed to get health:', error)
      return 'error'
    }
  }

  async getMinimumLedgerSlot() {
    try {
      return await this.connection.getMinimumLedgerSlot()
    } catch (error) {
      console.error('Failed to get minimum ledger slot:', error)
      throw error
    }
  }

  async getSupply() {
    try {
      return await this.connection.getSupply()
    } catch (error) {
      console.error('Failed to get supply:', error)
      throw error
    }
  }

  async estimateGasFee(transaction: Transaction | VersionedTransaction): Promise<number> {
    try {
      const feeCalculator = await this.connection.getFeeForMessage(
        transaction.compileMessage()
      )
      return feeCalculator?.value || 0
    } catch (error) {
      console.error('Failed to estimate gas fee:', error)
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
      return await this.connection.getSignaturesForAddress(address, options)
    } catch (error) {
      console.error('Failed to get signatures for address:', error)
      throw error
    }
  }

  switchEndpoint(newUrl: string, newWebsocketUrl?: string) {
    this.config.url = newUrl
    if (newWebsocketUrl) {
      this.config.websocketUrl = newWebsocketUrl
    }
    
    this.connection = new Connection(this.config.url, {
      commitment: 'confirmed',
      wsEndpoint: this.config.websocketUrl,
    })
  }
}

export const eclipseRPCService = new EclipseRPCService()