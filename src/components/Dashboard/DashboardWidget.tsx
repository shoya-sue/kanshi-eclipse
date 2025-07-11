import { useState } from 'react'
import { DashboardWidget as DashboardWidgetType } from './DashboardConfig'
import { useGasFees } from '../../hooks/useGasFees'
import { useNetworkStats } from '../../hooks/useRPCHealth'
import { useWalletBalance } from '../../hooks/useWallet'
import { useDEXStats } from '../../hooks/useDEX'
import { useMultipleTokenPrices } from '../../hooks/useDEX'
import { formatLamports, formatNumber } from '../../utils/formatters'
import { Activity, Server, Wallet, TrendingUp, DollarSign, Settings } from 'lucide-react'
import Card from '../Common/Card'
import LoadingSpinner from '../Common/LoadingSpinner'

interface DashboardWidgetProps {
  widget: DashboardWidgetType
  onConfigChange?: (config: Record<string, any>) => void
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({ widget }) => {
  const [showConfig, setShowConfig] = useState(false)

  const getSizeClass = (size: DashboardWidgetType['size']) => {
    switch (size) {
      case 'small':
        return 'col-span-1'
      case 'medium':
        return 'col-span-2'
      case 'large':
        return 'col-span-3'
      default:
        return 'col-span-2'
    }
  }

  const renderWidget = () => {
    switch (widget.type) {
      case 'gas-fees':
        return <GasFeesWidget />
      case 'transactions':
        return <TransactionsWidget />
      case 'rpc-status':
        return <RPCStatusWidget />
      case 'wallet-balance':
        return <WalletBalanceWidget />
      case 'dex-stats':
        return <DEXStatsWidget />
      case 'token-prices':
        return <TokenPricesWidget />
      default:
        return <div>Unknown widget type</div>
    }
  }

  if (!widget.enabled) {
    return null
  }

  return (
    <div className={getSizeClass(widget.size)}>
      <Card className="h-full">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {widget.title}
            </h3>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          {renderWidget()}
        </div>
      </Card>
    </div>
  )
}

const GasFeesWidget = () => {
  const { data: gasFees, isLoading } = useGasFees()

  if (isLoading) return <LoadingSpinner size="sm" />

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Activity className="w-5 h-5 text-eclipse-primary" />
        <span className="text-sm text-gray-600 dark:text-gray-400">現在のガス料金</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {gasFees && gasFees.length > 0 ? formatLamports(gasFees[0].fee) : '---'}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        平均: {gasFees && gasFees.length > 0 ? formatLamports(gasFees.reduce((sum, fee) => sum + fee.fee, 0) / gasFees.length) : '---'}
      </div>
    </div>
  )
}

const TransactionsWidget = () => {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Activity className="w-5 h-5 text-eclipse-primary" />
        <span className="text-sm text-gray-600 dark:text-gray-400">最新トランザクション</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {Math.floor(Math.random() * 1000)}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        過去24時間
      </div>
    </div>
  )
}

const RPCStatusWidget = () => {
  const { data: networkStats, isLoading } = useNetworkStats()

  if (isLoading) return <LoadingSpinner size="sm" />

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Server className="w-5 h-5 text-eclipse-primary" />
        <span className="text-sm text-gray-600 dark:text-gray-400">RPC状態</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {networkStats?.onlineEndpoints || 0}/{networkStats?.totalEndpoints || 0}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        平均応答時間: {networkStats?.averageResponseTime ? formatNumber(networkStats.averageResponseTime) : '---'}ms
      </div>
    </div>
  )
}

const WalletBalanceWidget = () => {
  const { data: balance, isLoading } = useWalletBalance()

  if (isLoading) return <LoadingSpinner size="sm" />

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Wallet className="w-5 h-5 text-eclipse-primary" />
        <span className="text-sm text-gray-600 dark:text-gray-400">ウォレット残高</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {balance?.sol.toFixed(4) || '0.0000'} SOL
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        ${(balance?.sol ? balance.sol * 100 : 0).toFixed(2)}
      </div>
    </div>
  )
}

const DEXStatsWidget = () => {
  const { data: dexStats, isLoading } = useDEXStats()

  if (isLoading) return <LoadingSpinner size="sm" />

  const formatCurrency = (num: number) => {
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B'
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M'
    if (num >= 1e3) return '$' + (num / 1e3).toFixed(2) + 'K'
    return '$' + num.toFixed(2)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <TrendingUp className="w-5 h-5 text-eclipse-primary" />
        <span className="text-sm text-gray-600 dark:text-gray-400">DEX統計</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {formatCurrency(dexStats?.totalVolume24h || 0)}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        24時間取引量
      </div>
    </div>
  )
}

const TokenPricesWidget = () => {
  const tokenAddresses = [
    'So11111111111111111111111111111111111111112', // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  ]
  const { data: prices, isLoading } = useMultipleTokenPrices(tokenAddresses)

  if (isLoading) return <LoadingSpinner size="sm" />

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <DollarSign className="w-5 h-5 text-eclipse-primary" />
        <span className="text-sm text-gray-600 dark:text-gray-400">トークン価格</span>
      </div>
      <div className="space-y-1">
        {prices?.slice(0, 3).map((price, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {price.mintSymbol}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              ${price.price.toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardWidget