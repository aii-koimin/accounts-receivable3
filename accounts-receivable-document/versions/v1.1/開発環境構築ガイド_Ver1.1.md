# 開発環境構築ガイド Ver1.1

## 🎯 概要

入金差異管理システムVer1.1の完全な開発環境構築手順

**想定環境**: macOS/Linux/Windows (Docker対応)  
**開発言語**: TypeScript (Node.js + React)  
**データベース**: PostgreSQL + Redis + MongoDB  
**コンテナ**: Docker Compose

---

## 📋 前提条件・必要ソフトウェア

### 必須ソフトウェア
```bash
# Node.js (v18以降推奨)
node --version  # v18.17.0以降

# npm (Node.js付属)
npm --version   # 9.0.0以降

# Docker & Docker Compose
docker --version         # 20.10.0以降
docker-compose --version # 2.0.0以降

# Git
git --version   # 2.30.0以降
```

### 推奨開発ツール
```bash
# VS Code + 拡張機能
- Prisma
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets

# データベース管理ツール
- DBeaver (PostgreSQL GUI)
- Redis Insight (Redis GUI)
- MongoDB Compass (MongoDB GUI)
```

---

## 🚀 プロジェクトセットアップ

### 1. リポジトリクローン
```bash
git clone <repository-url>
cd accounts-receivable/accounts-receivable
```

### 2. 依存関係インストール
```bash
# Backend依存関係
cd backend
npm install

# Frontend依存関係  
cd ../frontend
npm install

# プロジェクトルートに戻る
cd ..
```

### 3. 環境変数設定
```bash
# backend/.env ファイル作成
cp backend/.env.example backend/.env
```

**backend/.env の設定内容:**
```env
# データベース接続
DATABASE_URL="postgresql://postgres:password@localhost:5432/ar_system?schema=public"
SQLITE_URL="file:./prisma/dev.db"  # 開発用

# Redis接続
REDIS_URL="redis://localhost:6379"

# MongoDB接続
MONGODB_URL="mongodb://localhost:27017/ar_system"

# JWT設定
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# メール設定 (開発環境はMockで十分)
SMTP_HOST="localhost"
SMTP_PORT=1025
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@ar-system.com"

# アプリケーション設定
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3002"

# AI設定 (将来の拡張用)
AI_CONFIDENCE_THRESHOLD=0.85
AUTO_EMAIL_ENABLED=true
PHONE_CALL_THRESHOLD=500000
```

**frontend/.env の設定内容:**
```env
# API接続
REACT_APP_API_BASE_URL="http://localhost:3001/api"

# 開発設定
REACT_APP_ENV="development"
REACT_APP_DEBUG=true

# UI設定
REACT_APP_DEFAULT_PAGE_SIZE=20
REACT_APP_AUTO_REFRESH_INTERVAL=300000
```

---

## 🐳 Docker環境構築

### 1. Docker Composeでデータベース起動
```bash
# プロジェクトルートで実行
docker-compose up -d postgres redis mongodb

# 起動確認
docker-compose ps
```

**docker-compose.yml の内容:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ar_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mongodb:
    image: mongo:6
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: ar_system
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  postgres_data:
  redis_data:
  mongodb_data:
```

### 2. データベース接続確認
```bash
# PostgreSQL接続テスト
docker exec -it accounts-receivable-postgres-1 psql -U postgres -d ar_system -c "SELECT version();"

# Redis接続テスト
docker exec -it accounts-receivable-redis-1 redis-cli ping

# MongoDB接続テスト
docker exec -it accounts-receivable-mongodb-1 mongosh --eval "db.version()"
```

---

## 🗃️ データベース初期化

### 1. Prismaセットアップ
```bash
cd backend

# Prismaクライアント生成
npx prisma generate

# データベーススキーマ適用
npx prisma migrate dev --name init

# または既存のマイグレーション適用
npx prisma migrate deploy
```

### 2. シードデータ投入
```bash
# サンプルデータ作成・投入
npx tsx src/scripts/seed.ts

# 投入データ確認
npx prisma studio
# または
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM payment_discrepancies;"
```

**サンプルデータ内容:**
- 顧客データ: 10社 (山田商事、田中工業、佐藤物産等)
- 請求書データ: 25件 (金額・期限バリエーション)
- 差異データ: 25件 (未入金・過入金・一部入金等)
- メールテンプレート: 5種類 (督促・照会・確認等)

---

## 🖥️ 開発サーバー起動

### 手順1: Backendサーバー起動
```bash
cd backend

# 開発サーバー起動 (ホットリロード対応)
npm run dev
# または
npx tsx src/index.ts

# 起動確認
curl http://localhost:3001/api/health
```

**期待レスポンス:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-26T17:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "email": "operational"
  }
}
```

### 手順2: Frontendサーバー起動
```bash
# 新しいターミナルで
cd frontend

# 開発サーバー起動
npm start
# または
npm run dev

# ブラウザで確認
open http://localhost:3002
```

### 手順3: 動作確認
```bash
# API動作テスト
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ar-system.com", "password": "password123"}'

# 差異データ取得テスト (認証後)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/discrepancies
```

---

## 🧪 テスト環境構築

### 1. テストデータベース準備
```bash
# テスト用データベース作成
export DATABASE_URL="file:./prisma/test.db"
npx prisma migrate dev --name test-init

# テストデータ投入
npm run test:seed
```

### 2. 単体テスト実行
```bash
# Backend テスト
cd backend
npm test

# Frontend テスト
cd ../frontend
npm test
```

### 3. E2Eテスト (オプション)
```bash
# Playwright インストール
npx playwright install

# E2Eテスト実行
npm run test:e2e
```

---

## 📊 開発ツール設定

### 1. VS Code設定 (.vscode/settings.json)
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "prisma.showPrismaDataPlatformNotification": false,
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

### 2. ESLint設定 (.eslintrc.js)
```javascript
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off'
  }
};
```

### 3. Prettier設定 (.prettierrc)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## 🔧 データ投入・管理

### 1. Excel差異データ取り込みテスト
```bash
# サンプルExcelファイルのパスを確認
ls -la accounts-receivable-document/未入金及び過入金管理テストデータ.xlsx

# API経由でテスト取り込み
curl -X POST "http://localhost:3001/api/import/analyze" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@accounts-receivable-document/未入金及び過入金管理テストデータ.xlsx"

# 実際に取り込み
curl -X POST "http://localhost:3001/api/import/discrepancies" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@accounts-receivable-document/未入金及び過入金管理テストデータ.xlsx"
```

### 2. データベース管理コマンド
```bash
# データベースリセット (開発時)
cd backend
npx prisma migrate reset

# スキーマ変更後の更新
npx prisma db push

# データエクスポート
npx prisma db seed

# 特定テーブルのデータ確認
sqlite3 prisma/dev.db "SELECT * FROM payment_discrepancies LIMIT 5;"
```

---

## 📡 API開発・テスト

### 1. API動作確認スクリプト
```bash
# test-api.sh を作成
#!/bin/bash

echo "=== API動作確認スクリプト ==="

# 1. ヘルスチェック
echo "1. ヘルスチェック"
curl -s http://localhost:3001/api/health | jq

# 2. ログイン
echo "2. 管理者ログイン"
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ar-system.com", "password": "password123"}' | jq -r '.token')

# 3. 差異データ取得
echo "3. 差異データ一覧"
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/discrepancies?limit=5" | jq

# 4. 顧客データ取得
echo "4. 顧客データ一覧"
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/customers?limit=3" | jq

# 5. メールテンプレート取得
echo "5. メールテンプレート一覧"
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/email/templates" | jq

echo "=== API動作確認完了 ==="
```

### 2. 実行・テスト
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🚨 トラブルシューティング

### よくある問題と解決法

#### 1. データベース接続エラー
```bash
# エラー: Connection refused
# 解決: Dockerコンテナが起動しているか確認
docker-compose ps

# 起動していない場合
docker-compose up -d postgres redis mongodb
```

#### 2. ポート競合エラー
```bash
# エラー: Port 3001 already in use
# 解決: 既存プロセスを停止
lsof -ti:3001 | xargs kill -9

# または別ポートを使用
PORT=3003 npm run dev
```

#### 3. Prismaスキーマエラー
```bash
# エラー: Schema not found
# 解決: マイグレーション再実行
npx prisma migrate reset
npx prisma migrate dev --name reinit
```

#### 4. 依存関係エラー
```bash
# エラー: Module not found
# 解決: node_modules再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 5. TypeScriptコンパイルエラー
```bash
# エラー: Type errors
# 解決: 型チェック実行
npm run type-check
# または
npx tsc --noEmit
```

---

## 🔄 Git開発フロー

### 1. 機能開発ブランチ作成
```bash
# メインブランチから最新を取得
git checkout main
git pull origin main

# 機能ブランチ作成
git checkout -b feature/add-new-email-template

# 開発作業...

# コミット
git add .
git commit -m "feat: 新しいメールテンプレート機能追加"

# プッシュ
git push origin feature/add-new-email-template
```

### 2. コミットメッセージ規約
```bash
# 規約: <type>: <description>
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
chore: その他の作業
```

---

## 📈 パフォーマンス最適化

### 1. 開発環境での最適化
```bash
# TypeScript高速化
echo 'TS_NODE_TRANSPILE_ONLY=true' >> backend/.env

# React高速リフレッシュ
echo 'FAST_REFRESH=true' >> frontend/.env

# ソースマップ最適化
echo 'GENERATE_SOURCEMAP=false' >> frontend/.env
```

### 2. データベース最適化
```sql
-- 開発環境での高速化設定
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 1000000;
PRAGMA temp_store = memory;
```

---

## 📚 参考情報・リンク

### 公式ドキュメント
- [Prisma Documentation](https://www.prisma.io/docs/)
- [React TypeScript Handbook](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

### 開発ツール
- [VS Code Extensions](https://marketplace.visualstudio.com/vscode)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### 追加リソース
```bash
# プロジェクト固有のドキュメント
├── accounts-receivable-document/
│   ├── README_完全版仕様書_Ver1.1.md
│   ├── API設計書_完全版_Ver1.1.md
│   ├── データベース設計書_完全版_Ver1.1.md
│   └── 未入金及び過入金管理テストデータ.xlsx
```

---

## ✅ 開発環境確認チェックリスト

### 初期セットアップ完了確認
- [ ] Node.js v18以降インストール済み
- [ ] Docker & Docker Compose起動可能
- [ ] プロジェクトクローン完了
- [ ] 依存関係インストール完了 (backend/frontend)
- [ ] 環境変数設定完了 (.env ファイル)

### データベース確認
- [ ] PostgreSQL コンテナ起動済み
- [ ] Redis コンテナ起動済み
- [ ] MongoDB コンテナ起動済み
- [ ] Prisma マイグレーション適用済み
- [ ] シードデータ投入済み

### サーバー起動確認
- [ ] Backend サーバー起動済み (http://localhost:3001)
- [ ] Frontend サーバー起動済み (http://localhost:3002)
- [ ] API ヘルスチェック正常
- [ ] 管理者ログイン成功
- [ ] 差異データ一覧表示確認

### 機能動作確認
- [ ] 5ステップ進捗表示動作
- [ ] 3つの表示モード切り替え動作
- [ ] 検索・フィルタリング動作
- [ ] 編集・削除操作動作
- [ ] Excel取り込み機能動作
- [ ] メールテンプレート管理動作

---

*🤖 この開発環境構築ガイドは実装済みシステムVer1.1の完全な構築手順です*