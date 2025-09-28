import React from 'react'
import { Check, Clock, AlertCircle } from 'lucide-react'
import { PaymentDiscrepancy } from '../types'

interface ProgressStepsProps {
  discrepancy: PaymentDiscrepancy
  className?: string
}

const STEPS = [
  { id: 1, label: '検知', key: 'DETECTED', percentage: 20 },
  { id: 2, label: 'メール送付', key: 'EMAIL_SENT', percentage: 40 },
  { id: 3, label: '連絡取得', key: 'CUSTOMER_CONTACTED', percentage: 60 },
  { id: 4, label: '合意', key: 'AGREED', percentage: 80 },
  { id: 5, label: '解決', key: 'RESOLVED', percentage: 100 },
]

const STATUS_TO_STEP: Record<string, number> = {
  'DETECTED': 1,
  'PROCESSING': 1,
  'EMAIL_SENT': 2,
  'CUSTOMER_CONTACTED': 3,
  'AGREED': 4,
  'RESOLVED': 5,
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  discrepancy,
  className = '',
}) => {
  const currentStep = STATUS_TO_STEP[discrepancy.status] || 1
  const progressPercentage = STEPS[currentStep - 1]?.percentage || 20

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  const getStepIcon = (stepId: number, status: string) => {
    if (status === 'completed') {
      return <Check className="w-4 h-4 text-white" />
    }
    if (status === 'current') {
      return <Clock className="w-4 h-4 text-white" />
    }
    return <span className="text-sm font-medium text-gray-500">{stepId}</span>
  }

  const getInterventionColor = (level: string) => {
    switch (level) {
      case 'AI_AUTONOMOUS':
        return 'text-success-600'
      case 'AI_ASSISTED':
        return 'text-warning-600'
      case 'HUMAN_REQUIRED':
        return 'text-danger-600'
      default:
        return 'text-gray-600'
    }
  }

  const getInterventionLabel = (level: string) => {
    switch (level) {
      case 'AI_AUTONOMOUS':
        return 'AI自動処理'
      case 'AI_ASSISTED':
        return 'AI支援処理'
      case 'HUMAN_REQUIRED':
        return '人間対応必須'
      default:
        return '処理レベル未定'
    }
  }

  return (
    <div className={`bg-white rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">処理進捗</h3>
          <div className="flex items-center mt-1 space-x-4">
            <span className={`text-sm font-medium ${getInterventionColor(discrepancy.interventionLevel)}`}>
              {getInterventionLabel(discrepancy.interventionLevel)}
            </span>
            <span className="text-sm text-gray-500">
              推定完了: 約{discrepancy.estimatedCompletionDays || 2}日後
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600">
            {progressPercentage}%
          </div>
          <div className="text-sm text-gray-500">完了</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step) => {
          const status = getStepStatus(step.id)
          return (
            <div
              key={step.id}
              className={`flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                status === 'current'
                  ? 'bg-primary-50 border border-primary-200'
                  : status === 'completed'
                  ? 'bg-success-50 border border-success-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              {/* Step Icon */}
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  status === 'completed'
                    ? 'bg-success-500'
                    : status === 'current'
                    ? 'bg-primary-500'
                    : 'bg-gray-300'
                }`}
              >
                {getStepIcon(step.id, status)}
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-medium ${
                      status === 'current'
                        ? 'text-primary-700'
                        : status === 'completed'
                        ? 'text-success-700'
                        : 'text-gray-500'
                    }`}
                  >
                    Step {step.id}: {step.label}
                  </span>
                  <span className="text-sm text-gray-500">
                    {step.percentage}%
                  </span>
                </div>

                {/* Current step details */}
                {status === 'current' && (
                  <div className="mt-2 text-sm text-primary-600">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{discrepancy.nextAction || '処理中...'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* AI Analysis Summary */}
      {discrepancy.aiAnalysis && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">AI分析結果</h4>
          <div className="text-sm text-gray-600">
            <div className="flex items-center justify-between mb-1">
              <span>信頼度:</span>
              <span className="font-medium">
                {Math.round(discrepancy.aiAnalysis.confidence * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span>推奨アクション:</span>
              <span className="font-medium">
                {discrepancy.aiAnalysis.recommendedAction}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {discrepancy.aiAnalysis.reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}