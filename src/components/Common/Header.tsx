import { useNetworkStats } from '../../hooks/useRPCHealth'
import { formatNumber } from '../../utils/formatters'
import WalletConnect from '../Wallet/WalletConnect'
import RealtimeStatus from '../Realtime/RealtimeStatus'
import RealtimeBlockHeight from '../Realtime/RealtimeBlockHeight'
import RealtimeGasFees from '../Realtime/RealtimeGasFees'
import ThemeToggle from './ThemeToggle'

const Header = () => {
  const { data: networkStats } = useNetworkStats()

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-eclipse-primary to-eclipse-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Eclipse Chain Tools</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Eclipseチェーン用ツール集</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {networkStats && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    networkStats.onlineEndpoints > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    RPC: {networkStats.onlineEndpoints}/{networkStats.totalEndpoints}
                  </span>
                </div>
                
                <div className="text-gray-600 dark:text-gray-300">
                  平均応答時間: {formatNumber(networkStats.averageResponseTime)}ms
                </div>
              </div>
            )}
            
            <div className="hidden lg:flex items-center space-x-4">
              <RealtimeBlockHeight />
              <RealtimeGasFees />
            </div>
            
            <div className="flex items-center space-x-4">
              <RealtimeStatus />
              <ThemeToggle />
              <WalletConnect />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header