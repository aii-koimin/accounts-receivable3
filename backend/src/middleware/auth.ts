import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../server'
import { AuthenticatedRequest } from '../types/common'
import { AppError } from './errorHandler'

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      throw new AppError('Access denied. No token provided.', 401)
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true }
    })

    if (!user) {
      throw new AppError('Invalid token.', 401)
    }

    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token.', 401))
    } else {
      next(error)
    }
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Access denied. Authentication required.', 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Access denied. Insufficient permissions.', 403))
    }

    next()
  }
}