import React, { useState, useEffect } from 'react'
import { Toast, toastService } from '../../services/toastService'

interface ToastComponentProps {
  toast: Toast
  onDismiss: (id: string) => void
}

const ToastComponent: React.FC<ToastComponentProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss(toast.id), 300)
  }

  const getIcon = () => {
    if (toast.options.icon) {
      return toast.options.icon
    }

    switch (toast.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      default:
        return 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
    }
  }

  return (
    <div
      className={`
        max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border transition-all duration-300 transform
        ${getBackgroundColor()}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {toast.message}
            </p>
            {toast.options.action && (
              <div className="mt-2">
                <button
                  onClick={toast.options.action.onClick}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {toast.options.action.label}
                </button>
              </div>
            )}
          </div>
          {toast.options.dismissible && (
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const unsubscribe = toastService.subscribe(setToasts)
    return unsubscribe
  }, [])

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2'
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2'
      default:
        return 'top-4 right-4'
    }
  }

  // Group toasts by position
  const toastsByPosition = toasts.reduce((acc, toast) => {
    const position = toast.options.position || 'top-right'
    if (!acc[position]) {
      acc[position] = []
    }
    acc[position].push(toast)
    return acc
  }, {} as Record<string, Toast[]>)

  return (
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          className={`fixed z-50 pointer-events-none ${getPositionClasses(position)}`}
        >
          <div className="space-y-4">
            {positionToasts.map((toast) => (
              <ToastComponent
                key={toast.id}
                toast={toast}
                onDismiss={toastService.removeToast.bind(toastService)}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}