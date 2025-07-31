# CLAUDE.md - プロジェクト固有の指示

## 重要な指示

### Git コミット時の注意
- **絶対に Co-authored-by を付けない**
- コミットメッセージに Claude への言及を含めない
- シンプルで明確なコミットメッセージを使用する

## プロジェクト概要
Eclipse Chain Tools - Eclipseブロックチェーン用のフロントエンドツール

## 技術スタック
- React + TypeScript
- Vite
- Tailwind CSS
- Solana Web3.js
- Eclipse RPC: https://eclipse.helius-rpc.com/

## 重要な技術的詳細
- **ガストークン**: ETH（lamportsではなくwei単位）
- **基本ガス料金**: 20 Gwei
- **デプロイ**: GitHub Actions経由での手動デプロイのみ

## コマンド
- `npm run dev`: 開発サーバー起動
- `npm run build`: プロダクションビルド
- `npm run lint`: ESLintチェック
- `npm run typecheck`: TypeScriptチェック
- `npm test`: テスト実行

## デプロイ
- 手動実行のみ（自動デプロイは無効）
- GitHub Actions → Deploy to VPS → Run workflow
- デプロイ先: /var/www/vhosts/kanshi-eclipse.sho43.xyz/