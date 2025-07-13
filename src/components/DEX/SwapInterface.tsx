import { useState } from 'react'
import { ArrowDownUp, Settings, RefreshCw } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useSwapState, useSwapCalculation, useSwapTransaction } from '../../hooks/useDEX'
import TokenSelector from './TokenSelector'
import Button from '../Common/Button'
import Card from '../Common/Card'
import LoadingSpinner from '../Common/LoadingSpinner'

const SwapInterface = () => {
  const { publicKey } = useWallet()
  const [showSettings, setShowSettings] = useState(false)
  const [customSlippage, setCustomSlippage] = useState('')
  
  const {
    inputToken,
    outputToken,
    inputAmount,
    slippage,
    isSwapping,
    setInputToken,
    setOutputToken,
    setInputAmount,
    setSlippage,
    setIsSwapping,
    swapTokens,
    resetSwap
  } = useSwapState()

  const { quote, isLoading: isLoadingQuote, error: quoteError } = useSwapCalculation(
    inputToken,
    outputToken,
    inputAmount,
    slippage
  )

  const swapMutation = useSwapTransaction()

  const handleSwap = async () => {
    if (!publicKey || !inputToken || !outputToken || !quote) return

    setIsSwapping(true)
    try {
      const swapRequest = {
        userPublicKey: publicKey.toString(),
        route: quote,
        wrapUnwrapSOL: true,
        feeAccount: undefined,
        computeUnitPriceMicroLamports: 5000,
        asLegacyTransaction: false
      }

      await swapMutation.mutateAsync(swapRequest)
      // Swap successful
      
      // Reset form after successful swap
      resetSwap()
    } catch (error) {
      console.error('Swap failed:', error)
    } finally {
      setIsSwapping(false)
    }
  }

  const handleSlippageChange = (newSlippage: number) => {
    setSlippage(newSlippage)
    setCustomSlippage('')
  }

  const handleCustomSlippageChange = (value: string) => {
    setCustomSlippage(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
      setSlippage(numValue)
    }
  }

  const formatAmount = (amount: string, decimals: number) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return '0'
    return (num / Math.pow(10, decimals)).toFixed(6)
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Swap Tokens</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={resetSwap}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                disabled={isSwapping}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slippage Tolerance
                  </label>
                  <div className="flex items-center space-x-2">
                    {[0.1, 0.5, 1.0].map((value) => (
                      <button
                        key={value}
                        onClick={() => handleSlippageChange(value)}
                        className={`px-3 py-1 rounded text-sm ${
                          slippage === value
                            ? 'bg-eclipse-primary text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                    <input
                      type="text"
                      placeholder="Custom"
                      value={customSlippage}
                      onChange={(e) => handleCustomSlippageChange(e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-eclipse-primary focus:border-eclipse-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">From</label>
            <div className="flex items-center space-x-2">
              <TokenSelector
                selectedToken={inputToken}
                onTokenSelect={setInputToken}
                excludeToken={outputToken || undefined}
                disabled={isSwapping}
              />
              <input
                type="text"
                placeholder="0.00"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eclipse-primary focus:border-eclipse-primary"
                disabled={isSwapping}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={swapTokens}
              disabled={isSwapping}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <ArrowDownUp className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">To</label>
            <div className="flex items-center space-x-2">
              <TokenSelector
                selectedToken={outputToken}
                onTokenSelect={setOutputToken}
                excludeToken={inputToken || undefined}
                disabled={isSwapping}
              />
              <div className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                {isLoadingQuote ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-gray-500">Loading...</span>
                  </div>
                ) : quote && outputToken ? (
                  <span className="text-gray-900">
                    {formatAmount(quote.outAmount, outputToken.decimals)}
                  </span>
                ) : (
                  <span className="text-gray-500">0.00</span>
                )}
              </div>
            </div>
          </div>

          {quote && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Impact</span>
                  <span className={`font-medium ${
                    quote.priceImpactPct > 5 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {quote.priceImpactPct.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Slippage</span>
                  <span className="text-gray-900">{slippage}%</span>
                </div>
                {quote.fees && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network Fee</span>
                    <span className="text-gray-900">
                      {(quote.fees.signatureFee / 1e9).toFixed(6)} SOL
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {quoteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{quoteError}</p>
            </div>
          )}

          <Button
            onClick={handleSwap}
            disabled={
              !publicKey ||
              !inputToken ||
              !outputToken ||
              !inputAmount ||
              !quote ||
              isSwapping ||
              isLoadingQuote
            }
            loading={isSwapping}
            className="w-full"
          >
            {!publicKey
              ? 'Connect Wallet'
              : !inputToken || !outputToken
              ? 'Select Tokens'
              : !inputAmount
              ? 'Enter Amount'
              : isLoadingQuote
              ? 'Loading Quote...'
              : 'Swap'}
          </Button>

          {swapMutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                Swap failed: {swapMutation.error.message}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default SwapInterface