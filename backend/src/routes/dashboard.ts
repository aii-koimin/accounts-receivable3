import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { getDashboardStats, getResearchMetrics } from '../controllers/dashboardController'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Dashboard statistics
router.get('/stats', getDashboardStats)

// Research metrics for effectiveness measurement
router.get('/research-metrics', getResearchMetrics)

export default router