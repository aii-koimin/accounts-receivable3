import React, { useState } from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Dashboard from './components/Dashboard'
import TaskManagement from './components/TaskManagement'
import CustomerManagement from './components/CustomerManagement'
import EmailSettings from './components/EmailSettings'
import DataImport from './components/DataImport'

const App: React.FC = () => {
  const [email, setEmail] = useState('admin@company.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { user, login, logout } = useAuth()
  const location = useLocation()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const success = await login(email, password)
      if (success) {
        setMessage(`ログイン成功`)
      } else {
        setMessage('ログインに失敗しました')
      }
    } catch (error: any) {
      setMessage(`ログインエラー: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    setMessage('')
  }

  const isActiveRoute = (path: string) => {
    return location.pathname === path
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  売掛金管理システム
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user.name}さん ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary text-sm"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <nav className="w-64 bg-white shadow-sm min-h-screen">
            <div className="p-4">
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      isActiveRoute('/') ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    📊 ダッシュボード
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tasks"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      isActiveRoute('/tasks') ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    📋 タスク管理
                  </Link>
                </li>
                <li>
                  <Link
                    to="/customers"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      isActiveRoute('/customers') ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    👥 顧客管理
                  </Link>
                </li>
                <li>
                  <Link
                    to="/email-settings"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      isActiveRoute('/email-settings') ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    📧 メール設定
                  </Link>
                </li>
                <li>
                  <Link
                    to="/data-import"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      isActiveRoute('/data-import') ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    📥 データ取り込み
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tasks" element={<TaskManagement />} />
                <Route path="/customers" element={<CustomerManagement />} />
                <Route path="/email-settings" element={<EmailSettings />} />
                <Route path="/data-import" element={<DataImport />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          売掛金管理システム
        </h1>
        <p className="text-center text-gray-600 mb-4">
          ログインしてください
        </p>

        {message && (
          <div className={`p-3 rounded mb-4 text-sm ${
            message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            className="input"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="input"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500">
          <p>テストアカウント:</p>
          <p>admin@company.com / admin123</p>
          <p>manager@company.com / manager123</p>
          <p>user@company.com / user123</p>
        </div>
      </div>
    </div>
  )
}

export default App