// User types
export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'USER'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

// Customer types
export interface Customer {
  id: string
  customerCode: string
  name: string
  email: string
  phone?: string
  address?: string
  contactPerson?: string
  paymentTerms: number
  creditLimit?: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  isActive: boolean
  notes?: string
  createdAt: string
  updatedAt: string
  _count?: {
    paymentDiscrepancies: number
    emailLogs: number
  }
}

// Payment Discrepancy types
export interface PaymentDiscrepancy {
  id: string
  customerId: string
  type: 'UNPAID' | 'OVERPAID' | 'PARTIAL' | 'MULTIPLE_INVOICES'
  status: 'DETECTED' | 'PROCESSING' | 'EMAIL_SENT' | 'CUSTOMER_CONTACTED' | 'AGREED' | 'RESOLVED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  interventionLevel: 'AI_AUTONOMOUS' | 'AI_ASSISTED' | 'HUMAN_REQUIRED'
  expectedAmount: number
  actualAmount: number
  differenceAmount: number
  detectedAt: string
  dueDate?: string
  overdueDays?: number
  assignedUserId?: string
  assignedAt?: string
  notes?: string
  tags?: string[]
  aiAnalysis?: AIAnalysis
  importKey?: string
  createdAt: string
  updatedAt: string

  // Relations
  customer: Customer
  assignedUser?: Pick<User, 'id' | 'name' | 'email'>
  emailLogs?: EmailLog[]
  tasks?: Task[]
  _count?: {
    emailLogs: number
    tasks: number
  }

  // Computed fields
  progressPercentage?: number
  currentStep?: number
  estimatedCompletionDays?: number
  nextAction?: string
}

export interface AIAnalysis {
  confidence: number
  recommendedAction: string
  reasoning: string
  factors?: Record<string, any>
}

// Email types
export interface EmailLog {
  id: string
  discrepancyId?: string
  customerId?: string
  sender: string
  recipient: string
  subject: string
  body: string
  templateId?: string
  status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED' | 'BOUNCED'
  sentAt?: string
  deliveredAt?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: 'UNPAID_REMINDER' | 'OVERPAID_INQUIRY' | 'PAYMENT_CONFIRMATION' | 'PARTIAL_PAYMENT_FOLLOW_UP'
  stage: 'FIRST_REMINDER' | 'SECOND_REMINDER' | 'FINAL_REMINDER' | 'INQUIRY' | 'CONFIRMATION'
  variables: string[]
  isActive: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy: Pick<User, 'id' | 'name' | 'email'>
  _count?: {
    emailLogs: number
  }
}

// Task types
export interface Task {
  id: string
  type: string
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  assignedUserId?: string
  dueDate?: string
  completedAt?: string
  result?: any
  metadata?: any
  createdAt: string
  updatedAt: string
  assignedUser?: Pick<User, 'id' | 'name' | 'email'>
  discrepancyId?: string
  discrepancy?: PaymentDiscrepancy
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
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

// Filter and search types
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

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Statistics types
export interface Statistics {
  overview: {
    aiAutonomous: number
    aiAssisted: number
    humanRequired: number
    urgent: number
  }
  metrics: {
    autonomousRate: number
    avgProcessingDays: number
    resolutionRate: number
    targetAutonomousRate: number
  }
  statusBreakdown: Record<string, number>
}

// View mode types
export type ViewMode = 'card' | 'grid' | 'table'

// Step progress types
export interface StepProgress {
  step: number
  label: string
  percentage: number
  completed: boolean
  current: boolean
}