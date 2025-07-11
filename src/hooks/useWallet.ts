import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js'
import { WalletBalance, TokenBalance, WalletTransaction, SendTransactionRequest } from '../types/wallet'

export const useWallet = () => {
  const wallet = useSolanaWallet()

  const walletState = {
    isConnected: wallet.connected,
    publicKey: wallet.publicKey,
    connecting: wallet.connecting,
    disconnecting: wallet.disconnecting,
    walletName: wallet.wallet?.adapter.name || null,
  }

  return {
    ...walletState,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    select: wallet.select,
    wallets: wallet.wallets,
  }
}

export const useWalletBalance = () => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()

  return useQuery<WalletBalance>({
    queryKey: ['walletBalance', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) throw new Error('Wallet not connected')

      // Get SOL balance
      const balance = await connection.getBalance(publicKey)
      const solBalance = balance / LAMPORTS_PER_SOL

      // Get token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      })

      const tokens: TokenBalance[] = []
      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data
        if ('parsed' in accountData) {
          const tokenInfo = accountData.parsed.info
          const tokenAmount = tokenInfo.tokenAmount

          // Skip tokens with zero balance
          if (tokenAmount.uiAmount === 0) continue

          tokens.push({
            mint: tokenInfo.mint,
            amount: tokenAmount.uiAmount,
            decimals: tokenAmount.decimals,
            symbol: 'Unknown', // Would need token metadata to get symbol
            name: 'Unknown Token',
          })
        }
      }

      return {
        sol: solBalance,
        tokens,
      }
    },
    enabled: !!publicKey,
    staleTime: 30000,
    refetchInterval: 30000,
  })
}

export const useWalletTransactions = () => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()

  return useQuery<WalletTransaction[]>({
    queryKey: ['walletTransactions', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) throw new Error('Wallet not connected')

      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 50 })
      const transactions: WalletTransaction[] = []

      for (const sig of signatures) {
        const transaction = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        })

        if (!transaction) continue

        const type = determineTransactionType(transaction, publicKey)
        const amount = calculateTransactionAmount(transaction, publicKey)

        transactions.push({
          signature: sig.signature,
          type,
          amount,
          token: 'SOL',
          timestamp: transaction.blockTime || 0,
          status: transaction.meta?.err ? 'failed' : 'success',
          fee: transaction.meta?.fee || 0,
        })
      }

      return transactions
    },
    enabled: !!publicKey,
    staleTime: 60000,
  })
}

export const useSendTransaction = () => {
  const { publicKey, signTransaction } = useSolanaWallet()
  const { connection } = useConnection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: SendTransactionRequest) => {
      if (!publicKey || !signTransaction) {
        throw new Error('Wallet not connected')
      }

      const toPublicKey = new PublicKey(request.to)
      const lamports = request.amount * LAMPORTS_PER_SOL

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())

      await connection.confirmTransaction(signature, 'confirmed')

      return signature
    },
    onSuccess: () => {
      // Invalidate balance and transaction queries
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] })
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] })
    },
  })
}

// Helper functions
function determineTransactionType(transaction: any, publicKey: PublicKey): WalletTransaction['type'] {
  // Simple heuristic to determine transaction type
  const preBalances = transaction.meta?.preBalances || []
  const postBalances = transaction.meta?.postBalances || []
  
  if (preBalances.length > 0 && postBalances.length > 0) {
    const accountIndex = transaction.transaction.message.accountKeys.findIndex(
      (key: PublicKey) => key.equals(publicKey)
    )
    
    if (accountIndex !== -1) {
      const preBalance = preBalances[accountIndex]
      const postBalance = postBalances[accountIndex]
      
      if (preBalance > postBalance) {
        return 'send'
      } else if (preBalance < postBalance) {
        return 'receive'
      }
    }
  }
  
  return 'other'
}

function calculateTransactionAmount(transaction: any, publicKey: PublicKey): number {
  const preBalances = transaction.meta?.preBalances || []
  const postBalances = transaction.meta?.postBalances || []
  
  if (preBalances.length > 0 && postBalances.length > 0) {
    const accountIndex = transaction.transaction.message.accountKeys.findIndex(
      (key: PublicKey) => key.equals(publicKey)
    )
    
    if (accountIndex !== -1) {
      const preBalance = preBalances[accountIndex]
      const postBalance = postBalances[accountIndex]
      const difference = Math.abs(preBalance - postBalance)
      
      return difference / LAMPORTS_PER_SOL
    }
  }
  
  return 0
}