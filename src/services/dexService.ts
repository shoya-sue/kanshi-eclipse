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
      const response = await fetch(`${this.jupiterApiUrl}/tokens`)
      const tokens: TokenInfo[] = await response.json()
      return tokens.filter(token => token.symbol && token.name)
    } catch (error) {
      console.error('Error fetching token list:', error)
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
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amount.toString(),
        slippageBps: slippageBps.toString(),
        onlyDirectRoutes: 'false',
        asLegacyTransaction: 'false'
      })

      const response = await fetch(`${this.jupiterApiUrl}/quote?${params}`)
      const quote: Route = await response.json()
      
      return quote
    } catch (error) {
      console.error('Error getting quote:', error)
      return null
    }
  }

  async getSwapTransaction(swapRequest: SwapRequest): Promise<SwapResponse | null> {
    try {
      const response = await fetch(`${this.jupiterApiUrl}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swapRequest)
      })

      const swapResponse: SwapResponse = await response.json()
      return swapResponse
    } catch (error) {
      console.error('Error getting swap transaction:', error)
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
      
      const signedTransaction = await wallet.signTransaction(transaction)
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: true,
          maxRetries: 2
        }
      )

      await this.connection.confirmTransaction(signature, 'confirmed')
      return signature
    } catch (error) {
      console.error('Error executing swap:', error)
      return null
    }
  }

  // Token price information
  async getTokenPrice(tokenAddress: string): Promise<TokenPrice | null> {
    try {
      const response = await fetch(`${this.jupiterApiUrl}/price?ids=${tokenAddress}`)
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
    } catch (error) {
      console.error('Error fetching token price:', error)
      return null
    }
  }

  async getMultipleTokenPrices(tokenAddresses: string[]): Promise<TokenPrice[]> {
    try {
      const ids = tokenAddresses.join(',')
      const response = await fetch(`${this.jupiterApiUrl}/price?ids=${ids}`)
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
    } catch (error) {
      console.error('Error fetching multiple token prices:', error)
      return []
    }
  }

  // Raydium API methods
  async getRaydiumPools(): Promise<PoolInfo[]> {
    try {
      const response = await fetch(`${this.raydiumApiUrl}/main/pairs`)
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
    } catch (error) {
      console.error('Error fetching Raydium pools:', error)
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
      const response = await fetch(`${this.raydiumApiUrl}/main/info`)
      const stats = await response.json()
      
      return {
        totalVolume24h: stats.totalVolume24h || 0,
        totalTrades24h: stats.totalTrades24h || 0,
        totalFees24h: stats.totalFees24h || 0,
        uniqueTraders24h: stats.uniqueTraders24h || 0,
        topTokens: stats.topTokens || [],
        priceChanges24h: stats.priceChanges24h || {}
      }
    } catch (error) {
      console.error('Error fetching Raydium stats:', error)
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
    // This would typically fetch from a backend or indexer
    // For now, return from localStorage
    const stored = localStorage.getItem(`trade_history_${walletAddress}`)
    return stored ? JSON.parse(stored) : []
  }

  async saveTradeHistory(walletAddress: string, trade: TradeHistory): Promise<void> {
    const existing = await this.getTradeHistory(walletAddress)
    const updated = [trade, ...existing].slice(0, 100) // Keep last 100 trades
    localStorage.setItem(`trade_history_${walletAddress}`, JSON.stringify(updated))
  }

  // Helper methods
  async isValidTokenAddress(address: string): Promise<boolean> {
    try {
      const publicKey = new PublicKey(address)
      const accountInfo = await this.connection.getAccountInfo(publicKey)
      return accountInfo !== null
    } catch (error) {
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