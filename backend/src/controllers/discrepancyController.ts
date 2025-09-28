import { Response, NextFunction } from 'express'
import { prisma } from '../server'
import { AppError } from '../middleware/errorHandler'
import { AuthenticatedRequest, PaginationParams, FilterParams, AIAnalysis } from '../types/common'

// AI confidence calculation based on specification
const calculateAIConfidence = (
  amount: number,
  customerRiskLevel: string,
  hasGoodPaymentHistory: boolean
): number => {
  let confidence = 0.5

  // Amount-based adjustment
  if (Math.abs(amount) < 10000) confidence += 0.2
  else if (Math.abs(amount) < 100000) confidence += 0.1
  else if (Math.abs(amount) >= 500000) confidence -= 0.2

  // Risk level adjustment
  switch (customerRiskLevel) {
    case 'LOW': confidence += 0.2; break
    case 'MEDIUM': confidence += 0.1; break
    case 'HIGH': confidence -= 0.1; break
    case 'CRITICAL': confidence -= 0.3; break
  }

  // Payment history adjustment
  if (hasGoodPaymentHistory) confidence += 0.1

  return Math.min(0.99, Math.max(0.1, confidence))
}

// Determine intervention level based on confidence
const determineInterventionLevel = (confidence: number): string => {
  if (confidence >= 0.9) return 'AI_AUTONOMOUS'
  if (confidence >= 0.7) return 'AI_ASSISTED'
  return 'HUMAN_REQUIRED'
}

// Calculate 5-step progress percentage
const calculateProgressPercentage = (status: string): number => {
  const statusMap: Record<string, number> = {
    'DETECTED': 20,
    'EMAIL_SENT': 40,
    'CUSTOMER_CONTACTED': 60,
    'AGREED': 80,
    'RESOLVED': 100
  }
  return statusMap[status] || 0
}

export const getDiscrepancies = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
      priority,
      type,
      assignedUserId,
      customerId,
      startDate,
      endDate
    } = req.query as PaginationParams & FilterParams

    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}

    if (search) {
      where.OR = [
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) where.status = status
    if (priority) where.priority = priority
    if (type) where.type = type
    if (assignedUserId) where.assignedUserId = assignedUserId
    if (customerId) where.customerId = customerId

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [discrepancies, total] = await Promise.all([
      prisma.paymentDiscrepancy.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              customerCode: true,
              riskLevel: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          emailLogs: {
            select: {
              id: true,
              status: true,
              sentAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          _count: {
            select: {
              emailLogs: true,
              tasks: true
            }
          }
        }
      }),
      prisma.paymentDiscrepancy.count({ where })
    ])

    const enrichedDiscrepancies = discrepancies.map(discrepancy => ({
      ...discrepancy,
      progressPercentage: calculateProgressPercentage(discrepancy.status),
      currentStep: Math.ceil(calculateProgressPercentage(discrepancy.status) / 20),
      estimatedCompletionDays: discrepancy.interventionLevel === 'AI_AUTONOMOUS' ? 1 :
                               discrepancy.interventionLevel === 'AI_ASSISTED' ? 2 : 5,
      nextAction: getNextAction(discrepancy.status, discrepancy.interventionLevel)
    }))

    const totalPages = Math.ceil(total / Number(limit))

    res.json({
      success: true,
      data: {
        data: enrichedDiscrepancies,
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

export const getDiscrepancy = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const discrepancy = await prisma.paymentDiscrepancy.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        emailLogs: {
          orderBy: { createdAt: 'desc' }
        },
        tasks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!discrepancy) {
      throw new AppError('Discrepancy not found', 404)
    }

    const enrichedDiscrepancy = {
      ...discrepancy,
      progressPercentage: calculateProgressPercentage(discrepancy.status),
      currentStep: Math.ceil(calculateProgressPercentage(discrepancy.status) / 20),
      estimatedCompletionDays: discrepancy.interventionLevel === 'AI_AUTONOMOUS' ? 1 :
                               discrepancy.interventionLevel === 'AI_ASSISTED' ? 2 : 5,
      nextAction: getNextAction(discrepancy.status, discrepancy.interventionLevel)
    }

    res.json({
      success: true,
      data: enrichedDiscrepancy
    })
  } catch (error) {
    next(error)
  }
}

export const createDiscrepancy = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      customerId,
      type,
      expectedAmount,
      actualAmount,
      dueDate,
      notes,
      tags
    } = req.body

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      throw new AppError('Customer not found', 404)
    }

    const differenceAmount = expectedAmount - actualAmount
    const overdueDays = dueDate ? Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))) : null

    // Calculate AI analysis
    const confidence = calculateAIConfidence(differenceAmount, customer.riskLevel, true) // Assuming good payment history for now
    const interventionLevel = determineInterventionLevel(confidence)

    const aiAnalysis: AIAnalysis = {
      confidence,
      recommendedAction: getRecommendedAction(type, interventionLevel, Math.abs(differenceAmount)),
      reasoning: `${type}差異 ${Math.abs(differenceAmount).toLocaleString()}円。顧客リスクレベル: ${customer.riskLevel}。信頼度: ${Math.round(confidence * 100)}%`,
      factors: {
        amount: Math.abs(differenceAmount),
        customerRiskLevel: customer.riskLevel,
        overdueDays,
        type
      }
    }

    const discrepancy = await prisma.paymentDiscrepancy.create({
      data: {
        customerId,
        type,
        expectedAmount,
        actualAmount,
        differenceAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        overdueDays,
        notes,
        tags,
        interventionLevel: interventionLevel as any,
        aiAnalysis,
        assignedUserId: req.user!.id
      },
      include: {
        customer: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create initial task
    await prisma.task.create({
      data: {
        type: `${type}_DETECTION`,
        title: `${type}差異の検知・処理`,
        description: `${customer.name}の${type}差異（${Math.abs(differenceAmount).toLocaleString()}円）を検知しました。`,
        priority: Math.abs(differenceAmount) > 100000 ? 'HIGH' : Math.abs(differenceAmount) > 50000 ? 'MEDIUM' : 'LOW',
        assignedUserId: req.user!.id,
        discrepancyId: discrepancy.id
      }
    })

    res.status(201).json({
      success: true,
      data: {
        ...discrepancy,
        progressPercentage: calculateProgressPercentage(discrepancy.status),
        currentStep: 1,
        estimatedCompletionDays: interventionLevel === 'AI_AUTONOMOUS' ? 1 : interventionLevel === 'AI_ASSISTED' ? 2 : 5,
        nextAction: getNextAction(discrepancy.status, interventionLevel)
      }
    })
  } catch (error) {
    next(error)
  }
}

export const updateDiscrepancy = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { status, priority, notes, assignedUserId, tags } = req.body

    const existingDiscrepancy = await prisma.paymentDiscrepancy.findUnique({
      where: { id }
    })

    if (!existingDiscrepancy) {
      throw new AppError('Discrepancy not found', 404)
    }

    const discrepancy = await prisma.paymentDiscrepancy.update({
      where: { id },
      data: {
        status,
        priority,
        notes,
        assignedUserId,
        tags,
        ...(assignedUserId && assignedUserId !== existingDiscrepancy.assignedUserId && {
          assignedAt: new Date()
        })
      },
      include: {
        customer: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: {
        ...discrepancy,
        progressPercentage: calculateProgressPercentage(discrepancy.status),
        currentStep: Math.ceil(calculateProgressPercentage(discrepancy.status) / 20),
        estimatedCompletionDays: discrepancy.interventionLevel === 'AI_AUTONOMOUS' ? 1 :
                                 discrepancy.interventionLevel === 'AI_ASSISTED' ? 2 : 5,
        nextAction: getNextAction(discrepancy.status, discrepancy.interventionLevel)
      }
    })
  } catch (error) {
    next(error)
  }
}

export const deleteDiscrepancy = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const discrepancy = await prisma.paymentDiscrepancy.findUnique({
      where: { id }
    })

    if (!discrepancy) {
      throw new AppError('Discrepancy not found', 404)
    }

    await prisma.paymentDiscrepancy.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Discrepancy deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

export const sendReminderEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { emailType = 'reminder', customMessage } = req.body

    const discrepancy = await prisma.paymentDiscrepancy.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedUser: true
      }
    })

    if (!discrepancy) {
      throw new AppError('Discrepancy not found', 404)
    }

    // Generate email content based on type
    let subject = ''
    let content = ''

    switch (emailType) {
      case 'reminder':
        subject = `お支払いのお願い - ${discrepancy.customer.name}様`
        content = `${discrepancy.customer.name}様\n\nいつもお世話になっております。\n\n未払い金額: ¥${Math.abs(discrepancy.differenceAmount).toLocaleString()}\n期日: ${discrepancy.dueDate ? new Date(discrepancy.dueDate).toLocaleDateString('ja-JP') : '未設定'}\n\nお支払いのご確認をお願いいたします。`
        break
      case 'inquiry':
        subject = `お支払い状況の確認 - ${discrepancy.customer.name}様`
        content = `${discrepancy.customer.name}様\n\nお支払い状況についてご確認させていただきたく、ご連絡いたします。\n\n金額: ¥${Math.abs(discrepancy.differenceAmount).toLocaleString()}\n\nご不明な点がございましたら、お気軽にお問い合わせください。`
        break
      case 'custom':
        subject = `ご連絡 - ${discrepancy.customer.name}様`
        content = customMessage || 'カスタムメッセージが設定されていません。'
        break
    }

    // Create email log
    const emailLog = await prisma.emailLog.create({
      data: {
        discrepancyId: id,
        customerId: discrepancy.customerId,
        sender: 'system@company.com',
        recipient: discrepancy.customer.email || '',
        subject,
        body: content,
        status: 'SENT', // Simulated - in real app would send actual email
        sentAt: new Date()
      }
    })

    // Update discrepancy status if it's the first email
    if (discrepancy.status === 'DETECTED') {
      await prisma.paymentDiscrepancy.update({
        where: { id },
        data: { status: 'EMAIL_SENT' }
      })
    }

    res.json({
      success: true,
      message: 'リマインダーメールを送信しました',
      data: emailLog
    })
  } catch (error) {
    next(error)
  }
}

export const getStatistics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await prisma.paymentDiscrepancy.groupBy({
      by: ['interventionLevel', 'status', 'priority'],
      _count: { id: true },
      _sum: { differenceAmount: true }
    })

    const totalDiscrepancies = await prisma.paymentDiscrepancy.count()
    const resolvedDiscrepancies = await prisma.paymentDiscrepancy.count({
      where: { status: 'RESOLVED' }
    })

    const aiAutonomousCount = stats
      .filter(s => s.interventionLevel === 'AI_AUTONOMOUS')
      .reduce((sum, s) => sum + s._count.id, 0)

    const aiAssistedCount = stats
      .filter(s => s.interventionLevel === 'AI_ASSISTED')
      .reduce((sum, s) => sum + s._count.id, 0)

    const humanRequiredCount = stats
      .filter(s => s.interventionLevel === 'HUMAN_REQUIRED')
      .reduce((sum, s) => sum + s._count.id, 0)

    const autonomousRate = totalDiscrepancies > 0 ? (aiAutonomousCount / totalDiscrepancies) * 100 : 0
    const resolutionRate = totalDiscrepancies > 0 ? (resolvedDiscrepancies / totalDiscrepancies) * 100 : 0

    // Calculate average processing time (mock data for now)
    const avgProcessingDays = 1.8

    res.json({
      success: true,
      data: {
        overview: {
          aiAutonomous: aiAutonomousCount,
          aiAssisted: aiAssistedCount,
          humanRequired: humanRequiredCount,
          urgent: stats
            .filter(s => s.priority === 'URGENT')
            .reduce((sum, s) => sum + s._count.id, 0)
        },
        metrics: {
          autonomousRate: Math.round(autonomousRate),
          avgProcessingDays,
          resolutionRate: Math.round(resolutionRate),
          targetAutonomousRate: 70
        },
        statusBreakdown: stats.reduce((acc, stat) => {
          if (!acc[stat.status]) acc[stat.status] = 0
          acc[stat.status] += stat._count.id
          return acc
        }, {} as Record<string, number>)
      }
    })
  } catch (error) {
    next(error)
  }
}

// Helper functions
const getNextAction = (status: string, interventionLevel: string): string => {
  switch (status) {
    case 'DETECTED':
      return interventionLevel === 'AI_AUTONOMOUS' ? 'AI自動メール送信予定' : 'メール送信承認待ち'
    case 'EMAIL_SENT':
      return '顧客からの返信待ち'
    case 'CUSTOMER_CONTACTED':
      return '解決方法の合意形成中'
    case 'AGREED':
      return '最終確認・記録作業中'
    default:
      return '処理完了'
  }
}

const getRecommendedAction = (type: string, interventionLevel: string, amount: number): string => {
  if (interventionLevel === 'AI_AUTONOMOUS') {
    return type === 'UNPAID' ? 'send_first_reminder' : 'send_inquiry_email'
  } else if (interventionLevel === 'AI_ASSISTED') {
    return 'prepare_draft_email'
  } else {
    return 'escalate_to_human'
  }
}