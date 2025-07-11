import { TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react'
import { useDEXStats } from '../../hooks/useDEX'
import Card from '../Common/Card'
import LoadingSpinner from '../Common/LoadingSpinner'

const DEXStats = () => {
  const { data: stats, isLoading, error } = useDEXStats()

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
          <p className="text-red-600">Failed to load DEX statistics</p>
        </div>
      </Card>
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
    return num.toFixed(2)
  }

  const formatCurrency = (num: number) => {
    return '$' + formatNumber(num)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">24h Volume</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.totalVolume24h || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">24h Trades</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.totalTrades24h || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">24h Traders</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.uniqueTraders24h || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">24h Fees</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.totalFees24h || 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Tokens by Volume</h3>
          <div className="space-y-4">
            {stats?.topTokens?.slice(0, 10).map((token, index) => (
              <div key={token.address} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                  <div className="flex items-center space-x-2">
                    {token.logoURI && (
                      <img 
                        src={token.logoURI} 
                        alt={token.symbol}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{token.symbol}</p>
                      <p className="text-sm text-gray-500">{token.name}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(Math.random() * 1000000)} {/* Mock volume */}
                  </p>
                  <div className="flex items-center space-x-1">
                    {Math.random() > 0.5 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm ${
                      Math.random() > 0.5 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(Math.random() * 20 - 10).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Changes (24h)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats?.priceChanges24h || {}).slice(0, 9).map(([symbol, change]) => (
              <div key={symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{symbol}</span>
                <div className="flex items-center space-x-1">
                  {change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change > 0 ? '+' : ''}{change.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DEXStats