import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../../test/testUtils'
import ErrorBoundary from '../ErrorBoundary'

// Component that throws an error
const ErrorComponent = ({ shouldError = true }: { shouldError?: boolean }) => {
  if (shouldError) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Mock the error logger
vi.mock('../../services/errorLogger', () => ({
  errorLogger: {
    logError: vi.fn(() => Promise.resolve()),
  },
}))

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent shouldError={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('should render error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('should display custom title and message', () => {
    const customTitle = 'Custom Error Title'
    const customMessage = 'Custom error message'

    render(
      <ErrorBoundary title={customTitle} message={customMessage}>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(customTitle)).toBeInTheDocument()
    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })

  it('should show retry button and handle retry', async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    const retryButton = screen.getByText('再試行')
    expect(retryButton).toBeInTheDocument()

    // Mock the retry functionality by re-rendering with no error
    retryButton.click()
    
    rerender(
      <ErrorBoundary>
        <ErrorComponent shouldError={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('should show page reload button', () => {
    const mockReload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    })

    render(
      <ErrorBoundary>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    const reloadButton = screen.getByText('ページを再読み込み')
    expect(reloadButton).toBeInTheDocument()

    reloadButton.click()
    expect(mockReload).toHaveBeenCalled()
  })

  it('should show error details when showErrorDetails is true', () => {
    render(
      <ErrorBoundary showErrorDetails={true}>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('エラーの詳細')).toBeInTheDocument()
  })

  it('should toggle error details visibility', async () => {
    const { user } = render(
      <ErrorBoundary showErrorDetails={true}>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    const detailsButton = screen.getByText('エラーの詳細')
    
    // Initially details should be hidden
    expect(screen.queryByText('エラー名:')).not.toBeInTheDocument()
    
    // Click to show details
    await user.click(detailsButton)
    expect(screen.getByText('エラー名:')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
    
    // Click again to hide details
    await user.click(detailsButton)
    expect(screen.queryByText('エラー名:')).not.toBeInTheDocument()
  })

  it('should display error ID when available', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/エラーID:/)).toBeInTheDocument()
  })

  it('should display error timestamp when available', () => {
    render(
      <ErrorBoundary showErrorDetails={true}>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    const detailsButton = screen.getByText('エラーの詳細')
    detailsButton.click()

    expect(screen.getByText(/発生時刻:/)).toBeInTheDocument()
  })

  it('should call custom error handler when provided', () => {
    const mockErrorHandler = vi.fn()

    render(
      <ErrorBoundary onError={mockErrorHandler}>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(mockErrorHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    )
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom fallback UI</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom fallback UI')).toBeInTheDocument()
    expect(screen.queryByText('エラーが発生しました')).not.toBeInTheDocument()
  })

  it('should handle multiple errors correctly', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Test error')).toBeInTheDocument()

    // Simulate another error
    rerender(
      <ErrorBoundary>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('should apply dark mode styles correctly', () => {
    render(
      <div className="dark">
        <ErrorBoundary>
          <ErrorComponent shouldError={true} />
        </ErrorBoundary>
      </div>
    )

    const errorContainer = screen.getByText('エラーが発生しました').closest('div')
    expect(errorContainer).toHaveClass('dark:bg-red-900/20', 'dark:border-red-800')
  })

  it('should handle errors without stack traces', () => {
    const ErrorWithoutStack = () => {
      const error = new Error('Error without stack')
      delete error.stack
      throw error
    }

    render(
      <ErrorBoundary showErrorDetails={true}>
        <ErrorWithoutStack />
      </ErrorBoundary>
    )

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
    expect(screen.getByText('Error without stack')).toBeInTheDocument()
  })

  it('should handle non-Error objects thrown', () => {
    const ComponentThrowingString = () => {
      throw 'String error'
    }

    render(
      <ErrorBoundary>
        <ComponentThrowingString />
      </ErrorBoundary>
    )

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
  })

  it('should log errors to error logger', async () => {
    const { errorLogger } = await import('../../services/errorLogger')

    render(
      <ErrorBoundary>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(errorLogger.logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        errorInfo: expect.any(Object),
        errorId: expect.any(String),
        component: 'ErrorBoundary',
        url: expect.any(String),
      })
    )
  })

  it('should be accessible', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    // Check for proper ARIA attributes
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('エラーが発生しました')

    // Check for proper button roles
    const retryButton = screen.getByRole('button', { name: '再試行' })
    const reloadButton = screen.getByRole('button', { name: 'ページを再読み込み' })
    
    expect(retryButton).toBeInTheDocument()
    expect(reloadButton).toBeInTheDocument()
  })

  it('should handle keyboard navigation', async () => {
    const { user } = render(
      <ErrorBoundary showErrorDetails={true}>
        <ErrorComponent shouldError={true} />
      </ErrorBoundary>
    )

    // Tab through the buttons
    await user.tab()
    expect(screen.getByRole('button', { name: '再試行' })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: 'ページを再読み込み' })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: 'エラーの詳細' })).toHaveFocus()

    // Activate with Enter key
    await user.keyboard('{Enter}')
    expect(screen.getByText('エラー名:')).toBeInTheDocument()
  })
})