import { useWebSocket } from '../../hooks/useWebSocket'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'

const RealtimeStatus = () => {
  const { connectionState, error } = useWebSocket()

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />
      case 'connecting':
        return <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'リアルタイム'
      case 'connecting':
        return '接続中'
      case 'disconnected':
        return '切断済み'
      default:
        return '不明'
    }
  }

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'text-green-600'
      case 'connecting':
        return 'text-yellow-600'
      case 'disconnected':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {getStatusIcon()}
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {error && (
        <div className="text-xs text-red-600" title={error.message}>
          エラー
        </div>
      )}
    </div>
  )
}

export default RealtimeStatus