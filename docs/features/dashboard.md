# カスタムダッシュボード機能

## 概要

Eclipse Chain Tools のカスタムダッシュボード機能は、ユーザーが自分のニーズに合わせて情報を組み合わせて表示できる機能です。

## 機能

### 1. ウィジェット管理
- **ドラッグ&ドロップ**: ウィジェットの位置を自由に変更
- **サイズ調整**: 小・中・大の3段階でサイズを設定
- **有効/無効**: 不要なウィジェットを非表示に設定
- **追加/削除**: ウィジェットの追加や削除が可能

### 2. 利用可能なウィジェット
- **ガス料金**: 現在のガス料金と平均値を表示
- **トランザクション**: 最新のトランザクション情報
- **RPC状態**: RPCエンドポイントの健全性
- **ウォレット残高**: 接続されたウォレットの残高
- **DEX統計**: DEX取引の統計情報
- **トークン価格**: 主要トークンの価格情報

### 3. 設定管理
- **設定の保存**: ローカルストレージに設定を保存
- **エクスポート**: 設定をJSONファイルで出力
- **インポート**: 設定ファイルから復元
- **リセット**: デフォルト設定に戻す

## 技術実装

### React Beautiful DnD
```typescript
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

const handleDragEnd = (result: any) => {
  if (!result.destination) return

  const newWidgets = Array.from(widgets)
  const [reorderedItem] = newWidgets.splice(result.source.index, 1)
  newWidgets.splice(result.destination.index, 0, reorderedItem)

  onWidgetsChange(newWidgets)
}
```

### ウィジェット設定
```typescript
export interface DashboardWidget {
  id: string
  type: 'gas-fees' | 'transactions' | 'rpc-status' | 'wallet-balance' | 'dex-stats' | 'token-prices'
  title: string
  size: 'small' | 'medium' | 'large'
  enabled: boolean
  config?: Record<string, any>
}
```

### カスタムフック
```typescript
export const useDashboard = () => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem('dashboard-widgets')
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS
  })

  useEffect(() => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets))
  }, [widgets])

  return {
    widgets,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    resetToDefault,
    exportConfig,
    importConfig
  }
}
```

## ユーザーインターフェース

### グリッドレイアウト
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.widget-small { grid-column: span 1; }
.widget-medium { grid-column: span 2; }
.widget-large { grid-column: span 3; }
```

### レスポンシブデザイン
- **デスクトップ**: 4列グリッド
- **タブレット**: 2列グリッド
- **モバイル**: 1列グリッド

## 設定とカスタマイズ

### デフォルト設定
```typescript
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
```

### 設定の永続化
```typescript
// 設定の保存
localStorage.setItem('dashboard-widgets', JSON.stringify(widgets))

// 設定の読み込み
const saved = localStorage.getItem('dashboard-widgets')
const widgets = saved ? JSON.parse(saved) : DEFAULT_WIDGETS
```

## 使用方法

### 1. ウィジェットの追加
1. 設定ボタンをクリック
2. 「ウィジェットを追加」から選択
3. 追加したいウィジェットをクリック

### 2. ウィジェットの配置
1. 設定画面で「ウィジェットの配置」を確認
2. ドラッグハンドルを使って並び替え
3. サイズを選択（小・中・大）
4. 有効/無効を切り替え

### 3. 設定の管理
- **エクスポート**: 設定をJSONファイルで保存
- **インポート**: 保存した設定を読み込み
- **リセット**: デフォルト設定に戻す

## データ統合

### リアルタイムデータ
```typescript
// WebSocketからのリアルタイムデータ
const { data: gasFees, isLoading } = useGasFees()
const { data: networkStats } = useNetworkStats()
const { data: balance } = useWalletBalance()
```

### キャッシュ統合
```typescript
// IndexedDBキャッシュとの統合
const cachedData = await getCache('dashboard_data', widgetId)
if (cachedData) {
  setData(cachedData)
} else {
  const freshData = await fetchData()
  await setCache('dashboard_data', widgetId, freshData, CACHE_TTL.MEDIUM)
}
```

## パフォーマンス最適化

### 遅延読み込み
```typescript
const DashboardWidget = lazy(() => import('./DashboardWidget'))

// Suspenseでラップ
<Suspense fallback={<LoadingSpinner />}>
  <DashboardWidget widget={widget} />
</Suspense>
```

### メモ化
```typescript
const MemoizedWidget = React.memo(DashboardWidget, (prevProps, nextProps) => {
  return prevProps.widget.id === nextProps.widget.id &&
         prevProps.widget.enabled === nextProps.widget.enabled
})
```

## アクセシビリティ

### キーボードナビゲーション
- タブキーでウィジェット間を移動
- Enterキーで設定を開く
- Escapeキーで設定を閉じる

### スクリーンリーダー対応
```typescript
<div
  role="grid"
  aria-label="カスタムダッシュボード"
  aria-describedby="dashboard-description"
>
  {widgets.map((widget) => (
    <div
      key={widget.id}
      role="gridcell"
      aria-label={widget.title}
      tabIndex={0}
    >
      <DashboardWidget widget={widget} />
    </div>
  ))}
</div>
```

## 将来の拡張

### 予定されている機能
- **カスタムウィジェット**: ユーザー定義のウィジェット
- **テーマ対応**: ウィジェットごとの色設定
- **データフィルタリング**: 期間や条件での絞り込み
- **アラート機能**: 閾値に基づく通知
- **共有機能**: 設定の共有とテンプレート