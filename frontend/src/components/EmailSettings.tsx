import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: string
  stage: string
  variables: string[]
  isActive: boolean
  createdAt: string
}

interface SmtpConfig {
  host: string
  port: string
  secure: string
  user: string
  pass: string
  fromName: string
  fromEmail: string
}

const EmailSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'smtp' | 'templates'>('smtp')
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)

  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: '',
    port: '587',
    secure: 'false',
    user: '',
    pass: '',
    fromName: 'AR System',
    fromEmail: ''
  })

  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'UNPAID_REMINDER',
    stage: 'FIRST_REMINDER'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [templatesRes, configRes] = await Promise.all([
        axios.get('/api/email/templates'),
        axios.get('/api/email/config')
      ])

      if (templatesRes.data.success) {
        setTemplates(templatesRes.data.data)
      }

      if (configRes.data.success) {
        const config = configRes.data.data
        setSmtpConfig({
          host: config.smtp_host || '',
          port: config.smtp_port || '587',
          secure: config.smtp_secure || 'false',
          user: config.smtp_user || '',
          pass: config.smtp_pass || '',
          fromName: config.smtp_from_name || 'AR System',
          fromEmail: config.smtp_from_email || ''
        })
      }
    } catch (error) {
      console.error('データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSmtpSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await axios.post('/api/email/config', smtpConfig)
      if (response.data.success) {
        alert('SMTP設定を保存しました')
      }
    } catch (error: any) {
      console.error('SMTP設定の保存に失敗しました:', error)
      alert(error.response?.data?.error || 'SMTP設定の保存に失敗しました')
    }
  }

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTemplate) {
        const response = await axios.put(`/api/email/templates/${editingTemplate.id}`, templateForm)
        if (response.data.success) {
          setTemplates(templates.map(t => t.id === editingTemplate.id ? response.data.data : t))
        }
      } else {
        const response = await axios.post('/api/email/templates', templateForm)
        if (response.data.success) {
          setTemplates([...templates, response.data.data])
        }
      }
      resetTemplateForm()
    } catch (error: any) {
      console.error('テンプレートの保存に失敗しました:', error)
      alert(error.response?.data?.error || 'テンプレートの保存に失敗しました')
    }
  }

  const handleTemplateEdit = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type,
      stage: template.stage
    })
    setShowTemplateForm(true)
  }

  const handleTemplateDelete = async (id: string) => {
    if (!confirm('このテンプレートを削除しますか？')) return

    try {
      await axios.delete(`/api/email/templates/${id}`)
      setTemplates(templates.filter(t => t.id !== id))
    } catch (error) {
      console.error('テンプレートの削除に失敗しました:', error)
      alert('テンプレートの削除に失敗しました')
    }
  }

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      subject: '',
      body: '',
      type: 'UNPAID_REMINDER',
      stage: 'FIRST_REMINDER'
    })
    setEditingTemplate(null)
    setShowTemplateForm(false)
  }

  const testSmtpConnection = async () => {
    try {
      const response = await axios.post('/api/email/test', smtpConfig)
      if (response.data.success) {
        alert('SMTP接続テストが成功しました')
      }
    } catch (error: any) {
      console.error('SMTP接続テストに失敗しました:', error)
      alert(error.response?.data?.error || 'SMTP接続テストに失敗しました')
    }
  }

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="body"]') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const newText = before + `{{${variable}}}` + after
      setTemplateForm({ ...templateForm, body: newText })
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
      }, 0)
    }
  }

  const availableVariables = [
    'customerName', 'companyName', 'senderName', 'invoiceNumber',
    'amount', 'expectedAmount', 'actualAmount', 'differenceAmount',
    'dueDate', 'overdueDays'
  ]

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
        <h2 className="text-2xl font-bold text-gray-900">メール設定</h2>
        <p className="text-gray-600">SMTP設定とメールテンプレートを管理します</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('smtp')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'smtp'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📧 SMTP設定
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📝 テンプレート管理
            </button>
          </nav>
        </div>
      </div>

      {/* SMTP Settings Tab */}
      {activeTab === 'smtp' && (
        <div className="card p-6">
          <form onSubmit={handleSmtpSave} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTPサーバー *
                </label>
                <input
                  type="text"
                  required
                  value={smtpConfig.host}
                  onChange={(e) => setSmtpConfig({...smtpConfig, host: e.target.value})}
                  placeholder="smtp.gmail.com"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ポート *
                </label>
                <input
                  type="number"
                  required
                  value={smtpConfig.port}
                  onChange={(e) => setSmtpConfig({...smtpConfig, port: e.target.value})}
                  className="input w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ユーザー名 *
                </label>
                <input
                  type="text"
                  required
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig({...smtpConfig, user: e.target.value})}
                  placeholder="your-email@gmail.com"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード *
                </label>
                <input
                  type="password"
                  required
                  value={smtpConfig.pass}
                  onChange={(e) => setSmtpConfig({...smtpConfig, pass: e.target.value})}
                  className="input w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  送信者名
                </label>
                <input
                  type="text"
                  value={smtpConfig.fromName}
                  onChange={(e) => setSmtpConfig({...smtpConfig, fromName: e.target.value})}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  送信者メールアドレス
                </label>
                <input
                  type="email"
                  value={smtpConfig.fromEmail}
                  onChange={(e) => setSmtpConfig({...smtpConfig, fromEmail: e.target.value})}
                  className="input w-full"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={smtpConfig.secure === 'true'}
                  onChange={(e) => setSmtpConfig({...smtpConfig, secure: e.target.checked ? 'true' : 'false'})}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">SSL/TLS を使用する</span>
              </label>
            </div>

            <div className="flex space-x-4">
              <button type="submit" className="btn btn-primary">
                設定を保存
              </button>
              <button
                type="button"
                onClick={testSmtpConnection}
                className="btn btn-secondary"
              >
                接続テスト
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Gmail設定例</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• SMTPサーバー: smtp.gmail.com</li>
              <li>• ポート: 587</li>
              <li>• SSL/TLS: チェック</li>
              <li>• アプリパスワードの使用を推奨</li>
            </ul>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          {/* Template List Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">メールテンプレート</h3>
              <p className="text-sm text-gray-600">自動送信用のメールテンプレートを管理します</p>
            </div>
            <button
              onClick={() => setShowTemplateForm(true)}
              className="btn btn-primary"
            >
              ➕ 新規テンプレート
            </button>
          </div>

          {/* Template Form Modal */}
          {showTemplateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    {editingTemplate ? 'テンプレート編集' : '新規테ンプレート작성'}
                  </h3>
                  <button
                    onClick={resetTemplateForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleTemplateSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        テンプレート名 *
                      </label>
                      <input
                        type="text"
                        required
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        メールタイプ
                      </label>
                      <select
                        value={templateForm.type}
                        onChange={(e) => setTemplateForm({...templateForm, type: e.target.value})}
                        className="input w-full"
                      >
                        <option value="UNPAID_REMINDER">未入金督促</option>
                        <option value="OVERPAID_INQUIRY">過入金照会</option>
                        <option value="PAYMENT_CONFIRMATION">入金確認</option>
                        <option value="PARTIAL_PAYMENT_FOLLOW_UP">一部入金フォローアップ</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      件名 *
                    </label>
                    <input
                      type="text"
                      required
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                      className="input w-full"
                      placeholder="【重要】お支払いのご確認について（請求書番号：{{invoiceNumber}}）"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        メール本文 *
                      </label>
                      <div className="text-xs text-gray-500">
                        利用可能な変数をクリックして挿入
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <textarea
                          name="body"
                          required
                          rows={12}
                          value={templateForm.body}
                          onChange={(e) => setTemplateForm({...templateForm, body: e.target.value})}
                          className="input w-full"
                          placeholder="{{customerName}} 様&#10;&#10;いつもお世話になっております。&#10;{{companyName}}の{{senderName}}です。&#10;&#10;..."
                        />
                      </div>
                      <div className="w-48">
                        <div className="text-xs font-medium text-gray-700 mb-2">変数一覧</div>
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                          {availableVariables.map((variable) => (
                            <button
                              key={variable}
                              type="button"
                              onClick={() => insertVariable(variable)}
                              className="block w-full text-left px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                            >
                              {variable}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetTemplateForm}
                      className="btn btn-secondary"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      {editingTemplate ? '更新' : '作成'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Template List */}
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="card p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                      <span className="badge badge-primary">{template.type}</span>
                      <span className="badge badge-secondary">{template.stage}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      <strong>件名:</strong> {template.subject}
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-3">
                      {template.body.substring(0, 200)}...
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleTemplateEdit(template)}
                      className="btn btn-secondary text-sm"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleTemplateDelete(template.id)}
                      className="btn btn-danger text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">メールテンプレートがありません</p>
              <button
                onClick={() => setShowTemplateForm(true)}
                className="btn btn-primary mt-4"
              >
                最初のテンプレートを作成
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EmailSettings