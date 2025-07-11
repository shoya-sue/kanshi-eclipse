import { useGasFeeStats } from '../../hooks/useGasFees'
import { formatLamports } from '../../utils/formatters'
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'
import Card from '../Common/Card'

const GasFeeStats = () => {
  const { data: stats, isLoading, error } = useGasFeeStats()

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <div className="text-center text-red-600 py-8">
          統計データの取得に失敗しました
        </div>
      </Card>
    )
  }

  const getTrendIcon = (current: number, average: number) => {
    if (current > average * 1.1) return <TrendingUp className="w-4 h-4 text-red-500" />
    if (current < average * 0.9) return <TrendingDown className="w-4 h-4 text-green-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const getTrendColor = (current: number, average: number) => {
    if (current > average * 1.1) return 'text-red-600'
    if (current < average * 0.9) return 'text-green-600'
    return 'text-gray-600'
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-eclipse-primary" />
          <h3 className="text-lg font-semibold text-gray-900">ガス料金統計</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">現在の料金</span>
              {getTrendIcon(stats.current, stats.average24h)}
            </div>
            <div className={`text-lg font-bold ${getTrendColor(stats.current, stats.average24h)}`}>
              {formatLamports(stats.current)}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-2">24時間平均</div>
            <div className="text-lg font-bold text-gray-900">
              {formatLamports(stats.average24h)}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-2">24時間最小</div>
            <div className="text-lg font-bold text-green-600">
              {formatLamports(stats.min24h)}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-2">24時間最大</div>
            <div className="text-lg font-bold text-red-600">
              {formatLamports(stats.max24h)}
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">推奨料金</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">低速 (遅い)</span>
              <span className="font-medium text-green-600">
                {formatLamports(stats.recommended.low)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">標準 (普通)</span>
              <span className="font-medium text-eclipse-primary">
                {formatLamports(stats.recommended.medium)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">高速 (速い)</span>
              <span className="font-medium text-red-600">
                {formatLamports(stats.recommended.high)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default GasFeeStats