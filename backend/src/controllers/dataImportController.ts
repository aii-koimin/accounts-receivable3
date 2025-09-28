import { Response, NextFunction } from 'express'
import { prisma } from '../server'
import { AppError } from '../middleware/errorHandler'
import { AuthenticatedRequest, ImportResult, ExcelImportRow } from '../types/common'
import * as XLSX from 'xlsx'
import * as yup from 'yup'

// Validation schema for Excel import data
const importRowSchema = yup.object({
  分類: yup.string().required('分類は必須です').oneOf(['未入金', '過入金', '一部入金', '複数請求'], '無効な分類です'),
  会社名: yup.string().required('会社名は必須です').min(1, '会社名は必須です'),
  金額: yup.number().required('金額は必須です').min(0, '金額は0以上である必要があります'),
  to: yup.string().required('メールアドレスは必須です').email('有効なメールアドレスを入力してください'),
  決済期日: yup.string().optional(),
  未入金内訳: yup.string().optional(),
  Key: yup.string().optional(),
  備考: yup.string().optional()
})

// Map Japanese types to enum values
const TYPE_MAPPING: Record<string, string> = {
  '未入金': 'UNPAID',
  '過入金': 'OVERPAID',
  '一部入金': 'PARTIAL',
  '複数請求': 'MULTIPLE_INVOICES'
}

// AI confidence calculation
const calculateAIConfidence = (amount: number, customerRiskLevel: string): number => {
  let confidence = 0.5

  if (Math.abs(amount) < 10000) confidence += 0.2
  else if (Math.abs(amount) < 100000) confidence += 0.1
  else if (Math.abs(amount) >= 500000) confidence -= 0.2

  switch (customerRiskLevel) {
    case 'LOW': confidence += 0.2; break
    case 'MEDIUM': confidence += 0.1; break
    case 'HIGH': confidence -= 0.1; break
    case 'CRITICAL': confidence -= 0.3; break
  }

  return Math.min(0.99, Math.max(0.1, confidence))
}

const determineInterventionLevel = (confidence: number): string => {
  if (confidence >= 0.9) return 'AI_AUTONOMOUS'
  if (confidence >= 0.7) return 'AI_ASSISTED'
  return 'HUMAN_REQUIRED'
}

export const analyzeExcelFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('ファイルが選択されていません', 400)
    }

    // Read Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      throw new AppError('有効なシートが見つかりません', 400)
    }

    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    if (jsonData.length === 0) {
      throw new AppError('データが見つかりません', 400)
    }

    const analysis = {
      totalRows: jsonData.length,
      validRows: 0,
      invalidRows: 0,
      errors: [] as Array<{ row: number; errors: string[] }>,
      preview: jsonData.slice(0, 10), // First 10 rows for preview
      requiredColumns: ['分類', '会社名', '金額', 'to'],
      optionalColumns: ['決済期日', '未入金内訳', 'Key', '備考'],
      detectedColumns: Object.keys(jsonData[0] || {})
    }

    // Validate each row
    jsonData.forEach((row: any, index: number) => {
      try {
        importRowSchema.validateSync(row, { abortEarly: false })
        analysis.validRows++
      } catch (error: any) {
        analysis.invalidRows++
        analysis.errors.push({
          row: index + 1,
          errors: error.errors || ['不明なエラー']
        })
      }
    })

    res.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    next(error)
  }
}

export const importExcelData = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('ファイルが選択されていません', 400)
    }

    // Read Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData: ExcelImportRow[] = XLSX.utils.sheet_to_json(worksheet)

    const result: ImportResult = {
      totalRows: jsonData.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      createdDiscrepancies: []
    }

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]!
      const rowNumber = i + 1

      try {
        // Validate row
        const validatedRow = await importRowSchema.validate(row, { abortEarly: false })

        // Check for duplicate import key
        if (validatedRow.Key) {
          const existingDiscrepancy = await prisma.paymentDiscrepancy.findFirst({
            where: { importKey: validatedRow.Key }
          })

          if (existingDiscrepancy) {
            throw new Error(`重複するキー: ${validatedRow.Key}`)
          }
        }

        // Find or create customer
        let customer = await prisma.customer.findFirst({
          where: {
            OR: [
              { name: validatedRow.会社名 },
              { email: validatedRow.to }
            ]
          }
        })

        if (!customer) {
          // Auto-generate customer code
          const customerCount = await prisma.customer.count()
          const customerCode = `AUTO_${String(customerCount + 1).padStart(3, '0')}`

          customer = await prisma.customer.create({
            data: {
              customerCode,
              name: validatedRow.会社名,
              email: validatedRow.to,
              riskLevel: 'LOW' // Default risk level for new customers
            }
          })
        }

        // Calculate amounts based on type
        const type = TYPE_MAPPING[validatedRow.分類]!
        let expectedAmount: number
        let actualAmount: number
        let differenceAmount: number

        switch (type) {
          case 'UNPAID':
            expectedAmount = validatedRow.金額
            actualAmount = 0
            differenceAmount = -validatedRow.金額
            break
          case 'OVERPAID':
            expectedAmount = validatedRow.金額 * 0.8 // Assume original was 80% of overpaid amount
            actualAmount = validatedRow.金額
            differenceAmount = validatedRow.金額 * 0.2
            break
          case 'PARTIAL':
            expectedAmount = validatedRow.金額 * 1.25 // Assume partial is 80% of expected
            actualAmount = validatedRow.金額
            differenceAmount = -validatedRow.金額 * 0.25
            break
          case 'MULTIPLE_INVOICES':
            expectedAmount = validatedRow.金額 * 0.7 // Assume multiple invoices
            actualAmount = validatedRow.金額
            differenceAmount = validatedRow.金額 * 0.3
            break
          default:
            throw new Error('無効な分類です')
        }

        // Calculate AI analysis
        const confidence = calculateAIConfidence(differenceAmount, customer.riskLevel)
        const interventionLevel = determineInterventionLevel(confidence)

        const aiAnalysis = {
          confidence,
          recommendedAction: type === 'UNPAID' ? 'send_first_reminder' : 'send_inquiry_email',
          reasoning: `${validatedRow.分類}差異 ${Math.abs(differenceAmount).toLocaleString()}円。顧客リスクレベル: ${customer.riskLevel}。信頼度: ${Math.round(confidence * 100)}%`,
          factors: {
            amount: Math.abs(differenceAmount),
            customerRiskLevel: customer.riskLevel,
            type,
            importSource: 'excel'
          }
        }

        // Parse due date
        let dueDate: Date | undefined
        if (validatedRow.決済期日) {
          try {
            dueDate = new Date(validatedRow.決済期日)
            if (isNaN(dueDate.getTime())) {
              dueDate = undefined
            }
          } catch {
            dueDate = undefined
          }
        }

        // Calculate overdue days
        const overdueDays = dueDate ? Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))) : undefined

        // Create payment discrepancy
        const discrepancy = await prisma.paymentDiscrepancy.create({
          data: {
            customerId: customer.id,
            type: type as any,
            expectedAmount,
            actualAmount,
            differenceAmount,
            dueDate,
            overdueDays,
            notes: [validatedRow.未入金内訳, validatedRow.備考].filter(Boolean).join('\n'),
            importKey: validatedRow.Key,
            interventionLevel: interventionLevel as any,
            aiAnalysis,
            assignedUserId: req.user!.id,
            tags: ['Excel取り込み', validatedRow.分類]
          }
        })

        // Create task for the discrepancy
        await prisma.task.create({
          data: {
            type: `${type}_DETECTION`,
            title: `${validatedRow.分類}差異の処理`,
            description: `${customer.name}の${validatedRow.分類}差異（${Math.abs(differenceAmount).toLocaleString()}円）をExcelから取り込みました。`,
            priority: Math.abs(differenceAmount) > 100000 ? 'HIGH' : Math.abs(differenceAmount) > 50000 ? 'MEDIUM' : 'LOW',
            assignedUserId: req.user!.id,
            discrepancyId: discrepancy.id
          }
        })

        result.successCount++
        result.createdDiscrepancies.push(discrepancy.id)

      } catch (error: any) {
        result.errorCount++
        result.errors.push({
          row: rowNumber,
          error: error.message || '不明なエラー',
          data: row
        })
      }
    }

    res.json({
      success: true,
      data: result,
      message: `${result.successCount}件のデータを正常に取り込みました`
    })
  } catch (error) {
    next(error)
  }
}

export const getImportHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    // Get recent imports (we'll track this via activity logs)
    const recentImports = await prisma.activityLog.findMany({
      where: {
        action: 'excel_import'
      },
      skip,
      take: Number(limit),
      orderBy: { executedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    const total = await prisma.activityLog.count({
      where: {
        action: 'excel_import'
      }
    })

    const totalPages = Math.ceil(total / Number(limit))

    res.json({
      success: true,
      data: {
        data: recentImports,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

export const validateImportData = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data } = req.body

    if (!Array.isArray(data)) {
      throw new AppError('データは配列である必要があります', 400)
    }

    const validationResults = {
      totalRows: data.length,
      validRows: 0,
      invalidRows: 0,
      errors: [] as Array<{ row: number; errors: string[] }>
    }

    // Validate each row
    data.forEach((row: any, index: number) => {
      try {
        importRowSchema.validateSync(row, { abortEarly: false })
        validationResults.validRows++
      } catch (error: any) {
        validationResults.invalidRows++
        validationResults.errors.push({
          row: index + 1,
          errors: error.errors || ['不明なエラー']
        })
      }
    })

    res.json({
      success: true,
      data: validationResults
    })
  } catch (error) {
    next(error)
  }
}