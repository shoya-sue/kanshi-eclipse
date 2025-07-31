export interface ToastOptions {
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  dismissible?: boolean
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  options: ToastOptions
  timestamp: number
}

type ToastListener = (toasts: Toast[]) => void

class ToastService {
  private toasts: Toast[] = []
  private listeners: ToastListener[] = []
  private nextId = 1

  private generateId(): string {
    return `toast-${this.nextId++}`
  }

  private notify(): void {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }

  private addToast(type: Toast['type'], message: string, options: ToastOptions = {}): void {
    const toast: Toast = {
      id: this.generateId(),
      type,
      message,
      options: {
        duration: 5000,
        position: 'top-right',
        dismissible: true,
        ...options
      },
      timestamp: Date.now()
    }

    this.toasts.push(toast)
    this.notify()

    // Auto-remove toast after duration
    if (toast.options.duration && toast.options.duration > 0) {
      setTimeout(() => {
        this.removeToast(toast.id)
      }, toast.options.duration)
    }
  }

  showSuccess(message: string, options?: ToastOptions): void {
    this.addToast('success', message, options)
  }

  showError(message: string, options?: ToastOptions): void {
    this.addToast('error', message, {
      duration: 7000, // Longer duration for errors
      ...options
    })
  }

  showWarning(message: string, options?: ToastOptions): void {
    this.addToast('warning', message, {
      duration: 6000,
      ...options
    })
  }

  showInfo(message: string, options?: ToastOptions): void {
    this.addToast('info', message, options)
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.notify()
  }

  clearAll(): void {
    this.toasts = []
    this.notify()
  }

  getToasts(): Toast[] {
    return [...this.toasts]
  }

  subscribe(listener: ToastListener): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // Helper method to show error from Error object
  showErrorFromException(error: Error, context?: string): void {
    const message = context 
      ? `${context}: ${error.message}`
      : error.message

    this.showError(message, {
      action: {
        label: '詳細',
        onClick: () => {
          console.error('Error details:', error)
        }
      }
    })
  }

  // Helper method to show network error
  showNetworkError(): void {
    this.showError('ネットワークエラーが発生しました。接続を確認してください。', {
      action: {
        label: '再試行',
        onClick: () => {
          window.location.reload()
        }
      }
    })
  }

  // Helper method to show validation error
  showValidationError(fieldName?: string): void {
    const message = fieldName 
      ? `${fieldName}の入力値が正しくありません`
      : '入力値が正しくありません'
    
    this.showError(message)
  }

  // Helper method to show wallet error
  showWalletError(message?: string): void {
    this.showError(message || 'ウォレットエラーが発生しました', {
      action: {
        label: 'ヘルプ',
        onClick: () => {
          window.open('https://docs.example.com/wallet-troubleshooting', '_blank')
        }
      }
    })
  }

  // Helper method to show blockchain error
  showBlockchainError(message?: string): void {
    this.showError(message || 'ブロックチェーンエラーが発生しました', {
      action: {
        label: 'ステータス確認',
        onClick: () => {
          // Navigate to RPC Monitor or status page
          window.location.hash = '#/rpc-monitor'
        }
      }
    })
  }
}

export const toastService = new ToastService()

// Helper function for showing toast messages
export const showToast = (options: {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  options?: ToastOptions
}) => {
  switch (options.type) {
    case 'success':
      toastService.showSuccess(options.message, options.options)
      break
    case 'error':
      toastService.showError(options.message, options.options)
      break
    case 'warning':
      toastService.showWarning(options.message, options.options)
      break
    case 'info':
      toastService.showInfo(options.message, options.options)
      break
  }
}