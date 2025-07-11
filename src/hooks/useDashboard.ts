import { useState, useEffect } from 'react'
import { DashboardWidget } from '../components/Dashboard/DashboardConfig'

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'gas-fees-1',
    type: 'gas-fees',
    title: 'ガス料金',
    size: 'medium',
    enabled: true
  },
  {
    id: 'rpc-status-1',
    type: 'rpc-status',
    title: 'RPC状態',
    size: 'medium',
    enabled: true
  },
  {
    id: 'wallet-balance-1',
    type: 'wallet-balance',
    title: 'ウォレット残高',
    size: 'medium',
    enabled: true
  },
  {
    id: 'dex-stats-1',
    type: 'dex-stats',
    title: 'DEX統計',
    size: 'large',
    enabled: true
  }
]

export const useDashboard = () => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem('dashboard-widgets')
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS
  })

  useEffect(() => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets))
  }, [widgets])

  const addWidget = (widget: DashboardWidget) => {
    setWidgets(prev => [...prev, widget])
  }

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
  }

  const updateWidget = (id: string, updates: Partial<DashboardWidget>) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, ...updates } : w
    ))
  }

  const reorderWidgets = (newOrder: DashboardWidget[]) => {
    setWidgets(newOrder)
  }

  const resetToDefault = () => {
    setWidgets(DEFAULT_WIDGETS)
  }

  const exportConfig = () => {
    const config = {
      widgets,
      exportedAt: new Date().toISOString()
    }
    return JSON.stringify(config, null, 2)
  }

  const importConfig = (jsonConfig: string) => {
    try {
      const config = JSON.parse(jsonConfig)
      if (config.widgets && Array.isArray(config.widgets)) {
        setWidgets(config.widgets)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to import dashboard config:', error)
      return false
    }
  }

  return {
    widgets,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    resetToDefault,
    exportConfig,
    importConfig,
    setWidgets
  }
}