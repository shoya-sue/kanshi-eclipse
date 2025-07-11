import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js'
import { 
  TokenInfo, 
  Route, 
  SwapRequest, 
  SwapResponse, 
  TokenPrice, 
  DEXStats, 
  PoolInfo,
  TradeHistory 
} from '../types/dex'
import { errorLogger } from './errorLogger'
import { toastService } from './toastService'
import { withNetworkRetry, withWalletRetry } from '../utils/retry'

const JUPITER_API_URL = 'https://quote-api.jup.ag/v6'
const RAYDIUM_API_URL = 'https://api.raydium.io/v2'

export class DexService {
  private connection: Connection
  private jupiterApiUrl: string
  private raydiumApiUrl: string

  constructor(connection: Connection) {
    this.connection = connection
    this.jupiterApiUrl = JUPITER_API_URL
    this.raydiumApiUrl = RAYDIUM_API_URL
  }

  // Jupiter API methods
  async getTokenList(): Promise<TokenInfo[]> {
    try {
      return await withNetworkRetry(async () => {
        const response = await fetch(`${this.jupiterApiUrl}/tokens`)
        if (!response.ok) {
          throw new Error(`Failed to fetch token list: ${response.status} ${response.statusText}`)
        }
        const tokens: TokenInfo[] = await response.json()
        return tokens.filter(token => token.symbol && token.name)
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to fetch token list: ${errorMessage}`), {
        category: 'DEX',
        context: { method: 'getTokenList', apiUrl: this.jupiterApiUrl },
        severity: 'medium'
      })
      toastService.showError('Failed to fetch token list')
      return []
    }
  }

  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50
  ): Promise<Route | null> {
    try {
      return await withNetworkRetry(async () => {
        const params = new URLSearchParams({
          inputMint,
          outputMint,
          amount: amount.toString(),
          slippageBps: slippageBps.toString(),
          onlyDirectRoutes: 'false',
          asLegacyTransaction: 'false'
        })

        const response = await fetch(`${this.jupiterApiUrl}/quote?${params}`)
        if (!response.ok) {
          throw new Error(`Failed to get quote: ${response.status} ${response.statusText}`)
        }
        const quote: Route = await response.json()
        
        return quote
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get quote: ${errorMessage}`), {
        category: 'DEX',
        context: { method: 'getQuote', inputMint, outputMint, amount, slippageBps },
        severity: 'medium'
      })
      toastService.showError('Failed to get swap quote')
      return null
    }
  }

  async getSwapTransaction(swapRequest: SwapRequest): Promise<SwapResponse | null> {
    try {
      return await withNetworkRetry(async () => {
        const response = await fetch(`${this.jupiterApiUrl}/swap`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(swapRequest)
        })

        if (!response.ok) {
          throw new Error(`Failed to get swap transaction: ${response.status} ${response.statusText}`)
        }
        const swapResponse: SwapResponse = await response.json()
        return swapResponse
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get swap transaction: ${errorMessage}`), {
        category: 'DEX',
        context: { method: 'getSwapTransaction', swapRequest },
        severity: 'high'
      })
      toastService.showError('Failed to create swap transaction')
      return null
    }
  }

  async executeSwap(
    swapTransaction: string,
    wallet: any
  ): Promise<string | null> {
    try {
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf)
      
      const signedTransaction = await withWalletRetry(async () => {
        return await wallet.signTransaction(transaction)
      })
      
      const signature = await withNetworkRetry(async () => {
        return await this.connection.sendRawTransaction(
          signedTransaction.serialize(),
          {
            skipPreflight: true,
            maxRetries: 2
          }
        )
      })

      await this.connection.confirmTransaction(signature, 'confirmed')
      toastService.showSuccess('Swap executed successfully')
      return signature
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const isUserRejection = errorMessage.toLowerCase().includes('user') || 
                               errorMessage.toLowerCase().includes('rejected')
      
      errorLogger.logError(new Error(`Failed to execute swap: ${errorMessage}`), {
        category: 'DEX',
        context: { method: 'executeSwap', isUserRejection },
        severity: isUserRejection ? 'low' : 'high'
      })
      
      if (isUserRejection) {
        toastService.showInfo('Swap cancelled by user')
      } else {
        toastService.showError('Failed to execute swap')
      }
      
      return null
    }
  }

  // Token price information
  async getTokenPrice(tokenAddress: string): Promise<TokenPrice | null> {
    try {
      return await withNetworkRetry(async () => {
        const response = await fetch(`${this.jupiterApiUrl}/price?ids=${tokenAddress}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch token price: ${response.status} ${response.statusText}`)
        }
        const priceData = await response.json()
        
        if (priceData.data && priceData.data[tokenAddress]) {
          const price = priceData.data[tokenAddress]
          return {
            id: tokenAddress,
            mintSymbol: price.mintSymbol || '',
            vsToken: price.vsToken || 'USDC',
            vsTokenSymbol: price.vsTokenSymbol || 'USDC',
            price: price.price || 0,
            priceChange24h: price.priceChange24h
          }
        }
        
        return null
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to fetch token price: ${errorMessage}`), {
        category: 'DEX',
        context: { method: 'getTokenPrice', tokenAddress },
        severity: 'medium'
      })
      toastService.showError('Failed to fetch token price')
      return null
    }
  }

  async getMultipleTokenPrices(tokenAddresses: string[]): Promise<TokenPrice[]> {
    try {
      return await withNetworkRetry(async () => {
        const ids = tokenAddresses.join(',')
        const response = await fetch(`${this.jupiterApiUrl}/price?ids=${ids}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch token prices: ${response.status} ${response.statusText}`)
        }
        const priceData = await response.json()
        
        const prices: TokenPrice[] = []
        for (const [address, data] of Object.entries(priceData.data || {})) {
          const price = data as any
          prices.push({
            id: address,
            mintSymbol: price.mintSymbol || '',
            vsToken: price.vsToken || 'USDC',
            vsTokenSymbol: price.vsTokenSymbol || 'USDC',
            price: price.price || 0,
            priceChange24h: price.priceChange24h
          })
        }
        
        return prices
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to fetch multiple token prices: ${errorMessage}`), {
        category: 'DEX',
        context: { method: 'getMultipleTokenPrices', tokenAddresses },
        severity: 'medium'
      })
      toastService.showError('Failed to fetch token prices')
      return []
    }
  }

  // Raydium API methods
  async getRaydiumPools(): Promise<PoolInfo[]> {
    try {
      return await withNetworkRetry(async () => {
        const response = await fetch(`${this.raydiumApiUrl}/main/pairs`)
        if (!response.ok) {
          throw new Error(`Failed to fetch Raydium pools: ${response.status} ${response.statusText}`)
        }
        const pools = await response.json()
        
        return pools.map((pool: any) => ({
          id: pool.ammId,
          tokenA: {
            address: pool.baseMint,
            symbol: pool.baseSymbol,
            name: pool.baseName,
            decimals: pool.baseDecimals,
            logoURI: pool.baseLogoURI
          },
          tokenB: {
            address: pool.quoteMint,
            symbol: pool.quoteSymbol,
            name: pool.quoteName,
            decimals: pool.quoteDecimals,
            logoURI: pool.quoteLogoURI
          },
          liquidity: pool.liquidity?.toString() || '0',
          volume24h: pool.volume24h?.toString() || '0',
          fees24h: pool.fees24h?.toString() || '0',
          apy: pool.apy || 0,
          tvl: pool.tvl?.toString() || '0'
        }))
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to fetch Raydium pools: ${errorMessage}`), {
        category: 'DEX',
        context: { method: 'getRaydiumPools', apiUrl: this.raydiumApiUrl },
        severity: 'medium'
      })
      toastService.showError('Failed to fetch liquidity pools')
      return []
    }
  }

  async getDEXStats(): Promise<DEXStats> {
    try {
      const [jupiterStats, raydiumStats] = await Promise.all([
        this.getJupiterStats(),
        this.getRaydiumStats()
      ])

      return {
        totalVolume24h: jupiterStats.totalVolume24h + raydiumStats.totalVolume24h,
        totalTrades24h: jupiterStats.totalTrades24h + raydiumStats.totalTrades24h,
        totalFees24h: jupiterStats.totalFees24h + raydiumStats.totalFees24h,
        uniqueTraders24h: jupiterStats.uniqueTraders24h + raydiumStats.uniqueTraders24h,
        topTokens: [...jupiterStats.topTokens, ...raydiumStats.topTokens].slice(0, 10),
        priceChanges24h: { ...jupiterStats.priceChanges24h, ...raydiumStats.priceChanges24h }
      }
    } catch (error) {
      console.error('Error fetching DEX stats:', error)
      return {
        totalVolume24h: 0,
        totalTrades24h: 0,
        totalFees24h: 0,
        uniqueTraders24h: 0,
        topTokens: [],
        priceChanges24h: {}
      }
    }
  }

  private async getJupiterStats(): Promise<DEXStats> {
    // Jupiter doesn't provide comprehensive stats API
    // This is a mock implementation
    return {
      totalVolume24h: 0,
      totalTrades24h: 0,
      totalFees24h: 0,
      uniqueTraders24h: 0,
      topTokens: [],
      priceChanges24h: {}
    }
  }

  private async getRaydiumStats(): Promise<DEXStats> {
    try {
      return await withNetworkRetry(async () => {
        const response = await fetch(`${this.raydiumApiUrl}/main/info`)
        if (!response.ok) {
          throw new Error(`Failed to fetch Raydium stats: ${response.status} ${response.statusText}`)
        }
        const stats = await response.json()
        
        return {
          totalVolume24h: stats.totalVolume24h || 0,
          totalTrades24h: stats.totalTrades24h || 0,
          totalFees24h: stats.totalFees24h || 0,
          uniqueTraders24h: stats.uniqueTraders24h || 0,
          topTokens: stats.topTokens || [],
          priceChanges24h: stats.priceChanges24h || {}
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to fetch Raydium stats: ${errorMessage}`), {
        category: 'DEX',
        context: { method: 'getRaydiumStats', apiUrl: this.raydiumApiUrl },
        severity: 'medium'
      })
      return {
        totalVolume24h: 0,
        totalTrades24h: 0,
        totalFees24h: 0,
        uniqueTraders24h: 0,
        topTokens: [],
        priceChanges24h: {}
      }
    }
  }

  // Trade history management
  async getTradeHistory(walletAddress: string): Promise<TradeHistory[]> {
    try {
      // This would typically fetch from a backend or indexer
      // For now, return from localStorage
      const stored = localStorage.getItem(`trade_history_${walletAddress}`)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get trade history: ${errorMessage}`), {
        category: 'DEX',
        context: { method: 'getTradeHistory', walletAddress },
        severity: 'medium'
      })
      toastService.showError('Failed to load trade history')
      return []
    }
  }

  async saveTradeHistory(walletAddress: string, trade: TradeHistory): Promise<void> {
    try {
      const existing = await this.getTradeHistory(walletAddress)
      const updated = [trade, ...existing].slice(0, 100) // Keep last 100 trades
      localStorage.setItem(`trade_history_${walletAddress}`, JSON.stringify(updated))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to save trade history: ${errorMessage}`), {
        category: 'DEX',
        context: { method: 'saveTradeHistory', walletAddress, trade },
        severity: 'medium'
      })
      toastService.showError('Failed to save trade history')
    }
  }

  // Helper methods
  async isValidTokenAddress(address: string): Promise<boolean> {
    try {
      const publicKey = new PublicKey(address)
      const accountInfo = await this.connection.getAccountInfo(publicKey)
      return accountInfo !== null
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to validate token address: ${errorMessage}`), {
        category: 'DEX',
        context: { method: 'isValidTokenAddress', address },
        severity: 'low'
      })
      return false
    }
  }

  calculatePriceImpact(inputAmount: string, outputAmount: string, marketPrice: number): number {
    const input = parseFloat(inputAmount)
    const output = parseFloat(outputAmount)
    const expectedOutput = input * marketPrice
    
    return ((expectedOutput - output) / expectedOutput) * 100
  }

  formatAmount(amount: string | number, decimals: number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return (num / Math.pow(10, decimals)).toFixed(6)
  }

  parseAmount(amount: string, decimals: number): number {
    return parseFloat(amount) * Math.pow(10, decimals)
  }
}