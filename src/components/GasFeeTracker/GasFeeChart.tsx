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
import { useGasFees } from '../../hooks/useGasFees'
import { formatWei, formatTime } from '../../utils/formatters'
import { CHART_COLORS } from '../../utils/constants'
import LoadingSpinner from '../Common/LoadingSpinner'
import ErrorBoundary from '../Common/ErrorBoundary'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface GasFeeChartProps {
  timeRange: '24h' | '7d' | '30d'
}

const GasFeeChart = ({ timeRange }: GasFeeChartProps) => {
  const { data: gasFees, isLoading, error } = useGasFees(timeRange)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <p className="text-red-600">データの取得に失敗しました</p>
          <p className="text-sm text-red-500 mt-1">しばらくしてから再度お試しください</p>
        </div>
      </div>
    )
  }

  if (!gasFees || gasFees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <p className="text-gray-600">データがありません</p>
        </div>
      </div>
    )
  }

  const chartData = {
    labels: gasFees.map(fee => {
      const date = new Date(fee.timestamp)
      switch (timeRange) {
        case '24h':
          return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        case '7d':
          return date.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
        case '30d':
          return date.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
        default:
          return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      }
    }),
    datasets: [
      {
        label: 'ガス料金',
        data: gasFees.map(fee => fee.fee),
        borderColor: CHART_COLORS.primary,
        backgroundColor: CHART_COLORS.primary + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            return `ガス料金: ${formatWei(value)}`
          },
          title: (context) => {
            const index = context[0].dataIndex
            const timestamp = gasFees[index].timestamp
            return formatTime(timestamp / 1000)
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
          text: 'ガス料金 (wei)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value) => formatWei(Number(value)),
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
    <ErrorBoundary>
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">ガス料金推移</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-eclipse-primary rounded-full"></div>
            <span className="text-sm text-gray-600">ガス料金</span>
          </div>
        </div>
        
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          * 料金は過去のトランザクション実績に基づく推定値です
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default GasFeeChart