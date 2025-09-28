# UI設計書 完全版 Ver1.1

## 🎯 概要

入金差異管理システムの完全フロントエンドUI設計・実装仕様

**フレームワーク**: React + TypeScript  
**スタイリング**: Tailwind CSS  
**アイコン**: Lucide React  
**状態管理**: React Hooks (useState/useEffect/useMemo)

---

## 🖥️ 画面構成・レイアウト

### メイン画面構造
```
┌─────────────────────────────────────────────────────────┐
│ 🎯 入金差異管理フロー【進捗版】                           │ ← ヘッダー
│ 進捗ステータスバー・AI自律処理70%・事前設定シナリオ対応    │
├─────────────────────────────────────────────────────────┤
│ [🤖AI: 88] [👤人間: 37] [📞電話: 8] [🚨緊急: 12] [📊総: 125] │ ← 統計サマリー
├─────────────────────────────────────────────────────────┤
│ [🔍検索] [🤖AI|👤人間|全体] [📄ブロック|📋列表|📊テーブル] [🔄] │ ← 検索・表示切替
├─────────────────────────────────────────────────────────┤
│                                                         │
│                  メインコンテンツエリア                   │ ← 3つの表示モード
│                                                         │
├─────────────────────────────────────────────────────────┤
│              ページネーション (1/7 ページ)                │ ← フッター
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 3つの表示モード詳細設計

### 1. 列表モード (推奨・デフォルト)

#### 特徴
- **5ステップ進捗バー**を各案件で表示
- **心理的負担軽減**を重視した視覚的フィードバック
- **詳細情報**を1画面で確認可能

#### レイアウト構造
```jsx
<div className="space-y-2">
  {discrepancies.map(discrepancy => (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all cursor-pointer mb-2 relative">
      {/* 優先度インジケーター */}
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg bg-{priority-color}" />
      
      <div className="flex items-start justify-between mb-2 pl-2">
        {/* 左側: 処理タイプアイコン + 顧客情報 */}
        <div className="flex items-center space-x-3 flex-1">
          {/* AI/人間アイコン */}
          <div className="flex items-center">
            {interventionLevel === 'ai_autonomous' && <Bot className="w-5 h-5 text-blue-600" />}
            {interventionLevel === 'ai_assisted' && (
              <div className="flex space-x-1">
                <Bot className="w-4 h-4 text-blue-500" />
                <User className="w-4 h-4 text-orange-500" />
              </div>
            )}
            {interventionLevel === 'human_required' && <User className="w-5 h-5 text-red-600" />}
          </div>
          
          {/* 顧客情報 */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <p className="font-semibold text-gray-900">{customer.name}</p>
              <span className="text-sm text-gray-500">({customer.code})</span>
            </div>
            
            {/* 🎯 5ステップ進捗表示 */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">
                  {interventionLevel === 'ai_autonomous' && '🤖 AI自律処理'}
                  {interventionLevel === 'ai_assisted' && '🤖👤 AI支援'}
                  {interventionLevel === 'human_required' && '👤 人間必須'}
                </span>
                {aiAnalysis?.confidence && (
                  <span className="text-xs px-1 py-0.5 rounded bg-{confidence-color}">
                    確信度: {Math.round(confidence * 100)}%
                  </span>
                )}
              </div>
              <ProgressSteps currentStep={getCurrentStep(discrepancy)} />
            </div>
          </div>
        </div>
        
        {/* 右側: ステータス + 金額 + アクション */}
        <div className="flex items-center space-x-2 ml-3">
          {/* 優先度バッジ */}
          <span className="text-xs px-2 py-1 rounded-full bg-{priority-color}">
            {priority === 'critical' && '🚨 緊急'}
            {priority === 'high' && '⚠️ 高'}
            {priority === 'medium' && '📊 中'}
            {priority === 'low' && '✅ 低'}
          </span>
          
          {/* 差異種別バッジ */}
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
            {type === 'unpaid' && '未入金'}
            {type === 'overpaid' && '過入金'}
            {type === 'partial' && '一部入金'}
            {type === 'multiple_invoices' && '複数請求'}
          </span>
          
          {/* 金額表示 */}
          <div className="text-right">
            <p className="text-lg font-bold text-{amount-color}">
              {discrepancyAmount > 0 ? '+' : ''}¥{formatCurrency(discrepancyAmount)}
            </p>
            {daysPastDue > 0 && (
              <p className="text-sm text-red-600 font-medium">{daysPastDue}日経過</p>
            )}
          </div>
          
          {/* 電話必要アラート */}
          {phoneRequired && (
            <div className="flex items-center bg-red-100 px-3 py-1 rounded-full">
              <Phone className="w-4 h-4 text-red-600 animate-pulse mr-1" />
              <span className="text-sm text-red-600 font-bold">電話必要</span>
            </div>
          )}
          
          {/* アクションメニュー */}
          <div className="relative">
            <button onClick={toggleDropdown}>
              <MoreVertical className="h-5 w-5" />
            </button>
            {/* ドロップダウンメニュー */}
          </div>
        </div>
      </div>
      
      {/* 次のアクション表示 */}
      {nextAction && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded ml-2 mt-2">
          <div className="flex items-center space-x-2">
            {nextAction.type === 'ai_auto' && <Bot className="w-4 h-4 text-blue-500" />}
            {nextAction.type === 'ai_suggested' && <Zap className="w-4 h-4 text-yellow-500" />}
            {nextAction.type === 'human_required' && <User className="w-4 h-4 text-red-500" />}
            <span>次のアクション: {nextAction.description}</span>
          </div>
        </div>
      )}
      
      {/* 検知日時 */}
      <div className="text-xs text-gray-500 ml-2 mt-2">
        検知日時: {formatDateTime(detectedAt)}
      </div>
    </div>
  ))}
</div>
```

#### 🎯 5ステップ進捗バーコンポーネント
```jsx
const ProgressSteps = ({ currentStep }) => {
  const progressSteps = [
    { id: 1, name: '入金差異検知', icon: '🔍' },
    { id: 2, name: '督促メール送付済み', icon: '📧' },
    { id: 3, name: '先方連絡を取れた', icon: '📞' },
    { id: 4, name: '解決方法合意済み', icon: '🤝' },
    { id: 5, name: '解決済み', icon: '✅' }
  ];

  return (
    <div className="flex items-center space-x-2">
      {progressSteps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              step.id <= currentStep 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {step.id <= currentStep ? step.icon : step.id}
            </div>
            <span className={`text-xs mt-1 text-center max-w-16 leading-tight ${
              step.id <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'
            }`}>
              {step.name}
            </span>
          </div>
          {index < progressSteps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 transition-all ${
              step.id < currentStep ? 'bg-blue-500' : 'bg-gray-200'
            }`} style={{ minWidth: '20px' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
```

### 2. ブロックモード (フロー表示)

#### 特徴
- **ステップ別カテゴリ表示**で処理の流れが直感的
- **ドラッグ&ドロップ**対応（将来拡張）
- **ステップ毎の件数**が一目で分かる

#### レイアウト構造
```jsx
<div className="bg-white rounded-lg border border-gray-200 p-4">
  <h2 className="text-lg font-bold text-gray-900 mb-4">🔄 ステップフロー表示</h2>
  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
    {progressSteps.map((step) => {
      const stepItems = paginatedData.filter(d => getCurrentStep(d) === step.id);
      return (
        <div key={step.id} className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
              {step.icon}
            </div>
            <div>
              <h3 className="font-medium text-sm">{step.name}</h3>
              <p className="text-xs text-gray-500">{stepItems.length}件</p>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stepItems.map(discrepancy => (
              <div key={discrepancy.id} 
                   className="bg-white p-2 rounded border cursor-pointer hover:shadow-sm"
                   onClick={() => onDiscrepancyClick(discrepancy)}>
                <p className="font-medium text-sm">{discrepancy.customer.name}</p>
                <p className="text-xs text-gray-500">
                  ¥{formatCurrency(Math.abs(discrepancy.discrepancyAmount))}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
</div>
```

### 3. テーブルモード (管理者向け)

#### 特徴
- **一覧性重視**でコンパクト表示
- **ソート機能**対応
- **一括選択・操作**可能

#### レイアウト構造
```jsx
<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            顧客
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            進捗ステップ
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            処理区分
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            差異額
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            優先度
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            操作
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {paginatedData.map((discrepancy) => (
          <tr key={discrepancy.id} 
              className="hover:bg-gray-50 cursor-pointer" 
              onClick={() => onDiscrepancyClick(discrepancy)}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div>
                <p className="font-medium text-gray-900">{discrepancy.customer.name}</p>
                <p className="text-sm text-gray-500">{discrepancy.customer.code}</p>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                  {progressSteps[getCurrentStep(discrepancy) - 1]?.icon}
                </div>
                <span className="text-sm">{progressSteps[getCurrentStep(discrepancy) - 1]?.name}</span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm">
                {discrepancy.interventionLevel === 'ai_autonomous' && '🤖 AI自律'}
                {discrepancy.interventionLevel === 'ai_assisted' && '🤖👤 AI支援'}
                {discrepancy.interventionLevel === 'human_required' && '👤 人間必須'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
              <span className={`font-medium ${
                discrepancy.discrepancyAmount > 0 ? 'text-blue-600' : 'text-red-600'
              }`}>
                {discrepancy.discrepancyAmount > 0 ? '+' : ''}
                ¥{formatCurrency(discrepancy.discrepancyAmount)}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityClass(discrepancy.priority)}`}>
                {getPriorityLabel(discrepancy.priority)}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <ActionDropdown discrepancy={discrepancy} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

## 🎛️ コントロール・フィルター設計

### ヘッダー部分
```jsx
<div className="mb-4 flex items-center justify-between">
  <div>
    <h1 className="text-xl font-bold text-gray-900 mb-1">
      🎯 入金差異管理フロー【進捗版】
    </h1>
    <p className="text-sm text-gray-600">
      進捗ステータスバー・AI自律処理70%・事前設定シナリオ対応
    </p>
  </div>
  
  {/* 表示モード切替 */}
  <div className="flex items-center space-x-2">
    <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
      <button
        onClick={() => setDisplayMode('flow')}
        className={`px-2 py-2 rounded text-sm flex items-center space-x-1 ${
          displayMode === 'flow' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Workflow className="w-4 h-4" />
        <span>ブロック</span>
      </button>
      <button
        onClick={() => setDisplayMode('list')}
        className={`px-2 py-2 rounded text-sm flex items-center space-x-1 ${
          displayMode === 'list' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <List className="w-4 h-4" />
        <span>列表</span>
      </button>
      <button
        onClick={() => setDisplayMode('table')}
        className={`px-2 py-2 rounded text-sm flex items-center space-x-1 ${
          displayMode === 'table' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Grid3X3 className="w-4 h-4" />
        <span>テーブル</span>
      </button>
    </div>
    
    {/* リフレッシュボタン */}
    <button
      onClick={onRefresh}
      disabled={loading}
      className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title="データを更新"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      <span className="ml-2 text-sm">更新</span>
    </button>
  </div>
</div>
```

### 統計サマリー (6指標)
```jsx
<div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
  <div className="bg-white rounded-lg border border-gray-200 p-3">
    <div className="flex items-center">
      <Bot className="h-4 w-4 text-blue-600 mr-2" />
      <div>
        <p className="text-xs text-blue-600">AI自律</p>
        <p className="text-lg font-semibold text-blue-900">{stats.aiAutonomous}</p>
      </div>
    </div>
  </div>
  
  <div className="bg-white rounded-lg border border-gray-200 p-3">
    <div className="flex items-center">
      <User className="h-4 w-4 text-red-600 mr-2" />
      <div>
        <p className="text-xs text-red-600">人間対応</p>
        <p className="text-lg font-semibold text-red-900">{stats.humanRequired}</p>
      </div>
    </div>
  </div>
  
  <div className="bg-white rounded-lg border border-gray-200 p-3">
    <div className="flex items-center">
      <Phone className="h-4 w-4 text-orange-600 mr-2" />
      <div>
        <p className="text-xs text-orange-600">電話要</p>
        <p className="text-lg font-semibold text-orange-900">{stats.phoneRequired}</p>
      </div>
    </div>
  </div>
  
  <div className="bg-white rounded-lg border border-gray-200 p-3">
    <div className="flex items-center">
      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
      <div>
        <p className="text-xs text-red-600">緊急</p>
        <p className="text-lg font-semibold text-red-900">{stats.critical}</p>
      </div>
    </div>
  </div>
  
  <div className="bg-white rounded-lg border border-gray-200 p-3">
    <div className="flex items-center">
      <CheckCircle className="h-4 w-4 text-gray-600 mr-2" />
      <div>
        <p className="text-xs text-gray-600">総件数</p>
        <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
      </div>
    </div>
  </div>
  
  <div className="bg-white rounded-lg border border-gray-200 p-3">
    <div className="flex items-center">
      <Mail className="h-4 w-4 text-yellow-600 mr-2" />
      <div>
        <p className="text-xs text-yellow-600">総差異額</p>
        <p className="text-sm font-semibold text-yellow-900">
          {(stats.totalAmount / 10000).toFixed(0)}万円
        </p>
      </div>
    </div>
  </div>
</div>
```

### 検索・フィルター・ページネーション
```jsx
<div className="mb-4 bg-white rounded-lg border border-gray-200 p-3">
  <div className="flex flex-col sm:flex-row gap-3 items-center">
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="顧客名、コードで検索..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
    
    <div className="flex items-center space-x-2">
      {/* ゾーンフォーカス */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setFocusZone('ai')}
          className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${
            focusZone === 'ai' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Bot className="w-3 h-3" />
          <span>AI</span>
        </button>
        <button
          onClick={() => setFocusZone('human')}
          className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${
            focusZone === 'human' ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <User className="w-3 h-3" />
          <span>人間</span>
        </button>
        <button
          onClick={() => setFocusZone('all')}
          className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${
            focusZone === 'all' ? 'bg-gray-200 text-gray-700' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span>全体</span>
        </button>
      </div>
      
      {/* ページサイズ */}
      <select
        value={pagination.limit}
        onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
        className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
      >
        <option value={5}>5件</option>
        <option value={10}>10件</option>
        <option value={20}>20件</option>
        <option value={50}>50件</option>
      </select>
      
      {/* ページネーション */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          disabled={pagination.page <= 1}
          className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
          {pagination.page} / {pagination.totalPages}
        </span>
        <button
          onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
          disabled={pagination.page >= pagination.totalPages}
          className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <button
        onClick={() => setAutoRefresh(!autoRefresh)}
        className={`p-1 rounded border ${autoRefresh ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-gray-200 text-gray-600'}`}
      >
        <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
      </button>
    </div>
  </div>
  
  <div className="mt-2 text-xs text-gray-600">
    {filteredAndSortedData.length}件中 {Math.min((pagination.page - 1) * pagination.limit + 1, filteredAndSortedData.length)} - {Math.min(pagination.page * pagination.limit, filteredAndSortedData.length)}件を表示
  </div>
</div>
```

---

## 🎨 カラーシステム・アイコン設計

### 優先度カラー
```jsx
const getPriorityClass = (priority) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-700 animate-pulse'; // 🚨 赤色・点滅
    case 'high':
      return 'bg-orange-100 text-orange-700'; // ⚠️ オレンジ色
    case 'medium':
      return 'bg-yellow-100 text-yellow-700'; // 📊 黄色
    case 'low':
      return 'bg-green-100 text-green-700'; // ✅ 緑色
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'critical': return '🚨 緊急';
    case 'high': return '⚠️ 高';
    case 'medium': return '📊 中';
    case 'low': return '✅ 低';
    default: return priority;
  }
};
```

### 介入レベル表示
```jsx
const getInterventionLevelDisplay = (level) => {
  switch (level) {
    case 'ai_autonomous':
      return { icon: <Bot className="w-5 h-5 text-blue-600" />, label: '🤖 AI自律' };
    case 'ai_assisted':
      return { 
        icon: (
          <div className="flex space-x-1">
            <Bot className="w-4 h-4 text-blue-500" />
            <User className="w-4 h-4 text-orange-500" />
          </div>
        ), 
        label: '🤖👤 AI支援' 
      };
    case 'human_required':
      return { icon: <User className="w-5 h-5 text-red-600" />, label: '👤 人間必須' };
    default:
      return { icon: null, label: level };
  }
};
```

### 差異種別表示
```jsx
const getDiscrepancyTypeLabel = (type) => {
  switch (type) {
    case 'unpaid': return '未入金';
    case 'overpaid': return '過入金';
    case 'partial': return '一部入金';
    case 'multiple_invoices': return '複数請求';
    default: return type;
  }
};
```

### 金額カラー
```jsx
const getAmountClass = (amount) => {
  return amount > 0 ? 'text-blue-600' : 'text-red-600'; // 正=青、負=赤
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ja-JP', { 
    style: 'currency', 
    currency: 'JPY' 
  }).format(Math.abs(amount));
};
```

---

## 🔧 インタラクション・操作設計

### 編集・削除操作
```jsx
const ActionDropdown = ({ discrepancy }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-gray-400 hover:text-gray-600 p-1"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(discrepancy);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>編集</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(discrepancy.id);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>削除</span>
          </button>
        </div>
      )}
    </div>
  );
};
```

### インライン編集フォーム
```jsx
{editMode === discrepancy.id && editFormData && (
  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">優先度</label>
        <select
          value={editFormData.priority}
          onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
        >
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="critical">緊急</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">ステータス</label>
        <select
          value={editFormData.status}
          onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
        >
          <option value="detected">検知</option>
          <option value="ai_analyzing">AI分析中</option>
          <option value="ai_action_ready">アクション準備</option>
          <option value="ai_executing">実行中</option>
          <option value="human_review">人間レビュー</option>
          <option value="customer_response">顧客返信</option>
          <option value="resolved">解決済み</option>
        </select>
      </div>
      <div className="md:col-span-1">
        <label className="block text-xs font-medium text-gray-700 mb-1">備考</label>
        <input
          type="text"
          value={editFormData.notes}
          onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
          placeholder="備考を入力..."
        />
      </div>
    </div>
    
    {/* 保存・キャンセルボタン */}
    <div className="flex items-center justify-end space-x-2 mt-3">
      <button 
        onClick={() => handleSaveEdit(discrepancy.id)}
        className="text-green-600 hover:text-green-800 p-1 flex items-center space-x-1"
      >
        <Save className="h-4 w-4" />
        <span className="text-xs">保存</span>
      </button>
      <button 
        onClick={handleCancelEdit}
        className="text-gray-600 hover:text-gray-800 p-1 flex items-center space-x-1"
      >
        <X className="h-4 w-4" />
        <span className="text-xs">キャンセル</span>
      </button>
    </div>
  </div>
)}
```

---

## 📱 レスポンシブ対応

### ブレークポイント設計
```jsx
// Tailwind CSS ブレークポイント
sm: '640px',   // スマートフォン縦
md: '768px',   // タブレット縦
lg: '1024px',  // タブレット横・PC小
xl: '1280px',  // PC標準
2xl: '1536px'  // PC大画面
```

### モバイル対応調整
```jsx
// モバイルでの列表表示調整
<div className="grid grid-cols-1 md:grid-cols-3 gap-3"> // PC: 3列、モバイル: 1列
<div className="flex flex-col sm:flex-row gap-3 items-center"> // PC: 横並び、モバイル: 縦並び
<div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4"> // PC: 6列、モバイル: 3列

// フロー表示のグリッド調整
<div className="grid grid-cols-2 lg:grid-cols-5 gap-4"> // PC: 5列、タブレット: 2列
```

---

## 🎯 アニメーション・トランジション

### ホバーエフェクト
```jsx
className="hover:shadow-md transition-all cursor-pointer"
className="hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
```

### ローディング状態
```jsx
{loading && (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
    <div className="space-y-8">
      <div className="h-64 bg-gray-200 rounded"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  </div>
)}

<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
```

### 緊急案件のアニメーション
```jsx
className={`${priority === 'critical' ? 'animate-pulse' : ''}`} // 緊急案件は点滅
<Phone className="w-4 h-4 text-red-600 animate-pulse mr-1" /> // 電話必要アイコンは点滅
```

---

## 📊 状態管理・データフロー

### React Hooks使用
```jsx
const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
const [flowView, setFlowView] = useState<FlowView>('separated');
const [filter, setFilter] = useState<DiscrepancyFilter>({});
const [searchTerm, setSearchTerm] = useState('');
const [pagination, setPagination] = useState<PaginationState>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
});
const [sortConfig, setSortConfig] = useState<SortConfig>({
  field: 'detectedAt',
  direction: 'desc'
});
const [selectedItems, setSelectedItems] = useState<string[]>([]);
const [autoRefresh, setAutoRefresh] = useState(true);
const [focusZone, setFocusZone] = useState<'ai' | 'human' | 'all'>('all');
const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
const [editMode, setEditMode] = useState<string | null>(null);
const [editFormData, setEditFormData] = useState<any>(null);
```

### データ処理フロー
```jsx
// フィルタリング・ソート・ページネーション
const filteredAndSortedData = useMemo(() => {
  let filtered = discrepancies.filter(item => {
    // 検索フィルター
    // ゾーンフォーカスフィルター  
    // その他のフィルター
    return true;
  });

  // ソート処理
  filtered.sort((a, b) => {
    const aValue = getNestedValue(a, sortConfig.field);
    const bValue = getNestedValue(b, sortConfig.field);
    return sortConfig.direction === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
  });

  return filtered;
}, [discrepancies, searchTerm, filter, sortConfig, focusZone]);

// ページネーション適用
const paginatedData = useMemo(() => {
  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit;
  return filteredAndSortedData.slice(start, end);
}, [filteredAndSortedData, pagination]);
```

---

## 🎯 TypeScript型定義

### 主要インターfaces
```typescript
interface PaymentDiscrepancy {
  id: string;
  type: 'unpaid' | 'overpaid' | 'partial' | 'multiple_invoices';
  discrepancyAmount: number;
  status: DiscrepancyStatus;
  interventionLevel: HumanInterventionLevel;
  priority: 'low' | 'medium' | 'high' | 'critical';
  daysPastDue?: number;
  aiAnalysis?: {
    confidence: number;
    escalationStage: number;
    recommendedActions: string[];
  };
  notes?: string;
  customer: Customer;
  invoice?: Invoice;
  nextAction?: NextAction;
  detectedAt: string;
  updatedAt: string;
}

interface ProgressDiscrepancyFlowBoardProps {
  discrepancies: PaymentDiscrepancy[];
  onStatusChange: (discrepancyId: string, newStatus: DiscrepancyStatus) => void;
  onDiscrepancyClick: (discrepancy: PaymentDiscrepancy) => void;
  onRefresh?: () => void;
  onEdit?: (discrepancy: PaymentDiscrepancy) => void;
  onDelete?: (discrepancyId: string) => void;
  loading?: boolean;
}

type DisplayMode = 'flow' | 'table' | 'list';
type FlowView = 'separated' | 'unified';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}
```

---

## 📚 参考・実装ガイダンス

### 実装順序推奨
1. **基本レイアウト** → ヘッダー・統計サマリー・フッター
2. **5ステップ進捗バー** → ProgressStepsコンポーネント
3. **列表モード** → ListItemコンポーネント（メイン）
4. **フィルター・検索** → 状態管理・データ処理
5. **編集・削除機能** → インライン編集・ドロップダウン
6. **ブロック・テーブルモード** → 追加表示モード
7. **レスポンシブ対応** → モバイル調整

### 重要なポイント
- ✅ **進捗バー**が最重要機能 - 心理的負担軽減の核心
- ✅ **AI/人間アイコン**で処理区分を明確化
- ✅ **優先度カラー**で視覚的緊急度表示
- ✅ **電話必要アラート**で重要アクション強調
- ✅ **確信度表示**でAI判断の透明性確保

---

*🤖 このUI設計書は実装済みのProgressDiscrepancyFlowBoard.tsx（1,228行）の完全仕様です*