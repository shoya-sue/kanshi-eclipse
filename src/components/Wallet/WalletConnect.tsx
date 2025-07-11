import { useState } from 'react'
import { useWallet } from '../../hooks/useWallet'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut } from 'lucide-react'
import { formatAddress } from '../../utils/formatters'
import Button from '../Common/Button'

const WalletConnect = () => {
  const { isConnected, publicKey, walletName, disconnect } = useWallet()
  const [showDropdown, setShowDropdown] = useState(false)

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString())
    }
  }

  const openInExplorer = () => {
    if (publicKey) {
      window.open(`https://eclipse.xyz/address/${publicKey.toString()}`, '_blank')
    }
  }

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <WalletMultiButton 
          className="!bg-eclipse-primary !text-white !rounded-lg !px-4 !py-2 !text-sm !font-medium hover:!bg-eclipse-primary/90 !transition-colors"
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2"
      >
        <Wallet className="w-4 h-4" />
        <span className="hidden sm:inline">
          {formatAddress(publicKey?.toString() || '', 4)}
        </span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-eclipse-primary rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{walletName}</div>
                <div className="text-sm text-gray-500">Connected</div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded truncate">
                  {publicKey?.toString()}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openInExplorer}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Explorer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="flex-1 text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}

export default WalletConnect