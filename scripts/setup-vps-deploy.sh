#!/bin/bash

# VPSデプロイセットアップスクリプト
# このスクリプトはローカルマシンで実行してください

set -e

echo "🚀 VPSデプロイセットアップを開始します..."

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 入力プロンプト
read -p "VPSのホスト名またはIPアドレス: " VPS_HOST
read -p "VPSのSSHユーザー名: " VPS_USERNAME
read -p "VPSのSSHポート番号 (デフォルト: 22): " VPS_PORT
VPS_PORT=${VPS_PORT:-22}

# SSHキーの生成
echo -e "\n${YELLOW}SSHキーペアを生成します...${NC}"
SSH_KEY_PATH="$HOME/.ssh/github-actions-kanshi-eclipse"

if [ -f "$SSH_KEY_PATH" ]; then
    echo -e "${YELLOW}既存のSSHキーが見つかりました。上書きしますか？ (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "既存のキーを使用します。"
    else
        ssh-keygen -t ed25519 -C "github-actions@kanshi-eclipse" -f "$SSH_KEY_PATH" -N ""
    fi
else
    ssh-keygen -t ed25519 -C "github-actions@kanshi-eclipse" -f "$SSH_KEY_PATH" -N ""
fi

# 公開鍵をVPSに追加
echo -e "\n${YELLOW}公開鍵をVPSに追加します...${NC}"
echo "VPSのパスワードを入力してください:"
ssh-copy-id -i "$SSH_KEY_PATH.pub" -p "$VPS_PORT" "$VPS_USERNAME@$VPS_HOST"

# VPSのディレクトリ設定
echo -e "\n${YELLOW}VPSのディレクトリを設定します...${NC}"
ssh -p "$VPS_PORT" "$VPS_USERNAME@$VPS_HOST" << 'EOF'
    # デプロイディレクトリの作成
    sudo mkdir -p /var/www/vhosts/kanshi-eclipse.sho43.xyz
    
    # バックアップディレクトリの作成
    sudo mkdir -p /var/backups
    
    # 権限の設定
    sudo chown -R $USER:www-data /var/www/vhosts/kanshi-eclipse.sho43.xyz
    sudo chmod -R 755 /var/www/vhosts/kanshi-eclipse.sho43.xyz
    
    echo "ディレクトリの設定が完了しました。"
EOF

# GitHub Secretsの設定ガイド
echo -e "\n${GREEN}✅ VPSの設定が完了しました！${NC}"
echo -e "\n${YELLOW}次に、GitHubリポジトリで以下のSecretsを設定してください:${NC}"
echo ""
echo "1. GitHubリポジトリの Settings → Secrets and variables → Actions に移動"
echo "2. 'New repository secret' をクリックして以下を追加:"
echo ""
echo -e "${YELLOW}VPS_HOST:${NC} $VPS_HOST"
echo -e "${YELLOW}VPS_USERNAME:${NC} $VPS_USERNAME"
echo -e "${YELLOW}VPS_PORT:${NC} $VPS_PORT"
echo -e "${YELLOW}VPS_SSH_KEY:${NC}"
echo ""
echo "以下のコマンドで秘密鍵の内容をコピーできます:"
echo -e "${GREEN}cat $SSH_KEY_PATH | pbcopy${NC} (macOS)"
echo -e "${GREEN}cat $SSH_KEY_PATH | xclip -selection clipboard${NC} (Linux)"
echo ""

# Webサーバー設定の確認
echo -e "${YELLOW}WebサーバーはNginxとApacheのどちらを使用していますか？${NC}"
echo "1) Nginx"
echo "2) Apache"
read -p "選択してください (1/2): " WEB_SERVER

case $WEB_SERVER in
    1)
        echo -e "\n${YELLOW}Nginx設定ファイルの例:${NC}"
        cat << 'NGINX_CONFIG'
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
NGINX_CONFIG
        ;;
    2)
        echo -e "\n${YELLOW}Apache設定ファイルの例:${NC}"
        cat << 'APACHE_CONFIG'
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
APACHE_CONFIG
        ;;
esac

echo -e "\n${GREEN}セットアップが完了しました！${NC}"
echo "GitHub Secretsの設定後、以下の手順でデプロイできます："
echo ""
echo "1. GitHubの Actions タブに移動"
echo "2. 'Deploy to VPS' ワークフローを選択"
echo "3. 'Run workflow' ボタンをクリック"
echo "4. 環境を選択して実行"
echo ""
echo "または GitHub CLI を使用："
echo -e "${GREEN}gh workflow run deploy-vps.yml -f environment=production${NC}"