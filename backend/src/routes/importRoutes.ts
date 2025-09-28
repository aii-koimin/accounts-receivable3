import { Router } from 'express'
import { analyzeFile, executeImport, uploadMiddleware } from '../controllers/importController'

const router = Router()

// File analysis endpoint
// TODO: Add authentication middleware once middleware import issue is resolved
router.post('/analyze', uploadMiddleware, analyzeFile)

// Import execution endpoint
// TODO: Add authentication middleware once middleware import issue is resolved
router.post('/execute', uploadMiddleware, executeImport)

export default router