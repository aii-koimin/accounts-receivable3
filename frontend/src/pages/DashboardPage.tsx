import React from 'react'
import { TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react'

const DashboardPage: React.FC = () => {
  // Mock data for demonstration
  const stats = {
    overview: {
      aiAutonomous: 45,
      aiAssisted: 23,
      humanRequired: 12,
      urgent: 3
    },
    metrics: {
      autonomousRate: 72,
      avgProcessingDays: 1.8,
      resolutionRate: 85,
      targetAutonomousRate: 70
    }
  }

  const recentActivities = [
    {
      id: 1,
      action: 'AI自動メール送信',
      customer: '株式会社サンプル',
      amount: 100000,
      time: '2分前'
    },
    {
      id: 2,
      action: '顧客返信受信',
      customer: 'テスト商事株式会社',
      amount: 75000,
      time: '15分前'
    },
    {
      id: 3,
      action: '差異解決完了',
      customer: 'ハイリスク株式会社',
      amount: 50000,
      time: '1時間前'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-1 text-sm text-gray-600">
          システムの全体状況と最新の活動をご覧ください
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-md flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success-600" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  AI自律処理
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.overview.aiAutonomous}件
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-warning-100 rounded-md flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning-600" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  AI支援処理
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.overview.aiAssisted}件
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  人間対応必須
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.overview.humanRequired}件
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-danger-100 rounded-md flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-danger-600" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  緊急対応
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.overview.urgent}件
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            研究効果測定
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">AI自動化率</span>
                <span className="font-medium">
                  {stats.metrics.autonomousRate}%
                  <span className="text-success-600 ml-1">
                    ↗ (目標{stats.metrics.targetAutonomousRate}%達成)
                  </span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-success-600 h-2 rounded-full"
                  style={{ width: `${stats.metrics.autonomousRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">平均処理時間</span>
                <span className="font-medium text-success-600">
                  {stats.metrics.avgProcessingDays}日 ↗ (目標2日クリア)
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">解決済み率</span>
                <span className="font-medium">
                  {stats.metrics.resolutionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${stats.metrics.resolutionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            最近のアクティビティ
          </h3>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-primary-600 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.customer} - ¥{activity.amount.toLocaleString()}
                  </p>
                </div>
                <div className="flex-shrink-0 text-sm text-gray-400">
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Statistics Bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">リアルタイム統計</h4>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success-500 rounded-full" />
              <span>AI自律処理: {stats.overview.aiAutonomous}件</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-warning-500 rounded-full" />
              <span>AI支援: {stats.overview.aiAssisted}件</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary-500 rounded-full" />
              <span>人間対応: {stats.overview.humanRequired}件</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-danger-500 rounded-full" />
              <span>緊急: {stats.overview.urgent}件</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex space-x-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="bg-success-500 h-full"
            style={{ width: `${(stats.overview.aiAutonomous / 83) * 100}%` }}
          />
          <div
            className="bg-warning-500 h-full"
            style={{ width: `${(stats.overview.aiAssisted / 83) * 100}%` }}
          />
          <div
            className="bg-primary-500 h-full"
            style={{ width: `${(stats.overview.humanRequired / 83) * 100}%` }}
          />
          <div
            className="bg-danger-500 h-full"
            style={{ width: `${(stats.overview.urgent / 83) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default DashboardPage