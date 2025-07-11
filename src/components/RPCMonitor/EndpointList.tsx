import { useState } from 'react'
import { useAllRPCHealth, useRPCEndpoints, useUpdateRPCEndpoints } from '../../hooks/useRPCHealth'
import { RPCEndpoint } from '../../types/rpc'
import { formatDuration, formatNumber } from '../../utils/formatters'
import { Server, Plus, Trash2, Edit3, Check, X } from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'
import Button from '../Common/Button'
import Card from '../Common/Card'

interface EndpointListProps {
  selectedEndpointId: string | null
  onEndpointSelect: (endpointId: string) => void
}

const EndpointList = ({ selectedEndpointId, onEndpointSelect }: EndpointListProps) => {
  const { data: healthData, isLoading } = useAllRPCHealth()
  const { data: endpoints } = useRPCEndpoints()
  const updateEndpoints = useUpdateRPCEndpoints()
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newEndpoint, setNewEndpoint] = useState({ name: '', url: '' })

  const handleAddEndpoint = () => {
    if (!newEndpoint.name || !newEndpoint.url) return
    
    const endpoint: RPCEndpoint = {
      id: Date.now().toString(),
      name: newEndpoint.name,
      url: newEndpoint.url,
      isActive: true,
      lastChecked: 0,
      status: 'checking',
      responseTime: 0,
      blockHeight: 0,
    }
    
    updateEndpoints([...endpoints, endpoint])
    setNewEndpoint({ name: '', url: '' })
    setIsAdding(false)
  }

  const handleDeleteEndpoint = (id: string) => {
    updateEndpoints(endpoints.filter(ep => ep.id !== id))
  }

  const handleToggleEndpoint = (id: string) => {
    updateEndpoints(endpoints.map(ep => 
      ep.id === id ? { ...ep, isActive: !ep.isActive } : ep
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'offline': return 'bg-red-500'
      case 'checking': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'オンライン'
      case 'offline': return 'オフライン'
      case 'checking': return '確認中'
      default: return '不明'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-eclipse-primary" />
            <h3 className="text-lg font-semibold text-gray-900">RPC エンドポイント</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Plus className="w-4 h-4 mr-2" />
            エンドポイント追加
          </Button>
        </div>

        {isAdding && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名前
                </label>
                <input
                  type="text"
                  value={newEndpoint.name}
                  onChange={(e) => setNewEndpoint(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="エンドポイント名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eclipse-primary focus:border-eclipse-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={newEndpoint.url}
                  onChange={(e) => setNewEndpoint(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eclipse-primary focus:border-eclipse-primary"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleAddEndpoint}
                disabled={!newEndpoint.name || !newEndpoint.url}
              >
                <Check className="w-4 h-4 mr-2" />
                追加
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false)
                  setNewEndpoint({ name: '', url: '' })
                }}
              >
                <X className="w-4 h-4 mr-2" />
                キャンセル
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {healthData?.map((health) => (
            <div
              key={health.endpoint.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedEndpointId === health.endpoint.id
                  ? 'border-eclipse-primary bg-eclipse-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onEndpointSelect(health.endpoint.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(health.endpoint.status)}`} />
                    <span className="font-medium text-gray-900">
                      {health.endpoint.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {getStatusText(health.endpoint.status)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      応答時間: {formatNumber(health.endpoint.responseTime)}ms
                    </div>
                    <div className="text-xs text-gray-500">
                      稼働率: {(health.uptime * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleEndpoint(health.endpoint.id)
                      }}
                      className={`p-1 rounded text-sm ${
                        health.endpoint.isActive
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {health.endpoint.isActive ? 'アクティブ' : '無効'}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(health.endpoint.id)
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteEndpoint(health.endpoint.id)
                      }}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>ブロック高: {health.endpoint.blockHeight.toLocaleString()}</span>
                  <span>
                    最終確認: {health.endpoint.lastChecked 
                      ? formatDuration(Date.now() - health.endpoint.lastChecked) + '前'
                      : '未確認'
                    }
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {health.endpoint.url}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {(!healthData || healthData.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            エンドポイントがありません
          </div>
        )}
      </div>
    </Card>
  )
}

export default EndpointList