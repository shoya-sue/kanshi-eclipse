# Eclipse Chain Tools 仕様書

## 1. プロジェクト概要

Eclipse Chain Toolsは、Eclipse チェーンのエコシステムを支援するためのフロントエンドツール集です。Solana の SeaLevel VM を搭載した Eclipse チェーンの開発者とユーザーに向けて、以下の3つの主要ツールを提供します：

1. **ガス料金トラッカー** - ネットワーク手数料の推移を可視化
2. **トランザクション解析ツール** - トランザクションの詳細情報をデコード・表示
3. **RPC状態モニター** - ノードの健全性とパフォーマンスを監視

## 2. 技術仕様

### 2.1 技術スタック

#### フロントエンド
- **React 18** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - スタイリング
- **Vite** - ビルドツール
- **React Query** - データフェッチング・キャッシング
- **React Router** - ルーティング

#### チャートライブラリ
- **Chart.js** - グラフ表示
- **React-Chartjs-2** - React用Chart.jsラッパー

#### Web3 Integration
- **@solana/web3.js** - Solana/Eclipse チェーンとの連携
- **@solana/spl-token** - トークン操作
- **@coral-xyz/anchor** - プログラム連携（将来的に使用予定）

#### データストレージ
- **Local Storage** - 設定・履歴の保存
- **IndexedDB** - 大量データの保存（将来的に使用予定）

### 2.2 アーキテクチャ

```
src/
├── components/        # UIコンポーネント
│   ├── Common/       # 共通コンポーネント
│   ├── GasFeeTracker/
│   ├── TransactionAnalyzer/
│   └── RPCMonitor/
├── hooks/            # カスタムフック
├── services/         # ビジネスロジック・API連携
├── types/            # TypeScript型定義
├── utils/            # ユーティリティ関数
└── pages/            # ページコンポーネント
```

## 3. 機能詳細仕様

### 3.1 ガス料金トラッカー

#### 概要
ネットワーク手数料の推移を可視化し、最適な取引タイミングを提供するツールです。

#### 主要機能

##### 3.1.1 リアルタイムガス料金表示
- **更新間隔**: 15秒
- **データソース**: Eclipse RPC API
- **表示形式**: lamports および SOL 単位

##### 3.1.2 推移グラフ
- **時間範囲**: 24時間、7日間、30日間
- **グラフタイプ**: 線グラフ
- **データポイント**: 最大1440個（1分間隔）

##### 3.1.3 統計情報
- 現在の料金
- 24時間平均
- 24時間最小・最大値
- 推奨料金（低速・標準・高速）

##### 3.1.4 アラート機能
- しきい値設定（上限・下限）
- ブラウザ通知
- ローカルストレージによる設定保存

#### データ構造

```typescript
interface GasFeeData {
  timestamp: number
  fee: number
  feeType: 'transfer' | 'swap' | 'nft' | 'program'
  priority: 'low' | 'medium' | 'high'
}

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

### 3.2 トランザクション解析ツール

#### 概要
トランザクションの詳細情報を人間が読みやすい形式で表示するツールです。

#### 主要機能

##### 3.2.1 トランザクション検索
- **検索方法**: 
  - トランザクション署名による検索
  - ウォレットアドレスによる検索
- **バリデーション**: 入力値の形式チェック
- **履歴機能**: 最大10件の検索履歴

##### 3.2.2 詳細情報表示
- **基本情報**: 署名、ステータス、手数料、ブロック時刻、スロット
- **アカウント情報**: 関連するすべてのアカウント
- **インストラクション**: プログラム呼び出しの詳細
- **ログ**: 実行ログとエラー情報

##### 3.2.3 インストラクションデコード
- **対応プログラム**:
  - System Program
  - Token Program
  - Associated Token Program
  - その他の一般的なプログラム
- **デコード内容**: パラメータの解釈・表示

#### データ構造

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

interface InstructionDetail {
  programId: string
  accounts: string[]
  data: string
  decodedData?: any
  instructionType?: string
}
```

### 3.3 RPC状態モニター

#### 概要
Eclipse チェーンの RPC エンドポイントの状態とネットワーク健全性を監視するツールです。

#### 主要機能

##### 3.3.1 エンドポイント管理
- **デフォルトエンドポイント**: 主要なEclipse RPC
- **カスタムエンドポイント**: ユーザー追加可能
- **エンドポイント設定**: 名前、URL、有効/無効

##### 3.3.2 ヘルスチェック
- **チェック間隔**: 30秒
- **測定項目**:
  - 応答時間
  - 可用性
  - ブロック高度
  - 同期状況

##### 3.3.3 パフォーマンス監視
- **履歴データ**: 過去24時間の応答時間
- **統計情報**: 平均応答時間、稼働率、エラー率
- **比較機能**: 複数エンドポイントの性能比較

##### 3.3.4 アラート機能
- **オフライン検出**: エンドポイントがオフラインになった場合
- **遅延検出**: 応答時間が閾値を超えた場合
- **通知方法**: ブラウザ通知、UI上での表示

#### データ構造

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

## 4. API仕様

### 4.1 Eclipse RPC API

#### 4.1.1 基本設定
- **メインネットURL**: `https://mainnetbeta-rpc.eclipse.xyz`
- **WebSocket URL**: `wss://mainnetbeta-rpc.eclipse.xyz`
- **タイムアウト**: 5秒
- **リトライ回数**: 3回

#### 4.1.2 使用メソッド

| メソッド | 用途 | 頻度 |
|---------|------|------|
| `getSlot` | 現在のスロット取得 | 30秒間隔 |
| `getBlockHeight` | ブロック高度取得 | 30秒間隔 |
| `getTransaction` | トランザクション詳細取得 | オンデマンド |
| `getRecentPerformanceSamples` | パフォーマンス履歴取得 | 15秒間隔 |
| `getAccountInfo` | アカウント情報取得 | オンデマンド |
| `getSignaturesForAddress` | アドレス関連署名取得 | オンデマンド |

### 4.2 エラーハンドリング

#### 4.2.1 RPC エラー
- **接続エラー**: 自動リトライ
- **タイムアウト**: バックアップRPCへの切り替え
- **レート制限**: 指数バックオフ

#### 4.2.2 データ検証
- **トランザクション署名**: Base58形式、87-88文字
- **公開鍵**: Base58形式、32バイト
- **URL**: HTTP/HTTPS形式の検証

## 5. データ保存仕様

### 5.1 Local Storage

#### 5.1.1 保存データ
- **ガス料金履歴**: `gasFeeHistory` (最大24時間分)
- **アラート設定**: `gasFeeAlertSettings`
- **検索履歴**: `transactionSearchHistory` (最大10件)
- **RPC エンドポイント**: `rpcEndpoints`

#### 5.1.2 データサイズ制限
- **ガス料金履歴**: 最大1440エントリ
- **検索履歴**: 最大10エントリ
- **RPC エンドポイント**: 最大20エントリ

### 5.2 データクリーンアップ
- **自動削除**: 24時間以上古いデータ
- **手動削除**: ユーザーによるクリア機能
- **サイズ制限**: 5MB以下を維持

## 6. セキュリティ仕様

### 6.1 入力検証
- **XSS対策**: 全てのユーザー入力をサニタイズ
- **SQLインジェクション対策**: 該当なし（クライアントサイドのみ）
- **CSRF対策**: 該当なし（状態変更API なし）

### 6.2 プライバシー
- **個人情報**: 収集・保存なし
- **トラッキング**: 実装なし
- **分析**: 必要に応じて実装予定

### 6.3 権限管理
- **ブラウザ通知**: ユーザーの明示的な許可
- **Local Storage**: 同一オリジンのみアクセス可能
- **RPC アクセス**: 読み取り専用

## 7. パフォーマンス仕様

### 7.1 応答時間
- **初回ロード**: 3秒以内
- **ページ遷移**: 1秒以内
- **データ更新**: 500ms以内

### 7.2 リソース使用量
- **メモリ使用量**: 100MB以下
- **CPU使用率**: 5%以下（アイドル時）
- **ネットワーク**: 1MB/時間以下

### 7.3 最適化
- **コード分割**: ページ別のチャンク
- **キャッシュ**: React Query による自動キャッシュ
- **バンドルサイズ**: 1MB以下

## 8. 互換性仕様

### 8.1 ブラウザ対応
- **Chrome**: 80以上
- **Firefox**: 75以上
- **Safari**: 13以上
- **Edge**: 80以上

### 8.2 レスポンシブデザイン
- **デスクトップ**: 1200px以上
- **タブレット**: 768px〜1199px
- **モバイル**: 320px〜767px

### 8.3 アクセシビリティ
- **WCAG 2.1**: AA準拠
- **キーボード操作**: 全機能対応
- **スクリーンリーダー**: 対応

## 9. 運用・保守仕様

### 9.1 監視項目
- **RPC エンドポイント状態**: 自動監視
- **エラー発生率**: フロントエンド監視
- **パフォーマンス**: Core Web Vitals

### 9.2 ログ出力
- **エラーログ**: コンソール出力
- **パフォーマンスログ**: 必要に応じて実装
- **アクセスログ**: 該当なし

### 9.3 バックアップ
- **設定データ**: Local Storage (ユーザー管理)
- **履歴データ**: 自動削除（24時間）
- **ソースコード**: Git リポジトリ

## 10. 将来的な拡張計画

### 10.1 機能追加
- **ウォレット連携**: 残高確認、トランザクション送信
- **NFT 表示**: Eclipse チェーン上の NFT
- **DeFi 統合**: DEX、Lending プロトコル連携
- **多言語対応**: 英語、中国語、韓国語

### 10.2 技術改善
- **PWA 対応**: オフライン機能
- **WebSocket**: リアルタイム通信
- **GraphQL**: 効率的なデータフェッチング
- **TypeScript strict mode**: より厳密な型チェック

### 10.3 インフラ
- **CDN**: 静的ファイル配信
- **監視システム**: 運用監視
- **CI/CD**: 自動デプロイ
- **負荷分散**: 複数RPC対応

---

**更新履歴**
- 2024-01-01: 初版作成
- 2024-01-15: RPC監視機能追加
- 2024-02-01: セキュリティ仕様追加