# Eclipse Chain Tools API リファレンス

## 概要

このドキュメントは、Eclipse Chain Tools で使用される API、サービス、フック、およびユーティリティ関数のリファレンスです。

## 目次

1. [Services](#services)
2. [Hooks](#hooks)
3. [Types](#types)
4. [Utilities](#utilities)
5. [Components](#components)

## Services

### EclipseRPCService

Eclipse RPC との通信を管理するサービスクラスです。

#### コンストラクタ

```typescript
new EclipseRPCService(config?: Partial<EclipseRPCConfig>)
```

#### メソッド

##### `getConnection(): Promise<Connection>`
Solana Connection オブジェクトを取得します。

##### `getSlot(): Promise<number>`
現在のスロット番号を取得します。

##### `getBlockHeight(): Promise<number>`
現在のブロック高度を取得します。

##### `getTransaction(signature: string)`
トランザクションの詳細情報を取得します。

**パラメータ:**
- `signature`: トランザクション署名

**戻り値:** トランザクションオブジェクト

##### `checkRPCHealth(): Promise<HealthResult>`
RPC エンドポイントの健全性をチェックします。

**戻り値:**
```typescript
{
  isHealthy: boolean
  responseTime: number
  blockHeight: number
  error?: string
}
```

### GasTrackerService

ガス料金の追跡と統計を管理するサービスクラスです。

#### メソッド

##### `getCurrentGasFees(): Promise<GasFeeData[]>`
現在のガス料金データを取得します。

##### `getGasFeeStats(): GasFeeStats`
ガス料金の統計情報を取得します。

##### `getHistoricalData(timeRange: '24h' | '7d' | '30d'): GasFeeData[]`
指定された期間の履歴データを取得します。

##### `startAutoUpdate(interval?: number): void`
自動更新を開始します。

**パラメータ:**
- `interval`: 更新間隔（ミリ秒、デフォルト: 15000）

##### `stopAutoUpdate(): void`
自動更新を停止します。

##### `estimateTransactionFee(feeType?: 'transfer' | 'swap' | 'nft' | 'program'): Promise<number>`
トランザクションタイプに基づいて料金を推定します。

### TransactionDecoderService

トランザクションのデコードと解析を行うサービスクラスです。

#### メソッド

##### `getTransactionDetails(signature: string): Promise<TransactionDetails | null>`
トランザクションの詳細情報を取得・デコードします。

##### `getAccountInfo(address: string): Promise<AccountInfo | null>`
アカウント情報を取得します。

##### `searchTransactions(address: string, options?: SearchOptions): Promise<TransactionSearchResult[]>`
アドレスに関連するトランザクションを検索します。

**パラメータ:**
- `address`: 検索するアドレス
- `options`: 検索オプション
  - `limit`: 取得件数（デフォルト: 10）
  - `before`: 指定署名より前のトランザクション
  - `until`: 指定署名より後のトランザクション

## Hooks

### useGasFees

ガス料金データを取得するフックです。

```typescript
const { data, isLoading, error } = useGasFees(timeRange?: '24h' | '7d' | '30d')
```

**パラメータ:**
- `timeRange`: 取得する期間（デフォルト: '24h'）

**戻り値:**
- `data`: `GasFeeData[]`
- `isLoading`: ロード状態
- `error`: エラー情報

### useGasFeeStats

ガス料金の統計情報を取得するフックです。

```typescript
const { data, isLoading, error } = useGasFeeStats()
```

**戻り値:**
- `data`: `GasFeeStats`
- `isLoading`: ロード状態
- `error`: エラー情報

### useTransaction

トランザクションの詳細情報を取得するフックです。

```typescript
const { data, isLoading, error } = useTransaction(signature: string | null)
```

**パラメータ:**
- `signature`: トランザクション署名

**戻り値:**
- `data`: `TransactionDetails | null`
- `isLoading`: ロード状態
- `error`: エラー情報

### useAccountInfo

アカウント情報を取得するフックです。

```typescript
const { data, isLoading, error } = useAccountInfo(address: string | null)
```

**パラメータ:**
- `address`: アカウントアドレス

**戻り値:**
- `data`: `AccountInfo | null`
- `isLoading`: ロード状態
- `error`: エラー情報

### useTransactionSearch

トランザクション検索を行うフックです。

```typescript
const { mutate, data, isLoading, error } = useTransactionSearch()
```

**使用例:**
```typescript
mutate({ 
  address: 'アドレス', 
  options: { limit: 10 } 
})
```

### useAllRPCHealth

すべてのRPCエンドポイントの健全性データを取得するフックです。

```typescript
const { data, isLoading, error } = useAllRPCHealth()
```

**戻り値:**
- `data`: `RPCHealthData[]`
- `isLoading`: ロード状態
- `error`: エラー情報

### useNetworkStats

ネットワーク統計情報を取得するフックです。

```typescript
const { data, isLoading, error } = useNetworkStats()
```

**戻り値:**
- `data`: `NetworkStats | null`
- `isLoading`: ロード状態
- `error`: エラー情報

## Types

### GasFeeData

```typescript
interface GasFeeData {
  timestamp: number
  fee: number
  feeType: 'transfer' | 'swap' | 'nft' | 'program'
  priority: 'low' | 'medium' | 'high'
}
```

### GasFeeStats

```typescript
interface GasFeeStats {
  current: number
  average24h: number
  average7d: number
  min24h: number
  max24h: number
  recommended: {
    low: number
    medium: number
    high: number
  }
}
```

### TransactionDetails

```typescript
interface TransactionDetails {
  signature: string
  slot: number
  blockTime: number
  fee: number
  success: boolean
  err?: string
  accounts: string[]
  instructions: InstructionDetail[]
  logMessages: string[]
}
```

### InstructionDetail

```typescript
interface InstructionDetail {
  programId: string
  accounts: string[]
  data: string
  decodedData?: any
  instructionType?: string
}
```

### RPCEndpoint

```typescript
interface RPCEndpoint {
  id: string
  name: string
  url: string
  isActive: boolean
  lastChecked: number
  status: 'online' | 'offline' | 'checking'
  responseTime: number
  blockHeight: number
  version?: string
}
```

### RPCHealthData

```typescript
interface RPCHealthData {
  endpoint: RPCEndpoint
  uptime: number
  avgResponseTime: number
  errorRate: number
  historicalData: {
    timestamp: number
    responseTime: number
    isOnline: boolean
  }[]
}
```

## Utilities

### formatters.ts

#### `formatLamports(lamports: number): string`
lamports を読みやすい形式に変換します。

**例:**
```typescript
formatLamports(1000000000) // "1.000000 SOL"
formatLamports(5000) // "5000 lamports"
```

#### `formatNumber(num: number): string`
数値を読みやすい形式に変換します。

**例:**
```typescript
formatNumber(1500000) // "1.5M"
formatNumber(2500) // "2.5K"
```

#### `formatTime(timestamp: number): string`
タイムスタンプを日本語形式に変換します。

**例:**
```typescript
formatTime(1640995200) // "2022/01/01 00:00:00"
```

#### `formatDuration(ms: number): string`
ミリ秒を期間形式に変換します。

**例:**
```typescript
formatDuration(65000) // "1m 5s"
formatDuration(500) // "500ms"
```

#### `formatAddress(address: string, length?: number): string`
アドレスを省略形式に変換します。

**例:**
```typescript
formatAddress("So11111111111111111111111111111111111111112", 8)
// "So111111...11111112"
```

### validators.ts

#### `isValidPublicKey(address: string): boolean`
公開鍵の形式が正しいかチェックします。

#### `isValidTransactionSignature(signature: string): boolean`
トランザクション署名の形式が正しいかチェックします。

#### `isValidUrl(url: string): boolean`
URL の形式が正しいかチェックします。

#### `isValidRPCUrl(url: string): boolean`
RPC URL の形式が正しいかチェックします。

#### `sanitizeInput(input: string): string`
入力値をサニタイズします。

### constants.ts

#### `ECLIPSE_RPC_CONFIG`
Eclipse RPC の設定情報です。

```typescript
{
  MAINNET: {
    url: string
    websocketUrl: string
  }
  BACKUP_URLS: string[]
  TIMEOUT: number
  RETRY_COUNT: number
}
```

#### `UPDATE_INTERVALS`
更新間隔の設定です。

```typescript
{
  GAS_FEE: number
  RPC_HEALTH: number
}
```

#### `CHART_COLORS`
チャート用のカラーパレットです。

#### `GAS_FEE_LEVELS`
ガス料金のレベル定義です。

## Components

### Common Components

#### `LoadingSpinner`
ローディングスピナーコンポーネントです。

**Props:**
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'gray'
  className?: string
}
```

#### `Button`
ボタンコンポーネントです。

**Props:**
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
}
```

#### `Card`
カードコンポーネントです。

**Props:**
```typescript
interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}
```

## 使用例

### ガス料金の取得と表示

```typescript
import { useGasFees, useGasFeeStats } from '../hooks/useGasFees'
import { formatLamports } from '../utils/formatters'

const GasFeeComponent = () => {
  const { data: fees } = useGasFees('24h')
  const { data: stats } = useGasFeeStats()

  return (
    <div>
      <h2>現在のガス料金: {formatLamports(stats?.current || 0)}</h2>
      <p>24時間平均: {formatLamports(stats?.average24h || 0)}</p>
    </div>
  )
}
```

### トランザクションの検索

```typescript
import { useTransaction } from '../hooks/useTransaction'

const TransactionViewer = ({ signature }: { signature: string }) => {
  const { data: transaction, isLoading } = useTransaction(signature)

  if (isLoading) return <div>Loading...</div>
  if (!transaction) return <div>Transaction not found</div>

  return (
    <div>
      <h2>Transaction Details</h2>
      <p>Fee: {formatLamports(transaction.fee)}</p>
      <p>Status: {transaction.success ? 'Success' : 'Failed'}</p>
    </div>
  )
}
```

### RPC 健全性の監視

```typescript
import { useAllRPCHealth } from '../hooks/useRPCHealth'

const RPCHealthMonitor = () => {
  const { data: healthData } = useAllRPCHealth()

  return (
    <div>
      {healthData?.map(health => (
        <div key={health.endpoint.id}>
          <h3>{health.endpoint.name}</h3>
          <p>Status: {health.endpoint.status}</p>
          <p>Response Time: {health.endpoint.responseTime}ms</p>
          <p>Uptime: {(health.uptime * 100).toFixed(1)}%</p>
        </div>
      ))}
    </div>
  )
}
```

---

**更新履歴**
- 2024-01-01: 初版作成
- 2024-01-15: RPC監視機能のAPI追加
- 2024-02-01: 使用例セクション追加