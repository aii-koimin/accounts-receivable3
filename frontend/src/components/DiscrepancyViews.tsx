import React from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  AlertTriangle,
  Clock,
  Mail,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  User,
  Calendar,
  Yen
} from 'lucide-react'
import { PaymentDiscrepancy, ViewMode } from '../types'

interface DiscrepancyViewsProps {
  discrepancies: PaymentDiscrepancy[]
  viewMode: ViewMode
  onEdit?: (discrepancy: PaymentDiscrepancy) => void
  onDelete?: (discrepancy: PaymentDiscrepancy) => void
  onView?: (discrepancy: PaymentDiscrepancy) => void
  onSendEmail?: (discrepancy: PaymentDiscrepancy) => void
}

export const DiscrepancyViews: React.FC<DiscrepancyViewsProps> = ({
  discrepancies,
  viewMode,
  onEdit,
  onDelete,
  onView,
  onSendEmail,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DETECTED':
        return 'bg-yellow-100 text-yellow-800'
      case 'EMAIL_SENT':
        return 'bg-blue-100 text-blue-800'
      case 'CUSTOMER_CONTACTED':
        return 'bg-purple-100 text-purple-800'
      case 'AGREED':
        return 'bg-indigo-100 text-indigo-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DETECTED':
        return '検知'
      case 'EMAIL_SENT':
        return 'メール送付'
      case 'CUSTOMER_CONTACTED':
        return '連絡取得'
      case 'AGREED':
        return '合意'
      case 'RESOLVED':
        return '解決'
      default:
        return status
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'UNPAID':
        return 'bg-red-100 text-red-800'
      case 'OVERPAID':
        return 'bg-green-100 text-green-800'
      case 'PARTIAL':
        return 'bg-orange-100 text-orange-800'
      case 'MULTIPLE_INVOICES':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'UNPAID':
        return '未入金'
      case 'OVERPAID':
        return '過入金'
      case 'PARTIAL':
        return '一部入金'
      case 'MULTIPLE_INVOICES':
        return '複数請求'
      default:
        return type
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'MEDIUM':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'LOW':
        return <Clock className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount)
  }

  const ActionButtons: React.FC<{ discrepancy: PaymentDiscrepancy }> = ({ discrepancy }) => (
    <div className="flex items-center space-x-2">
      {onView && (
        <button
          onClick={() => onView(discrepancy)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="詳細表示"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}
      {onSendEmail && discrepancy.status !== 'RESOLVED' && (
        <button
          onClick={() => onSendEmail(discrepancy)}
          className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
          title="メール送信"
        >
          <Mail className="w-4 h-4" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={() => onEdit(discrepancy)}
          className="p-1 text-yellow-400 hover:text-yellow-600 transition-colors"
          title="編集"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(discrepancy)}
          className="p-1 text-red-400 hover:text-red-600 transition-colors"
          title="削除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )

  if (viewMode === 'card') {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {discrepancies.map((discrepancy) => (
          <div key={discrepancy.id} className="card p-6 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getPriorityIcon(discrepancy.priority)}
                <span className={`badge ${getTypeColor(discrepancy.type)}`}>
                  {getTypeLabel(discrepancy.type)}
                </span>
              </div>
              <ActionButtons discrepancy={discrepancy} />
            </div>

            {/* Customer Info */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                {discrepancy.customer.name}
              </h3>
              <p className="text-sm text-gray-600">
                {discrepancy.customer.email}
              </p>
            </div>

            {/* Amount Info */}
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">予定金額:</span>
                <span className="font-medium">
                  {formatCurrency(discrepancy.expectedAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">実際金額:</span>
                <span className="font-medium">
                  {formatCurrency(discrepancy.actualAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-gray-900">差異金額:</span>
                <span className={`${
                  discrepancy.differenceAmount < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(Math.abs(discrepancy.differenceAmount))}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">進捗</span>
                <span className="font-medium">{discrepancy.progressPercentage || 20}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${discrepancy.progressPercentage || 20}%` }}
                />
              </div>
            </div>

            {/* Status and Assignment */}
            <div className="flex items-center justify-between">
              <span className={`badge ${getStatusColor(discrepancy.status)}`}>
                {getStatusLabel(discrepancy.status)}
              </span>
              {discrepancy.assignedUser && (
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-3 h-3 mr-1" />
                  {discrepancy.assignedUser.name}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {discrepancies.map((discrepancy) => (
          <div key={discrepancy.id} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-1">
                {getPriorityIcon(discrepancy.priority)}
                <span className={`badge text-xs ${getTypeColor(discrepancy.type)}`}>
                  {getTypeLabel(discrepancy.type)}
                </span>
              </div>
              <ActionButtons discrepancy={discrepancy} />
            </div>

            <h4 className="font-medium text-gray-900 mb-2 truncate">
              {discrepancy.customer.name}
            </h4>

            <div className="space-y-1 text-sm mb-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">差異:</span>
                <span className={`font-medium ${
                  discrepancy.differenceAmount < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(Math.abs(discrepancy.differenceAmount))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">進捗:</span>
                <span className="font-medium">{discrepancy.progressPercentage || 20}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`badge text-xs ${getStatusColor(discrepancy.status)}`}>
                {getStatusLabel(discrepancy.status)}
              </span>
              {discrepancy.dueDate && (
                <span className="text-xs text-gray-500">
                  {format(new Date(discrepancy.dueDate), 'MM/dd', { locale: ja })}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Table view
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                顧客・種別
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                金額情報
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス・進捗
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                担当者・期日
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {discrepancies.map((discrepancy) => (
              <tr key={discrepancy.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      {getPriorityIcon(discrepancy.priority)}
                      <span className="font-medium text-gray-900">
                        {discrepancy.customer.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`badge ${getTypeColor(discrepancy.type)}`}>
                        {getTypeLabel(discrepancy.type)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="flex items-center space-x-1 mb-1">
                      <Yen className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">予定:</span>
                      <span className="font-medium">
                        {formatCurrency(discrepancy.expectedAmount)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 mb-1">
                      <Yen className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">実際:</span>
                      <span className="font-medium">
                        {formatCurrency(discrepancy.actualAmount)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">差異:</span>
                      <span className={`font-semibold ${
                        discrepancy.differenceAmount < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(Math.abs(discrepancy.differenceAmount))}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <span className={`badge ${getStatusColor(discrepancy.status)} mb-2`}>
                      {getStatusLabel(discrepancy.status)}
                    </span>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${discrepancy.progressPercentage || 20}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {discrepancy.progressPercentage || 20}% 完了
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    {discrepancy.assignedUser && (
                      <div className="flex items-center space-x-1 mb-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-900">
                          {discrepancy.assignedUser.name}
                        </span>
                      </div>
                    )}
                    {discrepancy.dueDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">
                          {format(new Date(discrepancy.dueDate), 'yyyy/MM/dd', { locale: ja })}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <ActionButtons discrepancy={discrepancy} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}