import { useRealtimeGasFees } from '../../hooks/useWebSocket'
import { formatLamports } from '../../utils/formatters'
import { Zap, TrendingUp, TrendingDown } from 'lucide-react'
import { useState, useEffect } from 'react'

const RealtimeGasFees = () => {
  const { data: gasFeeData, lastUpdated, isConnected } = useRealtimeGasFees()
  const [currentFee, setCurrentFee] = useState<number>(0)
  const [, setPreviousFee] = useState<number>(0)
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable')

  // Update current fee and calculate trend
  useEffect(() => {
    if (gasFeeData && gasFeeData.currentFee) {
      setPreviousFee(currentFee)
      setCurrentFee(gasFeeData.currentFee)
      
      if (gasFeeData.currentFee > currentFee) {
        setTrend('up')
      } else if (gasFeeData.currentFee < currentFee) {
        setTrend('down')
      } else {
        setTrend('stable')
      }
    }
  }, [gasFeeData, currentFee])

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />
      default:
        return <Zap className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-red-600'
      case 'down':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Zap className="w-4 h-4" />
        <span className="text-sm">オフライン</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      {getTrendIcon()}
      <div className="text-sm">
        <span className="text-gray-600">ガス料金: </span>
        <span className={`font-medium ${getTrendColor()}`}>
          {currentFee ? formatLamports(currentFee) : '---'}
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

export default RealtimeGasFees