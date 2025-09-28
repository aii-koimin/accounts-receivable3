import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  RotateCcw,
  Play
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ImportAnalysis {
  totalRows: number
  validRows: number
  invalidRows: number
  errors: Array<{ row: number; errors: string[] }>
  preview: any[]
  requiredColumns: string[]
  optionalColumns: string[]
  detectedColumns: string[]
}

interface ImportResult {
  totalRows: number
  successCount: number
  errorCount: number
  errors: Array<{ row: number; error: string; data: any }>
  createdDiscrepancies: string[]
}

const DataImportPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'confirm' | 'result'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setCurrentStep('upload')
      setAnalysis(null)
      setImportResult(null)
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

  const analyzeFile = async () => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/data-import/excel/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setAnalysis(data.data)
        setCurrentStep('analyze')
      } else {
        toast.error(data.error || 'ファイル分析に失敗しました')
      }
    } catch (error) {
      toast.error('ファイル分析中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const importData = async () => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/data-import/excel/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setImportResult(data.data)
        setCurrentStep('result')
        toast.success(data.message || 'データの取り込みが完了しました')
      } else {
        toast.error(data.error || 'データ取り込みに失敗しました')
      }
    } catch (error) {
      toast.error('データ取り込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const resetImport = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setAnalysis(null)
    setImportResult(null)
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />
    }
    return <Upload className="w-8 h-8 text-gray-400" />
  }

  const downloadSampleFile = () => {
    // Create sample CSV data
    const sampleData = [
      ['分類', '会社名', '金額', 'to', '決済期日', '未入金内訳', 'Key', '備考'],
      ['未入金', '株式会社サンプル', '100000', 'sample@sample.com', '2024-01-15', '請求書INV001', 'KEY001', '支払い期限超過'],
      ['過入金', 'テスト商事株式会社', '75000', 'test@test.com', '2024-01-10', '', 'KEY002', '複数請求書の一括支払いの可能性'],
      ['一部入金', 'ハイリスク株式会社', '150000', 'highrisk@highrisk.com', '2024-01-20', '請求書INV003の一部', 'KEY003', '残金50,000円']
    ]

    const csvContent = sampleData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'sample_import.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">データ取り込み</h1>
        <p className="mt-1 text-sm text-gray-600">
          Excelファイルから差異データを一括取り込みします
        </p>
      </div>

      {/* Progress Steps */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          {[
            { key: 'upload', label: 'ファイル選択', step: 1 },
            { key: 'analyze', label: 'データ分析', step: 2 },
            { key: 'confirm', label: '実行確認', step: 3 },
            { key: 'result', label: '結果表示', step: 4 }
          ].map((item, index) => (
            <div key={item.key} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === item.key
                    ? 'bg-primary-600 text-white'
                    : index < ['upload', 'analyze', 'confirm', 'result'].indexOf(currentStep)
                    ? 'bg-success-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {index < ['upload', 'analyze', 'confirm', 'result'].indexOf(currentStep) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  item.step
                )}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {item.label}
              </span>
              {index < 3 && (
                <div className="w-16 h-0.5 bg-gray-300 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* File Upload Step */}
      {currentStep === 'upload' && (
        <div className="card p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">ファイル選択</h3>
              <button
                onClick={downloadSampleFile}
                className="btn btn-secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                サンプルファイル
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                {selectedFile ? (
                  <>
                    {getFileIcon(selectedFile.name)}
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {isDragActive
                          ? 'ファイルをドロップしてください'
                          : 'ファイルをドラッグ&ドロップまたはクリックして選択'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Excel (.xlsx, .xls) またはCSVファイル、最大10MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Required Columns Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">必須項目</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <strong>分類:</strong> 未入金/過入金/一部入金/複数請求
                </div>
                <div>
                  <strong>会社名:</strong> 顧客の会社名
                </div>
                <div>
                  <strong>金額:</strong> 差異金額（数値）
                </div>
                <div>
                  <strong>to:</strong> 顧客のメールアドレス
                </div>
              </div>
            </div>

            {selectedFile && (
              <div className="flex justify-end">
                <button
                  onClick={analyzeFile}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      ファイル分析
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis Step */}
      {currentStep === 'analyze' && analysis && (
        <div className="space-y-6">
          {/* Analysis Summary */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">データ分析結果</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {analysis.totalRows}
                </div>
                <div className="text-sm text-gray-600">総行数</div>
              </div>
              <div className="bg-success-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-success-600">
                  {analysis.validRows}
                </div>
                <div className="text-sm text-gray-600">有効行数</div>
              </div>
              <div className="bg-danger-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-danger-600">
                  {analysis.invalidRows}
                </div>
                <div className="text-sm text-gray-600">エラー行数</div>
              </div>
            </div>

            {/* Column Detection */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">検出された列</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.detectedColumns.map((column) => (
                  <span
                    key={column}
                    className={`badge ${
                      analysis.requiredColumns.includes(column)
                        ? 'badge-success'
                        : analysis.optionalColumns.includes(column)
                        ? 'badge-primary'
                        : 'badge-secondary'
                    }`}
                  >
                    {column}
                    {analysis.requiredColumns.includes(column) && ' (必須)'}
                  </span>
                ))}
              </div>
            </div>

            {/* Errors */}
            {analysis.errors.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">エラー詳細</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {analysis.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-800 mb-2">
                      <strong>行 {error.row}:</strong>
                      <ul className="ml-4 list-disc">
                        {error.errors.map((err, errIndex) => (
                          <li key={errIndex}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Preview */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">データプレビュー (先頭10行)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {analysis.detectedColumns.map((column) => (
                        <th
                          key={column}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysis.preview.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {analysis.detectedColumns.map((column) => (
                          <td
                            key={column}
                            className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                          >
                            {row[column] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={resetImport} className="btn btn-secondary">
                <RotateCcw className="w-4 h-4 mr-2" />
                最初から
              </button>

              {analysis.validRows > 0 && (
                <button
                  onClick={() => setCurrentStep('confirm')}
                  className="btn btn-primary"
                >
                  実行確認へ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Step */}
      {currentStep === 'confirm' && analysis && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">取り込み実行確認</h3>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">実行前の確認</h4>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>{analysis.validRows}件のデータが取り込まれます</li>
                  <li>新規顧客は自動的に作成されます</li>
                  <li>AI分析により自動的に処理レベルが判定されます</li>
                  <li>取り込み後の修正は個別に行う必要があります</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('analyze')}
              className="btn btn-secondary"
            >
              分析結果に戻る
            </button>

            <button
              onClick={importData}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  取り込み中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  データ取り込み実行
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Result Step */}
      {currentStep === 'result' && importResult && (
        <div className="card p-6">
          <div className="text-center mb-6">
            <CheckCircle className="w-12 h-12 text-success-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              データ取り込み完了
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {importResult.totalRows}
              </div>
              <div className="text-sm text-gray-600">処理対象</div>
            </div>
            <div className="bg-success-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-success-600">
                {importResult.successCount}
              </div>
              <div className="text-sm text-gray-600">成功</div>
            </div>
            <div className="bg-danger-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-danger-600">
                {importResult.errorCount}
              </div>
              <div className="text-sm text-gray-600">エラー</div>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">エラー詳細</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                {importResult.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-800 mb-2">
                    <strong>行 {error.row}:</strong> {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <button onClick={resetImport} className="btn btn-secondary">
              新しいファイルを取り込む
            </button>
            <button
              onClick={() => window.location.href = '/tasks'}
              className="btn btn-primary"
            >
              タスク管理画面へ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataImportPage