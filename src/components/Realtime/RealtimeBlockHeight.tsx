import { useRealtimeBlockHeight } from '../../hooks/useWebSocket'
import { formatNumber } from '../../utils/formatters'
import { TrendingUp, Clock } from 'lucide-react'

const RealtimeBlockHeight = () => {
  const { data: blockHeight, lastUpdated, isConnected } = useRealtimeBlockHeight()

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Clock className="w-4 h-4" />
        <span className="text-sm">オフライン</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <TrendingUp className="w-4 h-4 text-eclipse-primary" />
      <div className="text-sm">
        <span className="text-gray-600">ブロック高: </span>
        <span className="font-medium text-gray-900">
          {blockHeight ? formatNumber(blockHeight) : '---'}
        </span>
      </div>
      {lastUpdated > 0 && (
        <div className="text-xs text-gray-500">
          ({Math.floor((Date.now() - lastUpdated) / 1000)}秒前)
        </div>
      )}
    </div>
  )
}

export default RealtimeBlockHeight