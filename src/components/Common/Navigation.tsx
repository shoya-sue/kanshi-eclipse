import { Link, useLocation } from 'react-router-dom'
import { Activity, Search, Server, Wallet, ArrowLeftRight, Settings, LayoutDashboard } from 'lucide-react'

const Navigation = () => {
  const location = useLocation()
  
  const navItems = [
    {
      path: '/dashboard',
      name: 'ダッシュボード',
      icon: LayoutDashboard,
      description: 'カスタマイズ可能なダッシュボード',
    },
    {
      path: '/gas-tracker',
      name: 'ガス料金トラッカー',
      icon: Activity,
      description: 'ネットワーク手数料の推移を監視',
    },
    {
      path: '/transaction-analyzer',
      name: 'トランザクション解析',
      icon: Search,
      description: 'トランザクションの詳細情報を表示',
    },
    {
      path: '/rpc-monitor',
      name: 'RPC状態モニター',
      icon: Server,
      description: 'RPCエンドポイントの健全性を監視',
    },
    {
      path: '/wallet',
      name: 'ウォレット',
      icon: Wallet,
      description: '残高確認とトランザクション送信',
    },
    {
      path: '/dex',
      name: 'DEX取引',
      icon: ArrowLeftRight,
      description: 'トークンの交換と取引',
    },
    {
      path: '/settings',
      name: '設定',
      icon: Settings,
      description: 'アプリケーションの設定',
    },
  ]

  return (
    <nav className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
                           (location.pathname === '/' && item.path === '/dashboard')
            
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center space-x-3 px-4 py-4 border-b-2 transition-colors ${
                  isActive
                    ? 'border-eclipse-primary text-eclipse-primary bg-white dark:bg-gray-900'
                    : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="hidden md:block">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default Navigation