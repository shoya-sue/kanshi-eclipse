import { usePWA } from '../../hooks/usePWA'
import { WifiOff } from 'lucide-react'

const OfflineIndicator = () => {
  const { isOnline } = usePWA()

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-16 left-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg z-40">
      <div className="flex items-center space-x-2">
        <WifiOff className="w-5 h-5 text-yellow-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800">
            オフラインモード
          </p>
          <p className="text-xs text-yellow-700">
            インターネット接続が利用できません。キャッシュされたデータを表示しています。
          </p>
        </div>
      </div>
    </div>
  )
}

export default OfflineIndicator