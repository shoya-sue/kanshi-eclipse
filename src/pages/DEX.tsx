import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/Common/Tabs'
import SwapInterface from '../components/DEX/SwapInterface'
import DEXStats from '../components/DEX/DEXStats'
import TradeHistory from '../components/DEX/TradeHistory'
import { useWallet } from '@solana/wallet-adapter-react'
import WalletConnect from '../components/Wallet/WalletConnect'

const DEX = () => {
  const { publicKey } = useWallet()
  const [activeTab, setActiveTab] = useState('swap')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DEX Trading</h1>
          <p className="text-gray-600">
            Trade tokens on Eclipse using Jupiter and Raydium protocols
          </p>
        </div>

        {!publicKey ? (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600">
                Connect your wallet to start trading on Eclipse DEX
              </p>
            </div>
            <WalletConnect />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="swap">Swap</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="history">Trade History</TabsTrigger>
            </TabsList>

            <TabsContent value="swap" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <SwapInterface />
                </div>
                <div className="lg:col-span-2">
                  <DEXStats />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <DEXStats />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <TradeHistory />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

export default DEX