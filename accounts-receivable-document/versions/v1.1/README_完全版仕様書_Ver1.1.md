# 入金差異管理システム Ver1.1 完全版仕様書

## 🎯 システム概要

**目的**: AIエージェントによる入金差異の自動検知・督促・解決で業務効率化と心理的負担軽減を実現

**処理能力**: AI自律処理70%・人間介入最小化・3段階エスカレーション・事前設定シナリオ対応

---

## 📊 5ステップ進捗管理システム

### ステップ1: 🔍 入金差異検知
- **機能**: AI自動検知・Excel取り込み・リアルタイム監視
- **確信度**: 85%以上で自動進行
- **対象差異**: 未入金・過入金・一部入金・複数請求混在

### ステップ2: 📧 督促メール送付済み
- **機能**: 事前設定テンプレート自動選択
- **シナリオ**: 1次督促・2次督促・最終通告
- **個人化**: 顧客情報・請求詳細・支払期限自動挿入

### ステップ3: 📞 先方連絡を取れた
- **機能**: 返信監視・電話督促スケジュール
- **AI判断**: 緊急度・金額・経過日数から電話タイミング決定
- **エスカレーション**: 30日経過で人間介入推奨

### ステップ4: 🤝 解決方法合意済み
- **機能**: 分割払い・延期・調整案の合意管理
- **記録**: 合意内容・期限・条件の構造化保存
- **監視**: 合意履行状況の自動追跡

### ステップ5: ✅ 解決済み
- **機能**: 最終確認・記録完了・統計反映
- **学習**: AI解決パターン学習・成功率向上
- **レポート**: 解決時間・手法・効果測定

---

## 🤖 AI自律処理設計

### 介入レベル3段階

#### 1. ai_autonomous (70%のケース)
```typescript
// 確信度85%以上・標準的な差異
interventionLevel: 'ai_autonomous'
autoProcessing: true
escalationStage: 1-3
```

#### 2. ai_assisted (20%のケース)
```typescript
// 確信度60-85%・複雑な状況
interventionLevel: 'ai_assisted'
humanReviewRequired: true
escalationStage: 3-4
```

#### 3. human_required (10%のケース)
```typescript
// 確信度60%未満・法的措置・高額案件
interventionLevel: 'human_required'
manualActionOnly: true
escalationStage: 4+
```

### エスカレーション判定ロジック
```typescript
const evaluateEscalation = (discrepancy) => {
  const { daysPastDue, discrepancyAmount, priority, customerRisk } = discrepancy;
  
  // Stage 1-3: AI自律処理
  if (daysPastDue <= 30 && Math.abs(discrepancyAmount) <= 500000) {
    return { stage: 1-3, level: 'ai_autonomous' };
  }
  
  // Stage 4: 人間介入推奨
  if (daysPastDue > 30 || priority === 'critical') {
    return { stage: 4, level: 'human_required' };
  }
  
  // 法的措置段階
  if (daysPastDue > 60 && Math.abs(discrepancyAmount) > 1000000) {
    return { stage: 5, level: 'human_required', action: 'legal' };
  }
};
```

---

## 📧 メールテンプレート管理システム

### テンプレート種類
- **1次督促**: 丁寧な入金確認依頼
- **2次督促**: より具体的な期限設定
- **最終通告**: 法的措置予告含む
- **過入金照会**: 返金手続き案内
- **入金確認**: 受領確認・感謝

### 変数システム
```typescript
interface EmailTemplate {
  variables: {
    customerName: string;      // {{customerName}}
    invoiceNumber: string;     // {{invoiceNumber}}
    amount: number;           // {{amount}}
    dueDate: string;          // {{dueDate}}
    daysPastDue: number;      // {{daysPastDue}}
    contactDeadline: string;  // {{contactDeadline}}
    signature: string;        // {{signature}}
  }
}
```

### 自動生成ロジック
```typescript
const generateEmail = (discrepancy, template) => {
  return template.body
    .replace('{{customerName}}', discrepancy.customer.name)
    .replace('{{amount}}', formatCurrency(discrepancy.discrepancyAmount))
    .replace('{{daysPastDue}}', discrepancy.daysPastDue.toString())
    // ... その他変数置換
};
```

---

## 📊 統計・分析機能

### リアルタイム統計6指標
1. **AI自律処理件数** - 青色・Bot アイコン
2. **人間対応必要件数** - 赤色・User アイコン  
3. **電話督促必要件数** - オレンジ色・Phone アイコン
4. **緊急対応件数** - 赤色・AlertTriangle アイコン
5. **総件数** - グレー・CheckCircle アイコン
6. **総差異額** - 黄色・Mail アイコン (万円単位)

### 処理効率測定
```typescript
const calculateEfficiency = (discrepancies) => {
  const aiResolved = discrepancies.filter(d => 
    d.interventionLevel === 'ai_autonomous' && d.status === 'resolved'
  );
  
  return {
    aiProcessingRate: (aiResolved.length / aiTotal.length) * 100,
    averageResolutionTime: calculateAverageTime(aiResolved),
    costSavings: aiResolved.length * AVERAGE_HUMAN_COST
  };
};
```

---

## 🗃️ データベース設計

### 主要テーブル
```sql
-- 差異管理テーブル
CREATE TABLE payment_discrepancies (
  id                TEXT PRIMARY KEY,
  type             TEXT NOT NULL, -- unpaid/overpaid/partial/multiple_invoices
  discrepancyAmount DECIMAL(12,2) NOT NULL,
  status           TEXT NOT NULL, -- detected/ai_analyzing/resolved等
  interventionLevel TEXT NOT NULL, -- ai_autonomous/ai_assisted/human_required
  priority         TEXT NOT NULL, -- low/medium/high/critical
  daysPastDue      INTEGER,
  aiAnalysis       JSON, -- 確信度・推奨アクション・分析結果
  importKey        TEXT, -- Excel重複防止用ハッシュ
  createdAt        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- メールテンプレート
CREATE TABLE email_templates (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  subject  TEXT NOT NULL,
  body     TEXT NOT NULL,
  type     TEXT NOT NULL, -- unpaid_reminder/overpaid_inquiry/payment_confirmation
  stage    TEXT, -- reminder/inquiry/confirmation
  variables JSON -- 使用可能変数一覧
);

-- 顧客管理
CREATE TABLE customers (
  id           TEXT PRIMARY KEY,
  code         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  paymentTerms INTEGER DEFAULT 30,
  creditLimit  DECIMAL(12,2),
  riskLevel    TEXT DEFAULT 'low' -- low/medium/high/critical
);

-- タスク管理（処理追跡用）
CREATE TABLE tasks (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL, -- UNPAID_DETECTION/EMAIL_SEND/PHONE_CALL等
  title       TEXT NOT NULL,
  status      TEXT NOT NULL, -- pending/in_progress/completed/failed
  priority    TEXT NOT NULL,
  assignedToId TEXT,
  metadata    JSON, -- 関連データ・進捗情報
  createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🖥️ フロントエンド UI設計

### 3つの表示モード

#### 1. 列表モード (推奨)
- **特徴**: 5ステップ進捗バー表示
- **情報密度**: 高・詳細情報一覧表示
- **操作性**: 編集・削除ドロップダウン
- **心理的効果**: 進捗可視化で安心感

#### 2. ブロックモード (フロー)
- **特徴**: ステップ別カテゴリ表示
- **情報密度**: 中・ステップ毎グループ化
- **操作性**: ドラッグ&ドロップ対応
- **心理的効果**: 処理の流れが直感的

#### 3. テーブルモード (管理者向け)
- **特徴**: 一覧性重視・ソート対応
- **情報密度**: 最高・コンパクト表示
- **操作性**: 一括選択・フィルタリング
- **心理的効果**: 効率性重視

### コンポーネント構成
```typescript
// メインコンポーネント
<ProgressDiscrepancyFlowBoard>
  <ProgressSteps />         // 5ステップ進捗バー
  <StatsSummary />          // 6指標統計
  <FilterControls />        // 検索・フィルター
  <ViewModeSelector />      // 表示モード切替
  
  {displayMode === 'list' && <ListItem />}
  {displayMode === 'flow' && <FlowStage />}
  {displayMode === 'table' && <DataTable />}
  
  <PaginationControls />    // ページネーション
</ProgressDiscrepancyFlowBoard>
```

---

## 🔄 API エンドポイント設計

### 差異管理
```typescript
// 差異一覧取得
GET /api/discrepancies
Query: ?status=detected&priority=high&limit=20&page=1

// 差異更新
PATCH /api/discrepancies/:id
Body: { notes, priority, status, interventionLevel }

// 差異削除
DELETE /api/discrepancies/:id

// エスカレーション評価
POST /api/discrepancies/:id/evaluate-escalation
Response: { stage, level, recommendedActions }
```

### データ取り込み
```typescript
// Excel分析
POST /api/import/analyze
Body: FormData with Excel file
Response: { preview, validation, importKey }

// 差異データ取り込み
POST /api/import/discrepancies  
Body: FormData with Excel file
Response: { imported, skipped, errors }

// テンプレートダウンロード
GET /api/import/template
Response: Excel file with proper headers
```

### メールテンプレート
```typescript
// テンプレート一覧
GET /api/email/templates
Query: ?type=unpaid_reminder&stage=reminder

// テンプレート作成
POST /api/email/templates
Body: { name, subject, body, type, stage }

// メール生成
POST /api/email/generate/:discrepancyId
Body: { templateId, customVariables }
```

---

## 🚀 技術スタック

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma (PostgreSQL/SQLite対応)
- **認証**: JWT
- **ファイル処理**: multer + xlsx
- **メール**: nodemailer
- **バックグラウンド処理**: node-cron

### Frontend  
- **Framework**: React + TypeScript
- **スタイリング**: Tailwind CSS
- **アイコン**: Lucide React
- **状態管理**: React Hooks (useState/useEffect/useMemo)
- **フォーム処理**: 標準HTML Forms
- **ファイルアップロード**: FormData

### Infrastructure
- **コンテナ**: Docker Compose
- **データベース**: PostgreSQL + Redis + MongoDB
- **開発**: tsx (TypeScript実行)
- **マイグレーション**: Prisma Migrate

---

## 📈 性能・品質指標

### 目標KPI
- **AI自律処理率**: 70%以上
- **平均解決時間**: 3日以内
- **人間介入率**: 30%以下
- **顧客満足度**: 85%以上
- **メール開封率**: 60%以上
- **レスポンス時間**: 24時間以内

### テストデータ
- **サンプル件数**: 25件の多様な差異パターン
- **顧客バリエーション**: 山田商事・田中工業・佐藤物産等
- **金額レンジ**: 1万円〜100万円
- **期限バリエーション**: 0日〜90日経過
- **優先度分布**: critical(20%) / high(30%) / medium(40%) / low(10%)

---

## ⚙️ 設定・カスタマイズ

### AI設定
```typescript
interface AIConfig {
  confidenceThreshold: 0.85,      // 自律処理開始確信度
  escalationDays: [30, 45, 60],   // エスカレーション日数
  autoEmailEnabled: true,          // 自動メール送信
  phoneCallThreshold: 500000,      // 電話督促金額閾値
  legalActionDays: 90             // 法的措置検討日数
}
```

### UI設定
```typescript
interface UIConfig {
  defaultViewMode: 'list',         // デフォルト表示モード
  itemsPerPage: 20,               // 1ページ件数
  autoRefreshInterval: 300000,     // 自動更新間隔(5分)
  priorityColors: {               // 優先度色設定
    critical: 'red',
    high: 'orange', 
    medium: 'yellow',
    low: 'green'
  }
}
```

---

## 🔒 セキュリティ・権限管理

### 認証・認可
- **JWT認証**: ログイン状態管理
- **ロールベース権限**: admin/manager/operator
- **API保護**: 全エンドポイントでトークン検証
- **データ暗号化**: 機密情報のハッシュ化

### 監査ログ
```typescript
interface AuditLog {
  userId: string,
  action: string,      // CREATE/UPDATE/DELETE/VIEW
  resource: string,    // discrepancy/customer/template
  resourceId: string,
  changes: object,     // 変更内容
  timestamp: Date,
  ipAddress: string
}
```

---

## 🎯 今後の拡張予定

### Phase 2 (Ver2.0)
- **音声認識**: 電話内容の自動記録・分析
- **チャットボット**: 顧客からの問い合わせ自動対応  
- **予測分析**: 入金遅延リスクの事前予測
- **モバイルアプリ**: 外出先からの対応

### Phase 3 (Ver3.0)
- **多言語対応**: 英語・中国語・韓国語
- **OCR連携**: 紙の支払通知書自動読み取り
- **BI連携**: Power BI・Tableau等での可視化
- **API公開**: 外部システムとの連携

---

## 📚 参考情報

### 設計思想
1. **心理的負担軽減**: 進捗可視化で安心感を提供
2. **AI First**: 人間は判断・AI は実行の役割分担
3. **段階的エスカレーション**: 穏やかな督促から徐々に強化
4. **データドリブン**: 全ての判断を数値・ロジックで根拠化
5. **ユーザビリティ**: 直感的操作・視覚的フィードバック重視

### 開発履歴
- **2025-01-26**: Ver0.1 基本機能実装
- **2025-01-26**: Ver1.1 メールテンプレート・Excel取り込み機能拡張
- **2025-01-26**: 本仕様書作成

---

*🤖 この仕様書は実装済みの完全版システムVer1.1の全機能を網羅しています*