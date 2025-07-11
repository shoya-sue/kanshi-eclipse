import { useState } from 'react'
import GasFeeChart from '../components/GasFeeTracker/GasFeeChart'
import GasFeeStats from '../components/GasFeeTracker/GasFeeStats'
import GasFeeAlerts from '../components/GasFeeTracker/GasFeeAlerts'

const GasFeeTracker = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">ガス料金トラッカー</h1>
        
        <div className="flex justify-between items-center mb-6">
          <div className="space-x-2">
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-4 py-2 rounded-lg ${
                timeRange === '24h' 
                  ? 'bg-eclipse-primary text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              24時間
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-2 rounded-lg ${
                timeRange === '7d' 
                  ? 'bg-eclipse-primary text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              7日間
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-2 rounded-lg ${
                timeRange === '30d' 
                  ? 'bg-eclipse-primary text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              30日間
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <GasFeeChart timeRange={timeRange} />
          </div>
          <div className="space-y-6">
            <GasFeeStats />
            <GasFeeAlerts />
          </div>
        </div>
      </div>
    </div>
  )
}

export default GasFeeTracker