import { useState, useEffect } from 'react'
import { usePWA } from '../../hooks/usePWA'
import { Bell, BellOff } from 'lucide-react'
import Button from '../Common/Button'
import Card from '../Common/Card'

const NotificationSettings = () => {
  const { requestNotificationPermission, showNotification } = usePWA()
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [settings, setSettings] = useState({
    gasFeeAlerts: false,
    transactionAlerts: false,
    rpcAlerts: false,
    maintenanceAlerts: true,
  })

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Failed to parse notification settings:', error)
      }
    }
  }, [])

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      setNotificationPermission('granted')
      showNotification('通知が有効になりました', {
        body: 'Eclipse Chain Tools からの通知を受信できます',
      })
    }
  }

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings))
  }

  const testNotification = () => {
    showNotification('テスト通知', {
      body: '通知は正常に動作しています！',
    })
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-eclipse-primary" />
          <h3 className="text-lg font-semibold text-gray-900">通知設定</h3>
        </div>

        {notificationPermission === 'default' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">通知を有効にする</h4>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              重要な情報をタイムリーに受け取るために、通知を有効にしてください。
            </p>
            <Button size="sm" onClick={handleRequestPermission}>
              通知を許可
            </Button>
          </div>
        )}

        {notificationPermission === 'denied' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <BellOff className="w-5 h-5 text-red-600" />
              <h4 className="font-medium text-red-900">通知がブロックされています</h4>
            </div>
            <p className="text-sm text-red-700">
              ブラウザの設定で通知を許可してください。
            </p>
          </div>
        )}

        {notificationPermission === 'granted' && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">通知が有効です</span>
                </div>
                <Button size="sm" variant="outline" onClick={testNotification}>
                  テスト通知
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">通知タイプ</h4>
              
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">ガス料金アラート</div>
                    <div className="text-sm text-gray-600">
                      料金が設定した閾値を超えた場合
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.gasFeeAlerts}
                    onChange={(e) => handleSettingChange('gasFeeAlerts', e.target.checked)}
                    className="rounded border-gray-300 text-eclipse-primary focus:ring-eclipse-primary"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">トランザクションアラート</div>
                    <div className="text-sm text-gray-600">
                      ウォレットのトランザクション完了時
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.transactionAlerts}
                    onChange={(e) => handleSettingChange('transactionAlerts', e.target.checked)}
                    className="rounded border-gray-300 text-eclipse-primary focus:ring-eclipse-primary"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">RPC状態アラート</div>
                    <div className="text-sm text-gray-600">
                      RPCエンドポイントの異常検出時
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.rpcAlerts}
                    onChange={(e) => handleSettingChange('rpcAlerts', e.target.checked)}
                    className="rounded border-gray-300 text-eclipse-primary focus:ring-eclipse-primary"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">メンテナンス通知</div>
                    <div className="text-sm text-gray-600">
                      アプリのメンテナンス情報
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceAlerts}
                    onChange={(e) => handleSettingChange('maintenanceAlerts', e.target.checked)}
                    className="rounded border-gray-300 text-eclipse-primary focus:ring-eclipse-primary"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default NotificationSettings