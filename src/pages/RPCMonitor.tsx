import { useState } from 'react'
import EndpointList from '../components/RPCMonitor/EndpointList'
import HealthDashboard from '../components/RPCMonitor/HealthDashboard'
import PerformanceChart from '../components/RPCMonitor/PerformanceChart'

const RPCMonitor = () => {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">RPC状態モニター</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <HealthDashboard />
          <PerformanceChart />
        </div>
        
        <EndpointList 
          selectedEndpointId={selectedEndpointId}
          onEndpointSelect={setSelectedEndpointId}
        />
      </div>
    </div>
  )
}

export default RPCMonitor