import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: hashedPassword,
      name: '管理者',
      role: 'ADMIN'
    }
  })

  // Create manager user
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@company.com' },
    update: {},
    create: {
      email: 'manager@company.com',
      password: await bcrypt.hash('manager123', 10),
      name: '経理管理者',
      role: 'MANAGER'
    }
  })

  // Create regular user
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@company.com' },
    update: {},
    create: {
      email: 'user@company.com',
      password: await bcrypt.hash('user123', 10),
      name: '経理担当者',
      role: 'USER'
    }
  })

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { customerCode: 'CUST001' },
      update: {},
      create: {
        customerCode: 'CUST001',
        name: '株式会社サンプル',
        email: 'sample@sample.com',
        phone: '03-1234-5678',
        address: '東京都港区1-1-1',
        contactPerson: '田中太郎',
        paymentTerms: 30,
        creditLimit: 1000000,
        riskLevel: 'LOW'
      }
    }),
    prisma.customer.upsert({
      where: { customerCode: 'CUST002' },
      update: {},
      create: {
        customerCode: 'CUST002',
        name: 'テスト商事株式会社',
        email: 'test@test.com',
        phone: '03-2345-6789',
        address: '大阪府大阪市2-2-2',
        contactPerson: '佐藤花子',
        paymentTerms: 45,
        creditLimit: 2000000,
        riskLevel: 'MEDIUM'
      }
    }),
    prisma.customer.upsert({
      where: { customerCode: 'CUST003' },
      update: {},
      create: {
        customerCode: 'CUST003',
        name: 'ハイリスク株式会社',
        email: 'highrisk@highrisk.com',
        phone: '03-3456-7890',
        address: '愛知県名古屋市3-3-3',
        contactPerson: '高橋次郎',
        paymentTerms: 60,
        creditLimit: 500000,
        riskLevel: 'HIGH'
      }
    })
  ])

  // Create sample payment discrepancies
  const discrepancies = await Promise.all([
    prisma.paymentDiscrepancy.create({
      data: {
        customerId: customers[0]!.id,
        type: 'UNPAID',
        status: 'DETECTED',
        priority: 'HIGH',
        interventionLevel: 'AI_AUTONOMOUS',
        expectedAmount: 100000,
        actualAmount: 0,
        differenceAmount: -100000,
        dueDate: new Date('2024-01-15'),
        overdueDays: 14,
        assignedUserId: regularUser.id,
        aiAnalysis: JSON.stringify({
          confidence: 0.85,
          recommendedAction: 'send_first_reminder',
          reasoning: '支払期限を2週間経過した未入金案件。顧客の過去の支払履歴は良好。'
        }),
        tags: JSON.stringify(['新規', '高優先度'])
      }
    }),
    prisma.paymentDiscrepancy.create({
      data: {
        customerId: customers[1]!.id,
        type: 'OVERPAID',
        status: 'EMAIL_SENT',
        priority: 'MEDIUM',
        interventionLevel: 'AI_ASSISTED',
        expectedAmount: 50000,
        actualAmount: 75000,
        differenceAmount: 25000,
        dueDate: new Date('2024-01-10'),
        assignedUserId: regularUser.id,
        aiAnalysis: JSON.stringify({
          confidence: 0.92,
          recommendedAction: 'confirm_overpayment',
          reasoning: '過入金25,000円を確認。複数請求書の一括支払いの可能性が高い。'
        }),
        tags: JSON.stringify(['過入金', '要確認'])
      }
    }),
    prisma.paymentDiscrepancy.create({
      data: {
        customerId: customers[2]!.id,
        type: 'PARTIAL',
        status: 'PROCESSING',
        priority: 'URGENT',
        interventionLevel: 'HUMAN_REQUIRED',
        expectedAmount: 200000,
        actualAmount: 150000,
        differenceAmount: -50000,
        dueDate: new Date('2024-01-20'),
        overdueDays: 8,
        assignedUserId: managerUser.id,
        aiAnalysis: JSON.stringify({
          confidence: 0.65,
          recommendedAction: 'escalate_to_human',
          reasoning: 'ハイリスク顧客からの一部入金。残金50,000円の支払い計画確認が必要。'
        }),
        tags: JSON.stringify(['一部入金', 'ハイリスク', '要人的対応'])
      }
    })
  ])

  // Create system configurations
  const configs = await Promise.all([
    prisma.systemConfig.upsert({
      where: { key: 'smtp_host' },
      update: {},
      create: {
        key: 'smtp_host',
        value: 'smtp.gmail.com',
        category: 'smtp',
        description: 'SMTPサーバーホスト'
      }
    }),
    prisma.systemConfig.upsert({
      where: { key: 'smtp_port' },
      update: {},
      create: {
        key: 'smtp_port',
        value: '587',
        category: 'smtp',
        description: 'SMTPサーバーポート'
      }
    }),
    prisma.systemConfig.upsert({
      where: { key: 'email_signature' },
      update: {},
      create: {
        key: 'email_signature',
        value: `--
売掛金管理システム
株式会社サンプル 経理部
〒100-0001 東京都千代田区1-1-1
TEL: 03-1234-5678
Email: accounting@company.com
`,
        category: 'email',
        description: 'メール署名'
      }
    })
  ])

  // Create email templates
  const templates = await Promise.all([
    prisma.emailTemplate.create({
      data: {
        name: '未入金督促メール（1次）',
        subject: '【重要】お支払いのご確認について（請求書番号：{{invoiceNumber}}）',
        body: `{{customerName}} 様

いつもお世話になっております。
{{companyName}}の{{senderName}}です。

下記の請求書につきまして、お支払い期限を過ぎておりますが、まだご入金の確認ができておりません。

【請求詳細】
・請求書番号：{{invoiceNumber}}
・請求金額：{{amount}}円
・支払期限：{{dueDate}}
・経過日数：{{overdueDays}}日

恐れ入りますが、ご確認いただき、至急お支払いいただきますようお願い申し上げます。

なお、既にお支払い済みの場合は、行き違いになりまして申し訳ございません。
その際は、お支払い日と金額をご連絡いただけますでしょうか。

ご不明な点がございましたら、お気軽にお問い合わせください。

よろしくお願いいたします。`,
        type: 'UNPAID_REMINDER',
        stage: 'FIRST_REMINDER',
        variables: JSON.stringify(['customerName', 'companyName', 'senderName', 'invoiceNumber', 'amount', 'dueDate', 'overdueDays']),
        createdById: adminUser.id
      }
    }),
    prisma.emailTemplate.create({
      data: {
        name: '過入金照会メール',
        subject: 'ご入金金額についてのお問い合わせ（請求書番号：{{invoiceNumber}}）',
        body: `{{customerName}} 様

いつもお世話になっております。
{{companyName}}の{{senderName}}です。

この度は、迅速なお支払いをいただき、誠にありがとうございます。

確認いたしましたところ、下記の件でご入金いただいた金額が、請求金額を上回っているようでございます。

【入金詳細】
・請求書番号：{{invoiceNumber}}
・請求金額：{{expectedAmount}}円
・ご入金金額：{{actualAmount}}円
・差額：{{differenceAmount}}円

恐れ入りますが、下記の可能性についてご確認をお願いいたします：

1. 複数の請求書の一括お支払い
2. 次回分の前払い
3. お振込み時の金額間違い

お手数をおかけして申し訳ございませんが、ご確認いただき、ご連絡をお願いいたします。

よろしくお願いいたします。`,
        type: 'OVERPAID_INQUIRY',
        stage: 'INQUIRY',
        variables: JSON.stringify(['customerName', 'companyName', 'senderName', 'invoiceNumber', 'expectedAmount', 'actualAmount', 'differenceAmount']),
        createdById: adminUser.id
      }
    })
  ])

  // Create sample email logs
  await prisma.emailLog.create({
    data: {
      discrepancyId: discrepancies[0]!.id,
      customerId: customers[0]!.id,
      sender: 'system@company.com',
      recipient: customers[0]!.email,
      subject: '【重要】お支払いのご確認について',
      body: 'メール本文...',
      templateId: templates[0]!.id,
      status: 'SENT',
      sentAt: new Date()
    }
  })

  // Create sample tasks
  await Promise.all([
    prisma.task.create({
      data: {
        type: 'UNPAID_DETECTION',
        title: '未入金検知タスク',
        description: '株式会社サンプルの未入金を検知し、自動メール送信を実行',
        priority: 'HIGH',
        status: 'COMPLETED',
        assignedUserId: regularUser.id,
        discrepancyId: discrepancies[0]!.id,
        completedAt: new Date(),
        result: JSON.stringify({
          action: 'email_sent',
          success: true,
          emailId: 'email_log_id_here'
        })
      }
    }),
    prisma.task.create({
      data: {
        type: 'RISK_ASSESSMENT',
        title: 'リスク評価タスク',
        description: 'ハイリスク株式会社の支払い能力を再評価',
        priority: 'MEDIUM',
        status: 'PENDING',
        assignedUserId: managerUser.id,
        discrepancyId: discrepancies[2]!.id
      }
    })
  ])

  console.log('Seeding completed successfully!')
  console.log('Created users:', { adminUser: adminUser.email, managerUser: managerUser.email, regularUser: regularUser.email })
  console.log('Created customers:', customers.length)
  console.log('Created discrepancies:', discrepancies.length)
  console.log('Created templates:', templates.length)
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })