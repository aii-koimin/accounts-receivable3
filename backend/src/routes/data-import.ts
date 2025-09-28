import { Router } from 'express'
import multer from 'multer'
import { authenticate } from '../middleware/auth'
import {
  analyzeExcelFile,
  importExcelData,
  getImportHistory,
  validateImportData
} from '../controllers/dataImportController'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('サポートされていないファイル形式です。Excel (.xlsx, .xls) またはCSVファイルを選択してください。'))
    }
  }
})

// Excel file analysis (preview before import)
router.post('/excel/analyze', upload.single('file'), analyzeExcelFile)

// Excel data import
router.post('/excel/import', upload.single('file'), importExcelData)

// Validate import data
router.post('/validate', validateImportData)

// Get import history
router.get('/history', getImportHistory)

export default router