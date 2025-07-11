import { Link, useLocation } from 'react-router-dom'
import { Activity, Search, Server } from 'lucide-react'

const Navigation = () => {
  const location = useLocation()
  
  const navItems = [
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
  ]

  return (
    <nav className="bg-gray-50 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
                           (location.pathname === '/' && item.path === '/gas-tracker')
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-4 border-b-2 transition-colors ${
                  isActive
                    ? 'border-eclipse-primary text-eclipse-primary bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="hidden md:block">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
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