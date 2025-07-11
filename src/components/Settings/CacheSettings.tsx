import { useState } from 'react'
import { Database, Trash2, Download, RefreshCw } from 'lucide-react'
import { useDBStats, useDBMaintenance } from '../../hooks/useIndexedDB'
import Button from '../Common/Button'
import Card from '../Common/Card'
import LoadingSpinner from '../Common/LoadingSpinner'

const CacheSettings = () => {
  const { stats, loading } = useDBStats()
  const { cleanupAll, clearAll, exportAll } = useDBMaintenance()
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [lastCleanup, setLastCleanup] = useState<number>(0)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleCleanup = async () => {
    setIsCleaningUp(true)
    try {
      const cleaned = await cleanupAll()
      setLastCleanup(cleaned)
      // Refresh stats after cleanup
      window.location.reload()
    } catch (error) {
      console.error('Failed to cleanup:', error)
    } finally {
      setIsCleaningUp(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('すべてのキャッシュデータを削除しますか？この操作は取り消せません。')) {
      return
    }

    setIsClearing(true)
    try {
      await clearAll()
      // Refresh stats after clearing
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear all:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const exports = await exportAll()
      const blob = new Blob([JSON.stringify(exports, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `eclipse-cache-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-eclipse-primary" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              キャッシュ管理
            </h3>
          </div>

          {stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">総サイズ</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatBytes(stats.totalSize)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">総エントリ数</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalEntries.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  ストア別詳細
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.storesSizes).map(([store, size]) => (
                    <div key={store} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {store}
                      </span>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-900 dark:text-white">
                          {formatBytes(size)}
                        </span>
                        <span className="text-gray-500">
                          ({stats.storesEntries[store]} 件)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                <Button
                  onClick={handleCleanup}
                  loading={isCleaningUp}
                  disabled={isCleaningUp}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>期限切れを削除</span>
                </Button>

                <Button
                  onClick={handleExport}
                  loading={isExporting}
                  disabled={isExporting}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>エクスポート</span>
                </Button>

                <Button
                  onClick={handleClearAll}
                  loading={isClearing}
                  disabled={isClearing}
                  variant="outline"
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>すべて削除</span>
                </Button>
              </div>

              {lastCleanup > 0 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {lastCleanup} 件の期限切れエントリを削除しました
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            キャッシュについて
          </h4>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              • キャッシュは表示速度を向上させるためにデータを一時的に保存します
            </p>
            <p>
              • 期限切れのデータは自動的に削除されますが、手動でクリーンアップすることもできます
            </p>
            <p>
              • エクスポート機能でキャッシュデータをバックアップできます
            </p>
            <p>
              • 問題が発生した場合は「すべて削除」でキャッシュをリセットできます
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default CacheSettings