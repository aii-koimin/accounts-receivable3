import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Send, CheckCircle, AlertCircle, Settings, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface SMTPSettings {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
}

interface SenderSettings {
  fromName: string
  fromEmail: string
  defaultCC: string
  defaultBCC: string
  signature: string
}

interface EmailSettingsForm {
  smtp: SMTPSettings
  sender: SenderSettings
}

const EmailSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'smtp' | 'templates' | 'logs'>('smtp')
  const [showPassword, setShowPassword] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testEmailSending, setTestEmailSending] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EmailSettingsForm>({
    defaultValues: {
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        user: '',
        pass: ''
      },
      sender: {
        fromName: 'AR System',
        fromEmail: '',
        defaultCC: 'manager@company.com',
        defaultBCC: 'audit@company.com',
        signature: `--
売掛金管理システム
株式会社サンプル 経理部
〒100-0001 東京都千代田区1-1-1
TEL: 03-1234-5678
Email: accounting@company.com`
      }
    }
  })

  const currentSettings = watch()

  const handleSaveSettings = async (data: EmailSettingsForm) => {
    try {
      // TODO: API call to save settings
      console.log('Saving settings:', data)
      toast.success('設定を保存しました')
    } catch (error) {
      toast.error('設定の保存に失敗しました')
    }
  }

  const handleTestConnection = async () => {
    setConnectionStatus('testing')
    try {
      // TODO: API call to test SMTP connection
      await new Promise(resolve => setTimeout(resolve, 2000)) // Mock delay
      setConnectionStatus('success')
      toast.success('SMTP接続テストに成功しました')
    } catch (error) {
      setConnectionStatus('error')
      toast.error('SMTP接続テストに失敗しました')
    }
  }

  const handleSendTestEmail = async () => {
    const testEmail = prompt('テストメールの送信先アドレスを入力してください:', currentSettings.sender.fromEmail)
    if (!testEmail) return

    setTestEmailSending(true)
    try {
      // TODO: API call to send test email
      await new Promise(resolve => setTimeout(resolve, 3000)) // Mock delay
      toast.success(`${testEmail} にテストメールを送信しました`)
    } catch (error) {
      toast.error('テストメールの送信に失敗しました')
    } finally {
      setTestEmailSending(false)
    }
  }

  const presetConfigs = [
    {
      name: 'Gmail',
      config: { host: 'smtp.gmail.com', port: 587, secure: false }
    },
    {
      name: 'Outlook',
      config: { host: 'smtp-mail.outlook.com', port: 587, secure: false }
    },
    {
      name: 'Yahoo',
      config: { host: 'smtp.mail.yahoo.com', port: 587, secure: false }
    }
  ]

  const applyPreset = (config: { host: string; port: number; secure: boolean }) => {
    setValue('smtp.host', config.host)
    setValue('smtp.port', config.port)
    setValue('smtp.secure', config.secure)
  }

  const mockEmailTemplates = [
    {
      id: '1',
      name: '未入金督促メール（1次）',
      type: 'UNPAID_REMINDER',
      stage: 'FIRST_REMINDER',
      isActive: true,
      usageCount: 15
    },
    {
      id: '2',
      name: '過入金照会メール',
      type: 'OVERPAID_INQUIRY',
      stage: 'INQUIRY',
      isActive: true,
      usageCount: 8
    },
    {
      id: '3',
      name: '未入金督促メール（最終）',
      type: 'UNPAID_REMINDER',
      stage: 'FINAL_REMINDER',
      isActive: true,
      usageCount: 3
    }
  ]

  const mockEmailLogs = [
    {
      id: '1',
      recipient: 'sample@sample.com',
      subject: '【重要】お支払いのご確認について',
      status: 'SENT',
      sentAt: '2024-01-28T10:30:00Z',
      customer: '株式会社サンプル'
    },
    {
      id: '2',
      recipient: 'test@test.com',
      subject: 'ご入金金額についてのお問い合わせ',
      status: 'DELIVERED',
      sentAt: '2024-01-28T09:15:00Z',
      customer: 'テスト商事株式会社'
    },
    {
      id: '3',
      recipient: 'highrisk@highrisk.com',
      subject: '【最終通知】お支払いについて',
      status: 'FAILED',
      sentAt: '2024-01-28T08:45:00Z',
      customer: 'ハイリスク株式会社',
      error: 'メールアドレスが無効です'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return 'bg-success-100 text-success-800'
      case 'FAILED':
        return 'bg-danger-100 text-danger-800'
      case 'PENDING':
        return 'bg-warning-100 text-warning-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SENT':
        return '送信済み'
      case 'DELIVERED':
        return '配信済み'
      case 'FAILED':
        return '失敗'
      case 'PENDING':
        return '送信中'
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">メール設定</h1>
        <p className="mt-1 text-sm text-gray-600">
          SMTP設定、テンプレート管理、送信履歴を管理します
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('smtp')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'smtp'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              SMTP設定
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              テンプレート
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Send className="w-4 h-4 inline mr-2" />
              送信履歴
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* SMTP Settings Tab */}
          {activeTab === 'smtp' && (
            <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-6">
              {/* Provider Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  プロバイダープリセット
                </label>
                <div className="flex space-x-3">
                  {presetConfigs.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset.config)}
                      className="btn btn-secondary"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* SMTP Basic Settings */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTPサーバー
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="smtp.gmail.com"
                    {...register('smtp.host', { required: 'SMTPサーバーは必須です' })}
                  />
                  {errors.smtp?.host && (
                    <p className="mt-1 text-sm text-red-600">{errors.smtp.host.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ポート
                  </label>
                  <input
                    type="number"
                    className="input"
                    placeholder="587"
                    {...register('smtp.port', {
                      required: 'ポートは必須です',
                      min: { value: 1, message: '有効なポート番号を入力してください' },
                      max: { value: 65535, message: '有効なポート番号を入力してください' }
                    })}
                  />
                  {errors.smtp?.port && (
                    <p className="mt-1 text-sm text-red-600">{errors.smtp.port.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ユーザー名
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="your-email@gmail.com"
                    {...register('smtp.user', { required: 'ユーザー名は必須です' })}
                  />
                  {errors.smtp?.user && (
                    <p className="mt-1 text-sm text-red-600">{errors.smtp.user.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    パスワード
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="アプリパスワードを使用"
                      {...register('smtp.pass', { required: 'パスワードは必須です' })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.smtp?.pass && (
                    <p className="mt-1 text-sm text-red-600">{errors.smtp.pass.message}</p>
                  )}
                </div>
              </div>

              {/* SSL/TLS Settings */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    {...register('smtp.secure')}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    SSL/TLS暗号化を使用 (通常はポート465の場合にチェック)
                  </span>
                </label>
              </div>

              {/* Sender Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">送信者情報</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      送信者名
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="AR System"
                      {...register('sender.fromName', { required: '送信者名は必須です' })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      送信者メール
                    </label>
                    <input
                      type="email"
                      className="input"
                      placeholder="system@company.com"
                      {...register('sender.fromEmail', {
                        required: '送信者メールは必須です',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: '有効なメールアドレスを入力してください'
                        }
                      })}
                    />
                    {errors.sender?.fromEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.sender.fromEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      デフォルトCC
                    </label>
                    <input
                      type="email"
                      className="input"
                      placeholder="manager@company.com"
                      {...register('sender.defaultCC')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      デフォルトBCC
                    </label>
                    <input
                      type="email"
                      className="input"
                      placeholder="audit@company.com"
                      {...register('sender.defaultBCC')}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    署名
                  </label>
                  <textarea
                    rows={6}
                    className="input"
                    placeholder="メール署名を入力..."
                    {...register('sender.signature')}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button type="submit" className="btn btn-primary">
                  設定を保存
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={connectionStatus === 'testing'}
                  className="btn btn-secondary"
                >
                  {connectionStatus === 'testing' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      接続確認中...
                    </>
                  ) : (
                    <>
                      {connectionStatus === 'success' ? (
                        <CheckCircle className="w-4 h-4 mr-2 text-success-600" />
                      ) : connectionStatus === 'error' ? (
                        <AlertCircle className="w-4 h-4 mr-2 text-danger-600" />
                      ) : (
                        <Settings className="w-4 h-4 mr-2" />
                      )}
                      接続テスト
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testEmailSending}
                  className="btn btn-secondary"
                >
                  {testEmailSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      送信中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      テストメール送信
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Email Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">メールテンプレート</h3>
                <button className="btn btn-primary">
                  新規テンプレート作成
                </button>
              </div>

              <div className="space-y-4">
                {mockEmailTemplates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            種別: {template.type}
                          </span>
                          <span className="text-sm text-gray-600">
                            段階: {template.stage}
                          </span>
                          <span className="text-sm text-gray-600">
                            使用回数: {template.usageCount}回
                          </span>
                          <span className={`badge ${
                            template.isActive ? 'badge-success' : 'badge-secondary'
                          }`}>
                            {template.isActive ? '有効' : '無効'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="btn btn-secondary">編集</button>
                        <button className="btn btn-secondary">プレビュー</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">送信履歴</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="顧客名・メールで検索..."
                    className="input w-64"
                  />
                  <select className="input">
                    <option value="">全てのステータス</option>
                    <option value="SENT">送信済み</option>
                    <option value="DELIVERED">配信済み</option>
                    <option value="FAILED">失敗</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        送信先・件名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        送信日時
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockEmailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.customer}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.recipient}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {log.subject}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${getStatusColor(log.status)}`}>
                            {getStatusLabel(log.status)}
                          </span>
                          {log.error && (
                            <div className="text-xs text-red-600 mt-1">
                              {log.error}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.sentAt).toLocaleString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900">
                            詳細
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailSettingsPage