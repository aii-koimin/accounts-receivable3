import React, { useState } from 'react'
import { Search, Plus, Edit, Trash2, Eye, Filter } from 'lucide-react'
import { Customer } from '../types'

const CustomersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState('')

  // Mock customer data
  const mockCustomers: Customer[] = [
    {
      id: '1',
      customerCode: 'CUST001',
      name: '株式会社サンプル',
      email: 'sample@sample.com',
      phone: '03-1234-5678',
      address: '東京都港区1-1-1',
      contactPerson: '田中太郎',
      paymentTerms: 30,
      creditLimit: 1000000,
      riskLevel: 'LOW',
      isActive: true,
      notes: '支払い履歴良好',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      _count: {
        paymentDiscrepancies: 2,
        emailLogs: 5
      }
    },
    {
      id: '2',
      customerCode: 'CUST002',
      name: 'テスト商事株式会社',
      email: 'test@test.com',
      phone: '03-2345-6789',
      address: '大阪府大阪市2-2-2',
      contactPerson: '佐藤花子',
      paymentTerms: 45,
      creditLimit: 2000000,
      riskLevel: 'MEDIUM',
      isActive: true,
      notes: '月末締め翌月払い',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      _count: {
        paymentDiscrepancies: 1,
        emailLogs: 3
      }
    },
    {
      id: '3',
      customerCode: 'CUST003',
      name: 'ハイリスク株式会社',
      email: 'highrisk@highrisk.com',
      phone: '03-3456-7890',
      address: '愛知県名古屋市3-3-3',
      contactPerson: '高橋次郎',
      paymentTerms: 60,
      creditLimit: 500000,
      riskLevel: 'HIGH',
      isActive: true,
      notes: '支払い遅延履歴あり。要注意',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-20T00:00:00Z',
      _count: {
        paymentDiscrepancies: 5,
        emailLogs: 12
      }
    }
  ]

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch = searchTerm === '' ||
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRisk = riskFilter === '' || customer.riskLevel === riskFilter

    return matchesSearch && matchesRisk
  })

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'bg-success-100 text-success-800'
      case 'MEDIUM':
        return 'bg-warning-100 text-warning-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'CRITICAL':
        return 'bg-danger-100 text-danger-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return '低'
      case 'MEDIUM':
        return '中'
      case 'HIGH':
        return '高'
      case 'CRITICAL':
        return '危険'
      default:
        return riskLevel
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount)
  }

  const handleEdit = (customer: Customer) => {
    console.log('Edit customer:', customer.id)
    // TODO: Implement edit functionality
  }

  const handleDelete = (customer: Customer) => {
    if (confirm(`${customer.name}を削除しますか？`)) {
      console.log('Delete customer:', customer.id)
      // TODO: Implement delete functionality
    }
  }

  const handleView = (customer: Customer) => {
    console.log('View customer:', customer.id)
    // TODO: Implement view details functionality
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">顧客管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            顧客情報の管理とリスク評価を行います
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          新規顧客登録
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="顧客名・メール・コードで検索..."
                className="input pl-10 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Risk Level Filter */}
            <select
              className="input w-full sm:w-auto"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="">全てのリスクレベル</option>
              <option value="LOW">低リスク</option>
              <option value="MEDIUM">中リスク</option>
              <option value="HIGH">高リスク</option>
              <option value="CRITICAL">危険</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredCustomers.length}件の顧客が見つかりました
          </div>
        </div>
      </div>

      {/* Customer List */}
      {filteredCustomers.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顧客情報
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    連絡先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    取引条件
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    リスク・活動
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {customer.name}
                          </span>
                          <span className={`badge text-xs ${
                            customer.isActive ? 'badge-success' : 'badge-secondary'
                          }`}>
                            {customer.isActive ? '有効' : '無効'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.customerCode}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">{customer.email}</div>
                        {customer.phone && (
                          <div className="text-gray-500">{customer.phone}</div>
                        )}
                        {customer.contactPerson && (
                          <div className="text-gray-500">担当: {customer.contactPerson}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          支払条件: {customer.paymentTerms}日
                        </div>
                        {customer.creditLimit && (
                          <div className="text-gray-500">
                            信用限度: {formatCurrency(customer.creditLimit)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className={`badge ${getRiskColor(customer.riskLevel)}`}>
                          リスク: {getRiskLabel(customer.riskLevel)}
                        </span>
                        <div className="text-xs text-gray-500">
                          差異: {customer._count?.paymentDiscrepancies || 0}件 |
                          メール: {customer._count?.emailLogs || 0}件
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleView(customer)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="詳細表示"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1 text-yellow-400 hover:text-yellow-600 transition-colors"
                          title="編集"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="p-1 text-red-400 hover:text-red-600 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Filter className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            該当する顧客が見つかりません
          </h3>
          <p className="text-gray-600">
            検索条件やフィルターを変更してください
          </p>
        </div>
      )}

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="card p-4">
          <div className="text-sm font-medium text-gray-500">総顧客数</div>
          <div className="text-2xl font-bold text-gray-900">
            {mockCustomers.length}
          </div>
        </div>

        <div className="card p-4">
          <div className="text-sm font-medium text-gray-500">低リスク</div>
          <div className="text-2xl font-bold text-success-600">
            {mockCustomers.filter(c => c.riskLevel === 'LOW').length}
          </div>
        </div>

        <div className="card p-4">
          <div className="text-sm font-medium text-gray-500">中リスク</div>
          <div className="text-2xl font-bold text-warning-600">
            {mockCustomers.filter(c => c.riskLevel === 'MEDIUM').length}
          </div>
        </div>

        <div className="card p-4">
          <div className="text-sm font-medium text-gray-500">高リスク以上</div>
          <div className="text-2xl font-bold text-danger-600">
            {mockCustomers.filter(c => ['HIGH', 'CRITICAL'].includes(c.riskLevel)).length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomersPage