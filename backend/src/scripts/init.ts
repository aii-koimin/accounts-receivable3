import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const prisma = new PrismaClient()

async function initializeDatabase() {
  console.log('🚀 初期化を開始します...')

  try {
    // Generate Prisma client
    console.log('📦 Prismaクライアントを生成中...')
    await execAsync('npx prisma generate')

    // Push database schema
    console.log('🗄️ データベーススキーマを適用中...')
    await execAsync('npx prisma db push')

    // Run seed
    console.log('🌱 シードデータを投入中...')
    await execAsync('npm run db:seed')

    console.log('✅ 初期化が完了しました！')
    console.log('')
    console.log('📋 デフォルトユーザー:')
    console.log('管理者: admin@company.com / admin123')
    console.log('マネージャー: manager@company.com / manager123')
    console.log('ユーザー: user@company.com / user123')
    console.log('')
    console.log('🚀 サーバーを起動するには: npm run dev')

  } catch (error) {
    console.error('❌ 初期化中にエラーが発生しました:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

initializeDatabase()