# Eclipse Chain Tools

Eclipse チェーン用のフロントエンドツール集です。SolanaのSeaLevel VMを搭載したEclipseチェーンの開発者とユーザーに向けた実用的なツールを提供します。

## 🚀 プロジェクト概要

このプロジェクトは、Eclipseチェーンのエコシステムを支援するための3つの主要ツールを提供します：

1. **ガス料金トラッカー** - ネットワーク手数料の推移を可視化
2. **トランザクション解析ツール** - トランザクションの詳細情報をデコード・表示
3. **RPC状態モニター** - ノードの健全性とパフォーマンスを監視

## 🛠️ 技術スタック

### フロントエンド
- **React 18** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - スタイリング
- **Chart.js / Recharts** - グラフ表示
- **React Query** - データフェッチング・キャッシング

### Web3 Integration
- **@solana/web3.js** - Solana/Eclipse チェーンとの連携
- **@solana/spl-token** - トークン操作
- **@coral-xyz/anchor** - プログラム連携（必要に応じて）

### バックエンド・インフラ
- **Eclipse RPC Endpoints** - チェーンデータ取得
- **WebSocket** - リアルタイムデータ更新
- **Local Storage** - 設定・履歴の保存

## 📋 機能詳細

### 1. ガス料金トラッカー
**目的**: ネットワーク手数料の推移を可視化し、最適な取引タイミングを提供

**主要機能**:
- リアルタイムガス料金表示
- 過去24時間・7日間・30日間の推移グラフ
- 取引タイプ別の料金比較（転送、スワップ、NFT取引など）
- 料金予測・推奨値の表示
- アラート機能（閾値設定）

**技術要件**:
- Eclipse RPCからのガス料金データ取得
- 時系列データの保存・管理
- レスポンシブなグラフ表示
- 定期的なデータ更新（15秒間隔）

### 2. トランザクション解析ツール
**目的**: トランザクションの詳細情報を人間が読みやすい形式で表示

**主要機能**:
- トランザクションハッシュ検索
- 詳細情報のデコード表示
  - 基本情報（送信者、受信者、金額、手数料）
  - インストラクション詳細
  - ログ・エラー情報
  - 関連アカウント情報
- プログラム呼び出しの可視化
- トークン転送の詳細表示
- エラー解析・デバッグ支援

**技術要件**:
- Eclipse RPC APIとの連携
- トランザクション署名のデコード
- インストラクションの解析
- エラーハンドリング

### 3. RPC状態モニター
**目的**: Eclipseチェーンのノード状態とネットワーク健全性を監視

**主要機能**:
- 複数RPC エンドポイントの状態監視
- レスポンス時間の測定・表示
- ブロック高度の同期状況確認
- エンドポイント可用性の履歴
- パフォーマンス比較ダッシュボード
- 異常時のアラート機能

**技術要件**:
- 複数RPC エンドポイントへの定期的なヘルスチェック
- レスポンス時間の測定・記録
- ブロック高度の追跡
- 可用性統計の計算

## 🏗️ プロジェクト構成

```
eclipse-chain-tools/
├── src/
│   ├── components/
│   │   ├── GasFeeTracker/
│   │   │   ├── GasFeeChart.tsx
│   │   │   ├── GasFeeStats.tsx
│   │   │   └── GasFeeAlerts.tsx
│   │   ├── TransactionAnalyzer/
│   │   │   ├── TransactionSearch.tsx
│   │   │   ├── TransactionDetails.tsx
│   │   │   └── InstructionDecoder.tsx
│   │   ├── RPCMonitor/
│   │   │   ├── EndpointList.tsx
│   │   │   ├── HealthDashboard.tsx
│   │   │   └── PerformanceChart.tsx
│   │   └── Common/
│   │       ├── Header.tsx
│   │       ├── Navigation.tsx
│   │       └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── useGasFees.ts
│   │   ├── useTransaction.ts
│   │   └── useRPCHealth.ts
│   ├── services/
│   │   ├── eclipseRPC.ts
│   │   ├── gasTracker.ts
│   │   └── transactionDecoder.ts
│   ├── types/
│   │   ├── eclipse.ts
│   │   ├── transaction.ts
│   │   └── rpc.ts
│   └── utils/
│       ├── formatters.ts
│       ├── validators.ts
│       └── constants.ts
├── public/
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🚀 開発計画

### Phase 1: 基盤構築（1-2週間）
- [ ] プロジェクトセットアップ
- [ ] Eclipse RPC連携の実装
- [ ] 基本的なUI/UXデザイン
- [ ] 共通コンポーネントの開発

### Phase 2: コア機能開発（2-3週間）
- [ ] ガス料金トラッカーの実装
- [ ] トランザクション解析ツールの開発
- [ ] RPC状態モニターの構築

### Phase 3: 機能拡張・最適化（1-2週間）
- [ ] レスポンシブデザインの改善
- [ ] パフォーマンス最適化
- [ ] エラーハンドリングの強化
- [ ] テストの追加

### Phase 4: デプロイ・保守（継続）
- [ ] 本番環境へのデプロイ
- [ ] 監視・ログ設定
- [ ] ユーザーフィードバック収集
- [ ] 継続的な改善

## 🔧 セットアップ方法

### 前提条件
- Node.js 18.0.0 以上
- npm または yarn
- Eclipse チェーンのRPC エンドポイント

### インストール手順

1. リポジトリのクローン
```bash
git clone https://github.com/your-username/eclipse-chain-tools.git
cd eclipse-chain-tools
```

2. 依存関係のインストール
```bash
npm install
```

3. 環境変数の設定
```bash
cp .env.example .env
# .env ファイルを編集してEclipse RPC URLを設定
```

4. 開発サーバーの起動
```bash
npm run dev
```

## 📝 設定

### 環境変数
```env
# Eclipse Chain RPC Endpoints
REACT_APP_ECLIPSE_RPC_URL=https://mainnetbeta-rpc.eclipse.xyz
REACT_APP_ECLIPSE_WS_URL=wss://mainnetbeta-rpc.eclipse.xyz

# Optional: Additional RPC endpoints for monitoring
REACT_APP_BACKUP_RPC_URLS=https://rpc1.eclipse.xyz,https://rpc2.eclipse.xyz

# Update intervals (milliseconds)
REACT_APP_GAS_FEE_UPDATE_INTERVAL=15000
REACT_APP_RPC_HEALTH_CHECK_INTERVAL=30000
```

## 🔗 関連リンク

- [Eclipse Official Website](https://eclipse.xyz)
- [Eclipse Documentation](https://docs.eclipse.xyz)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [React Documentation](https://react.dev)

---

**Eclipse Chain Tools** - Eclipseエコシステムの発展を支援するツール集