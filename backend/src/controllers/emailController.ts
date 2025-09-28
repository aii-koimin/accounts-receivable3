import { Response, NextFunction } from 'express'
import nodemailer from 'nodemailer'
import { prisma } from '../server'
import { AppError } from '../middleware/errorHandler'
import { AuthenticatedRequest, EmailConfig } from '../types/common'

// Email service class
class EmailService {
  private transporter: nodemailer.Transporter | null = null

  async createTransporter(config: EmailConfig): Promise<nodemailer.Transporter> {
    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    })

    return transporter
  }

  async testConnection(config: EmailConfig): Promise<boolean> {
    try {
      const transporter = await this.createTransporter(config)
      await transporter.verify()
      return true
    } catch (error) {
      console.error('SMTP connection test failed:', error)
      return false
    }
  }

  async sendEmail(
    config: EmailConfig,
    to: string,
    subject: string,
    body: string,
    cc?: string,
    bcc?: string
  ): Promise<boolean> {
    try {
      const transporter = await this.createTransporter(config)

      const mailOptions = {
        from: `${config.fromName} <${config.fromEmail}>`,
        to,
        cc,
        bcc,
        subject,
        html: body
      }

      await transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Email send failed:', error)
      return false
    }
  }

  replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      result = result.replace(new RegExp(placeholder, 'g'), String(value))
    })
    return result
  }
}

const emailService = new EmailService()

export const getEmailSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.systemConfig.findMany({
      where: {
        category: { in: ['smtp', 'email'] }
      }
    })

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    res.json({
      success: true,
      data: {
        smtp: {
          host: settingsMap.smtp_host || '',
          port: parseInt(settingsMap.smtp_port || '587'),
          secure: settingsMap.smtp_secure === 'true',
          user: settingsMap.smtp_user || '',
          pass: settingsMap.smtp_pass ? '***' : '' // Hide password
        },
        sender: {
          fromName: settingsMap.smtp_from_name || 'AR System',
          fromEmail: settingsMap.smtp_from_email || '',
          defaultCC: settingsMap.email_default_cc || '',
          defaultBCC: settingsMap.email_default_bcc || '',
          signature: settingsMap.email_signature || ''
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

export const updateEmailSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { smtp, sender } = req.body

    const updates = [
      { key: 'smtp_host', value: smtp.host, category: 'smtp' },
      { key: 'smtp_port', value: smtp.port.toString(), category: 'smtp' },
      { key: 'smtp_secure', value: smtp.secure.toString(), category: 'smtp' },
      { key: 'smtp_user', value: smtp.user, category: 'smtp' },
      { key: 'smtp_from_name', value: sender.fromName, category: 'email' },
      { key: 'smtp_from_email', value: sender.fromEmail, category: 'email' },
      { key: 'email_default_cc', value: sender.defaultCC || '', category: 'email' },
      { key: 'email_default_bcc', value: sender.defaultBCC || '', category: 'email' },
      { key: 'email_signature', value: sender.signature || '', category: 'email' }
    ]

    // Only update password if provided
    if (smtp.pass && smtp.pass !== '***') {
      updates.push({ key: 'smtp_pass', value: smtp.pass, category: 'smtp' })
    }

    await Promise.all(
      updates.map(update =>
        prisma.systemConfig.upsert({
          where: { key: update.key },
          create: {
            key: update.key,
            value: update.value,
            category: update.category,
            description: `Auto-generated setting for ${update.key}`
          },
          update: {
            value: update.value
          }
        })
      )
    )

    res.json({
      success: true,
      message: 'Email settings updated successfully'
    })
  } catch (error) {
    next(error)
  }
}

export const testEmailConnection = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { smtp } = req.body

    const config: EmailConfig = {
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      user: smtp.user,
      pass: smtp.pass,
      fromName: smtp.fromName || 'AR System',
      fromEmail: smtp.fromEmail || smtp.user
    }

    const isConnected = await emailService.testConnection(config)

    res.json({
      success: true,
      data: { connected: isConnected },
      message: isConnected ? 'SMTP connection successful' : 'SMTP connection failed'
    })
  } catch (error) {
    next(error)
  }
}

export const sendTestEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { smtp, testEmail } = req.body

    const config: EmailConfig = {
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      user: smtp.user,
      pass: smtp.pass,
      fromName: smtp.fromName || 'AR System',
      fromEmail: smtp.fromEmail || smtp.user
    }

    const testSubject = 'Test Email from AR System'
    const testBody = `
      <h2>Test Email</h2>
      <p>This is a test email from the Accounts Receivable Management System.</p>
      <p>If you received this email, your SMTP configuration is working correctly.</p>
      <p>Sent at: ${new Date().toLocaleString()}</p>
      <hr>
      <p>AR System - Automated Email Test</p>
    `

    const sent = await emailService.sendEmail(config, testEmail, testSubject, testBody)

    if (sent) {
      // Log the test email
      await prisma.emailLog.create({
        data: {
          sender: config.fromEmail,
          recipient: testEmail,
          subject: testSubject,
          body: testBody,
          status: 'SENT',
          sentAt: new Date()
        }
      })
    }

    res.json({
      success: true,
      data: { sent },
      message: sent ? 'Test email sent successfully' : 'Failed to send test email'
    })
  } catch (error) {
    next(error)
  }
}

export const getEmailTemplates = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            emailLogs: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    res.json({
      success: true,
      data: templates
    })
  } catch (error) {
    next(error)
  }
}

export const createEmailTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, subject, body, type, stage, variables } = req.body

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body,
        type: type as any,
        stage: stage as any,
        variables,
        createdById: req.user!.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: template
    })
  } catch (error) {
    next(error)
  }
}

export const updateEmailTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { name, subject, body, type, stage, variables, isActive } = req.body

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name,
        subject,
        body,
        type: type as any,
        stage: stage as any,
        variables,
        isActive
      },
      include: {
        createdBy: {
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
      data: template
    })
  } catch (error) {
    next(error)
  }
}

export const sendDiscrepancyEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { discrepancyId, templateId, customMessage } = req.body

    const discrepancy = await prisma.paymentDiscrepancy.findUnique({
      where: { id: discrepancyId },
      include: {
        customer: true
      }
    })

    if (!discrepancy) {
      throw new AppError('Discrepancy not found', 404)
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      throw new AppError('Email template not found', 404)
    }

    // Get email configuration
    const settings = await prisma.systemConfig.findMany({
      where: {
        category: { in: ['smtp', 'email'] }
      }
    })

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    const config: EmailConfig = {
      host: settingsMap.smtp_host,
      port: parseInt(settingsMap.smtp_port || '587'),
      secure: settingsMap.smtp_secure === 'true',
      user: settingsMap.smtp_user,
      pass: settingsMap.smtp_pass,
      fromName: settingsMap.smtp_from_name || 'AR System',
      fromEmail: settingsMap.smtp_from_email || settingsMap.smtp_user
    }

    // Prepare template variables
    const variables = {
      customerName: discrepancy.customer.name,
      companyName: '株式会社サンプル', // This should come from system settings
      senderName: req.user!.name,
      invoiceNumber: `INV-${discrepancy.id.slice(-6)}`, // Mock invoice number
      amount: discrepancy.expectedAmount.toLocaleString(),
      actualAmount: discrepancy.actualAmount.toLocaleString(),
      expectedAmount: discrepancy.expectedAmount.toLocaleString(),
      differenceAmount: Math.abs(discrepancy.differenceAmount).toLocaleString(),
      dueDate: discrepancy.dueDate?.toLocaleDateString('ja-JP') || '未設定',
      overdueDays: discrepancy.overdueDays || 0
    }

    // Replace variables in template
    const subject = emailService.replaceVariables(template.subject, variables)
    let body = emailService.replaceVariables(template.body, variables)

    // Add custom message if provided
    if (customMessage) {
      body = `${customMessage}\n\n${body}`
    }

    // Add signature
    if (settingsMap.email_signature) {
      body += `\n\n${settingsMap.email_signature}`
    }

    // Send email
    const sent = await emailService.sendEmail(
      config,
      discrepancy.customer.email,
      subject,
      body.replace(/\n/g, '<br>'),
      settingsMap.email_default_cc,
      settingsMap.email_default_bcc
    )

    // Log email
    const emailLog = await prisma.emailLog.create({
      data: {
        discrepancyId: discrepancy.id,
        customerId: discrepancy.customerId,
        sender: config.fromEmail,
        recipient: discrepancy.customer.email,
        subject,
        body,
        templateId: template.id,
        status: sent ? 'SENT' : 'FAILED',
        sentAt: sent ? new Date() : null,
        errorMessage: sent ? null : 'Failed to send email'
      }
    })

    // Update discrepancy status if email sent successfully
    if (sent) {
      await prisma.paymentDiscrepancy.update({
        where: { id: discrepancy.id },
        data: {
          status: 'EMAIL_SENT'
        }
      })
    }

    res.json({
      success: true,
      data: {
        sent,
        emailLogId: emailLog.id
      },
      message: sent ? 'Email sent successfully' : 'Failed to send email'
    })
  } catch (error) {
    next(error)
  }
}

export const getEmailLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { discrepancyId, customerId, page = 1, limit = 20 } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    const where: any = {}

    if (discrepancyId) where.discrepancyId = discrepancyId
    if (customerId) where.customerId = customerId

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          discrepancy: {
            select: {
              id: true,
              type: true,
              status: true
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          template: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      }),
      prisma.emailLog.count({ where })
    ])

    const totalPages = Math.ceil(total / Number(limit))

    res.json({
      success: true,
      data: {
        data: logs,
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