import { useNetworkStats } from '../../hooks/useRPCHealth'
import { formatNumber, formatDuration } from '../../utils/formatters'
import { Activity, Zap, TrendingUp, AlertTriangle } from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'
import Card from '../Common/Card'

const HealthDashboard = () => {
  const { data: networkStats, isLoading } = useNetworkStats()

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    )
  }

  if (!networkStats) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          ネットワーク統計データがありません
        </div>
      </Card>
    )
  }

  const healthPercentage = (networkStats.onlineEndpoints / networkStats.totalEndpoints) * 100

  return (
    <Card>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-eclipse-primary" />
          <h3 className="text-lg font-semibold text-gray-900">ネットワーク状態</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-eclipse-primary mb-1">
              {networkStats.onlineEndpoints}
            </div>
            <div className="text-sm text-gray-600">オンライン</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-500 mb-1">
              {networkStats.totalEndpoints}
            </div>
            <div className="text-sm text-gray-600">総エンドポイント</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">ネットワーク健全性</span>
            <span className="text-sm font-medium text-gray-900">
              {healthPercentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                healthPercentage >= 80 
                  ? 'bg-green-500' 
                  : healthPercentage >= 60 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500'
              }`}
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Zap className="w-5 h-5 text-blue-500" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                平均応答時間
              </div>
              <div className="text-lg font-semibold text-blue-600">
                {formatNumber(networkStats.averageResponseTime)}ms
              </div>
            </div>
          </div>

          {networkStats.bestEndpoint && (
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  最高性能
                </div>
                <div className="text-sm text-green-600">
                  {networkStats.bestEndpoint.name}
                </div>
                <div className="text-xs text-gray-500">
                  {formatNumber(networkStats.bestEndpoint.responseTime)}ms
                </div>
              </div>
            </div>
          )}

          {networkStats.worstEndpoint && networkStats.worstEndpoint.status === 'offline' && (
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  問題あり
                </div>
                <div className="text-sm text-red-600">
                  {networkStats.worstEndpoint.name}
                </div>
                <div className="text-xs text-gray-500">
                  オフライン
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              最終更新: {formatDuration(Date.now() - Date.now())}前
            </span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-600">リアルタイム</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default HealthDashboard