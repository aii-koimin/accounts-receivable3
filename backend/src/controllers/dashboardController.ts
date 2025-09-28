import { Response, NextFunction } from 'express'
import { prisma } from '../server'
import { AuthenticatedRequest } from '../types/common'
import { format, subDays, subMonths } from 'date-fns'

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const lastMonth = subMonths(now, 1)

    // Get basic counts
    const [
      totalDiscrepancies,
      resolvedDiscrepancies,
      aiAutonomousCount,
      aiAssistedCount,
      humanRequiredCount,
      urgentCount,
      totalCustomers,
      totalEmailsSent,
      totalTasks
    ] = await Promise.all([
      prisma.paymentDiscrepancy.count(),
      prisma.paymentDiscrepancy.count({ where: { status: 'RESOLVED' } }),
      prisma.paymentDiscrepancy.count({ where: { interventionLevel: 'AI_AUTONOMOUS' } }),
      prisma.paymentDiscrepancy.count({ where: { interventionLevel: 'AI_ASSISTED' } }),
      prisma.paymentDiscrepancy.count({ where: { interventionLevel: 'HUMAN_REQUIRED' } }),
      prisma.paymentDiscrepancy.count({ where: { priority: 'URGENT' } }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.emailLog.count({ where: { status: 'SENT' } }),
      prisma.task.count()
    ])

    // Calculate AI autonomous rate
    const autonomousRate = totalDiscrepancies > 0 ? Math.round((aiAutonomousCount / totalDiscrepancies) * 100) : 0

    // Calculate resolution rate
    const resolutionRate = totalDiscrepancies > 0 ? Math.round((resolvedDiscrepancies / totalDiscrepancies) * 100) : 0

    // Calculate average processing time (mock calculation for now)
    const avgProcessingDays = 1.8

    // Get recent activity
    const recentActivities = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { executedAt: 'desc' },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    // Get time series data for the last 30 days
    const timeSeriesData = []
    for (let i = 29; i >= 0; i--) {
      const date = subDays(now, i)
      const dateStr = format(date, 'yyyy-MM-dd')

      const [detected, resolved] = await Promise.all([
        prisma.paymentDiscrepancy.count({
          where: {
            createdAt: {
              gte: date,
              lt: subDays(date, -1)
            }
          }
        }),
        prisma.paymentDiscrepancy.count({
          where: {
            status: 'RESOLVED',
            updatedAt: {
              gte: date,
              lt: subDays(date, -1)
            }
          }
        })
      ])

      timeSeriesData.push({
        date: dateStr,
        detected,
        resolved
      })
    }

    // Get intervention level breakdown by status
    const statusBreakdown = await prisma.paymentDiscrepancy.groupBy({
      by: ['status', 'interventionLevel'],
      _count: { id: true }
    })

    // Get customer risk distribution
    const customerRiskDistribution = await prisma.customer.groupBy({
      by: ['riskLevel'],
      _count: { id: true },
      where: { isActive: true }
    })

    // Calculate performance metrics compared to last month
    const [currentMonthResolved, lastMonthResolved] = await Promise.all([
      prisma.paymentDiscrepancy.count({
        where: {
          status: 'RESOLVED',
          updatedAt: {
            gte: subDays(now, 30)
          }
        }
      }),
      prisma.paymentDiscrepancy.count({
        where: {
          status: 'RESOLVED',
          updatedAt: {
            gte: subMonths(now, 2),
            lt: lastMonth
          }
        }
      })
    ])

    const performanceImprovement = lastMonthResolved > 0
      ? Math.round(((currentMonthResolved - lastMonthResolved) / lastMonthResolved) * 100)
      : 0

    // Calculate AI effectiveness metrics
    const aiEffectivenessData = await prisma.paymentDiscrepancy.findMany({
      where: {
        interventionLevel: { in: ['AI_AUTONOMOUS', 'AI_ASSISTED'] },
        status: 'RESOLVED'
      },
      select: {
        interventionLevel: true,
        createdAt: true,
        updatedAt: true,
        aiAnalysis: true
      }
    })

    const aiProcessingTimes = aiEffectivenessData.map(item => {
      const processingTime = (new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      return {
        type: item.interventionLevel,
        processingDays: Math.round(processingTime * 10) / 10,
        confidence: item.aiAnalysis ? (item.aiAnalysis as any).confidence || 0 : 0
      }
    })

    const avgAIProcessingTime = aiProcessingTimes.length > 0
      ? aiProcessingTimes.reduce((sum, item) => sum + item.processingDays, 0) / aiProcessingTimes.length
      : 0

    const avgAIConfidence = aiProcessingTimes.length > 0
      ? aiProcessingTimes.reduce((sum, item) => sum + item.confidence, 0) / aiProcessingTimes.length
      : 0

    const response = {
      overview: {
        aiAutonomous: aiAutonomousCount,
        aiAssisted: aiAssistedCount,
        humanRequired: humanRequiredCount,
        urgent: urgentCount
      },
      metrics: {
        autonomousRate,
        avgProcessingDays,
        resolutionRate,
        targetAutonomousRate: 70,
        performanceImprovement,
        avgAIProcessingTime: Math.round(avgAIProcessingTime * 10) / 10,
        avgAIConfidence: Math.round(avgAIConfidence * 100)
      },
      systemStats: {
        totalDiscrepancies,
        resolvedDiscrepancies,
        totalCustomers,
        totalEmailsSent,
        totalTasks
      },
      timeSeriesData,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        const key = `${item.status}_${item.interventionLevel}`
        acc[key] = item._count.id
        return acc
      }, {} as Record<string, number>),
      customerRiskDistribution: customerRiskDistribution.reduce((acc, item) => {
        acc[item.riskLevel] = item._count.id
        return acc
      }, {} as Record<string, number>),
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: getActivityDescription(activity.action, activity.entityType),
        user: activity.user.name,
        timestamp: activity.executedAt,
        details: activity.newValues
      }))
    }

    res.json({
      success: true,
      data: response
    })
  } catch (error) {
    next(error)
  }
}

export const getResearchMetrics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { period = '30' } = req.query
    const daysBack = parseInt(period as string)
    const startDate = subDays(new Date(), daysBack)

    // AI Processing Effectiveness
    const aiProcessingData = await prisma.paymentDiscrepancy.findMany({
      where: {
        createdAt: { gte: startDate },
        interventionLevel: { in: ['AI_AUTONOMOUS', 'AI_ASSISTED'] }
      },
      select: {
        id: true,
        interventionLevel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        aiAnalysis: true,
        differenceAmount: true
      }
    })

    // Calculate AI success rates
    const aiAutonomousTotal = aiProcessingData.filter(d => d.interventionLevel === 'AI_AUTONOMOUS').length
    const aiAutonomousResolved = aiProcessingData.filter(d =>
      d.interventionLevel === 'AI_AUTONOMOUS' && d.status === 'RESOLVED'
    ).length

    const aiAssistedTotal = aiProcessingData.filter(d => d.interventionLevel === 'AI_ASSISTED').length
    const aiAssistedResolved = aiProcessingData.filter(d =>
      d.interventionLevel === 'AI_ASSISTED' && d.status === 'RESOLVED'
    ).length

    const aiAutonomousSuccessRate = aiAutonomousTotal > 0 ? (aiAutonomousResolved / aiAutonomousTotal) * 100 : 0
    const aiAssistedSuccessRate = aiAssistedTotal > 0 ? (aiAssistedResolved / aiAssistedTotal) * 100 : 0

    // Processing time analysis
    const resolvedCases = aiProcessingData.filter(d => d.status === 'RESOLVED')
    const processingTimes = resolvedCases.map(d => {
      const processingHours = (new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60)
      return {
        type: d.interventionLevel,
        hours: processingHours,
        days: processingHours / 24,
        amount: Math.abs(d.differenceAmount),
        confidence: d.aiAnalysis ? (d.aiAnalysis as any).confidence || 0 : 0
      }
    })

    const avgProcessingTimeByType = {
      AI_AUTONOMOUS: processingTimes
        .filter(p => p.type === 'AI_AUTONOMOUS')
        .reduce((sum, p, _, arr) => sum + p.days / arr.length, 0),
      AI_ASSISTED: processingTimes
        .filter(p => p.type === 'AI_ASSISTED')
        .reduce((sum, p, _, arr) => sum + p.days / arr.length, 0)
    }

    // Confidence vs Success correlation
    const confidenceAnalysis = resolvedCases.map(d => ({
      confidence: d.aiAnalysis ? (d.aiAnalysis as any).confidence || 0 : 0,
      wasSuccessful: d.status === 'RESOLVED',
      processingTime: (new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    }))

    // Cost reduction calculation (mock)
    const totalCasesProcessed = aiProcessingData.length
    const humanProcessingTimePerCase = 4 // hours
    const aiProcessingTimePerCase = 0.5 // hours
    const hourlyRate = 3000 // yen per hour

    const timeSavedHours = totalCasesProcessed * (humanProcessingTimePerCase - aiProcessingTimePerCase)
    const costSavings = timeSavedHours * hourlyRate

    // Psychological burden reduction metrics (mock based on processing time reduction)
    const stressReductionScore = Math.min(100, Math.round(
      (avgProcessingTimeByType.AI_AUTONOMOUS / 5) * 100 // 5 days was original target
    ))

    const response = {
      researchPeriod: {
        days: daysBack,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      aiEffectiveness: {
        autonomousRate: Math.round((aiAutonomousTotal / (aiAutonomousTotal + aiAssistedTotal + 1)) * 100),
        autonomousSuccessRate: Math.round(aiAutonomousSuccessRate),
        assistedSuccessRate: Math.round(aiAssistedSuccessRate),
        totalCasesProcessed,
        targetAutonomousRate: 70,
        targetReached: aiAutonomousSuccessRate >= 70
      },
      processingTimeMetrics: {
        avgAIAutonomous: Math.round(avgProcessingTimeByType.AI_AUTONOMOUS * 10) / 10,
        avgAIAssisted: Math.round(avgProcessingTimeByType.AI_ASSISTED * 10) / 10,
        targetProcessingTime: 2.0,
        improvementPercentage: Math.round(((5 - avgProcessingTimeByType.AI_AUTONOMOUS) / 5) * 100)
      },
      psychologicalImpact: {
        stressReductionScore,
        targetReduction: 30,
        processingTimeReduction: Math.round(((5 - avgProcessingTimeByType.AI_AUTONOMOUS) / 5) * 100),
        visibilityImprovement: 85 // Mock score based on 5-step progress visibility
      },
      economicImpact: {
        timeSavedHours: Math.round(timeSavedHours),
        costSavings: Math.round(costSavings),
        efficiency: Math.round((timeSavedHours / (totalCasesProcessed * humanProcessingTimePerCase)) * 100)
      },
      confidenceAnalysis: {
        averageConfidence: Math.round(
          confidenceAnalysis.reduce((sum, c) => sum + c.confidence, 0) / confidenceAnalysis.length * 100
        ),
        highConfidenceCases: confidenceAnalysis.filter(c => c.confidence >= 0.8).length,
        correlationScore: 0.82 // Mock correlation between confidence and success
      }
    }

    res.json({
      success: true,
      data: response
    })
  } catch (error) {
    next(error)
  }
}

// Helper function to describe activities
function getActivityDescription(action: string, entityType: string): string {
  const actionMap: Record<string, string> = {
    create: '作成',
    update: '更新',
    delete: '削除',
    email_send: 'メール送信',
    excel_import: 'Excel取り込み'
  }

  const entityMap: Record<string, string> = {
    PaymentDiscrepancy: '差異',
    Customer: '顧客',
    EmailLog: 'メール',
    Task: 'タスク'
  }

  return `${entityMap[entityType] || entityType}の${actionMap[action] || action}`
}