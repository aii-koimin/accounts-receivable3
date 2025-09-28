import { Router } from 'express'
import {
  getEmailSettings,
  updateEmailSettings,
  testEmailConnection,
  sendTestEmail,
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  sendDiscrepancyEmail,
  getEmailLogs
} from '../controllers/emailController'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Email settings (admin/manager only)
router.get('/settings', authorize('ADMIN', 'MANAGER'), getEmailSettings)
router.put('/settings', authorize('ADMIN', 'MANAGER'), updateEmailSettings)
router.post('/test-connection', authorize('ADMIN', 'MANAGER'), testEmailConnection)
router.post('/send-test', authorize('ADMIN', 'MANAGER'), sendTestEmail)

// Email templates
router.get('/templates', getEmailTemplates)
router.post('/templates', authorize('ADMIN', 'MANAGER'), createEmailTemplate)
router.put('/templates/:id', authorize('ADMIN', 'MANAGER'), updateEmailTemplate)

// Email sending
router.post('/send-discrepancy', sendDiscrepancyEmail)

// Email logs
router.get('/logs', getEmailLogs)

export default router