import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { DexService } from '../services/dexService'
import { 
  TokenInfo, 
  Route, 
  SwapRequest, 
  TradeHistory 
} from '../types/dex'

export const useDEX = () => {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const [dexService] = useState(() => new DexService(connection))

  return {
    dexService,
    wallet: { publicKey, signTransaction },
    connection
  }
}

export const useTokenList = () => {
  const { dexService } = useDEX()

  return useQuery({
    queryKey: ['tokenList'],
    queryFn: () => dexService.getTokenList(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useTokenPrice = (tokenAddress: string) => {
  const { dexService } = useDEX()

  return useQuery({
    queryKey: ['tokenPrice', tokenAddress],
    queryFn: () => dexService.getTokenPrice(tokenAddress),
    enabled: !!tokenAddress,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useMultipleTokenPrices = (tokenAddresses: string[]) => {
  const { dexService } = useDEX()

  return useQuery({
    queryKey: ['multipleTokenPrices', tokenAddresses],
    queryFn: () => dexService.getMultipleTokenPrices(tokenAddresses),
    enabled: tokenAddresses.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useSwapQuote = (
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
) => {
  const { dexService } = useDEX()

  return useQuery({
    queryKey: ['swapQuote', inputMint, outputMint, amount, slippageBps],
    queryFn: () => dexService.getQuote(inputMint, outputMint, amount, slippageBps),
    enabled: !!inputMint && !!outputMint && amount > 0,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 30 * 1000, // 30 seconds
  })
}

export const useSwapTransaction = () => {
  const { dexService, wallet } = useDEX()

  return useMutation({
    mutationFn: async (swapRequest: SwapRequest) => {
      const swapResponse = await dexService.getSwapTransaction(swapRequest)
      if (!swapResponse) throw new Error('Failed to get swap transaction')
      
      const signature = await dexService.executeSwap(swapResponse.swapTransaction, wallet)
      if (!signature) throw new Error('Failed to execute swap')
      
      return signature
    },
  })
}

export const useDEXStats = () => {
  const { dexService } = useDEX()

  return useQuery({
    queryKey: ['dexStats'],
    queryFn: () => dexService.getDEXStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const usePoolInfo = () => {
  const { dexService } = useDEX()

  return useQuery({
    queryKey: ['poolInfo'],
    queryFn: () => dexService.getRaydiumPools(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useTradeHistory = () => {
  const { dexService } = useDEX()
  const { publicKey } = useWallet()

  const {
    data: tradeHistory,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tradeHistory', publicKey?.toString()],
    queryFn: () => dexService.getTradeHistory(publicKey?.toString() || ''),
    enabled: !!publicKey,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })

  const saveTradeHistory = useCallback(
    async (trade: TradeHistory) => {
      if (!publicKey) return
      await dexService.saveTradeHistory(publicKey.toString(), trade)
      refetch()
    },
    [publicKey, dexService, refetch]
  )

  return {
    tradeHistory: tradeHistory || [],
    isLoading,
    error,
    saveTradeHistory,
    refetch
  }
}

export const useSwapState = () => {
  const [inputToken, setInputToken] = useState<TokenInfo | null>(null)
  const [outputToken, setOutputToken] = useState<TokenInfo | null>(null)
  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount, setOutputAmount] = useState('')
  const [slippage, setSlippage] = useState(0.5) // 0.5%
  const [isSwapping, setIsSwapping] = useState(false)

  const swapTokens = useCallback(() => {
    setInputToken(outputToken)
    setOutputToken(inputToken)
    setInputAmount(outputAmount)
    setOutputAmount(inputAmount)
  }, [inputToken, outputToken, inputAmount, outputAmount])

  const resetSwap = useCallback(() => {
    setInputToken(null)
    setOutputToken(null)
    setInputAmount('')
    setOutputAmount('')
    setIsSwapping(false)
  }, [])

  return {
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    slippage,
    isSwapping,
    setInputToken,
    setOutputToken,
    setInputAmount,
    setOutputAmount,
    setSlippage,
    setIsSwapping,
    swapTokens,
    resetSwap
  }
}

export const useTokenSearch = (query: string) => {
  const { data: tokenList } = useTokenList()
  const [searchResults, setSearchResults] = useState<TokenInfo[]>([])

  useEffect(() => {
    if (!tokenList || !query) {
      setSearchResults([])
      return
    }

    const filtered = tokenList.filter(
      token =>
        token.symbol.toLowerCase().includes(query.toLowerCase()) ||
        token.name.toLowerCase().includes(query.toLowerCase()) ||
        token.address.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 20) // Limit to 20 results

    setSearchResults(filtered)
  }, [tokenList, query])

  return searchResults
}

export const useSwapCalculation = (
  inputToken: TokenInfo | null,
  outputToken: TokenInfo | null,
  inputAmount: string,
  slippage: number
) => {
  const [quote, setQuote] = useState<Route | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { dexService } = useDEX()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const fetchQuote = async () => {
      if (!inputToken || !outputToken || !inputAmount || parseFloat(inputAmount) <= 0) {
        setQuote(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const amount = dexService.parseAmount(inputAmount, inputToken.decimals)
        const slippageBps = Math.floor(slippage * 100)
        
        const quoteResult = await dexService.getQuote(
          inputToken.address,
          outputToken.address,
          amount,
          slippageBps
        )

        setQuote(quoteResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get quote')
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce quote requests
    timeoutId = setTimeout(fetchQuote, 500)

    return () => clearTimeout(timeoutId)
  }, [inputToken, outputToken, inputAmount, slippage, dexService])

  return { quote, isLoading, error }
}