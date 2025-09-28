import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

interface ImportResult {
  success: boolean
  processed: number
  created: number
  updated: number
  errors: string[]
  warnings: string[]
}

interface AnalysisResult {
  totalRows: number
  validRows: number
  invalidRows: number
  columns: string[]
  preview: any[]
  errors: string[]
  warnings: string[]
}

const DataImport: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [importOptions, setImportOptions] = useState({
    createNewCustomers: true,
    skipDuplicates: true,
    emailNotification: true
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setCurrentStep(2)
      analyzeFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const analyzeFile = async (file: File) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('/api/import/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        setAnalysisResult(response.data.data)
        setCurrentStep(3)
      }
    } catch (error: any) {
      console.error('ファイル分析に失敗しました:', error)
      alert(error.response?.data?.error || 'ファイル分析に失敗しました')
      setCurrentStep(1)
    } finally {
      setLoading(false)
    }
  }

  const executeImport = async () => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('options', JSON.stringify(importOptions))

      const response = await axios.post('/api/import/execute', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        setImportResult(response.data.data)
        setCurrentStep(4)
      }
    } catch (error: any) {
      console.error('データ取り込みに失敗しました:', error)
      alert(error.response?.data?.error || 'データ取り込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const resetImport = () => {
    setCurrentStep(1)
    setSelectedFile(null)
    setAnalysisResult(null)
    setImportResult(null)
    setLoading(false)
  }

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed'
    if (step === currentStep) return 'current'
    return 'upcoming'
  }

  const steps = [
    { number: 1, name: 'ファイル選択', description: 'Excel/CSVファイルをアップロード' },
    { number: 2, name: 'データ分析', description: 'ファイル内容の検証と分析' },
    { number: 3, name: '実行確認', description: '取り込み設定の確認' },
    { number: 4, name: '結果表示', description: '取り込み結果の確認' }
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">データ取り込み</h2>
        <p className="text-gray-600">Excel/CSVファイルから売掛金差異データを一括取り込みします</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  getStepStatus(step.number) === 'completed'
                    ? 'bg-success-600 text-white'
                    : getStepStatus(step.number) === 'current'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {getStepStatus(step.number) === 'completed' ? '✓' : step.number}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${
                    getStepStatus(step.number) === 'current' ? 'text-primary-600' : 'text-gray-900'
                  }`}>
                    {step.name}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${
                  getStepStatus(step.number) === 'completed' ? 'bg-success-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: File Selection */}
      {currentStep === 1 && (
        <div className="card p-8">
          <div className="text-center">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 transition-colors ${
                isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-6xl mb-4">📁</div>
              <div className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'ファイルをドロップしてください' : 'ファイルを選択またはドラッグ&ドロップ'}
              </div>
              <div className="text-gray-500 mb-4">
                Excel (.xlsx, .xls) または CSV (.csv) ファイル
              </div>
              <div className="text-sm text-gray-400">
                最大ファイルサイズ: 10MB
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">必須カラム</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-sm font-medium text-red-900">分類 *</div>
                <div className="text-xs text-red-600">未入金/過入金/一部入金/複数請求</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-sm font-medium text-red-900">会社名 *</div>
                <div className="text-xs text-red-600">顧客名</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-sm font-medium text-red-900">金額 *</div>
                <div className="text-xs text-red-600">差異金額</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-sm font-medium text-red-900">to *</div>
                <div className="text-xs text-red-600">顧客メールアドレス</div>
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">オプションカラム</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900">決済期日</div>
                <div className="text-xs text-blue-600">YYYY-MM-DD形式</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900">未入金内訳</div>
                <div className="text-xs text-blue-600">詳細情報</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900">Key</div>
                <div className="text-xs text-blue-600">重複防止用キー</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900">備考</div>
                <div className="text-xs text-blue-600">特記事項</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Analysis (Loading) */}
      {currentStep === 2 && loading && (
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-900 mb-2">ファイルを分析中...</div>
          <div className="text-gray-500">データの検証と分析を行っています</div>
        </div>
      )}

      {/* Step 3: Analysis Results & Import Options */}
      {currentStep === 3 && analysisResult && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">分析結果</h3>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{analysisResult.totalRows}</div>
                <div className="text-sm text-gray-600">総行数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">{analysisResult.validRows}</div>
                <div className="text-sm text-gray-600">有効行数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-danger-600">{analysisResult.invalidRows}</div>
                <div className="text-sm text-gray-600">無効行数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{analysisResult.columns.length}</div>
                <div className="text-sm text-gray-600">列数</div>
              </div>
            </div>

            {analysisResult.errors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 rounded-lg">
                <h4 className="text-sm font-medium text-red-900 mb-2">エラー</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {analysisResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.warnings.length > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">警告</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {analysisResult.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">検出されたカラム</h4>
              <div className="flex flex-wrap gap-2">
                {analysisResult.columns.map((column, index) => (
                  <span key={index} className="badge badge-primary">{column}</span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">データプレビュー</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {analysisResult.columns.map((column, index) => (
                        <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysisResult.preview.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {analysisResult.columns.map((column, colIndex) => (
                          <td key={colIndex} className="px-4 py-2 text-sm text-gray-900">
                            {row[column] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">取り込みオプション</h3>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importOptions.createNewCustomers}
                  onChange={(e) => setImportOptions({...importOptions, createNewCustomers: e.target.checked})}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  新規顧客を自動作成する
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importOptions.skipDuplicates}
                  onChange={(e) => setImportOptions({...importOptions, skipDuplicates: e.target.checked})}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  重複データをスキップする（Keyが同一の場合）
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importOptions.emailNotification}
                  onChange={(e) => setImportOptions({...importOptions, emailNotification: e.target.checked})}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  取り込み完了通知メールを送信する
                </span>
              </label>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={resetImport}
                className="btn btn-secondary"
              >
                キャンセル
              </button>
              <button
                onClick={executeImport}
                disabled={analysisResult.invalidRows > 0}
                className="btn btn-primary"
              >
                取り込み実行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Import Results */}
      {currentStep === 4 && importResult && (
        <div className="card p-6">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              importResult.success ? 'bg-success-100' : 'bg-danger-100'
            }`}>
              <div className={`text-2xl ${
                importResult.success ? 'text-success-600' : 'text-danger-600'
              }`}>
                {importResult.success ? '✓' : '✕'}
              </div>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {importResult.success ? '取り込み完了' : '取り込み失敗'}
            </h3>
            <p className="text-gray-600">
              {importResult.success
                ? 'データの取り込みが正常に完了しました'
                : 'データの取り込み中にエラーが発生しました'
              }
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{importResult.processed}</div>
              <div className="text-sm text-gray-600">処理件数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">{importResult.created}</div>
              <div className="text-sm text-gray-600">新規作成</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{importResult.updated}</div>
              <div className="text-sm text-gray-600">更新</div>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 rounded-lg">
              <h4 className="text-sm font-medium text-red-900 mb-2">エラー</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {importResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {importResult.warnings.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-900 mb-2">警告</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {importResult.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={resetImport}
              className="btn btn-primary"
            >
              新しいファイルを取り込む
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay for step 3 */}
      {currentStep === 3 && loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <div className="text-lg font-medium text-gray-900 mb-2">データを取り込み中...</div>
            <div className="text-gray-500">しばらくお待ちください</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataImport