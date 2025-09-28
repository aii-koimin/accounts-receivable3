import { Router } from 'express'
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
} from '../controllers/customerController'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/search', searchCustomers)
router.get('/', getCustomers)
router.get('/:id', getCustomer)
router.post('/', createCustomer)
router.put('/:id', updateCustomer)
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteCustomer)

export default router