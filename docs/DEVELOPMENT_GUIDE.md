# Eclipse Chain Tools 開発ガイド

## 概要

このドキュメントは、Eclipse Chain Tools の開発に参加する開発者向けのガイドです。プロジェクトの構造、開発フロー、コーディング規約、テスト方法などを説明しています。

## 目次

1. [開発環境セットアップ](#開発環境セットアップ)
2. [プロジェクト構造](#プロジェクト構造)
3. [開発フロー](#開発フロー)
4. [コーディング規約](#コーディング規約)
5. [テスト](#テスト)
6. [デプロイメント](#デプロイメント)
7. [トラブルシューティング](#トラブルシューティング)

## 開発環境セットアップ

### 必要な環境

- **Node.js**: 18.0.0 以上
- **npm**: 9.0.0 以上 または **yarn**: 1.22.0 以上
- **Git**: 2.30.0 以上

### インストール手順

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/your-username/eclipse-chain-tools.git
   cd eclipse-chain-tools
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   ```

3. **環境変数の設定**
   ```bash
   cp .env.example .env
   # .env ファイルを編集して必要な設定を行う
   ```

4. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

### 推奨開発ツール

- **VSCode**: 推奨エディタ
- **ESLint**: コードリンティング
- **Prettier**: コードフォーマット
- **TypeScript**: 型チェック

### VSCode 拡張機能

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

## プロジェクト構造

```
eclipse-chain-tools/
├── src/
│   ├── components/           # UIコンポーネント
│   │   ├── Common/          # 共通コンポーネント
│   │   ├── GasFeeTracker/   # ガス料金トラッカー
│   │   ├── TransactionAnalyzer/ # トランザクション解析
│   │   └── RPCMonitor/      # RPC監視
│   ├── hooks/               # カスタムフック
│   ├── services/            # ビジネスロジック
│   ├── types/               # TypeScript型定義
│   ├── utils/               # ユーティリティ関数
│   ├── pages/               # ページコンポーネント
│   ├── App.tsx             # メインアプリケーション
│   └── main.tsx            # エントリーポイント
├── public/                  # 静的ファイル
├── docs/                    # ドキュメント
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

### ディレクトリ別の役割

#### `/src/components/`
再利用可能なUIコンポーネントを配置します。

- **Common/**: 全体で使用される共通コンポーネント
- **機能別/**: 各機能に特化したコンポーネント

#### `/src/hooks/`
カスタムフックを配置します。データフェッチング、状態管理、副作用の処理を行います。

#### `/src/services/`
ビジネスロジックとAPI通信を行うサービスクラスを配置します。

#### `/src/types/`
TypeScript の型定義を配置します。

#### `/src/utils/`
ユーティリティ関数を配置します。フォーマット、バリデーション、定数などを含みます。

## 開発フロー

### Git ワークフロー

1. **機能ブランチの作成**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **開発作業**
   - コードの実装
   - テストの作成
   - ドキュメントの更新

3. **コミット**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **プッシュとプルリクエスト**
   ```bash
   git push origin feature/new-feature
   # GitHub でプルリクエストを作成
   ```

### コミットメッセージ規約

Conventional Commits を使用します。

```
<type>(<scope>): <description>

<body>

<footer>
```

#### Type
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: スタイル変更
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: その他

#### 例
```
feat(gas-tracker): add real-time gas fee updates

- Add WebSocket connection for real-time updates
- Implement auto-refresh mechanism
- Add user preference for update intervals

Closes #123
```

## コーディング規約

### TypeScript

#### 型定義
```typescript
// Good
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

// Bad
interface User {
  id: any
  name: any
  email: any
  createdAt: any
}
```

#### 関数定義
```typescript
// Good
const getUserById = async (id: string): Promise<User | null> => {
  // implementation
}

// Bad
const getUserById = async (id) => {
  // implementation
}
```

### React

#### コンポーネント定義
```typescript
// Good
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false 
}) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  )
}

export default Button
```

#### フック使用
```typescript
// Good
const useGasFees = (timeRange: string) => {
  const [fees, setFees] = useState<GasFeeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true)
        const data = await gasTrackerService.getHistoricalData(timeRange)
        setFees(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchFees()
  }, [timeRange])

  return { fees, loading, error }
}
```

### CSS/Tailwind

#### クラス名の順序
```tsx
// Good
<div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
  {/* content */}
</div>

// Bad
<div className="shadow-sm rounded-lg border-gray-200 bg-white border flex p-4 justify-between items-center">
  {/* content */}
</div>
```

#### レスポンシブデザイン
```tsx
// Good
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* content */}
</div>
```

## テスト

### テストの種類

1. **Unit Tests**: 個別の関数・コンポーネントのテスト
2. **Integration Tests**: 複数のコンポーネントの連携テスト
3. **E2E Tests**: エンドツーエンドテスト

### テストフレームワーク

- **Vitest**: 単体テスト
- **React Testing Library**: Reactコンポーネントテスト
- **Playwright**: E2Eテスト

### テストコマンド

```bash
# 単体テスト実行
npm run test

# カバレッジ測定
npm run test:coverage

# E2Eテスト実行
npm run test:e2e
```

### テスト例

#### コンポーネントテスト
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button onClick={() => {}}>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    screen.getByRole('button').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

#### フックテスト
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useGasFees } from './useGasFees'

describe('useGasFees', () => {
  it('fetches gas fees data', async () => {
    const { result } = renderHook(() => useGasFees('24h'))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.fees).toBeDefined()
    expect(result.current.error).toBeNull()
  })
})
```

## デプロイメント

### ビルドコマンド

```bash
# 本番ビルド
npm run build

# プレビュー
npm run preview

# 型チェック
npm run typecheck

# リンティング
npm run lint
```

### 環境変数

#### 開発環境
```env
VITE_ECLIPSE_RPC_URL=https://mainnetbeta-rpc.eclipse.xyz
VITE_ECLIPSE_WS_URL=wss://mainnetbeta-rpc.eclipse.xyz
VITE_GAS_FEE_UPDATE_INTERVAL=15000
VITE_RPC_HEALTH_CHECK_INTERVAL=30000
```

#### 本番環境
```env
VITE_ECLIPSE_RPC_URL=https://mainnetbeta-rpc.eclipse.xyz
VITE_ECLIPSE_WS_URL=wss://mainnetbeta-rpc.eclipse.xyz
VITE_GAS_FEE_UPDATE_INTERVAL=15000
VITE_RPC_HEALTH_CHECK_INTERVAL=30000
```

### デプロイメント手順

1. **ビルドの実行**
   ```bash
   npm run build
   ```

2. **成果物の確認**
   ```bash
   npm run preview
   ```

3. **本番環境への配置**
   - Static hosting service にアップロード
   - CDN 設定
   - ドメイン設定

## トラブルシューティング

### よくある問題

#### 1. RPC 接続エラー
```
Error: Failed to connect to RPC endpoint
```

**解決方法:**
- 環境変数の確認
- ネットワーク接続の確認
- RPC エンドポイントの状態確認

#### 2. TypeScript エラー
```
Type 'string' is not assignable to type 'number'
```

**解決方法:**
- 型定義の確認
- 型変換の実装
- 型ガードの使用

#### 3. メモリリーク
```
Warning: Can't perform a React state update on an unmounted component
```

**解決方法:**
```typescript
useEffect(() => {
  let isMounted = true
  
  const fetchData = async () => {
    const data = await apiCall()
    if (isMounted) {
      setData(data)
    }
  }
  
  fetchData()
  
  return () => {
    isMounted = false
  }
}, [])
```

### デバッグ方法

#### 1. ブラウザ開発者ツール
- Console でエラーログを確認
- Network タブでAPI呼び出しを確認
- Performance タブでパフォーマンスを測定

#### 2. React Developer Tools
- コンポーネントの状態確認
- Props の確認
- Re-render の追跡

#### 3. Redux DevTools
- 状態の変更履歴
- Time travel debugging
- Action の確認

### パフォーマンス最適化

#### 1. バンドルサイズ
```bash
# バンドルサイズ分析
npm run build -- --analyze
```

#### 2. コード分割
```typescript
// Lazy loading
const LazyComponent = React.lazy(() => import('./LazyComponent'))

// Route-based code splitting
const Home = React.lazy(() => import('./pages/Home'))
const About = React.lazy(() => import('./pages/About'))
```

#### 3. メモ化
```typescript
// React.memo
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>
})

// useMemo
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

// useCallback
const handleClick = useCallback(() => {
  doSomething()
}, [dependency])
```

## 貢献ガイド

### プルリクエスト

1. **Issue の確認**: 関連する Issue があるか確認
2. **ブランチ作成**: 機能ブランチを作成
3. **実装**: 機能の実装とテストの追加
4. **ドキュメント**: 必要に応じてドキュメントを更新
5. **PR作成**: 詳細な説明とともにPRを作成

### コードレビュー

レビュー観点:
- コードの品質
- テストの網羅性
- パフォーマンス
- セキュリティ
- ユーザビリティ

### リリースプロセス

1. **機能の完成**: すべての機能が実装・テスト済み
2. **ドキュメント更新**: 仕様書・API リファレンスの更新
3. **バージョン更新**: package.json のバージョンアップ
4. **タグ作成**: Git タグの作成
5. **リリース**: 本番環境への配置

---

**更新履歴**
- 2024-01-01: 初版作成
- 2024-01-15: テストセクション追加
- 2024-02-01: デプロイメント手順追加