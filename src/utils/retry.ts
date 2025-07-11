export interface RetryOptions {
  retries: number
  delay: number
  exponentialBackoff: boolean
  maxDelay: number
  onRetry?: (attempt: number, error: Error) => void
  shouldRetry?: (error: Error) => boolean
}

export class RetryError extends Error {
  constructor(
    message: string,
    public lastError: Error,
    public attempts: number
  ) {
    super(message)
    this.name = 'RetryError'
  }
}

const defaultOptions: RetryOptions = {
  retries: 3,
  delay: 1000,
  exponentialBackoff: true,
  maxDelay: 10000,
  shouldRetry: (error) => {
    // Default: retry on network errors but not on validation errors
    const message = error.message.toLowerCase()
    return message.includes('network') || 
           message.includes('fetch') || 
           message.includes('timeout') ||
           message.includes('connection')
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options }
  let lastError: Error
  
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on last attempt
      if (attempt === opts.retries) {
        break
      }
      
      // Check if we should retry this error
      if (opts.shouldRetry && !opts.shouldRetry(lastError)) {
        break
      }
      
      // Calculate delay with exponential backoff
      let delay = opts.delay
      if (opts.exponentialBackoff) {
        delay = Math.min(opts.delay * Math.pow(2, attempt), opts.maxDelay)
      }
      
      // Add jitter to prevent thundering herd
      delay = delay + Math.random() * 1000
      
      // Call retry callback
      if (opts.onRetry) {
        opts.onRetry(attempt + 1, lastError)
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new RetryError(
    `Failed after ${opts.retries + 1} attempts`,
    lastError!,
    opts.retries + 1
  )
}

// Specialized retry functions for different scenarios

export async function withNetworkRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  return withRetry(fn, {
    retries: maxRetries,
    delay: 1000,
    exponentialBackoff: true,
    shouldRetry: (error) => {
      const message = error.message.toLowerCase()
      return message.includes('network') || 
             message.includes('fetch') || 
             message.includes('timeout') ||
             message.includes('connection') ||
             message.includes('rpc')
    },
    onRetry: (attempt, error) => {
      console.warn(`Network request failed, retrying (${attempt}/${maxRetries}):`, error.message)
    }
  })
}

export async function withWalletRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  return withRetry(fn, {
    retries: maxRetries,
    delay: 2000,
    exponentialBackoff: false,
    shouldRetry: (error) => {
      const message = error.message.toLowerCase()
      // Retry on connection issues but not on user rejection
      return message.includes('connection') || 
             message.includes('timeout') ||
             (!message.includes('user') && !message.includes('rejected'))
    },
    onRetry: (attempt, error) => {
      console.warn(`Wallet operation failed, retrying (${attempt}/${maxRetries}):`, error.message)
    }
  })
}

export async function withBlockchainRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  return withRetry(fn, {
    retries: maxRetries,
    delay: 1500,
    exponentialBackoff: true,
    maxDelay: 15000,
    shouldRetry: (error) => {
      const message = error.message.toLowerCase()
      return message.includes('rpc') || 
             message.includes('network') || 
             message.includes('timeout') ||
             message.includes('connection') ||
             message.includes('rate limit')
    },
    onRetry: (attempt, error) => {
      console.warn(`Blockchain operation failed, retrying (${attempt}/${maxRetries}):`, error.message)
    }
  })
}

// Circuit breaker pattern for repeated failures
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess(): void {
    this.failures = 0
    this.state = 'closed'
  }
  
  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.threshold) {
      this.state = 'open'
    }
  }
  
  getState(): string {
    return this.state
  }
  
  reset(): void {
    this.failures = 0
    this.state = 'closed'
  }
}

// Pre-configured circuit breakers
export const networkCircuitBreaker = new CircuitBreaker(5, 60000)
export const walletCircuitBreaker = new CircuitBreaker(3, 30000)
export const blockchainCircuitBreaker = new CircuitBreaker(10, 120000)