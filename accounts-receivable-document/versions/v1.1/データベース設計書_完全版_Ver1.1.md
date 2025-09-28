# データベース設計書 完全版 Ver1.1

## 🎯 概要

入金差異管理システムの完全データベース設計・実装済みスキーマ定義

**ORM**: Prisma  
**メインDB**: PostgreSQL (本番環境) / SQLite (開発環境)  
**キャッシュ**: Redis  
**ドキュメント**: MongoDB (将来拡張用)

---

## 📊 ER図・テーブル関係

```
[User] --------< [PaymentDiscrepancy]
   |                      |
   |                      |----< [DiscrepancyAction]
   |                      |----< [Task]
   |                      |----< [EmailLog]
   |
   |----< [EmailTemplate]
   |----< [ImportHistory]

[Customer] ----< [Invoice] ----< [Payment]
    |                |              |
    |                |              |
    |----< [PaymentDiscrepancy] <---|

[EmailTemplate] ----< [EmailLog]
```

---

## 🗃️ テーブル定義 (Prisma Schema)

### User (ユーザー管理)
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  passwordHash String
  name        String?
  role        String   @default("admin") // admin/manager/operator
  isActive    Boolean  @default(true)
  lastLoginAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  paymentDiscrepancies PaymentDiscrepancy[]
  tasks               Task[]
  emailLogs           EmailLog[]
  importHistory       ImportHistory[]

  @@map("users")
}
```

### Customer (顧客管理)
```prisma
model Customer {
  id            String   @id @default(cuid())
  code          String   @unique // CUST001, CUST002, etc.
  name          String
  email         String?
  phone         String?
  address       String?
  contactPerson String?
  paymentTerms  Int      @default(30) // 支払期限（日数）
  creditLimit   Decimal  @default(0) // 与信限度額
  riskLevel     String   @default("low") // low/medium/high/critical
  isActive      Boolean  @default(true)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  invoices             Invoice[]
  payments             Payment[]
  paymentDiscrepancies PaymentDiscrepancy[]

  @@map("customers")
}
```

### Invoice (請求書管理)
```prisma
model Invoice {
  id          String   @id @default(cuid())
  number      String   @unique // INV-2025-001
  customerId  String
  amount      Decimal
  dueDate     DateTime
  issueDate   DateTime @default(now())
  status      String   @default("pending") // pending/paid/partial/overdue
  description String?
  metadata    Json?    // 追加情報・カスタムフィールド
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  customer             Customer             @relation(fields: [customerId], references: [id])
  payments             Payment[]
  paymentDiscrepancies PaymentDiscrepancy[]

  @@map("invoices")
}
```

### Payment (入金管理)
```prisma
model Payment {
  id          String   @id @default(cuid())
  customerId  String
  invoiceId   String?  // 複数請求の場合はnull
  amount      Decimal
  paidDate    DateTime
  method      String?  // bank_transfer/credit_card/cash/check
  reference   String?  // 振込名義・参照番号
  notes       String?
  isReconciled Boolean @default(false) // 照合済みフラグ
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  customer             Customer             @relation(fields: [customerId], references: [id])
  invoice              Invoice?             @relation(fields: [invoiceId], references: [id])
  paymentDiscrepancies PaymentDiscrepancy[]

  @@map("payments")
}
```

### PaymentDiscrepancy (入金差異管理) ⭐ メインテーブル
```prisma
model PaymentDiscrepancy {
  id                String   @id @default(cuid())
  customerId        String
  invoiceId         String?
  paymentId         String?
  type              String   // unpaid/overpaid/partial/multiple_invoices
  discrepancyAmount Decimal  // 差異金額（正=過入金、負=未入金）
  status            String   @default("detected") 
  // detected/ai_analyzing/ai_action_ready/ai_executing/human_review/human_action/
  // ai_phone_scheduled/customer_response/escalated/resolved
  
  interventionLevel String   @default("ai_autonomous")
  // ai_autonomous/ai_assisted/human_required
  
  priority          String   @default("medium") // low/medium/high/critical
  daysPastDue       Int?     // 支払期限からの経過日数
  aiAnalysis        Json?    // AI分析結果・確信度・推奨アクション
  notes             String?  // 人間入力の備考
  importKey         String?  // Excel取り込み時の重複防止キー
  detectedAt        DateTime @default(now())
  resolvedAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  customer            Customer             @relation(fields: [customerId], references: [id])
  invoice             Invoice?             @relation(fields: [invoiceId], references: [id])
  payment             Payment?             @relation(fields: [paymentId], references: [id])
  actions             DiscrepancyAction[]
  tasks               Task[]
  emailLogs           EmailLog[]

  @@index([status])
  @@index([priority])
  @@index([interventionLevel])
  @@index([detectedAt])
  @@index([importKey])
  @@map("payment_discrepancies")
}
```

### DiscrepancyAction (差異対応履歴)
```prisma
model DiscrepancyAction {
  id            String   @id @default(cuid())
  discrepancyId String
  type          String   // email_sent/phone_call/human_review/status_change/note_added
  description   String
  performedBy   String   // AI_AGENT/user_id
  metadata      Json?    // アクション詳細・メール内容等
  performedAt   DateTime @default(now())

  // Relations
  discrepancy PaymentDiscrepancy @relation(fields: [discrepancyId], references: [id], onDelete: Cascade)

  @@index([discrepancyId])
  @@index([performedAt])
  @@map("discrepancy_actions")
}
```

### EmailTemplate (メールテンプレート)
```prisma
model EmailTemplate {
  id        String   @id @default(cuid())
  name      String   // "1次督促メール（未入金）"
  subject   String   // "入金確認のお願い - 請求書{{invoiceNumber}}"
  body      String   // メール本文（変数付き）
  type      String   // unpaid_reminder/overpaid_inquiry/payment_confirmation/custom
  stage     String?  // reminder/inquiry/confirmation/final_notice
  variables Json?    // 利用可能変数一覧
  isActive  Boolean  @default(true)
  createdBy String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  emailLogs EmailLog[]

  @@index([type])
  @@index([isActive])
  @@map("email_templates")
}
```

### EmailLog (メール送信履歴)
```prisma
model EmailLog {
  id            String   @id @default(cuid())
  discrepancyId String?
  templateId    String?
  recipientEmail String
  recipientName String?
  subject       String
  body          String
  status        String   @default("pending") // pending/sent/failed/bounced
  sentAt        DateTime?
  failureReason String?
  metadata      Json?    // 送信詳細・追跡情報
  createdBy     String?
  createdAt     DateTime @default(now())

  // Relations
  discrepancy PaymentDiscrepancy? @relation(fields: [discrepancyId], references: [id])
  template    EmailTemplate?      @relation(fields: [templateId], references: [id])
  user        User?               @relation(fields: [createdBy], references: [id])

  @@index([discrepancyId])
  @@index([status])
  @@index([sentAt])
  @@map("email_logs")
}
```

### Task (タスク管理)
```prisma
model Task {
  id            String   @id @default(cuid())
  type          String   // UNPAID_DETECTION/EMAIL_SEND/PHONE_CALL/HUMAN_REVIEW/etc
  title         String
  description   String?
  status        String   @default("pending") // pending/in_progress/completed/failed
  priority      String   @default("medium") // low/medium/high/critical
  assignedToId  String?  // AI_AGENT or user_id
  discrepancyId String?  // 関連差異ID
  metadata      Json?    // タスク固有データ・進捗情報
  dueDate       DateTime?
  completedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  assignedTo  User?               @relation(fields: [assignedToId], references: [id])
  discrepancy PaymentDiscrepancy? @relation(fields: [discrepancyId], references: [id])

  @@index([status])
  @@index([priority])
  @@index([assignedToId])
  @@index([discrepancyId])
  @@map("tasks")
}
```

### ImportHistory (取り込み履歴)
```prisma
model ImportHistory {
  id            String   @id @default(cuid())
  fileName      String
  fileSize      Int?
  totalRows     Int
  importedRows  Int
  skippedRows   Int
  errorRows     Int
  status        String   @default("completed") // processing/completed/failed
  errors        Json?    // エラー詳細
  summary       Json?    // 取り込み結果サマリー
  importedBy    String
  importedAt    DateTime @default(now())

  // Relations
  user User @relation(fields: [importedBy], references: [id])

  @@index([importedBy])
  @@index([importedAt])
  @@map("import_history")
}
```

---

## 🔍 インデックス戦略

### 主要検索パターン別インデックス
```sql
-- 差異管理の主要検索
CREATE INDEX idx_discrepancies_status_priority ON payment_discrepancies(status, priority);
CREATE INDEX idx_discrepancies_customer_status ON payment_discrepancies(customerId, status);
CREATE INDEX idx_discrepancies_detected_at_desc ON payment_discrepancies(detectedAt DESC);
CREATE INDEX idx_discrepancies_intervention_level ON payment_discrepancies(interventionLevel);

-- 顧客・請求書検索
CREATE INDEX idx_customers_code_active ON customers(code, isActive);
CREATE INDEX idx_customers_name_search ON customers(name); -- 部分一致検索用
CREATE INDEX idx_invoices_customer_status ON invoices(customerId, status);
CREATE INDEX idx_invoices_due_date ON invoices(dueDate);

-- メール・タスク管理
CREATE INDEX idx_email_logs_discrepancy_sent ON email_logs(discrepancyId, sentAt);
CREATE INDEX idx_tasks_assigned_status ON tasks(assignedToId, status);
CREATE INDEX idx_tasks_discrepancy_type ON tasks(discrepancyId, type);

-- 取り込み・履歴
CREATE INDEX idx_import_history_date ON import_history(importedAt DESC);
CREATE INDEX idx_discrepancy_actions_discrepancy_date ON discrepancy_actions(discrepancyId, performedAt DESC);
```

---

## 📊 JSON フィールド構造

### PaymentDiscrepancy.aiAnalysis
```typescript
interface AIAnalysis {
  confidence: number;           // 0.0-1.0の確信度
  escalationStage: number;      // 1-5のエスカレーション段階
  riskScore: number;           // 0-100のリスクスコア
  recommendedActions: string[]; // ["email_reminder", "phone_call", "human_review"]
  reasoning: string[];         // AI判断の根拠
  nextReviewDate?: string;     // 次回レビュー推奨日
  customerProfile: {
    historicalPaymentScore: number;  // 過去の支払実績スコア
    riskFactors: string[];          // リスク要因
    preferredContactMethod: string;  // 推奨連絡方法
  };
  processedAt: string;         // AI分析実行日時
}
```

### Task.metadata
```typescript
interface TaskMetadata {
  // EMAIL_SENDタスクの場合
  emailSend?: {
    templateId: string;
    recipientEmail: string;
    scheduledAt?: string;
    sentAt?: string;
    emailLogId?: string;
  };
  
  // PHONE_CALLタスクの場合
  phoneCall?: {
    phoneNumber: string;
    preferredTime: string;
    callAttempts: number;
    lastAttemptAt?: string;
    connectionSuccess?: boolean;
    callNotes?: string;
  };
  
  // HUMAN_REVIEWタスクの場合
  humanReview?: {
    requiredBy: string;        // 期限
    reviewReason: string[];    // レビューが必要な理由
    priority: string;          // 緊急度
    assignedReviewer?: string; // 担当者
    reviewedAt?: string;       // レビュー完了日時
    decision?: string;         // レビュー結果
  };
  
  // 共通フィールド
  autoCreated: boolean;        // AI自動作成フラグ
  retryCount?: number;         // 再試行回数
  externalReferences?: {       // 外部システム連携
    systemName: string;
    referenceId: string;
  }[];
}
```

### EmailTemplate.variables
```typescript
interface TemplateVariables {
  required: string[];    // 必須変数
  optional: string[];    // オプション変数
  descriptions: {        // 変数説明
    [key: string]: {
      description: string;
      example: string;
      dataType: 'string' | 'number' | 'date' | 'currency';
    };
  };
}
```

---

## 🔐 セキュリティ・制約

### データ制約
```sql
-- 金額フィールドの制約
ALTER TABLE payment_discrepancies ADD CONSTRAINT chk_amount_range 
  CHECK (discrepancyAmount BETWEEN -10000000 AND 10000000);

ALTER TABLE customers ADD CONSTRAINT chk_credit_limit 
  CHECK (creditLimit >= 0);

-- 列挙値の制約
ALTER TABLE payment_discrepancies ADD CONSTRAINT chk_type 
  CHECK (type IN ('unpaid', 'overpaid', 'partial', 'multiple_invoices'));

ALTER TABLE payment_discrepancies ADD CONSTRAINT chk_status 
  CHECK (status IN ('detected', 'ai_analyzing', 'ai_action_ready', 'ai_executing', 
                   'human_review', 'human_action', 'ai_phone_scheduled', 
                   'customer_response', 'escalated', 'resolved'));

ALTER TABLE payment_discrepancies ADD CONSTRAINT chk_intervention_level 
  CHECK (interventionLevel IN ('ai_autonomous', 'ai_assisted', 'human_required'));

ALTER TABLE payment_discrepancies ADD CONSTRAINT chk_priority 
  CHECK (priority IN ('low', 'medium', 'high', 'critical'));
```

### 行レベルセキュリティ (RLS)
```sql
-- ユーザーロール別のアクセス制御
ALTER TABLE payment_discrepancies ENABLE ROW LEVEL SECURITY;

-- 管理者は全レコードアクセス可能
CREATE POLICY admin_full_access ON payment_discrepancies
  FOR ALL TO admin_role
  USING (true);

-- オペレーターは自分が担当する案件のみ
CREATE POLICY operator_assigned_only ON payment_discrepancies
  FOR ALL TO operator_role
  USING (
    id IN (
      SELECT discrepancyId FROM tasks 
      WHERE assignedToId = current_user_id()
    )
  );
```

---

## 📊 パフォーマンス最適化

### パーティショニング戦略
```sql
-- 大量データ対応：月次パーティション
CREATE TABLE payment_discrepancies_y2025m01 
  PARTITION OF payment_discrepancies
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE payment_discrepancies_y2025m02 
  PARTITION OF payment_discrepancies
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

### 集計テーブル (マテリアライズドビュー)
```sql
-- 統計サマリーの高速化
CREATE MATERIALIZED VIEW discrepancy_stats_daily AS
SELECT 
  DATE(detectedAt) as date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE interventionLevel = 'ai_autonomous') as ai_autonomous,
  COUNT(*) FILTER (WHERE interventionLevel = 'human_required') as human_required,
  COUNT(*) FILTER (WHERE priority = 'critical') as critical,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
  SUM(ABS(discrepancyAmount)) as total_amount,
  AVG(CASE WHEN status = 'resolved' THEN 
    EXTRACT(EPOCH FROM (resolvedAt - detectedAt))/86400 END) as avg_resolution_days
FROM payment_discrepancies 
GROUP BY DATE(detectedAt)
ORDER BY date DESC;

-- 1時間毎に更新
SELECT cron.schedule('refresh-stats', '0 * * * *', 
  'REFRESH MATERIALIZED VIEW discrepancy_stats_daily;');
```

---

## 🔄 データライフサイクル

### アーカイブ戦略
```sql
-- 解決済み案件の6ヶ月後アーカイブ
CREATE TABLE payment_discrepancies_archive (
  LIKE payment_discrepancies INCLUDING ALL
);

-- アーカイブ処理プロシージャ
CREATE OR REPLACE FUNCTION archive_old_discrepancies()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  WITH archived_data AS (
    DELETE FROM payment_discrepancies 
    WHERE status = 'resolved' 
      AND resolvedAt < NOW() - INTERVAL '6 months'
    RETURNING *
  )
  INSERT INTO payment_discrepancies_archive 
  SELECT * FROM archived_data;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- 月次実行
SELECT cron.schedule('archive-discrepancies', '0 2 1 * *',
  'SELECT archive_old_discrepancies();');
```

---

## 🎯 マイグレーション履歴

### マイグレーション実行順
```bash
# 初期スキーマ作成
npx prisma migrate dev --name init

# 介入レベルフィールド追加
npx prisma migrate dev --name add-intervention-level

# インポートキーフィールド追加  
npx prisma migrate dev --name add-import-key-field

# インデックス最適化
npx prisma migrate dev --name optimize-indexes
```

### 現在のスキーマ状態
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "sqlite" for development
  url      = env("DATABASE_URL")
}
```

---

## 📊 サンプルデータ構造

### 典型的な差異レコード
```sql
INSERT INTO payment_discrepancies (
  id, customerId, invoiceId, type, discrepancyAmount, 
  status, interventionLevel, priority, daysPastDue, aiAnalysis
) VALUES (
  'cmfzc7qq40001e55y6ha0kb6r',
  'customer1',
  'invoice1', 
  'unpaid',
  -250000,
  'ai_analyzing',
  'ai_autonomous',
  'high',
  15,
  '{
    "confidence": 0.85,
    "escalationStage": 2,
    "riskScore": 65,
    "recommendedActions": ["email_reminder", "monitor_response"],
    "reasoning": ["15日経過", "高額案件", "過去に遅延履歴なし"],
    "customerProfile": {
      "historicalPaymentScore": 85,
      "riskFactors": [],
      "preferredContactMethod": "email"
    },
    "processedAt": "2025-01-26T14:20:00Z"
  }'::json
);
```

---

## 🔧 バックアップ・復旧

### 自動バックアップ
```bash
# 日次フルバックアップ
pg_dump -h localhost -U postgres ar_system > backup_$(date +%Y%m%d).sql

# 重要テーブルのみ
pg_dump -h localhost -U postgres -t payment_discrepancies -t customers ar_system > critical_backup.sql
```

### ポイントインタイム復旧
```bash
# WALアーカイブ有効化
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'

# 特定時点への復旧
pg_basebackup -D /var/lib/postgresql/recovery -Ft -z -P
```

---

*🤖 このデータベース設計書は実装済みの完全スキーマVer1.1を反映しています*