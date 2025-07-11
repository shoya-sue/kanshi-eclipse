import { useState } from 'react'
import { ExternalLink, Filter, Download } from 'lucide-react'
import { useTradeHistory } from '../../hooks/useDEX'
import { TradeHistory as TradeHistoryType } from '../../types/dex'
import Card from '../Common/Card'
import LoadingSpinner from '../Common/LoadingSpinner'
import Button from '../Common/Button'

const TradeHistory = () => {
  const { tradeHistory, isLoading, error } = useTradeHistory()
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all')
  const [sortBy, setSortBy] = useState<'timestamp' | 'amount'>('timestamp')

  const filteredHistory = tradeHistory.filter(trade => {
    if (filter === 'all') return true
    return trade.status === filter
  })

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (sortBy === 'timestamp') {
      return b.timestamp - a.timestamp
    }
    return parseFloat(b.inputAmount) - parseFloat(a.inputAmount)
  })

  const formatAmount = (amount: string, decimals: number) => {
    const num = parseFloat(amount)
    return (num / Math.pow(10, decimals)).toFixed(6)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusColor = (status: TradeHistoryType['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'From', 'To', 'Amount In', 'Amount Out', 'Price Impact', 'Status', 'Signature'],
      ...sortedHistory.map(trade => [
        formatDate(trade.timestamp),
        trade.inputToken.symbol,
        trade.outputToken.symbol,
        formatAmount(trade.inputAmount, trade.inputToken.decimals),
        formatAmount(trade.outputAmount, trade.outputToken.decimals),
        trade.priceImpact.toFixed(2) + '%',
        trade.status,
        trade.signature
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trade_history.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load trade history</p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Trade History</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-eclipse-primary focus:border-eclipse-primary"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-eclipse-primary focus:border-eclipse-primary"
            >
              <option value="timestamp">Date</option>
              <option value="amount">Amount</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {sortedHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No trades found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedHistory.map((trade) => (
              <div key={trade.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {trade.inputToken.logoURI && (
                          <img 
                            src={trade.inputToken.logoURI} 
                            alt={trade.inputToken.symbol}
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                        <span className="font-medium">{trade.inputToken.symbol}</span>
                      </div>
                      <span className="text-gray-500">→</span>
                      <div className="flex items-center space-x-1">
                        {trade.outputToken.logoURI && (
                          <img 
                            src={trade.outputToken.logoURI} 
                            alt={trade.outputToken.symbol}
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                        <span className="font-medium">{trade.outputToken.symbol}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                      {trade.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatDate(trade.timestamp)}</p>
                    <p className="text-sm text-gray-600">{trade.dex}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Amount In</p>
                    <p className="font-medium">
                      {formatAmount(trade.inputAmount, trade.inputToken.decimals)} {trade.inputToken.symbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount Out</p>
                    <p className="font-medium">
                      {formatAmount(trade.outputAmount, trade.outputToken.decimals)} {trade.outputToken.symbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Price Impact</p>
                    <p className={`font-medium ${trade.priceImpact > 5 ? 'text-red-600' : 'text-green-600'}`}>
                      {trade.priceImpact.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fees</p>
                    <p className="font-medium">{trade.fees.toFixed(6)} SOL</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>Slippage: {trade.slippage.toFixed(2)}%</span>
                  </div>
                  <a
                    href={`https://solscan.io/tx/${trade.signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-sm text-eclipse-primary hover:text-eclipse-primary-dark"
                  >
                    <span>View on Solscan</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

export default TradeHistory