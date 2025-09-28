import { Request } from 'express'
import { User } from '@prisma/client'

export interface AuthenticatedRequest extends Request {
  user?: User
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  search?: string
  status?: string
  priority?: string
  type?: string
  assignedUserId?: string
  customerId?: string
  startDate?: string
  endDate?: string
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface AIAnalysis {
  confidence: number
  recommendedAction: string
  reasoning: string
  factors?: Record<string, any>
}

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromName: string
  fromEmail: string
}

export interface ExcelImportRow {
  分類: string
  会社名: string
  金額: number
  to: string
  決済期日?: string
  未入金内訳?: string
  Key?: string
  備考?: string
}

export interface ImportResult {
  totalRows: number
  successCount: number
  errorCount: number
  errors: Array<{
    row: number
    error: string
    data: any
  }>
  createdDiscrepancies: string[]
}