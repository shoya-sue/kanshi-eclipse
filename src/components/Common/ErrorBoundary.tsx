import React from 'react'
import { AlertTriangle, RefreshCw, Bug, ChevronDown, ChevronUp } from 'lucide-react'
import { errorLogger } from '../../services/errorLogger'
import { getErrorMessageFromError } from '../../utils/errorMessages'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  errorId?: string
  timestamp?: number
  showDetails?: boolean
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showErrorDetails?: boolean
  title?: string
  message?: string
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, showDetails: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Log error to our error logging service
    errorLogger.logError(error, {
      errorInfo,
      errorId,
      component: 'ErrorBoundary',
      url: window.location.href
    })
    
    // Update state with error info
    this.setState({
      errorInfo,
      errorId,
      timestamp: Date.now()
    })
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    console.error('Error caught by boundary:', error, errorInfo)
  }

  private toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails })
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      const userMessage = this.state.error 
        ? getErrorMessageFromError(this.state.error, 'ja')
        : '予期しないエラーが発生しました'
      
      return (
        <div className="flex items-center justify-center min-h-[200px] bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-8">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              {this.props.title || 'エラーが発生しました'}
            </h3>
            <p className="text-red-600 dark:text-red-300 mb-4">
              {this.props.message || userMessage}
            </p>
            
            {this.state.errorId && (
              <p className="text-xs text-red-500 dark:text-red-400 mb-4">
                エラーID: {this.state.errorId}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center mb-4">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>再試行</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ページを再読み込み</span>
              </button>
            </div>
            
            {this.props.showErrorDetails && (
              <div className="mt-4">
                <button
                  onClick={this.toggleDetails}
                  className="inline-flex items-center space-x-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                >
                  <Bug className="w-4 h-4" />
                  <span>エラーの詳細</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                
                {this.state.showDetails && (
                  <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/40 rounded-lg text-left">
                    <div className="text-xs text-red-700 dark:text-red-300">
                      <div className="mb-2">
                        <strong>エラー名:</strong> {this.state.error?.name}
                      </div>
                      <div className="mb-2">
                        <strong>メッセージ:</strong> {this.state.error?.message}
                      </div>
                      {this.state.timestamp && (
                        <div className="mb-2">
                          <strong>発生時刻:</strong> {new Date(this.state.timestamp).toLocaleString()}
                        </div>
                      )}
                      {this.state.error?.stack && (
                        <div className="mb-2">
                          <strong>スタックトレース:</strong>
                          <pre className="mt-1 text-xs bg-red-200 dark:bg-red-800/50 p-2 rounded overflow-x-auto">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong>コンポーネントスタック:</strong>
                          <pre className="mt-1 text-xs bg-red-200 dark:bg-red-800/50 p-2 rounded overflow-x-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary