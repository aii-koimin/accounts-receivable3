import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500
  let message = 'Internal server error'

  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409
        message = 'Duplicate entry'
        break
      case 'P2025':
        statusCode = 404
        message = 'Record not found'
        break
      case 'P2003':
        statusCode = 400
        message = 'Foreign key constraint failed'
        break
      default:
        statusCode = 400
        message = 'Database error'
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400
    message = 'Validation error'
  }

  // Log error in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      statusCode,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    })
  } else {
    console.error(error)
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
}