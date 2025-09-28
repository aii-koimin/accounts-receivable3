import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...')

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        password: true // Include password for hash verification
      }
    })

    console.log('📊 Found users:', users.length)

    for (const user of users) {
      console.log(`\n👤 User: ${user.name} (${user.email})`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Active: ${user.isActive}`)
      console.log(`   Password hash starts with: ${user.password.substring(0, 10)}...`)

      // Test password verification
      const testPassword = user.email.includes('admin')
        ? 'admin123'
        : user.email.includes('manager')
        ? 'manager123'
        : 'user123'

      const isValid = await bcrypt.compare(testPassword, user.password)
      console.log(`   Password "${testPassword}" is valid: ${isValid}`)
    }

  } catch (error) {
    console.error('❌ Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()