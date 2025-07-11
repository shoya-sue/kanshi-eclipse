import { useWallet } from '../hooks/useWallet'
import WalletBalance from '../components/Wallet/WalletBalance'
import WalletTransactions from '../components/Wallet/WalletTransactions'
import SendTransaction from '../components/Wallet/SendTransaction'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Wallet as WalletIcon } from 'lucide-react'

const Wallet = () => {
  const { isConnected } = useWallet()

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-eclipse-primary/10 rounded-full flex items-center justify-center mx-auto">
            <WalletIcon className="w-12 h-12 text-eclipse-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ウォレットを接続
            </h2>
            <p className="text-gray-600 mb-6">
              残高確認とトランザクション送信を行うには、ウォレットを接続してください
            </p>
          </div>
          <WalletMultiButton 
            className="!bg-eclipse-primary !text-white !rounded-lg !px-6 !py-3 !text-base !font-medium hover:!bg-eclipse-primary/90 !transition-colors"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">ウォレット</h1>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <WalletBalance />
            <WalletTransactions />
          </div>
          <div>
            <SendTransaction />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Wallet