import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Placeholder for settings routes
router.get('/', authorize('ADMIN', 'MANAGER'), (req, res) => {
  res.json({ success: false, message: 'Settings not implemented yet' })
})

export default router