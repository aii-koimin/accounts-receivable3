import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../server'
import { AppError } from '../middleware/errorHandler'
import { AuthenticatedRequest } from '../types/common'

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role = 'USER' } = req.body

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new AppError('User already exists', 409)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as any
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    })

    res.status(201).json({
      success: true,
      data: { user, token }
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email, isActive: true }
    })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Invalid email or password', 401)
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    })

    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      data: { user: userWithoutPassword, token }
    })
  } catch (error) {
    next(error)
  }
}

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedDiscrepancies: true,
            tasks: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email } = req.body

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    next(error)
  }
}

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      throw new AppError('Current password is incorrect', 400)
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedNewPassword }
    })

    res.json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error) {
    next(error)
  }
}