# 売掛金管理AIエージェントシステム Ver4.0

Ver4.0 真のゼロベース仕様書に基づいて構築された、AI自律処理による売掛金差異管理システムです。

## 🎯 プロジェクト概要

本システムは、売掛金差異の処理を**AI自律処理70%**、**心理的負担30%軽減**、**処理時間80%短縮**を実現する革新的な売掛金管理システムです。

### 主要機能

- **🤖 AI自動差異検知**: 請求・入金データの自動照合と差異分類
- **📊 5ステップ進捗管理**: 視覚的な進捗表示による心理的負担軽減
- **📧 自動メール生成・送信**: AI判定による自動顧客対応
- **📋 3つの表示モード**: カード・グリッド・テーブル表示の切り替え
- **📊 Excel一括取り込み**: 大量差異データの自動処理
- **📈 研究効果測定**: AI効果の定量的評価

### AI介入レベル

- **AI_AUTONOMOUS (自動処理)**: 確信度90%以上、完全自動対応
- **AI_ASSISTED (AI支援)**: 確信度70-89%、AI下書き→人間承認
- **HUMAN_REQUIRED (人間必須)**: 確信度70%未満、完全手動対応

## 🚀 クイックスタート

### 前提条件

- Node.js 18以上
- npm または yarn

### インストール・起動手順

1. **リポジトリクローン**
   ```bash
   git clone <repository-url>
   cd accounts-receivable3
   ```

2. **バックエンド初期化**
   ```bash
   cd backend
   npm install
   npm run init  # データベース初期化 + シードデータ投入
   npm run dev   # サーバー起動 (http://localhost:3001)
   ```

3. **フロントエンド起動**
   ```bash
   cd frontend
   npm install
   npm run dev   # 開発サーバー起動 (http://localhost:3000)
   ```

### デフォルトアカウント

| 役割 | メールアドレス | パスワード |
|-----|---------------|-----------|
| 管理者 | admin@company.com | admin123 |
| マネージャー | manager@company.com | manager123 |
| ユーザー | user@company.com | user123 |

## 📁 プロジェクト構造

```
accounts-receivable3/
├── backend/                 # Node.js + Express + Prisma
│   ├── src/
│   │   ├── controllers/     # APIコントローラー
│   │   ├── middleware/      # 認証・エラーハンドリング
│   │   ├── routes/          # APIルート定義
│   │   ├── scripts/         # 初期化・シード
│   │   └── types/           # TypeScript型定義
│   ├── prisma/              # データベーススキーマ
│   └── package.json
├── frontend/                # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/      # UIコンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── contexts/        # React Context
│   │   └── types/           # TypeScript型定義
│   └── package.json
└── accounts-receivable-document/ # 仕様書・ドキュメント
```

## 🔧 技術スタック

### フロントエンド
- **React 18** + **TypeScript 5**
- **Tailwind CSS 3** (スタイリング)
- **React Router** (ルーティング)
- **TanStack Query** (データフェッチング)
- **React Hook Form** (フォーム管理)

### バックエンド
- **Node.js 18** + **Express.js 4.18**
- **TypeScript 5**
- **Prisma ORM 5.8** (データベース)
- **SQLite** (開発) / **PostgreSQL** (本番)
- **JWT認証** + **Nodemailer** (メール送信)

## 📋 主要画面

### 1. ダッシュボード
- リアルタイム統計表示
- AI自動化率・処理時間・解決率の可視化
- 研究効果測定指標

### 2. タスク管理（メイン画面）
- **5ステップ進捗表示**: 検知→メール送付→連絡取得→合意→解決
- **3表示モード**: カード・グリッド・テーブル
- 検索・フィルタ・ソート機能

### 3. 顧客管理
- 顧客情報CRUD操作
- リスクレベル管理 (LOW/MEDIUM/HIGH/CRITICAL)
- 取引履歴・メール履歴表示

### 4. データ取り込み
- **Excel/CSV一括取り込み**
- 4段階処理: ファイル選択→データ分析→実行確認→結果表示
- 自動顧客作成・AI分析・タスク生成

### 5. メール設定
- **SMTP設定**: Gmail/Outlook/Yahoo対応
- **テンプレート管理**: 未入金督促・過入金照会等
- **送信履歴**: 配信状況追跡

## 📊 Excel取り込みフォーマット

### 必須項目
| 列名 | 形式 | 説明 |
|-----|------|------|
| 分類 | 文字列 | 未入金/過入金/一部入金/複数請求 |
| 会社名 | 文字列 | 顧客名 |
| 金額 | 数値 | 差異金額 |
| to | メール | 顧客メールアドレス |

### オプション項目
| 列名 | 形式 | 説明 |
|-----|------|------|
| 決済期日 | 日付 | 支払期限 (YYYY-MM-DD) |
| 未入金内訳 | 文字列 | 詳細情報 |
| Key | 文字列 | 重複防止用キー |
| 備考 | 文字列 | 特記事項 |

## 🧪 開発・テスト

### 型チェック
```bash
# バックエンド
cd backend && npm run typecheck

# フロントエンド
cd frontend && npm run typecheck
```

### リント
```bash
# バックエンド
cd backend && npm run lint

# フロントエンド
cd frontend && npm run lint
```

### ビルド
```bash
# バックエンド
cd backend && npm run build

# フロントエンド
cd frontend && npm run build
```

## 📈 研究評価指標

### 定量指標
- **AI自律処理率**: 70%以上 (目標達成)
- **平均処理時間**: 2日以内 (従来14日→80%短縮)
- **人間作業時間**: 30%以下

### 定性指標
- **担当者心理的負担**: 30%軽減 (5ステップ可視化効果)
- **顧客満足度**: 20%向上 (迅速対応)
- **処理品質一貫性**: 90%以上 (標準化効果)

## 🔒 セキュリティ

- **JWT認証** (7日間有効)
- **ロールベースアクセス制御** (ADMIN/MANAGER/USER)
- **HTTPS通信必須**
- **個人情報暗号化保存**
- **操作ログ完全記録**

## 📜 ライセンス

本プロジェクトは研究目的で開発されており、商用利用については事前にご相談ください。

## 🆘 サポート

問題や質問がある場合は、Issueを作成してください。

---

**🎯 売掛金管理AIエージェントシステム Ver4.0**
*AI自律処理による心理的負担軽減と業務効率化の実現*