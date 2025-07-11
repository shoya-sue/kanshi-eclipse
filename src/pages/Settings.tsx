import { useState } from 'react'
import { Settings as SettingsIcon, Palette, Database, Bell } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/Common/Tabs'
import CacheSettings from '../components/Settings/CacheSettings'
import { useTheme } from '../contexts/ThemeContext'
import NotificationSettings from '../components/PWA/NotificationSettings'
import Card from '../components/Common/Card'
import Button from '../components/Common/Button'

const Settings = () => {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('appearance')

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <SettingsIcon className="w-8 h-8 text-eclipse-primary" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">設定</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            アプリケーションの設定を管理します
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>表示</span>
            </TabsTrigger>
            <TabsTrigger value="cache" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>キャッシュ</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>通知</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="mt-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  テーマ設定
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        ライトモード
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        明るい背景色を使用します
                      </p>
                    </div>
                    <Button
                      variant={theme === 'light' ? 'primary' : 'outline'}
                      onClick={() => handleThemeChange('light')}
                      className="min-w-[80px]"
                    >
                      {theme === 'light' ? '選択中' : '選択'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        ダークモード
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        暗い背景色を使用します
                      </p>
                    </div>
                    <Button
                      variant={theme === 'dark' ? 'primary' : 'outline'}
                      onClick={() => handleThemeChange('dark')}
                      className="min-w-[80px]"
                    >
                      {theme === 'dark' ? '選択中' : '選択'}
                    </Button>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    自動テーマ切り替え
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    システムの設定に基づいて自動的にテーマが切り替わります。
                    手動で選択した場合は、その設定が優先されます。
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="cache" className="mt-6">
            <CacheSettings />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Settings