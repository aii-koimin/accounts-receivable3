import { Response, NextFunction } from 'express'
import { prisma } from '../server'
import { AppError } from '../middleware/errorHandler'
import { AuthenticatedRequest, PaginationParams, FilterParams } from '../types/common'

export const getCustomers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
      search,
    } = req.query as PaginationParams & FilterParams

    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { customerCode: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              paymentDiscrepancies: true,
              emailLogs: true
            }
          }
        }
      }),
      prisma.customer.count({ where })
    ])

    const totalPages = Math.ceil(total / Number(limit))

    res.json({
      success: true,
      data: {
        data: customers,
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

export const getCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        paymentDiscrepancies: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        emailLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        riskAssessments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            paymentDiscrepancies: true,
            emailLogs: true
          }
        }
      }
    })

    if (!customer) {
      throw new AppError('Customer not found', 404)
    }

    res.json({
      success: true,
      data: customer
    })
  } catch (error) {
    next(error)
  }
}

export const createCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      contactPerson,
      paymentTerms = 30,
      creditLimit,
      riskLevel = 'LOW',
      notes
    } = req.body

    // Generate customer code
    const customerCount = await prisma.customer.count()
    const customerCode = `CUST${String(customerCount + 1).padStart(3, '0')}`

    const customer = await prisma.customer.create({
      data: {
        customerCode,
        name,
        email,
        phone,
        address,
        contactPerson,
        paymentTerms,
        creditLimit,
        riskLevel: riskLevel as any,
        notes
      }
    })

    res.status(201).json({
      success: true,
      data: customer
    })
  } catch (error) {
    next(error)
  }
}

export const updateCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const {
      name,
      email,
      phone,
      address,
      contactPerson,
      paymentTerms,
      creditLimit,
      riskLevel,
      notes,
      isActive
    } = req.body

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
        contactPerson,
        paymentTerms,
        creditLimit,
        riskLevel: riskLevel as any,
        notes,
        isActive
      }
    })

    res.json({
      success: true,
      data: customer
    })
  } catch (error) {
    next(error)
  }
}

export const deleteCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            paymentDiscrepancies: true
          }
        }
      }
    })

    if (!customer) {
      throw new AppError('Customer not found', 404)
    }

    if (customer._count.paymentDiscrepancies > 0) {
      throw new AppError('Cannot delete customer with existing payment discrepancies', 400)
    }

    await prisma.customer.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

export const searchCustomers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query as { q: string }

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      })
    }

    const customers = await prisma.customer.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { customerCode: { contains: q, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        customerCode: true,
        name: true,
        email: true,
        riskLevel: true
      },
      take: 10,
      orderBy: { name: 'asc' }
    })

    res.json({
      success: true,
      data: customers
    })
  } catch (error) {
    next(error)
  }
}