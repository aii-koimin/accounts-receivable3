import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import * as XLSX from 'xlsx'
import { prisma } from '../server'
import { AppError } from '../middleware/errorHandler'
import path from 'path'

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new AppError('Unsupported file type', 400))
    }
  }
})

export const uploadMiddleware = upload.single('file')

interface ImportOptions {
  createNewCustomers: boolean
  skipDuplicates: boolean
  emailNotification: boolean
}

export const analyzeFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400)
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Try different starting rows to find actual data
    let data = []
    let actualStartRow = 0

    // Check common starting positions
    const possibleStartRows = [0, 5, 6, 7, 8, 9, 10]

    for (const startRow of possibleStartRows) {
      try {
        const testData = XLSX.utils.sheet_to_json(worksheet, { range: startRow })
        if (testData.length > 0) {
          const firstRow = testData[0]
          const keys = Object.keys(firstRow)

          // Check if this looks like actual data (not just headers/empty rows)
          // Look for specific indicators of real data
          const hasRealCompanyName = Object.values(firstRow).some(value =>
            value && typeof value === 'string' &&
            !value.includes('★') &&
            !value.includes('▼') &&
            !value.includes('締め日') &&
            value.length > 3 &&
            !['SLACK', 'Key', '分類', 'No', '会社名'].includes(value)
          )

          const hasNonEmptyKeys = keys.some(key =>
            !key.startsWith('__EMPTY') &&
            !['2', '6', '12', '13'].includes(key) &&
            key !== 'Vlook'
          )

          if (keys.length > 5 && hasRealCompanyName && hasNonEmptyKeys) {
            data = testData
            actualStartRow = startRow
            console.log(`✅ Found actual data starting at row ${startRow + 1}`)
            break
          }
        }
      } catch (e) {
        // Continue trying other positions
      }
    }

    // If no good data found, try a more specific approach for this Excel format
    if (data.length === 0) {
      console.log('No data found with automatic detection, trying manual search...')

      // Try to find "Xresearch" or other company names specifically
      for (let startRow = 0; startRow <= 15; startRow++) {
        try {
          const testData = XLSX.utils.sheet_to_json(worksheet, { range: startRow })
          if (testData.length > 0) {
            const hasXresearch = JSON.stringify(testData).includes('Xresearch')
            const hasCompanyData = Object.values(testData[0]).some(value =>
              value && typeof value === 'string' && value.length > 4 &&
              !value.includes('★') && !value.includes('▼')
            )

            if (hasXresearch || hasCompanyData) {
              data = testData
              actualStartRow = startRow
              console.log(`🎯 Found data with company info at row ${startRow + 1}`)
              break
            }
          }
        } catch (e) {
          // Continue
        }
      }

      // Last resort: use default
      if (data.length === 0) {
        data = XLSX.utils.sheet_to_json(worksheet)
        console.log('Using default Excel parsing')
      }
    }

    const columns = data.length > 0 ? Object.keys(data[0] as any) : []
    console.log('Available columns:', columns)
    console.log('Sample data:', data.slice(0, 2))

    const errors: string[] = []
    const warnings: string[] = []

    // Flexible column mapping - try to detect columns by common patterns
    const detectColumn = (possibleNames: string[]) => {
      return possibleNames.find(name => columns.some(col =>
        col.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(col.toLowerCase())
      )) || possibleNames.find(name => columns.includes(name))
    }

    // Try to detect required columns
    const typeColumn = detectColumn(['分類', 'type', 'category', 'status'])
    const companyColumn = detectColumn(['会社名', 'company', 'customer', 'name'])
    const amountColumn = detectColumn(['金額', 'amount', 'value', 'price', 'cost'])
    const emailColumn = detectColumn(['to', 'email', 'メール'])

    // If standard columns not found, try to infer from data structure
    let detectedColumns = {
      type: typeColumn,
      company: companyColumn,
      amount: amountColumn,
      email: emailColumn
    }

    // If we can't detect standard columns, be more flexible
    if (!detectedColumns.company && !detectedColumns.amount) {
      // Look for any column that might contain company/description data
      const textColumns = columns.filter(col => {
        const sampleValue = data[0]?.[col]
        return typeof sampleValue === 'string' && sampleValue.length > 5
      })

      // Look for any column that might contain numeric data
      const numericColumns = columns.filter(col => {
        const sampleValue = data[0]?.[col]
        return !isNaN(parseFloat(sampleValue)) && sampleValue !== ''
      })

      if (textColumns.length > 0) detectedColumns.company = textColumns[0]
      if (numericColumns.length > 0) detectedColumns.amount = numericColumns[0]
    }

    console.log('Detected columns:', detectedColumns)

    let validRows = 0
    let invalidRows = 0

    data.forEach((row: any, index) => {
      const rowNumber = index + 2 // Excel row number (starting from 2, accounting for header)

      // Check if row has any meaningful data
      const hasAnyData = Object.values(row).some(value =>
        value !== undefined && value !== null && value !== ''
      )

      if (!hasAnyData) {
        invalidRows++
        errors.push(`行${rowNumber}: 空行です`)
        return
      }

      let isValid = true
      const rowErrors: string[] = []

      // Validate company/description field
      const companyValue = detectedColumns.company ? row[detectedColumns.company] : null
      if (!companyValue || companyValue.toString().trim() === '') {
        isValid = false
        rowErrors.push('会社名/説明が空です')
      }

      // Validate amount field (if detected)
      if (detectedColumns.amount) {
        const amountValue = row[detectedColumns.amount]
        const amount = parseFloat(amountValue)
        if (isNaN(amount)) {
          isValid = false
          rowErrors.push('金額が数値ではありません')
        }
      }

      // Validate email field (if detected and required)
      if (detectedColumns.email) {
        const emailValue = row[detectedColumns.email]
        if (emailValue && emailValue !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(emailValue)) {
            isValid = false
            rowErrors.push('無効なメールアドレス形式')
          }
        }
      }

      if (isValid) {
        validRows++
      } else {
        invalidRows++
        errors.push(`行${rowNumber}: ${rowErrors.join(', ')}`)
      }
    })

    const analysis = {
      totalRows: data.length,
      validRows,
      invalidRows,
      columns,
      preview: data.slice(0, 5),
      errors,
      warnings
    }

    res.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    next(error)
  }
}

export const executeImport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400)
    }

    const options: ImportOptions = req.body.options ? JSON.parse(req.body.options) : {
      createNewCustomers: true,
      skipDuplicates: true,
      emailNotification: true
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Use the same data detection logic as analyzeFile
    let data = []
    let actualStartRow = 0

    const possibleStartRows = [0, 5, 6, 7, 8, 9, 10]

    for (const startRow of possibleStartRows) {
      try {
        const testData = XLSX.utils.sheet_to_json(worksheet, { range: startRow })
        if (testData.length > 0) {
          const firstRow = testData[0]
          const keys = Object.keys(firstRow)

          const hasRealCompanyName = Object.values(firstRow).some(value =>
            value && typeof value === 'string' &&
            !value.includes('★') &&
            !value.includes('▼') &&
            !value.includes('締め日') &&
            value.length > 3 &&
            !['SLACK', 'Key', '分類', 'No', '会社名'].includes(value)
          )

          const hasNonEmptyKeys = keys.some(key =>
            !key.startsWith('__EMPTY') &&
            !['2', '6', '12', '13'].includes(key) &&
            key !== 'Vlook'
          )

          if (keys.length > 5 && hasRealCompanyName && hasNonEmptyKeys) {
            data = testData
            actualStartRow = startRow
            console.log(`✅ Execute: Found actual data starting at row ${startRow + 1}`)
            break
          }
        }
      } catch (e) {
        // Continue trying other positions
      }
    }

    // If no good data found, try manual search for Xresearch
    if (data.length === 0) {
      console.log('Execute: No data found with automatic detection, trying manual search...')

      for (let startRow = 0; startRow <= 15; startRow++) {
        try {
          const testData = XLSX.utils.sheet_to_json(worksheet, { range: startRow })
          if (testData.length > 0) {
            const hasXresearch = JSON.stringify(testData).includes('Xresearch')
            const hasCompanyData = Object.values(testData[0]).some(value =>
              value && typeof value === 'string' && value.length > 4 &&
              !value.includes('★') && !value.includes('▼')
            )

            if (hasXresearch || hasCompanyData) {
              data = testData
              actualStartRow = startRow
              console.log(`🎯 Execute: Found data with company info at row ${startRow + 1}`)
              break
            }
          }
        } catch (e) {
          // Continue
        }
      }

      if (data.length === 0) {
        data = XLSX.utils.sheet_to_json(worksheet)
        console.log('Execute: Using default Excel parsing')
      }
    }

    const errors: string[] = []
    const warnings: string[] = []
    let processed = 0
    let created = 0
    let updated = 0

    // Get existing customers and discrepancies for duplicate checking
    const existingCustomers = await prisma.customer.findMany({
      select: { id: true, name: true, email: true, customerCode: true }
    })

    const existingDiscrepancies = options.skipDuplicates
      ? await prisma.paymentDiscrepancy.findMany({
          where: { importKey: { not: null } },
          select: { importKey: true }
        })
      : []

    const existingKeys = new Set(existingDiscrepancies.map(d => d.importKey))

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i]
      const rowNumber = i + 2

      try {
        // Generate a unique key for this import if not present
        const importKey = row['Key'] || row['▼ペースト'] || `AUTO_${Date.now()}_${i}`

        // Skip if duplicate key exists
        if (options.skipDuplicates && existingKeys.has(importKey)) {
          warnings.push(`行${rowNumber}: 重複キー(${importKey})のためスキップしました`)
          continue
        }

        // Add to existingKeys to prevent duplicates within this import
        existingKeys.add(importKey)

        // Dynamically find the company name and email fields
        const companyName = row['会社名'] || row['__EMPTY_4'] ||
                           Object.values(row).find(val =>
                             val === 'Xresearch' || (typeof val === 'string' && val.length > 3 &&
                             !val.includes('★') && !val.includes('▼') && !val.includes('Key') &&
                             !val.includes('SLACK') && !val.includes('分類'))
                           ) || 'Unknown Company'

        const emailAddress = row['to'] || row['__EMPTY_10'] ||
                            Object.values(row).find(val =>
                              typeof val === 'string' && val.includes('@')
                            ) || undefined

        // Find or create customer
        let customer = existingCustomers.find(c =>
          c.name === companyName || c.email === emailAddress
        )

        if (!customer && options.createNewCustomers) {
          // Generate customer code
          const customerCode = `CUST${Date.now()}${i}`

          customer = await prisma.customer.create({
            data: {
              customerCode,
              name: companyName,
              email: emailAddress,
              paymentTerms: 30,
              riskLevel: 'LOW'
            }
          })
          created++
        } else if (!customer) {
          errors.push(`行${rowNumber}: 顧客が見つからず、自動作成が無効になっています`)
          continue
        }

        // Parse discrepancy type
        const typeMap: { [key: string]: string } = {
          '未入金': 'UNPAID',
          '過入金': 'OVERPAID',
          '一部入金': 'PARTIAL',
          '複数請求': 'MULTIPLE_INVOICES'
        }

        // Dynamically find the discrepancy type and amount fields
        const discrepancyCategory = row['分類'] || row['__EMPTY_2'] ||
                                  Object.values(row).find(val =>
                                    typeof val === 'string' && (val.includes('月') || val.includes('超') || val.includes('未'))
                                  ) || '未分類'

        const discrepancyType = typeMap[discrepancyCategory] || 'UNPAID'

        // Find amount field
        const amountValue = row['金額'] || row['__EMPTY_19'] ||
                           Object.values(row).find(val =>
                             typeof val === 'number' && val > 0
                           ) || 0

        const amount = typeof amountValue === 'number' ? amountValue : parseFloat(amountValue) || 0

        // Calculate expected and actual amounts based on type
        let expectedAmount: number
        let actualAmount: number
        let differenceAmount: number

        if (discrepancyType === 'UNPAID') {
          expectedAmount = Math.abs(amount)
          actualAmount = 0
          differenceAmount = -Math.abs(amount)
        } else if (discrepancyType === 'OVERPAID') {
          expectedAmount = 0 // This should be set based on original invoice amount
          actualAmount = Math.abs(amount)
          differenceAmount = Math.abs(amount)
        } else {
          expectedAmount = Math.abs(amount) + 10000 // Assume some expected amount
          actualAmount = Math.abs(amount)
          differenceAmount = actualAmount - expectedAmount
        }

        // Parse due date
        let dueDate: Date | null = null
        if (row['決済期日']) {
          const parsedDate = new Date(row['決済期日'])
          if (!isNaN(parsedDate.getTime())) {
            dueDate = parsedDate
          }
        }

        // Calculate overdue days
        let overdueDays: number | null = null
        if (dueDate && discrepancyType === 'UNPAID') {
          const today = new Date()
          const diffTime = today.getTime() - dueDate.getTime()
          overdueDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
        }

        // Determine AI intervention level based on amount and type
        let interventionLevel = 'AI_AUTONOMOUS'
        if (Math.abs(amount) > 100000 || discrepancyType === 'MULTIPLE_INVOICES') {
          interventionLevel = 'HUMAN_REQUIRED'
        } else if (Math.abs(amount) > 50000) {
          interventionLevel = 'AI_ASSISTED'
        }

        // Determine priority
        let priority = 'MEDIUM'
        if (overdueDays && overdueDays > 30) {
          priority = 'URGENT'
        } else if (Math.abs(amount) > 100000) {
          priority = 'HIGH'
        } else if (Math.abs(amount) < 10000) {
          priority = 'LOW'
        }

        // Create discrepancy
        await prisma.paymentDiscrepancy.create({
          data: {
            customerId: customer.id,
            type: discrepancyType,
            expectedAmount,
            actualAmount,
            differenceAmount,
            dueDate,
            overdueDays,
            priority,
            interventionLevel,
            importKey: importKey,
            notes: row['備考'] || row['未入金内訳'] || null,
            aiAnalysis: JSON.stringify({
              confidence: interventionLevel === 'AI_AUTONOMOUS' ? 0.9 : interventionLevel === 'AI_ASSISTED' ? 0.75 : 0.6,
              recommendedAction: discrepancyType === 'UNPAID' ? 'send_reminder' : 'confirm_payment',
              reasoning: `${row['分類']}として自動インポート。金額: ${amount}円`
            })
          }
        })

        processed++
      } catch (error) {
        errors.push(`行${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    const result = {
      success: errors.length === 0,
      processed,
      created,
      updated,
      errors,
      warnings
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}