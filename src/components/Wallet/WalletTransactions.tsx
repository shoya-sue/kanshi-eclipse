import { useWalletTransactions } from '../../hooks/useWallet'
import { formatLamports, formatTime, formatAddress } from '../../utils/formatters'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'
import Card from '../Common/Card'
import Button from '../Common/Button'

const WalletTransactions = () => {
  const { data: transactions, isLoading, error, refetch, isRefetching } = useWalletTransactions()

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
          <div className="text-red-600 mb-2">トランザクション履歴の取得に失敗しました</div>
          <Button size="sm" onClick={() => refetch()}>
            再試行
          </Button>
        </div>
      </Card>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          トランザクション履歴がありません
        </div>
      </Card>
    )
  }

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending') {
      return <Clock className="w-4 h-4 text-yellow-500" />
    }
    
    if (status === 'failed') {
      return <XCircle className="w-4 h-4 text-red-500" />
    }

    switch (type) {
      case 'send':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />
      case 'receive':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-blue-500" />
    }
  }

  const getTransactionColor = (type: string, status: string) => {
    if (status === 'failed') return 'text-red-600'
    if (status === 'pending') return 'text-yellow-600'
    
    switch (type) {
      case 'send':
        return 'text-red-600'
      case 'receive':
        return 'text-green-600'
      default:
        return 'text-blue-600'
    }
  }

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'send': return '送金'
      case 'receive': return '受け取り'
      case 'swap': return 'スワップ'
      case 'stake': return 'ステーキング'
      case 'unstake': return 'アンステーキング'
      default: return 'その他'
    }
  }

  const openInExplorer = (signature: string) => {
    window.open(`https://eclipse.xyz/tx/${signature}`, '_blank')
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            トランザクション履歴
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions.map((tx, index) => (
            <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getTransactionIcon(tx.type, tx.status)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {getTransactionLabel(tx.type)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {tx.token}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatTime(tx.timestamp)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatAddress(tx.signature, 8)}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`font-medium ${getTransactionColor(tx.type, tx.status)}`}>
                  {tx.type === 'send' ? '-' : '+'}
                  {formatLamports(tx.amount * 1000000000)}
                </div>
                <div className="text-sm text-gray-500">
                  手数料: {formatLamports(tx.fee)}
                </div>
                <button
                  onClick={() => openInExplorer(tx.signature)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>詳細</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500 text-center">
            最新50件のトランザクションを表示
          </div>
        </div>
      </div>
    </Card>
  )
}

export default WalletTransactions