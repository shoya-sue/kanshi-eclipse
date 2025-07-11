import { useState, useEffect } from 'react'
import { useGasFeeStats } from '../../hooks/useGasFees'
import { formatLamports } from '../../utils/formatters'
import { Bell, BellOff, Settings } from 'lucide-react'
import Card from '../Common/Card'
import Button from '../Common/Button'

interface AlertSettings {
  enabled: boolean
  lowThreshold: number
  highThreshold: number
  notificationEnabled: boolean
}

const GasFeeAlerts = () => {
  const { data: stats } = useGasFeeStats()
  const [settings, setSettings] = useState<AlertSettings>({
    enabled: false,
    lowThreshold: 5000,
    highThreshold: 15000,
    notificationEnabled: false,
  })
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('gasFeeAlertSettings')
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to parse alert settings:', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('gasFeeAlertSettings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    if (!settings.enabled || !stats) return

    const currentFee = stats.current
    
    if (currentFee <= settings.lowThreshold) {
      showNotification('ガス料金が低下しました', `現在の料金: ${formatLamports(currentFee)}`)
    } else if (currentFee >= settings.highThreshold) {
      showNotification('ガス料金が上昇しました', `現在の料金: ${formatLamports(currentFee)}`)
    }
  }, [stats, settings])

  const showNotification = (title: string, body: string) => {
    if (!settings.notificationEnabled) return
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      })
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setSettings(prev => ({ ...prev, notificationEnabled: permission === 'granted' }))
    }
  }

  const getAlertStatus = () => {
    if (!settings.enabled || !stats) return null

    const currentFee = stats.current
    
    if (currentFee <= settings.lowThreshold) {
      return { type: 'low', message: '料金が低下しています', color: 'text-green-600' }
    } else if (currentFee >= settings.highThreshold) {
      return { type: 'high', message: '料金が上昇しています', color: 'text-red-600' }
    }
    
    return { type: 'normal', message: '料金は正常範囲です', color: 'text-gray-600' }
  }

  const alertStatus = getAlertStatus()

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {settings.enabled ? (
              <Bell className="w-5 h-5 text-eclipse-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">料金アラート</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        
        {alertStatus && (
          <div className={`p-3 rounded-lg border ${
            alertStatus.type === 'low' 
              ? 'bg-green-50 border-green-200' 
              : alertStatus.type === 'high'
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className={`font-medium ${alertStatus.color}`}>
              {alertStatus.message}
            </div>
            {stats && (
              <div className="text-sm text-gray-600 mt-1">
                現在の料金: {formatLamports(stats.current)}
              </div>
            )}
          </div>
        )}
        
        {showSettings && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="alert-enabled"
                checked={settings.enabled}
                onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded border-gray-300 text-eclipse-primary focus:ring-eclipse-primary"
              />
              <label htmlFor="alert-enabled" className="text-sm font-medium text-gray-700">
                アラートを有効にする
              </label>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  低料金しきい値 (lamports)
                </label>
                <input
                  type="number"
                  value={settings.lowThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, lowThreshold: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eclipse-primary focus:border-eclipse-primary"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  高料金しきい値 (lamports)
                </label>
                <input
                  type="number"
                  value={settings.highThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, highThreshold: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eclipse-primary focus:border-eclipse-primary"
                  min="0"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notification-enabled"
                  checked={settings.notificationEnabled}
                  onChange={(e) => {
                    if (e.target.checked) {
                      requestNotificationPermission()
                    } else {
                      setSettings(prev => ({ ...prev, notificationEnabled: false }))
                    }
                  }}
                  className="rounded border-gray-300 text-eclipse-primary focus:ring-eclipse-primary"
                />
                <label htmlFor="notification-enabled" className="text-sm font-medium text-gray-700">
                  ブラウザ通知を有効にする
                </label>
              </div>
            </div>
          </div>
        )}
        
        {!settings.enabled && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-2">
              アラートを有効にして料金変動を監視
            </p>
            <Button
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, enabled: true }))}
            >
              アラートを有効にする
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

export default GasFeeAlerts