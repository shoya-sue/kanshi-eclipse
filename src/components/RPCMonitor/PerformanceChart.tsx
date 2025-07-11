import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { useAllRPCHealth } from '../../hooks/useRPCHealth'
import { formatNumber } from '../../utils/formatters'
import { CHART_COLORS } from '../../utils/constants'
import { BarChart3 } from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'
import Card from '../Common/Card'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const PerformanceChart = () => {
  const { data: healthData, isLoading } = useAllRPCHealth()

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    )
  }

  if (!healthData || healthData.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          パフォーマンスデータがありません
        </div>
      </Card>
    )
  }

  // Generate last 24 hours of data
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date()
    hour.setHours(hour.getHours() - (23 - i))
    return hour.getHours().toString().padStart(2, '0') + ':00'
  })

  const datasets = healthData
    .filter((health: any) => health.endpoint.isActive)
    .map((health: any, index: number) => ({
      label: health.endpoint.name,
      data: hours.map(() => {
        // Generate mock response time data based on actual average
        const baseTime = health.avgResponseTime
        const variation = Math.random() * 200 - 100
        return Math.max(50, baseTime + variation)
      }),
      borderColor: Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length],
      backgroundColor: Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length] + '20',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointRadius: 1,
      pointHoverRadius: 4,
    }))

  const chartData = {
    labels: hours,
    datasets,
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            return `${context.dataset.label}: ${formatNumber(value)}ms`
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '時刻',
        },
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '応答時間 (ms)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value) => formatNumber(Number(value)) + 'ms',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-eclipse-primary" />
            <h3 className="text-lg font-semibold text-gray-900">パフォーマンス推移</h3>
          </div>
          <div className="text-sm text-gray-500">
            過去24時間
          </div>
        </div>

        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {healthData.slice(0, 3).map((health: any) => (
            <div key={health.endpoint.id} className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {formatNumber(health.avgResponseTime)}ms
              </div>
              <div className="text-sm text-gray-600">
                {health.endpoint.name}
              </div>
              <div className="text-xs text-gray-500">
                稼働率: {(health.uptime * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default PerformanceChart