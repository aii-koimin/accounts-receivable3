import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import { PaymentDiscrepancy } from '../types'

const TaskManagement: React.FC = () => {
  console.log('TaskManagement: コンポーネント初期化')

  const [discrepancies, setDiscrepancies] = useState<PaymentDiscrepancy[]>([])
  const [loading, setLoading] = useState(true)
  const [processingDelete, setProcessingDelete] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'grid' | 'table'>('card')
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    interventionLevel: 'all'
  })

  useEffect(() => {
    console.log('TaskManagement: useEffect実行')
    fetchDiscrepancies()
  }, [])

  const fetchDiscrepancies = async () => {
    console.log('TaskManagement: fetchDiscrepancies開始')
    try {
      const response = await api.get('/discrepancies')
      console.log('TaskManagement: API レスポンス:', response)
      if (response.data.success) {
        const data = response.data.data.data || []
        console.log('TaskManagement: 取得データ:', data.length, '件')
        setDiscrepancies(data)
      }
    } catch (error) {
      console.error('TaskManagement: 差異データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressSteps = (status: string) => {
    const steps = ['検知', 'メール送付', '連絡取得', '合意', '解決']
    const statusMap: { [key: string]: number } = {
      'DETECTED': 0,
      'EMAIL_SENT': 1,
      'CUSTOMER_CONTACTED': 2,
      'AGREED': 3,
      'RESOLVED': 4
    }
    return { steps, currentStep: statusMap[status] || 0 }
  }

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      'DETECTED': 'badge badge-secondary',
      'PROCESSING': 'badge badge-warning',
      'EMAIL_SENT': 'badge badge-primary',
      'CUSTOMER_CONTACTED': 'badge badge-warning',
      'AGREED': 'badge badge-success',
      'RESOLVED': 'badge badge-success'
    }
    return badges[status] || 'badge badge-secondary'
  }

  const getPriorityBadge = (priority: string) => {
    const badges: { [key: string]: string } = {
      'LOW': 'badge badge-secondary',
      'MEDIUM': 'badge badge-primary',
      'HIGH': 'badge badge-warning',
      'URGENT': 'badge badge-danger'
    }
    return badges[priority] || 'badge badge-secondary'
  }

  const getInterventionLevelBadge = (level: string) => {
    const badges: { [key: string]: string } = {
      'AI_AUTONOMOUS': 'badge badge-success',
      'AI_ASSISTED': 'badge badge-warning',
      'HUMAN_REQUIRED': 'badge badge-danger'
    }
    const labels: { [key: string]: string } = {
      'AI_AUTONOMOUS': 'AI自動',
      'AI_ASSISTED': 'AI支援',
      'HUMAN_REQUIRED': '人的対応'
    }
    return { class: badges[level] || 'badge badge-secondary', label: labels[level] || level }
  }

  const filteredDiscrepancies = discrepancies.filter(disc => {
    return (filter.status === 'all' || disc.status === filter.status) &&
           (filter.priority === 'all' || disc.priority === filter.priority) &&
           (filter.interventionLevel === 'all' || disc.interventionLevel === filter.interventionLevel)
  })

  const handleEdit = async (discrepancy: PaymentDiscrepancy) => {
    const newStatus = prompt('新しいステータスを入力してください (DETECTED, EMAIL_SENT, CUSTOMER_CONTACTED, AGREED, RESOLVED):', discrepancy.status)
    if (!newStatus) return

    try {
      await api.put(`/discrepancies/${discrepancy.id}`, { status: newStatus })
      await fetchDiscrepancies()
      alert('ステータスを更新しました')
    } catch (error: any) {
      console.error('更新エラー:', error)
      if (error.response?.status === 401) {
        alert('認証が切れています。ページを更新してログインし直してください。')
      } else {
        alert(`更新に失敗しました: ${error.response?.data?.error || error.message}`)
      }
    }
  }

  const handleView = (discrepancy: PaymentDiscrepancy) => {
    console.log('TaskManagement: handleView クリック:', discrepancy.id)
    const details = `
会社名: ${discrepancy.customer.name}
メール: ${discrepancy.customer.email}
差異タイプ: ${discrepancy.type}
期待金額: ¥${discrepancy.expectedAmount.toLocaleString()}
実際金額: ¥${discrepancy.actualAmount.toLocaleString()}
差異金額: ¥${discrepancy.differenceAmount.toLocaleString()}
ステータス: ${discrepancy.status}
優先度: ${discrepancy.priority}
担当者: ${discrepancy.assignedUser?.name || '未割当'}
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
      await fetchDiscrepancies()
      alert('メールを送信しました')
    } catch (error: any) {
      console.error('メール送信エラー:', error)
      if (error.response?.status === 401) {
        alert('認証が切れています。ページを更新してログインし直してください。')
      } else {
        alert(`メール送信に失敗しました: ${error.response?.data?.error || error.message}`)
      }
    }
  }

  const handleDelete = async (discrepancy: PaymentDiscrepancy) => {
    console.log('TaskManagement: handleDelete クリック:', discrepancy.id)

    if (processingDelete) {
      console.log('削除処理中のため、処理をスキップ')
      return
    }

    if (!confirm(`${discrepancy.customer.name}の差異を削除しますか？`)) return

    setProcessingDelete(discrepancy.id)

    try {
      console.log('削除開始:', discrepancy.id)
      const response = await api.delete(`/discrepancies/${discrepancy.id}`)
      console.log('削除レスポンス:', response)

      await fetchDiscrepancies()
      alert('差異を削除しました')
    } catch (error: any) {
      console.error('削除エラー:', error)
      console.error('エラー詳細:', error.response?.data)

      if (error.response?.status === 401) {
        alert('認証が切れています。ページを更新してログインし直してください。')
      } else {
        alert(`削除に失敗しました: ${error.response?.data?.error || error.message}`)
      }
    } finally {
      setProcessingDelete(null)
    }
  }

  const ProgressSteps: React.FC<{ status: string }> = ({ status }) => {
    const { steps, currentStep } = getProgressSteps(status)

    return (
      <div className="flex items-center space-x-2 mt-3">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              index <= currentStep ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {index + 1}
            </div>
            <span className={`ml-1 text-xs ${
              index <= currentStep ? 'text-primary-600 font-medium' : 'text-gray-500'
            }`}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-4 h-px mx-2 ${
                index < currentStep ? 'bg-primary-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">タスク管理</h2>
        <p className="text-gray-600">売掛金差異の5ステップ進捗管理</p>
        <button
          onClick={() => {
            console.log('テストボタンクリック!', new Date())
            alert('テストボタンが動作しています!')
          }}
          className="btn btn-primary mt-2"
        >
          テストボタン
        </button>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'card' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
            }`}
          >
            📋 カード
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'grid' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
            }`}
          >
            ⊞ グリッド
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'table' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
            }`}
          >
            📊 テーブル
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="input text-sm"
          >
            <option value="all">全ステータス</option>
            <option value="DETECTED">検知</option>
            <option value="EMAIL_SENT">メール送付</option>
            <option value="CUSTOMER_CONTACTED">連絡取得</option>
            <option value="AGREED">合意</option>
            <option value="RESOLVED">解決</option>
          </select>

          <select
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            className="input text-sm"
          >
            <option value="all">全優先度</option>
            <option value="LOW">低</option>
            <option value="MEDIUM">中</option>
            <option value="HIGH">高</option>
            <option value="URGENT">緊急</option>
          </select>

          <select
            value={filter.interventionLevel}
            onChange={(e) => setFilter({ ...filter, interventionLevel: e.target.value })}
            className="input text-sm"
          >
            <option value="all">全介入レベル</option>
            <option value="AI_AUTONOMOUS">AI自動</option>
            <option value="AI_ASSISTED">AI支援</option>
            <option value="HUMAN_REQUIRED">人的対応</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'card' && (
        <div className="space-y-4">
          {filteredDiscrepancies.map((disc) => (
            <div key={disc.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{disc.customer.name}</h3>
                  <p className="text-sm text-gray-500">{disc.customer.customerCode} | {disc.customer.email}</p>
                </div>
                <div className="flex gap-2">
                  <span className={getPriorityBadge(disc.priority)}>{disc.priority}</span>
                  <span className={getInterventionLevelBadge(disc.interventionLevel).class}>
                    {getInterventionLevelBadge(disc.interventionLevel).label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">差異タイプ</p>
                  <p className="text-sm font-medium">{disc.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">差異金額</p>
                  <p className={`text-sm font-medium ${
                    disc.differenceAmount > 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {disc.differenceAmount > 0 ? '+' : ''}{disc.differenceAmount.toLocaleString()}円
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">担当者</p>
                  <p className="text-sm font-medium">{disc.assignedUser?.name || '未割当'}</p>
                </div>
              </div>

              <ProgressSteps status={disc.status} />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleView(disc)}
                  className="btn btn-secondary text-xs px-2 py-1"
                >
                  詳細
                </button>
                <button
                  onClick={() => handleSendEmail(disc)}
                  className="btn btn-primary text-xs px-2 py-1"
                >
                  メール送信
                </button>
                <button
                  onClick={() => handleEdit(disc)}
                  className="btn btn-warning text-xs px-2 py-1"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(disc)}
                  disabled={processingDelete === disc.id}
                  className={`btn text-xs px-2 py-1 ${
                    processingDelete === disc.id
                      ? 'btn-secondary opacity-50 cursor-not-allowed'
                      : 'btn-danger'
                  }`}
                >
                  {processingDelete === disc.id ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDiscrepancies.map((disc) => (
            <div key={disc.id} className="card p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-sm font-medium text-gray-900 truncate">{disc.customer.name}</h3>
                <span className={getPriorityBadge(disc.priority)}>{disc.priority}</span>
              </div>

              <p className={`text-sm font-medium mb-2 ${
                disc.differenceAmount > 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                {disc.differenceAmount > 0 ? '+' : ''}{disc.differenceAmount.toLocaleString()}円
              </p>

              <div className="text-xs text-gray-500 mb-3">
                {disc.type} | {getInterventionLevelBadge(disc.interventionLevel).label}
              </div>

              <ProgressSteps status={disc.status} />

              <div className="mt-3 grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleView(disc)}
                  className="btn btn-secondary text-xs px-1 py-1"
                >
                  詳細
                </button>
                <button
                  onClick={() => handleSendEmail(disc)}
                  className="btn btn-primary text-xs px-1 py-1"
                >
                  メール
                </button>
                <button
                  onClick={() => handleEdit(disc)}
                  className="btn btn-warning text-xs px-1 py-1"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(disc)}
                  disabled={processingDelete === disc.id}
                  className={`btn text-xs px-1 py-1 ${
                    processingDelete === disc.id
                      ? 'btn-secondary opacity-50 cursor-not-allowed'
                      : 'btn-danger'
                  }`}
                >
                  {processingDelete === disc.id ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顧客
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    差異金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    優先度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    介入レベル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    担当者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDiscrepancies.map((disc) => (
                  <tr key={disc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{disc.customer.name}</div>
                        <div className="text-sm text-gray-500">{disc.customer.customerCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {disc.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        disc.differenceAmount > 0 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {disc.differenceAmount > 0 ? '+' : ''}{disc.differenceAmount.toLocaleString()}円
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getPriorityBadge(disc.priority)}>{disc.priority}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getInterventionLevelBadge(disc.interventionLevel).class}>
                        {getInterventionLevelBadge(disc.interventionLevel).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(disc.status)}>{disc.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {disc.assignedUser?.name || '未割当'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => handleView(disc)}
                          className="btn btn-secondary text-xs px-2 py-1"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => handleSendEmail(disc)}
                          className="btn btn-primary text-xs px-2 py-1"
                        >
                          メール送信
                        </button>
                        <button
                          onClick={() => handleEdit(disc)}
                          className="btn btn-warning text-xs px-2 py-1"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(disc)}
                          disabled={processingDelete === disc.id}
                          className={`btn text-xs px-2 py-1 ${
                            processingDelete === disc.id
                              ? 'btn-secondary opacity-50 cursor-not-allowed'
                              : 'btn-danger'
                          }`}
                        >
                          {processingDelete === disc.id ? '削除中...' : '削除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredDiscrepancies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">条件に一致するタスクがありません</p>
        </div>
      )}
    </div>
  )
}

export default TaskManagement