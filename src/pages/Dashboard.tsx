import { useState } from 'react'
import { LayoutDashboard, Settings, Download, Upload, RotateCcw } from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'
import DashboardWidget from '../components/Dashboard/DashboardWidget'
import DashboardConfig from '../components/Dashboard/DashboardConfig'
import Button from '../components/Common/Button'

const Dashboard = () => {
  const {
    widgets,
    setWidgets,
    resetToDefault,
    exportConfig,
    importConfig
  } = useDashboard()
  const [showConfig, setShowConfig] = useState(false)

  const handleExport = () => {
    const config = exportConfig()
    const blob = new Blob([config], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-config-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const success = importConfig(content)
      if (success) {
        alert('ダッシュボード設定をインポートしました')
      } else {
        alert('設定ファイルの形式が正しくありません')
      }
    }
    reader.readAsText(file)
  }

  const handleReset = () => {
    if (confirm('ダッシュボードをデフォルト設定にリセットしますか？')) {
      resetToDefault()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="w-8 h-8 text-eclipse-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                カスタムダッシュボード
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                お好みの情報を組み合わせて表示します
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>エクスポート</span>
            </Button>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <div className="inline-block">
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>インポート</span>
                </Button>
              </div>
            </label>

            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>リセット</span>
            </Button>

            <Button
              onClick={() => setShowConfig(true)}
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>設定</span>
            </Button>
          </div>
        </div>

        {widgets.filter(w => w.enabled).length === 0 ? (
          <div className="text-center py-16">
            <LayoutDashboard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              ウィジェットが設定されていません
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              設定ボタンからウィジェットを追加してください
            </p>
            <Button onClick={() => setShowConfig(true)}>
              ウィジェットを追加
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {widgets.map((widget) => (
              <DashboardWidget
                key={widget.id}
                widget={widget}
                onConfigChange={(config) => {
                  setWidgets(prev => prev.map(w => 
                    w.id === widget.id ? { ...w, config } : w
                  ))
                }}
              />
            ))}
          </div>
        )}

        {showConfig && (
          <DashboardConfig
            widgets={widgets}
            onWidgetsChange={setWidgets}
            onClose={() => setShowConfig(false)}
          />
        )}
      </div>
    </div>
  )
}

export default Dashboard