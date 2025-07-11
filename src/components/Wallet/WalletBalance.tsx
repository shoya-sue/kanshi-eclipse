import { useWalletBalance } from '../../hooks/useWallet'
import { formatNumber } from '../../utils/formatters'
import { Coins, TrendingUp, RefreshCw } from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'
import Card from '../Common/Card'
import Button from '../Common/Button'

const WalletBalance = () => {
  const { data: balance, isLoading, error, refetch, isRefetching } = useWalletBalance()

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">残高の取得に失敗しました</div>
          <Button size="sm" onClick={() => refetch()}>
            再試行
          </Button>
        </div>
      </Card>
    )
  }

  if (!balance) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          ウォレットが接続されていません
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-eclipse-primary" />
            <h3 className="text-lg font-semibold text-gray-900">残高</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="space-y-4">
          {/* SOL Balance */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-eclipse-primary/10 to-eclipse-secondary/10 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-eclipse-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">SOL</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Solana</div>
                <div className="text-sm text-gray-500">SOL</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {formatNumber(balance.sol)} SOL
              </div>
              <div className="text-sm text-gray-500">
                メイン残高
              </div>
            </div>
          </div>

          {/* Token Balances */}
          {balance.tokens.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">トークン</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {balance.tokens.map((token, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {token.symbol?.substring(0, 2) || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{token.name}</div>
                        <div className="text-sm text-gray-500">{token.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {formatNumber(token.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {token.decimals} decimals
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {balance.tokens.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <div className="mb-2">トークンが見つかりません</div>
              <div className="text-sm">SOL のみを保有しています</div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>最終更新: {new Date().toLocaleTimeString('ja-JP')}</span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>リアルタイム</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default WalletBalance