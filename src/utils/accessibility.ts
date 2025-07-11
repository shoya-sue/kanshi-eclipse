// Accessibility utilities for better user experience

export interface AccessibilityConfig {
  reducedMotion: boolean
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
}

export class AccessibilityManager {
  private config: AccessibilityConfig = {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: false
  }

  constructor() {
    this.detectSystemPreferences()
    this.loadUserPreferences()
    this.setupEventListeners()
  }

  private detectSystemPreferences(): void {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.config.reducedMotion = true
    }

    // Check for high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.config.highContrast = true
    }

    // Check for screen reader
    if (this.detectScreenReader()) {
      this.config.screenReader = true
    }

    // Check for keyboard navigation
    if (this.detectKeyboardNavigation()) {
      this.config.keyboardNavigation = true
    }
  }

  private detectScreenReader(): boolean {
    // Check for common screen reader indicators
    return !!(
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('SCREENREADER') ||
      window.speechSynthesis
    )
  }

  private detectKeyboardNavigation(): boolean {
    // Detect if user is primarily using keyboard
    let keyboardUsed = false
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        keyboardUsed = true
        this.config.keyboardNavigation = true
        this.saveUserPreferences()
      }
    }, { once: true })

    return keyboardUsed
  }

  private setupEventListeners(): void {
    // Listen for media query changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.config.reducedMotion = e.matches
      this.applyAccessibilityStyles()
    })

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.config.highContrast = e.matches
      this.applyAccessibilityStyles()
    })

    // Listen for keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.config.keyboardNavigation = true
        this.applyAccessibilityStyles()
      }
    })

    // Listen for mouse usage (disable keyboard navigation styling)
    document.addEventListener('mousedown', () => {
      document.body.classList.add('using-mouse')
      document.body.classList.remove('using-keyboard')
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('using-keyboard')
        document.body.classList.remove('using-mouse')
      }
    })
  }

  private loadUserPreferences(): void {
    try {
      const saved = localStorage.getItem('accessibility-config')
      if (saved) {
        const userConfig = JSON.parse(saved)
        this.config = { ...this.config, ...userConfig }
      }
    } catch (error) {
      console.error('Failed to load accessibility preferences:', error)
    }
  }

  private saveUserPreferences(): void {
    try {
      localStorage.setItem('accessibility-config', JSON.stringify(this.config))
    } catch (error) {
      console.error('Failed to save accessibility preferences:', error)
    }
  }

  private applyAccessibilityStyles(): void {
    const root = document.documentElement

    // Apply reduced motion
    if (this.config.reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }

    // Apply high contrast
    if (this.config.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Apply large text
    if (this.config.largeText) {
      root.classList.add('large-text')
    } else {
      root.classList.remove('large-text')
    }

    // Apply screen reader optimizations
    if (this.config.screenReader) {
      root.classList.add('screen-reader')
    } else {
      root.classList.remove('screen-reader')
    }

    // Apply keyboard navigation styles
    if (this.config.keyboardNavigation) {
      root.classList.add('keyboard-navigation')
    } else {
      root.classList.remove('keyboard-navigation')
    }
  }

  public getConfig(): AccessibilityConfig {
    return { ...this.config }
  }

  public updateConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates }
    this.applyAccessibilityStyles()
    this.saveUserPreferences()
  }

  public announceToScreenReader(message: string): void {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  public announceToScreenReaderImmediate(message: string): void {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'assertive')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  public focusElement(element: HTMLElement): void {
    element.focus()
    
    // Ensure element is visible
    element.scrollIntoView({ 
      behavior: this.config.reducedMotion ? 'auto' : 'smooth',
      block: 'center'
    })
  }

  public trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus()
            e.preventDefault()
          }
        }
      }
      
      if (e.key === 'Escape') {
        container.blur()
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus()
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }
}

// ARIA utilities
export const ariaUtils = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'aria'): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },

  // Set ARIA attributes for better accessibility
  setAriaAttributes: (element: HTMLElement, attributes: Record<string, string>): void => {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key.startsWith('aria-') ? key : `aria-${key}`, value)
    })
  },

  // Remove ARIA attributes
  removeAriaAttributes: (element: HTMLElement, attributes: string[]): void => {
    attributes.forEach(attr => {
      element.removeAttribute(attr.startsWith('aria-') ? attr : `aria-${attr}`)
    })
  },

  // Set up ARIA describedby relationship
  setupDescribedBy: (element: HTMLElement, description: string): string => {
    const id = ariaUtils.generateId('description')
    const descElement = document.createElement('div')
    descElement.id = id
    descElement.className = 'sr-only'
    descElement.textContent = description
    
    element.parentElement?.appendChild(descElement)
    element.setAttribute('aria-describedby', id)
    
    return id
  },

  // Set up ARIA labelledby relationship
  setupLabelledBy: (element: HTMLElement, labelId: string): void => {
    element.setAttribute('aria-labelledby', labelId)
  },

  // Set up ARIA live region
  setupLiveRegion: (element: HTMLElement, politeness: 'polite' | 'assertive' = 'polite'): void => {
    element.setAttribute('aria-live', politeness)
    element.setAttribute('aria-atomic', 'true')
  }
}

// Keyboard navigation utilities
export const keyboardUtils = {
  // Handle arrow key navigation
  handleArrowKeyNavigation: (
    items: HTMLElement[],
    currentIndex: number,
    direction: 'up' | 'down' | 'left' | 'right'
  ): number => {
    let newIndex = currentIndex
    
    switch (direction) {
      case 'up':
      case 'left':
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        break
      case 'down':
      case 'right':
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        break
    }
    
    items[newIndex]?.focus()
    return newIndex
  },

  // Handle escape key
  handleEscapeKey: (callback: () => void): void => {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        callback()
      }
    })
  },

  // Handle enter/space key activation
  handleActivationKeys: (element: HTMLElement, callback: () => void): void => {
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        callback()
      }
    })
  }
}

// Color contrast utilities
export const colorUtils = {
  // Calculate relative luminance
  getLuminance: (color: string): number => {
    const rgb = colorUtils.hexToRgb(color)
    if (!rgb) return 0
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  },

  // Calculate contrast ratio
  getContrastRatio: (color1: string, color2: string): number => {
    const lum1 = colorUtils.getLuminance(color1)
    const lum2 = colorUtils.getLuminance(color2)
    
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  },

  // Check if colors meet WCAG contrast requirements
  meetsWCAG: (color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
    const ratio = colorUtils.getContrastRatio(color1, color2)
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7
  },

  // Convert hex to RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
}

// Create global accessibility manager instance
export const accessibilityManager = new AccessibilityManager()