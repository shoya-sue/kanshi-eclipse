import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { GripVertical, Plus, X, Settings } from 'lucide-react'
import Button from '../Common/Button'

export interface DashboardWidget {
  id: string
  type: 'gas-fees' | 'transactions' | 'rpc-status' | 'wallet-balance' | 'dex-stats' | 'token-prices'
  title: string
  size: 'small' | 'medium' | 'large'
  enabled: boolean
  config?: Record<string, any>
}

interface DashboardConfigProps {
  widgets: DashboardWidget[]
  onWidgetsChange: (widgets: DashboardWidget[]) => void
  onClose: () => void
}

const WIDGET_TYPES = [
  { id: 'gas-fees', title: 'ガス料金', description: 'リアルタイムガス料金情報' },
  { id: 'transactions', title: 'トランザクション', description: '最新のトランザクション情報' },
  { id: 'rpc-status', title: 'RPC状態', description: 'RPCエンドポイントの健全性' },
  { id: 'wallet-balance', title: 'ウォレット残高', description: '接続されたウォレットの残高' },
  { id: 'dex-stats', title: 'DEX統計', description: 'DEX取引の統計情報' },
  { id: 'token-prices', title: 'トークン価格', description: 'トークンの価格情報' }
] as const

const DashboardConfig: React.FC<DashboardConfigProps> = ({
  widgets,
  onWidgetsChange,
  onClose
}) => {
  const [, setEditingWidget] = useState<string | null>(null)

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const newWidgets = Array.from(widgets)
    const [reorderedItem] = newWidgets.splice(result.source.index, 1)
    newWidgets.splice(result.destination.index, 0, reorderedItem)

    onWidgetsChange(newWidgets)
  }

  const addWidget = (type: DashboardWidget['type']) => {
    const widgetType = WIDGET_TYPES.find(w => w.id === type)
    if (!widgetType) return

    const newWidget: DashboardWidget = {
      id: `${type}-${Date.now()}`,
      type,
      title: widgetType.title,
      size: 'medium',
      enabled: true
    }

    onWidgetsChange([...widgets, newWidget])
  }

  const removeWidget = (id: string) => {
    onWidgetsChange(widgets.filter(w => w.id !== id))
  }

  const toggleWidget = (id: string) => {
    onWidgetsChange(widgets.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ))
  }

  const updateWidget = (id: string, updates: Partial<DashboardWidget>) => {
    onWidgetsChange(widgets.map(w => 
      w.id === id ? { ...w, ...updates } : w
    ))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            ダッシュボード設定
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                ウィジェットを追加
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {WIDGET_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => addWidget(type.id as DashboardWidget['type'])}
                    className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                  >
                    <Plus className="w-5 h-5 text-eclipse-primary" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {type.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {type.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                ウィジェットの配置
              </h3>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="widgets">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {widgets.map((widget, index) => (
                        <Draggable key={widget.id} draggableId={widget.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                            >
                              <div className="flex items-center space-x-3">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="w-5 h-5 text-gray-400" />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {widget.title}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      ({widget.type})
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <select
                                    value={widget.size}
                                    onChange={(e) => updateWidget(widget.id, { 
                                      size: e.target.value as DashboardWidget['size'] 
                                    })}
                                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  >
                                    <option value="small">小</option>
                                    <option value="medium">中</option>
                                    <option value="large">大</option>
                                  </select>

                                  <button
                                    onClick={() => setEditingWidget(widget.id)}
                                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => toggleWidget(widget.id)}
                                    className={`px-3 py-1 rounded text-sm font-medium ${
                                      widget.enabled
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    {widget.enabled ? '有効' : '無効'}
                                  </button>

                                  <button
                                    onClick={() => removeWidget(widget.id)}
                                    className="p-1 text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={onClose}>
            完了
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DashboardConfig