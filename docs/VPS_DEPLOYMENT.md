# VPSサーバーへのデプロイ設定

このガイドでは、GitHub ActionsでVPSサーバーに自動デプロイする方法を説明します。

## 前提条件

1. VPSサーバーへのSSHアクセス
2. Webサーバー（Apache/Nginx）が設定済み
3. GitHubリポジトリの管理者権限

## セットアップ手順

### 1. SSHキーペアの生成

ローカルマシンで新しいSSHキーペアを生成します：

```bash
ssh-keygen -t ed25519 -C "github-actions@kanshi-eclipse" -f ~/.ssh/github-actions-deploy
```

### 2. VPSサーバーの設定

VPSサーバーにSSHでログインし、公開鍵を追加します：

```bash
# VPSサーバーで実行
mkdir -p ~/.ssh
echo "公開鍵の内容をここに貼り付け" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. ディレクトリの準備

VPSサーバーでデプロイ先ディレクトリを作成：

```bash
sudo mkdir -p /var/www/vhosts/kanshi-eclipse.sho43.xyz
sudo chown -R $USER:www-data /var/www/vhosts/kanshi-eclipse.sho43.xyz
sudo chmod -R 755 /var/www/vhosts/kanshi-eclipse.sho43.xyz
```

### 4. GitHub Secretsの設定

GitHubリポジトリで以下のSecretsを設定：

1. リポジトリページで「Settings」→「Secrets and variables」→「Actions」に移動
2. 「New repository secret」をクリック
3. 以下のSecretsを追加：

- `VPS_HOST`: VPSサーバーのIPアドレスまたはホスト名
- `VPS_USERNAME`: SSHユーザー名
- `VPS_SSH_KEY`: 秘密鍵の内容（~/.ssh/github-actions-deploy）
- `VPS_PORT`: SSHポート番号（デフォルト: 22）

### 5. Webサーバーの設定

#### Nginx設定例

```nginx
server {
    listen 80;
    server_name kanshi-eclipse.sho43.xyz;
    root /var/www/vhosts/kanshi-eclipse.sho43.xyz;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
```

#### Apache設定例

```apache
<VirtualHost *:80>
    ServerName kanshi-eclipse.sho43.xyz
    DocumentRoot /var/www/vhosts/kanshi-eclipse.sho43.xyz

    <Directory /var/www/vhosts/kanshi-eclipse.sho43.xyz>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </IfModule>
</VirtualHost>
```

### 6. HTTPS設定（推奨）

Let's EncryptでSSL証明書を取得：

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx  # Nginxの場合
# または
sudo apt install certbot python3-certbot-apache  # Apacheの場合

sudo certbot --nginx -d kanshi-eclipse.sho43.xyz  # Nginxの場合
# または
sudo certbot --apache -d kanshi-eclipse.sho43.xyz  # Apacheの場合
```

## デプロイの実行

### 手動デプロイ

GitHubのActionsタブから手動でワークフローを実行します：

1. GitHubリポジトリの「Actions」タブに移動
2. 左側のワークフロー一覧から「Deploy to VPS」を選択
3. 「Run workflow」ボタンをクリック
4. デプロイ環境を選択（production/staging）
5. オプションでデプロイメッセージを入力
6. 「Run workflow」をクリックして実行

または、GitHub CLIを使用：

```bash
gh workflow run deploy-vps.yml -f environment=production -f message="新機能のデプロイ"
```

## トラブルシューティング

### SSH接続エラー

```
Error: ssh: handshake failed: ssh: unable to authenticate
```

**解決方法：**
- SSH鍵が正しく設定されているか確認
- GitHubのSecretsに秘密鍵全体（ヘッダーとフッターを含む）が含まれているか確認

### 権限エラー

```
Error: scp: /var/www/vhosts/kanshi-eclipse.sho43.xyz/: Permission denied
```

**解決方法：**
- デプロイ先ディレクトリの所有者と権限を確認
- sudoersファイルに必要な権限を追加

### ビルドエラー

```
Error: npm ERR! code ELIFECYCLE
```

**解決方法：**
- ローカルでビルドが成功するか確認
- Node.jsのバージョンを確認
- 環境変数が正しく設定されているか確認

## セキュリティ推奨事項

1. **専用のデプロイユーザー**を作成することを推奨
2. **最小権限の原則**に従い、必要な権限のみを付与
3. **SSHポートを変更**してセキュリティを向上
4. **ファイアウォール**で不要なポートをブロック
5. **定期的なバックアップ**を設定

## 監視とログ

デプロイの履歴はGitHub Actionsのページで確認できます。
サーバー側のログは以下で確認：

```bash
# Nginxアクセスログ
sudo tail -f /var/log/nginx/access.log

# Nginxエラーログ
sudo tail -f /var/log/nginx/error.log

# デプロイユーザーのログ
sudo journalctl -u ssh -f
```