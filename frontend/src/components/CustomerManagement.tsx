import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface Customer {
  id: string
  customerCode: string
  name: string
  email: string
  phone?: string
  address?: string
  contactPerson?: string
  paymentTerms: number
  creditLimit?: number
  riskLevel: string
  isActive: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    customerCode: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    paymentTerms: 30,
    creditLimit: '',
    riskLevel: 'LOW',
    notes: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers')
      if (response.data.success) {
        setCustomers(response.data.data)
      }
    } catch (error) {
      console.error('顧客データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null
      }

      if (editingCustomer) {
        const response = await axios.put(`/api/customers/${editingCustomer.id}`, submitData)
        if (response.data.success) {
          setCustomers(customers.map(c => c.id === editingCustomer.id ? response.data.data : c))
        }
      } else {
        const response = await axios.post('/api/customers', submitData)
        if (response.data.success) {
          setCustomers([...customers, response.data.data])
        }
      }

      resetForm()
    } catch (error: any) {
      console.error('顧客の保存に失敗しました:', error)
      alert(error.response?.data?.error || '保存に失敗しました')
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      customerCode: customer.customerCode,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      contactPerson: customer.contactPerson || '',
      paymentTerms: customer.paymentTerms,
      creditLimit: customer.creditLimit?.toString() || '',
      riskLevel: customer.riskLevel,
      notes: customer.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この顧客を削除しますか？')) return

    try {
      await axios.delete(`/api/customers/${id}`)
      setCustomers(customers.filter(c => c.id !== id))
    } catch (error) {
      console.error('顧客の削除に失敗しました:', error)
      alert('削除に失敗しました')
    }
  }

  const resetForm = () => {
    setFormData({
      customerCode: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
      paymentTerms: 30,
      creditLimit: '',
      riskLevel: 'LOW',
      notes: ''
    })
    setEditingCustomer(null)
    setShowForm(false)
  }

  const getRiskLevelBadge = (riskLevel: string) => {
    const badges: { [key: string]: string } = {
      'LOW': 'badge badge-success',
      'MEDIUM': 'badge badge-warning',
      'HIGH': 'badge badge-danger',
      'CRITICAL': 'badge badge-danger'
    }
    return badges[riskLevel] || 'badge badge-secondary'
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <h2 className="text-2xl font-bold text-gray-900">顧客管理</h2>
        <p className="text-gray-600">顧客情報の作成・編集・削除が可能です</p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="顧客名、顧客コード、メールアドレスで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary ml-4"
        >
          ➕ 新規顧客追加
        </button>
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingCustomer ? '顧客情報編集' : '新規顧客追加'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    顧客コード *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerCode}
                    onChange={(e) => setFormData({...formData, customerCode: e.target.value})}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    顧客名 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    担当者名
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  住所
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    支払条件（日）
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({...formData, paymentTerms: parseInt(e.target.value)})}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    与信限度額
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    リスクレベル
                  </label>
                  <select
                    value={formData.riskLevel}
                    onChange={(e) => setFormData({...formData, riskLevel: e.target.value})}
                    className="input w-full"
                  >
                    <option value="LOW">低リスク</option>
                    <option value="MEDIUM">中リスク</option>
                    <option value="HIGH">高リスク</option>
                    <option value="CRITICAL">要注意</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="input w-full"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingCustomer ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer List */}
      <div className="card">
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
                  支払条件
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  リスクレベル
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.customerCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    {customer.phone && (
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    )}
                    {customer.contactPerson && (
                      <div className="text-sm text-gray-500">担当: {customer.contactPerson}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.paymentTerms}日</div>
                    {customer.creditLimit && (
                      <div className="text-sm text-gray-500">
                        限度額: {customer.creditLimit.toLocaleString()}円
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getRiskLevelBadge(customer.riskLevel)}>
                      {customer.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-danger-600 hover:text-danger-900"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm ? '検索条件に一致する顧客が見つかりません' : '顧客データがありません'}
          </p>
        </div>
      )}
    </div>
  )
}

export default CustomerManagement