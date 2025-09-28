import React, { useState, useEffect } from 'react'
import { Grid, List, Table, Search, Filter, Plus } from 'lucide-react'
import { ViewMode, PaymentDiscrepancy } from '../types'
import { DiscrepancyViews } from '../components/DiscrepancyViews'
import api from '../utils/api'

const TasksPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [discrepancies, setDiscrepancies] = useState<PaymentDiscrepancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDiscrepancies()
  }, [])

  const fetchDiscrepancies = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/discrepancies')
      if (response.data.success) {
        setDiscrepancies(response.data.data.data || [])
      } else {
        throw new Error('データの取得に失敗しました')
      }
    } catch (error: any) {
      console.error('差異データの取得に失敗しました:', error)
      setError('データの取得に失敗しました')
      // Fallback to mock data for demonstration
      const mockDiscrepancies: PaymentDiscrepancy[] = [
    {
      id: '1',
      customerId: 'cust1',
      type: 'UNPAID',
      status: 'DETECTED',
      priority: 'HIGH',
      interventionLevel: 'AI_AUTONOMOUS',
      expectedAmount: 100000,
      actualAmount: 0,
      differenceAmount: -100000,
      detectedAt: '2024-01-28T10:00:00Z',
      dueDate: '2024-01-15T00:00:00Z',
      overdueDays: 14,
      createdAt: '2024-01-28T10:00:00Z',
      updatedAt: '2024-01-28T10:00:00Z',
      progressPercentage: 20,
      currentStep: 1,
      estimatedCompletionDays: 1,
      nextAction: 'AI自動メール送信予定',
      customer: {
        id: 'cust1',
        customerCode: 'CUST001',
        name: '株式会社サンプル',
        email: 'sample@sample.com',
        paymentTerms: 30,
        riskLevel: 'LOW',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      assignedUser: {
        id: 'user1',
        name: '経理担当者',
        email: 'user@company.com'
      },
      aiAnalysis: {
        confidence: 0.85,
        recommendedAction: 'send_first_reminder',
        reasoning: '支払期限を2週間経過した未入金案件。顧客の過去の支払履歴は良好。'
      },
      _count: {
        emailLogs: 0,
        tasks: 1
      }
    },
    {
      id: '2',
      customerId: 'cust2',
      type: 'OVERPAID',
      status: 'EMAIL_SENT',
      priority: 'MEDIUM',
      interventionLevel: 'AI_ASSISTED',
      expectedAmount: 50000,
      actualAmount: 75000,
      differenceAmount: 25000,
      detectedAt: '2024-01-28T09:00:00Z',
      dueDate: '2024-01-10T00:00:00Z',
      createdAt: '2024-01-28T09:00:00Z',
      updatedAt: '2024-01-28T11:00:00Z',
      progressPercentage: 40,
      currentStep: 2,
      estimatedCompletionDays: 2,
      nextAction: '顧客からの返信待ち',
      customer: {
        id: 'cust2',
        customerCode: 'CUST002',
        name: 'テスト商事株式会社',
        email: 'test@test.com',
        paymentTerms: 45,
        riskLevel: 'MEDIUM',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      assignedUser: {
        id: 'user1',
        name: '経理担当者',
        email: 'user@company.com'
      },
      aiAnalysis: {
        confidence: 0.92,
        recommendedAction: 'confirm_overpayment',
        reasoning: '過入金25,000円を確認。複数請求書の一括支払いの可能性が高い。'
      },
      _count: {
        emailLogs: 1,
        tasks: 1
      }
    },
    {
      id: '3',
      customerId: 'cust3',
      type: 'PARTIAL',
      status: 'CUSTOMER_CONTACTED',
      priority: 'URGENT',
      interventionLevel: 'HUMAN_REQUIRED',
      expectedAmount: 200000,
      actualAmount: 150000,
      differenceAmount: -50000,
      detectedAt: '2024-01-27T14:00:00Z',
      dueDate: '2024-01-20T00:00:00Z',
      overdueDays: 8,
      createdAt: '2024-01-27T14:00:00Z',
      updatedAt: '2024-01-28T09:30:00Z',
      progressPercentage: 60,
      currentStep: 3,
      estimatedCompletionDays: 5,
      nextAction: '解決方法の合意形成中',
      customer: {
        id: 'cust3',
        customerCode: 'CUST003',
        name: 'ハイリスク株式会社',
        email: 'highrisk@highrisk.com',
        paymentTerms: 60,
        riskLevel: 'HIGH',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      assignedUser: {
        id: 'manager1',
        name: '経理管理者',
        email: 'manager@company.com'
      },
      aiAnalysis: {
        confidence: 0.65,
        recommendedAction: 'escalate_to_human',
        reasoning: 'ハイリスク顧客からの一部入金。残金50,000円の支払い計画確認が必要。'
      },
      _count: {
        emailLogs: 2,
        tasks: 1
      }
    }
      ]
      setDiscrepancies(mockDiscrepancies)
    } finally {
      setLoading(false)
    }
  }

  const filteredDiscrepancies = discrepancies.filter((discrepancy) => {
    const matchesSearch = searchTerm === '' ||
      discrepancy.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discrepancy.customer.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === '' || discrepancy.status === statusFilter
    const matchesPriority = priorityFilter === '' || discrepancy.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const ViewModeToggle = () => (
    <div className="flex rounded-lg bg-gray-100 p-1">
      <button
        onClick={() => setViewMode('card')}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'card'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <List className="w-4 h-4 mr-2" />
        カード
      </button>
      <button
        onClick={() => setViewMode('grid')}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'grid'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Grid className="w-4 h-4 mr-2" />
        グリッド
      </button>
      <button
        onClick={() => setViewMode('table')}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'table'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Table className="w-4 h-4 mr-2" />
        テーブル
      </button>
    </div>
  )

  const handleEdit = async (discrepancy: PaymentDiscrepancy) => {
    const newStatus = prompt('新しいステータスを入力してください (DETECTED, EMAIL_SENT, CUSTOMER_CONTACTED, AGREED, RESOLVED):', discrepancy.status)
    if (!newStatus) return

    try {
      await api.put(`/discrepancies/${discrepancy.id}`, { status: newStatus })
      fetchDiscrepancies() // Refresh the list
      alert('ステータスを更新しました')
    } catch (error) {
      console.error('更新エラー:', error)
      alert('更新に失敗しました')
    }
  }

  const handleDelete = async (discrepancy: PaymentDiscrepancy) => {
    if (!confirm(`${discrepancy.customer.name}の差異を削除しますか？`)) return

    try {
      await api.delete(`/discrepancies/${discrepancy.id}`)
      fetchDiscrepancies() // Refresh the list
      alert('差異を削除しました')
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  const handleView = (discrepancy: PaymentDiscrepancy) => {
    const details = `
会社名: ${discrepancy.customer.name}
メール: ${discrepancy.customer.email}
差異タイプ: ${discrepancy.type}
期待金額: ¥${discrepancy.expectedAmount.toLocaleString()}
実際金額: ¥${discrepancy.actualAmount.toLocaleString()}
差異金額: ¥${discrepancy.differenceAmount.toLocaleString()}
ステータス: ${discrepancy.status}
優先度: ${discrepancy.priority}
AI信頼度: ${Math.round((discrepancy.aiAnalysis?.confidence || 0) * 100)}%
    `
    alert(details)
  }

  const handleSendEmail = async (discrepancy: PaymentDiscrepancy) => {
    const emailType = prompt('メールタイプを選択してください:\n1. reminder (支払い催促)\n2. inquiry (問い合わせ)\n3. custom (カスタム)', '1')
    if (!emailType) return

    const type = emailType === '2' ? 'inquiry' : emailType === '3' ? 'custom' : 'reminder'
    let customMessage = ''

    if (type === 'custom') {
      customMessage = prompt('カスタムメッセージを入力してください:', '')
      if (!customMessage) return
    }

    try {
      await api.post(`/discrepancies/${discrepancy.id}/send-email`, {
        emailType: type,
        customMessage
      })
      fetchDiscrepancies() // Refresh the list
      alert('メールを送信しました')
    } catch (error) {
      console.error('メール送信エラー:', error)
      alert('メール送信に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">データを読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-600">
              <Filter className="w-5 h-5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">データ取得エラー</h3>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              <p className="mt-1 text-xs text-red-500">モックデータを表示しています。</p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">タスク管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            売掛金差異の処理状況を管理します
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => fetchDiscrepancies()}>
          <Plus className="w-4 h-4 mr-2" />
          データ再読込
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="顧客名・メールで検索..."
                className="input pl-10 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="input w-full sm:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">全てのステータス</option>
              <option value="DETECTED">検知</option>
              <option value="EMAIL_SENT">メール送付</option>
              <option value="CUSTOMER_CONTACTED">連絡取得</option>
              <option value="AGREED">合意</option>
              <option value="RESOLVED">解決</option>
            </select>

            {/* Priority Filter */}
            <select
              className="input w-full sm:w-auto"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">全ての優先度</option>
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
              <option value="URGENT">緊急</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <ViewModeToggle />
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {filteredDiscrepancies.length}件の差異が見つかりました
        </span>
        <span>
          AI自動処理: {filteredDiscrepancies.filter(d => d.interventionLevel === 'AI_AUTONOMOUS').length}件 |
          AI支援: {filteredDiscrepancies.filter(d => d.interventionLevel === 'AI_ASSISTED').length}件 |
          人間対応: {filteredDiscrepancies.filter(d => d.interventionLevel === 'HUMAN_REQUIRED').length}件
        </span>
      </div>

      {/* Discrepancy Views */}
      {filteredDiscrepancies.length > 0 ? (
        <DiscrepancyViews
          discrepancies={filteredDiscrepancies}
          viewMode={viewMode}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onSendEmail={handleSendEmail}
        />
      ) : (
        <div className="card p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Filter className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            該当する差異が見つかりません
          </h3>
          <p className="text-gray-600">
            検索条件やフィルターを変更してください
          </p>
        </div>
      )}
    </div>
  )
}

export default TasksPage