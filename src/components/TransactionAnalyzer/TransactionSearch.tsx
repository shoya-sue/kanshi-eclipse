import { useState, useCallback } from 'react'
import { Search, History, AlertCircle } from 'lucide-react'
import { useTransaction, useTransactionSearch } from '../../hooks/useTransaction'
import { TransactionDetails } from '../../types/transaction'
import { isValidTransactionSignature, isValidPublicKey } from '../../utils/validators'
import Button from '../Common/Button'
import Card from '../Common/Card'

interface TransactionSearchProps {
  onTransactionSelect: (transaction: TransactionDetails) => void
}

const TransactionSearch = ({ onTransactionSelect }: TransactionSearchProps) => {
  const [searchInput, setSearchInput] = useState('')
  const [searchType, setSearchType] = useState<'signature' | 'address'>('signature')
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const stored = localStorage.getItem('transactionSearchHistory')
    return stored ? JSON.parse(stored) : []
  })
  const [validationError, setValidationError] = useState<string | null>(null)

  const { data: transaction, isLoading: isLoadingTransaction } = useTransaction(
    searchType === 'signature' && isValidTransactionSignature(searchInput) ? searchInput : null
  )

  const transactionSearchMutation = useTransactionSearch()

  const validateInput = useCallback((input: string, type: 'signature' | 'address') => {
    if (!input.trim()) {
      setValidationError(null)
      return false
    }

    if (type === 'signature') {
      if (!isValidTransactionSignature(input)) {
        setValidationError('無効なトランザクション署名です')
        return false
      }
    } else {
      if (!isValidPublicKey(input)) {
        setValidationError('無効なアドレスです')
        return false
      }
    }

    setValidationError(null)
    return true
  }, [])

  const addToSearchHistory = useCallback((input: string) => {
    const newHistory = [input, ...searchHistory.filter(item => item !== input)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('transactionSearchHistory', JSON.stringify(newHistory))
  }, [searchHistory])

  const handleSearch = useCallback(async () => {
    if (!validateInput(searchInput, searchType)) return

    const trimmedInput = searchInput.trim()

    if (searchType === 'signature') {
      if (transaction) {
        onTransactionSelect(transaction)
        addToSearchHistory(trimmedInput)
      }
    } else {
      try {
        const results = await transactionSearchMutation.mutateAsync({
          address: trimmedInput,
          options: { limit: 10 }
        })

        if (results.length > 0) {
          // For address search, we need to fetch the first transaction details
          const firstSignature = results[0].signature
          // This would trigger the transaction hook to fetch details
          setSearchInput(firstSignature)
          setSearchType('signature')
        }
        
        addToSearchHistory(trimmedInput)
      } catch (error) {
        console.error('Transaction search failed:', error)
      }
    }
  }, [searchInput, searchType, transaction, onTransactionSelect, transactionSearchMutation, validateInput, addToSearchHistory])

  const handleHistoryClick = (historyItem: string) => {
    setSearchInput(historyItem)
    setSearchType(isValidTransactionSignature(historyItem) ? 'signature' : 'address')
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('transactionSearchHistory')
  }

  const handleInputChange = (value: string) => {
    setSearchInput(value)
    validateInput(value, searchType)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-eclipse-primary" />
          <h3 className="text-lg font-semibold text-gray-900">トランザクション検索</h3>
        </div>

        <div className="space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setSearchType('signature')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                searchType === 'signature'
                  ? 'bg-eclipse-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              署名で検索
            </button>
            <button
              onClick={() => setSearchType('address')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                searchType === 'address'
                  ? 'bg-eclipse-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              アドレスで検索
            </button>
          </div>

          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  searchType === 'signature'
                    ? 'トランザクション署名を入力...'
                    : 'ウォレットアドレスを入力...'
                }
                aria-label={
                  searchType === 'signature'
                    ? 'トランザクション署名'
                    : 'ウォレットアドレス'
                }
                className={`w-full px-3 py-2 border rounded-md focus:ring-eclipse-primary focus:border-eclipse-primary ${
                  validationError ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationError && (
                <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchInput.trim() || !!validationError}
              loading={isLoadingTransaction || transactionSearchMutation.isPending}
            >
              検索
            </Button>
          </div>
        </div>

        {transactionSearchMutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-600 text-sm">
                検索に失敗しました: {transactionSearchMutation.error.message}
              </span>
            </div>
          </div>
        )}

        {searchHistory.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">検索履歴</span>
              </div>
              <button
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                クリア
              </button>
            </div>
            <div className="space-y-1">
              {searchHistory.slice(0, 5).map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded truncate"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default TransactionSearch