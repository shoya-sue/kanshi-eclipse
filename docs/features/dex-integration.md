# DEX統合機能

## 概要

Eclipse Chain Tools の DEX（分散型取引所）統合機能は、Jupiter と Raydium プロトコルを使用してトークンの交換と取引を行う機能を提供します。

## 機能

### 1. トークンスワップ
- **Jupiter API統合**: 最適なルートを自動選択
- **Raydium統合**: 流動性プールでの直接取引
- **リアルタイム価格取得**: 複数の価格ソースから最新価格を取得
- **スリッページ制御**: カスタマイズ可能なスリッページ許容値

### 2. 取引統計
- **24時間統計**: 取引量、手数料、ユーザー数
- **トップトークン**: 取引量による人気トークンランキング
- **価格変動**: 24時間の価格変動率

### 3. 取引履歴
- **取引記録**: 全ての取引の詳細履歴
- **フィルタリング**: 成功/失敗/保留中での絞り込み
- **エクスポート**: CSV形式でのデータエクスポート
- **Solscan統合**: トランザクションの詳細確認

## 技術実装

### API統合
```typescript
// Jupiter API - 最適ルート取得
const quote = await dexService.getQuote(
  inputMint, 
  outputMint, 
  amount, 
  slippageBps
)

// Raydium API - プール情報取得
const pools = await dexService.getRaydiumPools()
```

### ウォレット統合
```typescript
// Solana Wallet Adapter使用
const { publicKey, signTransaction } = useWallet()

// トランザクション署名と送信
const signature = await dexService.executeSwap(
  swapTransaction, 
  wallet
)
```

### 状態管理
```typescript
// React Query でのキャッシュ管理
const { data: tokenList } = useQuery({
  queryKey: ['tokenList'],
  queryFn: () => dexService.getTokenList(),
  staleTime: 5 * 60 * 1000, // 5分
})
```

## ユーザーインターフェース

### スワップインターフェース
- トークン選択ダイアログ
- 金額入力フィールド
- 価格影響とスリッページ表示
- 手数料計算

### 統計ダッシュボード
- 24時間統計の視覚化
- 人気トークンランキング
- 価格変動チャート

### 取引履歴
- 取引一覧表示
- 詳細情報ポップアップ
- エクスポート機能

## セキュリティ

### トランザクション検証
- 署名前の内容確認
- 最大スリッページ制限
- 価格影響警告

### プライベートキー保護
- ウォレットアダプターによる安全な署名
- 秘密鍵の非保存
- セキュアな通信

## 使用方法

### 1. ウォレット接続
```typescript
// ウォレット接続が必要
if (!publicKey) {
  return <WalletConnect />
}
```

### 2. トークンスワップ
1. 入力トークンを選択
2. 出力トークンを選択
3. 交換量を入力
4. スリッページ設定
5. スワップ実行

### 3. 取引履歴確認
1. 取引履歴タブを選択
2. フィルターで絞り込み
3. 詳細情報を確認
4. 必要に応じてエクスポート

## API仕様

### Jupiter API
- **Quote**: `/quote?inputMint=...&outputMint=...&amount=...`
- **Swap**: `/swap` (POST)
- **Price**: `/price?ids=...`

### Raydium API
- **Pools**: `/main/pairs`
- **Stats**: `/main/info`

## エラーハンドリング

### 一般的なエラー
- ネットワーク接続エラー
- 不十分な残高
- スリッページ超過
- トランザクション失敗

### エラー表示
```typescript
{swapMutation.error && (
  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-sm text-red-700">
      Swap failed: {swapMutation.error.message}
    </p>
  </div>
)}
```

## 設定

### 環境変数
```bash
VITE_JUPITER_API_URL=https://quote-api.jup.ag/v6
VITE_RAYDIUM_API_URL=https://api.raydium.io/v2
```

### デフォルト設定
- スリッページ: 0.5%
- 最大スリッページ: 50%
- キャッシュ時間: 5分（トークンリスト）、30秒（価格）