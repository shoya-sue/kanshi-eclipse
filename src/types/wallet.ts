import { PublicKey } from '@solana/web3.js'

export interface WalletState {
  isConnected: boolean
  publicKey: PublicKey | null
  connecting: boolean
  disconnecting: boolean
  walletName: string | null
}

export interface WalletBalance {
  sol: number
  tokens: TokenBalance[]
}

export interface TokenBalance {
  mint: string
  amount: number
  decimals: number
  symbol: string
  name: string
  logoURI?: string
}

export interface WalletTransaction {
  signature: string
  type: 'send' | 'receive' | 'swap' | 'stake' | 'unstake' | 'other'
  amount: number
  token: string
  timestamp: number
  status: 'success' | 'failed' | 'pending'
  fee: number
  counterparty?: string
}

export interface SendTransactionRequest {
  to: string
  amount: number
  token?: string
  memo?: string
}

export interface SwapTransactionRequest {
  fromToken: string
  toToken: string
  amount: number
  slippage: number
}