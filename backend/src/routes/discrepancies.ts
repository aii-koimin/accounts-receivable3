import { Router } from 'express'
import {
  getDiscrepancies,
  getDiscrepancy,
  createDiscrepancy,
  updateDiscrepancy,
  deleteDiscrepancy,
  sendReminderEmail,
  getStatistics
} from '../controllers/discrepancyController'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/statistics', getStatistics)
router.get('/', getDiscrepancies)
router.get('/:id', getDiscrepancy)
router.post('/', createDiscrepancy)
router.put('/:id', updateDiscrepancy)
router.post('/:id/send-email', sendReminderEmail)
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteDiscrepancy)

export default router