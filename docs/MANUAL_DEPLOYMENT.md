# 手動デプロイガイド

このプロジェクトは手動デプロイのみをサポートしています。自動デプロイは無効化されており、意図的なデプロイのみが実行されます。

## デプロイ方法

### 1. GitHub Actions UI経由

1. GitHubリポジトリにアクセス
2. 「Actions」タブをクリック
3. 左側のワークフロー一覧から選択：
   - **Deploy to VPS**: シンプルなVPSデプロイ
   - **Secure VPS Deployment**: テスト付きの安全なデプロイ
4. 「Run workflow」ボタンをクリック
5. 必要な情報を入力：
   - **Environment**: production または staging
   - **Skip tests**: テストをスキップするか（Secureワークフローのみ）
   - **Message**: デプロイメッセージ（オプション）
6. 「Run workflow」をクリックして実行

### 2. GitHub CLI経由

```bash
# シンプルなデプロイ
gh workflow run deploy-vps.yml \
  -f environment=production \
  -f message="バグ修正のデプロイ"

# セキュアなデプロイ（テスト実行あり）
gh workflow run deploy-vps-secure.yml \
  -f environment=production \
  -f skip_tests=false \
  -f message="新機能のリリース"

# テストをスキップしてデプロイ（緊急時のみ）
gh workflow run deploy-vps-secure.yml \
  -f environment=production \
  -f skip_tests=true \
  -f message="緊急修正"
```

### 3. REST API経由

```bash
# GitHub Personal Access Tokenが必要
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR-TOKEN>" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/deploy-vps.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "environment": "production",
      "message": "APIからのデプロイ"
    }
  }'
```

## デプロイ前のチェックリスト

- [ ] ローカルでビルドが成功することを確認
- [ ] テストがすべて通ることを確認
- [ ] 環境変数が正しく設定されていることを確認
- [ ] デプロイ先のサーバーが稼働していることを確認
- [ ] 必要に応じてバックアップを取得

## デプロイ履歴の確認

1. GitHubの「Actions」タブで過去のデプロイを確認
2. 各デプロイの詳細ログを確認可能
3. 失敗した場合はエラーログから原因を特定

## ロールバック手順

デプロイに失敗した場合や問題が発生した場合：

```bash
# VPSサーバーにSSH接続
ssh username@your-vps-host

# バックアップからリストア
cd /var/www/vhosts/kanshi-eclipse.sho43.xyz
sudo tar -xzf /var/backups/kanshi-eclipse-YYYYMMDD-HHMMSS.tar.gz

# 権限を再設定
sudo chown -R www-data:www-data .
sudo chmod -R 755 .

# Webサーバーを再起動
sudo systemctl restart nginx  # または apache2
```

## セキュリティ注意事項

1. **本番環境へのデプロイは慎重に**
   - 必ずステージング環境でテストしてから本番へ
   
2. **緊急時以外はテストをスキップしない**
   - skip_tests=trueは緊急修正時のみ使用
   
3. **デプロイメッセージを活用**
   - 後から何をデプロイしたか分かるように記録

4. **定期的なバックアップ確認**
   - /var/backups/内のバックアップファイルを定期的に確認
   - 古いバックアップは適切に削除

## トラブルシューティング

### ワークフローが表示されない

```bash
# ワークフローファイルの構文チェック
yamllint .github/workflows/deploy-vps.yml

# GitHubにプッシュされているか確認
git status
git push origin main
```

### デプロイが失敗する

1. Actions タブでエラーログを確認
2. SSH接続が可能か確認
3. ディスク容量を確認
4. Webサーバーのエラーログを確認

```bash
# VPSサーバーで実行
df -h  # ディスク容量確認
sudo tail -f /var/log/nginx/error.log  # Nginxエラーログ
sudo journalctl -xe  # システムログ
```