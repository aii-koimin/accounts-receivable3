import React from 'react'

const Dashboard: React.FC = () => {
  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
        <p className="text-gray-600">売掛金差異管理の状況を確認できます</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <div className="w-6 h-6 text-primary-600">📊</div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">総差異件数</h3>
              <p className="text-2xl font-semibold text-gray-900">3</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <div className="w-6 h-6 text-success-600">✅</div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">解決済み</h3>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <div className="w-6 h-6 text-warning-600">⏳</div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">処理中</h3>
              <p className="text-2xl font-semibold text-gray-900">2</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg">
              <div className="w-6 h-6 text-danger-600">🚨</div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">要対応</h3>
              <p className="text-2xl font-semibold text-gray-900">1</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Processing Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI自律処理率</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>目標: 70%</span>
              <span className="font-medium text-success-600">達成: 85%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-success-600 h-2 rounded-full" style={{width: '85%'}}></div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">処理時間短縮</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>従来: 14日 → 現在: 2.8日</span>
              <span className="font-medium text-success-600">80%短縮</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-success-600 h-2 rounded-full" style={{width: '80%'}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">最近のタスク</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-danger-400 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">ハイリスク株式会社 - 一部入金差異</p>
                  <p className="text-xs text-gray-500">差異金額: -50,000円 | 要人的対応</p>
                </div>
              </div>
              <span className="badge badge-danger">緊急</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-warning-400 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">サンプル商事株式会社 - 過入金照会</p>
                  <p className="text-xs text-gray-500">差異金額: +25,000円 | AI支援</p>
                </div>
              </div>
              <span className="badge badge-warning">処理中</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success-400 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">株式会社サンプル - 未入金督促</p>
                  <p className="text-xs text-gray-500">差異金額: -100,000円 | AI自動処理</p>
                </div>
              </div>
              <span className="badge badge-success">メール送信済み</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard