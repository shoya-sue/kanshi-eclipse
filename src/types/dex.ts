export interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  tags?: string[]
}

export interface Route {
  inAmount: string
  outAmount: string
  priceImpactPct: number
  slippageBps: number
  marketInfos: MarketInfo[]
  otherAmountThreshold: string
  swapMode: 'ExactIn' | 'ExactOut'
  fees?: RouteFees
}

export interface MarketInfo {
  id: string
  label: string
  inputMint: string
  outputMint: string
  notEnoughLiquidity: boolean
  inAmount: string
  outAmount: string
  priceImpactPct: number
  lpFee: LpFee
  platformFee: PlatformFee
}

export interface LpFee {
  amount: string
  mint: string
  pct: number
}

export interface PlatformFee {
  amount: string
  mint: string
  pct: number
}

export interface RouteFees {
  signatureFee: number
  openOrdersDeposits: number[]
  ataDeposits: number[]
  totalFeeAndDeposits: number
  minimumSOLForTransaction: number
}

export interface SwapRequest {
  userPublicKey: string
  route: Route
  wrapUnwrapSOL: boolean
  feeAccount?: string
  computeUnitPriceMicroLamports?: number
  prioritizationFeeLamports?: number
  asLegacyTransaction?: boolean
}

export interface SwapResponse {
  swapTransaction: string
  lastValidBlockHeight: number
  prioritizationFeeLamports?: number
}

export interface TokenPrice {
  id: string
  mintSymbol: string
  vsToken: string
  vsTokenSymbol: string
  price: number
  priceChange24h?: number
  volume24h?: number
  marketCap?: number
}

export interface DEXStats {
  totalVolume24h: number
  totalTrades24h: number
  totalFees24h: number
  uniqueTraders24h: number
  topTokens: TokenInfo[]
  priceChanges24h: { [symbol: string]: number }
}

export interface PoolInfo {
  id: string
  tokenA: TokenInfo
  tokenB: TokenInfo
  liquidity: string
  volume24h: string
  fees24h: string
  apy: number
  tvl: string
}

export interface DexConfig {
  name: string
  baseUrl: string
  apiKey?: string
  supportedTokens: TokenInfo[]
  maxSlippage: number
  defaultSlippage: number
  minTradeAmount: number
}

export interface TradeHistory {
  id: string
  signature: string
  timestamp: number
  inputToken: TokenInfo
  outputToken: TokenInfo
  inputAmount: string
  outputAmount: string
  priceImpact: number
  slippage: number
  fees: number
  status: 'pending' | 'success' | 'failed'
  dex: string
}