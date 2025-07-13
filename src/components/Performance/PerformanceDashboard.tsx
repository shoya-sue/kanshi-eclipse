import React, { useState } from 'react'
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw, Trash2, Settings } from 'lucide-react'
import { usePerformanceMonitor, usePerformanceThresholds, usePerformanceAlert } from '../../hooks/usePerformanceMonitor'
import { PerformanceCategory } from '../../services/performanceMonitor'
import Card from '../Common/Card'
import Button from '../Common/Button'
import LoadingSpinner from '../Common/LoadingSpinner'

const PerformanceDashboard: React.FC = () => {
  const { stats, isLoading, error, refreshStats, clearMetrics } = usePerformanceMonitor()
  const { thresholds } = usePerformanceThresholds()
  const { alerts, clearAlerts, dismissAlert } = usePerformanceAlert()
  const [selectedCategory, setSelectedCategory] = useState<PerformanceCategory | 'all'>('all')

  const getCategoryColor = (category: PerformanceCategory): string => {
    switch (category) {
      case PerformanceCategory.NETWORK:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case PerformanceCategory.RENDERING:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case PerformanceCategory.MEMORY:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case PerformanceCategory.STORAGE:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case PerformanceCategory.API_CALL:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case PerformanceCategory.BLOCKCHAIN:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
      case PerformanceCategory.WALLET:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'ms') {
      return value < 1000 ? `${value.toFixed(2)}ms` : `${(value / 1000).toFixed(2)}s`
    }
    if (unit === 'bytes') {
      if (value < 1024) return `${value}B`
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(2)}KB`
      if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(2)}MB`
      return `${(value / 1024 / 1024 / 1024).toFixed(2)}GB`
    }
    return `${value.toFixed(2)}${unit}`
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const filteredRecentMetrics = stats?.recentMetrics.filter(metric => 
    selectedCategory === 'all' || metric.category === selectedCategory
  ) || []

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
          <AlertTriangle className="w-5 h-5" />
          <span>パフォーマンスデータの読み込みに失敗しました: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            パフォーマンス監視
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={refreshStats}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>更新</span>
          </Button>
          <Button
            variant="outline"
            onClick={clearMetrics}
            className="flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>クリア</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-l-4 border-red-500">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                パフォーマンス警告 ({alerts.length})
              </h2>
            </div>
            <Button variant="secondary" onClick={clearAlerts}>
              すべて削除
            </Button>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    {alert.metric.name}: {formatValue(alert.metric.value, alert.metric.unit)}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    閾値: {formatValue(alert.threshold.threshold, alert.metric.unit)}
                  </p>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">総メトリクス数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalMetrics || 0}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">アクティブな閾値</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {thresholds.filter(t => t.enabled).length}
              </p>
            </div>
            <Settings className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">警告数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {alerts.length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">平均API応答時間</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.averageValues.api_response_time 
                  ? formatValue(stats.averageValues.api_response_time, 'ms')
                  : 'N/A'
                }
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          カテゴリー別メトリクス分布
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats?.categories || {}).map(([category, count]) => (
            <div
              key={category}
              className={`p-4 rounded-lg ${getCategoryColor(category as PerformanceCategory)}`}
            >
              <p className="text-sm font-medium">{category}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Trends */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          パフォーマンス傾向
        </h2>
        <div className="space-y-3">
          {stats?.trends.map((trend) => (
            <div key={trend.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-white">
                {trend.name}
              </span>
              <div className="flex items-center space-x-2">
                {getTrendIcon(trend.trend)}
                <span className={`text-sm font-medium ${
                  trend.trend === 'up' ? 'text-red-600' : 
                  trend.trend === 'down' ? 'text-green-600' : 
                  'text-gray-600'
                }`}>
                  {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Metrics */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            最近のメトリクス
          </h2>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as PerformanceCategory | 'all')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">すべて</option>
            {Object.values(PerformanceCategory).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="パフォーマンスメトリクス一覧">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">名前</th>
                <th scope="col" className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">値</th>
                <th scope="col" className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">カテゴリー</th>
                <th scope="col" className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">時刻</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecentMetrics.map((metric) => (
                <tr key={metric.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{metric.name}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">
                    {formatValue(metric.value, metric.unit)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(metric.category)}`}>
                      {metric.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default PerformanceDashboard