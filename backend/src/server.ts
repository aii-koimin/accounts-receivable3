import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

import authRoutes from './routes/auth'
import discrepancyRoutes from './routes/discrepancies'
import customerRoutes from './routes/customers'
import emailRoutes from './routes/email'
import dataImportRoutes from './routes/data-import'
import importRoutes from './routes/importRoutes'
import settingsRoutes from './routes/settings'
import dashboardRoutes from './routes/dashboard'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

export const prisma = new PrismaClient()

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(requestLogger)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/discrepancies', discrepancyRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/data-import', dataImportRoutes)
app.use('/api/import', importRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Error handling
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})