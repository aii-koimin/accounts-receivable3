# API設計書 完全版 Ver1.1

## 🎯 概要

入金差異管理システムの全APIエンドポイント・リクエスト・レスポンス仕様

**BaseURL**: `http://localhost:3001/api`
**認証**: JWT Bearer Token (Authorization: Bearer {token})

---

## 🔐 認証 API

### POST /auth/login
管理者ログイン

**Request:**
```json
{
  "email": "admin@ar-system.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmfz8iujn0000imqcylwf31uc",
    "email": "admin@ar-system.com",
    "role": "admin"
  }
}
```

---

## 💰 差異管理 API

### GET /discrepancies
差異一覧取得

**Query Parameters:**
```typescript
{
  page?: number,           // ページ番号 (default: 1)
  limit?: number,          // 1ページ件数 (default: 20)
  status?: string[],       // ステータスフィルター
  priority?: string[],     // 優先度フィルター
  type?: string[],         // 差異種別フィルター
  interventionLevel?: string[], // 介入レベルフィルター
  search?: string,         // 顧客名・コード検索
  sortBy?: string,         // ソート項目
  sortOrder?: 'asc' | 'desc' // ソート順
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cmfzc7qq40001e55y6ha0kb6r",
      "type": "unpaid",
      "discrepancyAmount": -250000,
      "status": "ai_analyzing", 
      "interventionLevel": "ai_autonomous",
      "priority": "high",
      "daysPastDue": 15,
      "notes": "AI自律処理中：確信度85%でメール送信準備",
      "aiAnalysis": {
        "confidence": 0.85,
        "escalationStage": 2,
        "recommendedActions": ["email_reminder", "monitor_response"]
      },
      "customer": {
        "id": "customer1",
        "name": "山田商事株式会社",
        "code": "CUST001",
        "email": "yamada@example.com",
        "paymentTerms": 30,
        "riskLevel": "low"
      },
      "invoice": {
        "id": "inv1",
        "number": "INV-2025-001",
        "amount": 250000,
        "dueDate": "2025-01-11"
      },
      "nextAction": {
        "type": "ai_auto",
        "description": "2次督促メール送信予定",
        "scheduledAt": "2025-01-27T10:00:00Z"
      },
      "detectedAt": "2025-01-26T09:30:00Z",
      "updatedAt": "2025-01-26T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 125,
    "totalPages": 7
  },
  "stats": {
    "total": 125,
    "aiAutonomous": 88,
    "humanRequired": 37,
    "critical": 12,
    "phoneRequired": 8,
    "totalAmount": 12500000
  }
}
```

### GET /discrepancies/:id
差異詳細取得

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmfzc7qq40001e55y6ha0kb6r",
    // ... 上記と同じ詳細情報
    "actions": [
      {
        "id": "action1",
        "type": "email_sent",
        "description": "1次督促メール送信完了",
        "performedAt": "2025-01-26T10:15:00Z",
        "performedBy": "AI_AGENT"
      }
    ],
    "communications": [
      {
        "id": "comm1", 
        "type": "email",
        "direction": "outbound",
        "subject": "入金確認のお願い - 請求書INV-2025-001",
        "content": "山田商事株式会社様\n\nいつもお世話になっております...",
        "sentAt": "2025-01-26T10:15:00Z"
      }
    ]
  }
}
```

### PATCH /discrepancies/:id
差異情報更新

**Request:**
```json
{
  "notes": "顧客から連絡あり：来週入金予定",
  "priority": "medium", 
  "status": "customer_response",
  "interventionLevel": "ai_autonomous"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmfzc7qq40001e55y6ha0kb6r",
    "notes": "顧客から連絡あり：来週入金予定",
    "priority": "medium",
    "status": "customer_response",
    "updatedAt": "2025-01-26T15:30:00Z"
  }
}
```

### DELETE /discrepancies/:id
差異レコード削除

**Response:**
```json
{
  "success": true,
  "message": "差異レコードを削除しました"
}
```

### POST /discrepancies/:id/evaluate-escalation
エスカレーション評価

**Response:**
```json
{
  "success": true,
  "data": {
    "currentStage": 2,
    "recommendedStage": 3,
    "escalationReasons": [
      "15日経過",
      "高額案件（25万円）", 
      "過去に遅延履歴あり"
    ],
    "recommendedActions": [
      "2次督促メール送信",
      "電話督促スケジュール", 
      "人間レビュー推奨"
    ],
    "interventionLevel": "ai_assisted"
  }
}
```

---

## 👥 顧客管理 API

### GET /customers
顧客一覧取得

**Query Parameters:**
```typescript
{
  search?: string,         // 名前・コード検索
  riskLevel?: string[],    // リスクレベルフィルター
  isActive?: boolean,      // 有効顧客のみ
  limit?: number,
  page?: number
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "customer1",
      "code": "CUST001", 
      "name": "山田商事株式会社",
      "email": "yamada@example.com",
      "phone": "03-1234-5678",
      "address": "東京都渋谷区山田1-1-1",
      "contactPerson": "山田太郎",
      "paymentTerms": 30,
      "creditLimit": 1000000,
      "riskLevel": "low",
      "isActive": true,
      "notes": "優良顧客・支払実績良好",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### POST /customers
顧客新規作成

**Request:**
```json
{
  "code": "CUST004",
  "name": "テスト株式会社", 
  "email": "test@example.com",
  "phone": "03-9999-9999",
  "address": "東京都新宿区テスト1-1-1",
  "contactPerson": "テスト太郎",
  "paymentTerms": 45,
  "creditLimit": 750000,
  "riskLevel": "medium",
  "isActive": true,
  "notes": "新規顧客"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmfzagump0001vltyfddts961",
    "code": "CUST004",
    "name": "テスト株式会社",
    // ... 作成された顧客情報
    "createdAt": "2025-01-26T16:00:00Z"
  }
}
```

---

## 📧 メールテンプレート API

### GET /email/templates
テンプレート一覧取得

**Query Parameters:**
```typescript
{
  type?: string,     // unpaid_reminder/overpaid_inquiry/payment_confirmation/custom
  stage?: string,    // reminder/inquiry/confirmation
  search?: string    // テンプレート名検索
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "template1",
      "name": "1次督促メール（未入金）",
      "subject": "入金確認のお願い - 請求書{{invoiceNumber}}",
      "body": "{{customerName}} 様\n\nいつもお世話になっております。\n{{senderName}}の{{senderTitle}}でございます。\n\n下記請求書について、お支払期限を過ぎておりますが、\nまだ入金を確認できておりません。\n\n【請求内容】\n・請求番号：{{invoiceNumber}}\n・請求金額：{{amount}}円\n・お支払期限：{{dueDate}}\n・経過日数：{{daysPastDue}}日\n\nご確認の上、至急お支払いいただけますよう\nお願いいたします。\n\n{{signature}}",
      "type": "unpaid_reminder",
      "stage": "reminder",
      "variables": [
        "customerName", "senderName", "senderTitle", 
        "invoiceNumber", "amount", "dueDate", 
        "daysPastDue", "signature"
      ],
      "isActive": true,
      "createdAt": "2025-01-26T10:00:00Z"
    }
  ]
}
```

### POST /email/templates
テンプレート新規作成

**Request:**
```json
{
  "name": "3次督促メール（最終通告）",
  "subject": "【最終通告】入金確認のお願い - 請求書{{invoiceNumber}}",
  "body": "{{customerName}} 様\n\n再三にわたりご連絡しておりますが、\n下記請求書のお支払いがまだ確認できておりません。\n\n【請求内容】\n・請求番号：{{invoiceNumber}}\n・請求金額：{{amount}}円\n・当初お支払期限：{{dueDate}}\n・経過日数：{{daysPastDue}}日\n\n{{finalDeadline}}までにお支払いいただけない場合、\n誠に遺憾ながら法的措置を検討せざるを得ません。\n\n至急ご対応いただけますよう、重ねてお願い申し上げます。\n\n{{signature}}",
  "type": "unpaid_reminder",
  "stage": "final_notice"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template_new",
    "name": "3次督促メール（最終通告）",
    // ... 作成されたテンプレート情報
    "variables": [
      "customerName", "invoiceNumber", "amount", 
      "dueDate", "daysPastDue", "finalDeadline", "signature"
    ],
    "createdAt": "2025-01-26T16:30:00Z"
  }
}
```

### PUT /email/templates/:id
テンプレート更新

**Request:**
```json
{
  "subject": "【重要】入金確認のお願い - 請求書{{invoiceNumber}}",
  "body": "更新されたメール本文...",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template1",
    "subject": "【重要】入金確認のお願い - 請求書{{invoiceNumber}}",
    // ... 更新された情報
    "updatedAt": "2025-01-26T16:45:00Z"
  }
}
```

### DELETE /email/templates/:id
テンプレート削除

**Response:**
```json
{
  "success": true,
  "message": "テンプレートを削除しました"
}
```

### POST /email/generate/:discrepancyId
差異に基づくメール生成

**Request:**
```json
{
  "templateId": "template1",
  "customVariables": {
    "senderName": "田中花子",
    "senderTitle": "経理部長",
    "signature": "株式会社サンプル\n経理部 田中花子\nTEL: 03-1234-5678\nEmail: tanaka@sample.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "to": "yamada@example.com",
    "subject": "入金確認のお願い - 請求書INV-2025-001",
    "body": "山田商事株式会社 様\n\nいつもお世話になっております。\n田中花子の経理部長でございます。\n\n下記請求書について、お支払期限を過ぎておりますが、\nまだ入金を確認できておりません。\n\n【請求内容】\n・請求番号：INV-2025-001\n・請求金額：250,000円\n・お支払期限：2025年1月11日\n・経過日数：15日\n\nご確認の上、至急お支払いいただけますよう\nお願いいたします。\n\n株式会社サンプル\n経理部 田中花子\nTEL: 03-1234-5678\nEmail: tanaka@sample.com",
    "preview": true
  }
}
```

---

## 📊 データ取り込み API

### GET /import/template
取り込み用Excelテンプレートダウンロード

**Response:** Excel file
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="差異データ取り込みテンプレート.xlsx"
```

**テンプレート構成:**
| 顧客コード | 顧客名 | 請求番号 | 請求金額 | 入金金額 | 支払期限 | 差異種別 | 備考 |
|------------|--------|----------|----------|----------|----------|----------|------|
| CUST001 | 山田商事 | INV-001 | 250000 | 200000 | 2025-01-11 | partial | 一部入金 |

### POST /import/analyze
Excelファイル分析・プレビュー

**Request:** FormData
```
file: [Excel file]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileName": "差異データ.xlsx",
    "totalRows": 25,
    "validRows": 23,
    "errors": [
      {
        "row": 3,
        "field": "顧客コード", 
        "message": "必須項目が空白です"
      },
      {
        "row": 15,
        "field": "請求金額",
        "message": "数値ではありません"
      }
    ],
    "preview": [
      {
        "row": 1,
        "customerCode": "CUST001",
        "customerName": "山田商事株式会社",
        "invoiceNumber": "INV-2025-001",
        "invoiceAmount": 250000,
        "paidAmount": 200000,
        "dueDate": "2025-01-11",
        "discrepancyType": "partial",
        "notes": "一部入金・残金要確認"
      }
    ],
    "importKey": "excel_import_20250126_164500_a1b2c3d4"
  }
}
```

### POST /import/discrepancies
差異データ取り込み実行

**Request:** FormData
```
file: [Excel file]
autoSave?: boolean  // true: 自動保存, false: プレビューのみ
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 23,
    "skipped": 2,
    "errors": [],
    "results": [
      {
        "row": 1,
        "status": "imported",
        "discrepancyId": "cmfz_new_001",
        "message": "差異レコード作成完了"
      },
      {
        "row": 2, 
        "status": "skipped",
        "message": "重複データのためスキップ"
      }
    ],
    "summary": {
      "totalProcessed": 25,
      "successfulImports": 23,
      "duplicatesSkipped": 2,
      "errorsEncountered": 0,
      "newCustomersCreated": 3,
      "newInvoicesCreated": 8
    }
  }
}
```

### GET /import/history
取り込み履歴

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "import1",
      "fileName": "差異データ_202501.xlsx",
      "importedRows": 23,
      "skippedRows": 2,
      "status": "completed",
      "importedAt": "2025-01-26T16:45:00Z",
      "importedBy": "admin@ar-system.com"
    }
  ]
}
```

---

## 📊 統計・レポート API

### GET /discrepancies/stats/overview
統計概要取得

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 125,
    "byStatus": {
      "detected": 15,
      "ai_analyzing": 25,
      "ai_action_ready": 18,
      "ai_executing": 12,
      "human_review": 8,
      "customer_response": 22,
      "escalated": 5,
      "resolved": 20
    },
    "byPriority": {
      "low": 45,
      "medium": 50,
      "high": 25,
      "critical": 5
    },
    "byInterventionLevel": {
      "ai_autonomous": 88,
      "ai_assisted": 25,
      "human_required": 12
    },
    "byDiscrepancyType": {
      "unpaid": 85,
      "overpaid": 25,
      "partial": 10,
      "multiple_invoices": 5
    },
    "totalAmount": {
      "unpaid": -8500000,
      "overpaid": 4000000,
      "net": -4500000
    },
    "processingEfficiency": {
      "aiSuccessRate": 92.5,
      "averageResolutionDays": 2.8,
      "humanInterventionRate": 15.2
    }
  }
}
```

### GET /discrepancies/stats/trends
推移統計

**Query Parameters:**
```typescript
{
  period?: 'daily' | 'weekly' | 'monthly',
  startDate?: string,
  endDate?: string
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "daily",
    "trends": [
      {
        "date": "2025-01-20",
        "detected": 12,
        "resolved": 8,
        "aiAutonomous": 10,
        "humanRequired": 2,
        "totalAmount": -450000
      },
      {
        "date": "2025-01-21", 
        "detected": 15,
        "resolved": 12,
        "aiAutonomous": 13,
        "humanRequired": 2,
        "totalAmount": -380000
      }
    ]
  }
}
```

---

## 🎯 タスク管理 API

### GET /tasks
タスク一覧取得

**Query Parameters:**
```typescript
{
  type?: string[],     // UNPAID_DETECTION/EMAIL_SEND/PHONE_CALL等
  status?: string[],   // pending/in_progress/completed/failed
  assignedTo?: string, // ユーザーID
  limit?: number,
  page?: number
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task1",
      "type": "EMAIL_SEND",
      "title": "山田商事株式会社への督促メール送信",
      "description": "未入金案件（INV-2025-001）への1次督促メール",
      "status": "completed",
      "priority": "high",
      "assignedToId": "AI_AGENT",
      "discrepancyId": "cmfzc7qq40001e55y6ha0kb6r",
      "metadata": {
        "templateId": "template1",
        "emailSentAt": "2025-01-26T10:15:00Z",
        "recipientEmail": "yamada@example.com"
      },
      "completedAt": "2025-01-26T10:15:30Z",
      "createdAt": "2025-01-26T10:14:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 58,
    "totalPages": 3
  }
}
```

---

## ⚙️ システム API

### GET /health
ヘルスチェック

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-26T17:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected", 
    "email": "operational"
  },
  "version": "1.1.0"
}
```

### GET /system/info
システム情報

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "1.1.0",
    "environment": "development",
    "nodeVersion": "v18.17.0",
    "uptime": 3600,
    "memoryUsage": {
      "rss": "45.2MB",
      "heapTotal": "32.1MB", 
      "heapUsed": "28.5MB"
    }
  }
}
```

---

## ❌ エラーレスポンス形式

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "リクエストパラメータが不正です",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      },
      {
        "field": "amount", 
        "message": "金額は数値で入力してください"
      }
    ]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証が必要です。ログインしてください。"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN", 
    "message": "この操作を実行する権限がありません"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "指定されたリソースが見つかりません"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "サーバー内部エラーが発生しました",
    "requestId": "req_1234567890"
  }
}
```

---

## 🔄 レート制限

```
Rate Limit: 1000 requests/hour/user
Headers:
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1643232000
```

---

*🤖 このAPI設計書は実装済みの全エンドポイントを網羅しています Ver1.1*