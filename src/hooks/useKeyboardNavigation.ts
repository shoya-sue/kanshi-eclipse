import { useEffect, useRef, RefObject } from 'react'
import { keyboardUtils } from '../utils/accessibility'

export const useKeyboardNavigation = (
  containerRef: RefObject<HTMLElement>,
  options: {
    autoFocus?: boolean
    trapFocus?: boolean
    enableArrowKeys?: boolean
    onEscape?: () => void
  } = {}
) => {
  const { autoFocus = false, trapFocus = false, enableArrowKeys = false, onEscape } = options
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Auto focus first focusable element
    if (autoFocus) {
      const firstFocusable = container.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      
      if (firstFocusable) {
        firstFocusable.focus()
      }
    }

    // Trap focus within container
    if (trapFocus) {
      const focusableElements = Array.from(container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )) as HTMLElement[]

      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
              lastFocusable?.focus()
              e.preventDefault()
            }
          } else {
            if (document.activeElement === lastFocusable) {
              firstFocusable?.focus()
              e.preventDefault()
            }
          }
        }
      }

      container.addEventListener('keydown', handleKeyDown)
      cleanupRef.current = () => container.removeEventListener('keydown', handleKeyDown)
    }

    // Handle escape key
    if (onEscape) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onEscape()
        }
      }

      document.addEventListener('keydown', handleEscape)
      const escapeCleanup = () => document.removeEventListener('keydown', handleEscape)
      
      if (cleanupRef.current) {
        const prevCleanup = cleanupRef.current
        cleanupRef.current = () => {
          prevCleanup()
          escapeCleanup()
        }
      } else {
        cleanupRef.current = escapeCleanup
      }
    }

    // Handle arrow key navigation
    if (enableArrowKeys) {
      const focusableElements = Array.from(container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )) as HTMLElement[]

      const handleArrowKeys = (e: KeyboardEvent) => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return

        const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
        if (currentIndex === -1) return

        e.preventDefault()

        let direction: 'up' | 'down' | 'left' | 'right'
        switch (e.key) {
          case 'ArrowUp':
            direction = 'up'
            break
          case 'ArrowDown':
            direction = 'down'
            break
          case 'ArrowLeft':
            direction = 'left'
            break
          case 'ArrowRight':
            direction = 'right'
            break
          default:
            return
        }

        keyboardUtils.handleArrowKeyNavigation(focusableElements, currentIndex, direction)
      }

      container.addEventListener('keydown', handleArrowKeys)
      const arrowCleanup = () => container.removeEventListener('keydown', handleArrowKeys)
      
      if (cleanupRef.current) {
        const prevCleanup = cleanupRef.current
        cleanupRef.current = () => {
          prevCleanup()
          arrowCleanup()
        }
      } else {
        cleanupRef.current = arrowCleanup
      }
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [containerRef, autoFocus, trapFocus, enableArrowKeys, onEscape])
}

export const useRovingTabIndex = (
  itemsRef: RefObject<HTMLElement[]>,
  options: {
    defaultIndex?: number
    orientation?: 'horizontal' | 'vertical'
    wrap?: boolean
  } = {}
) => {
  const { defaultIndex = 0, orientation = 'horizontal', wrap = true } = options
  const activeIndexRef = useRef(defaultIndex)

  useEffect(() => {
    const items = itemsRef.current
    if (!items) return

    // Set initial tab indices
    items.forEach((item, index) => {
      item.tabIndex = index === activeIndexRef.current ? 0 : -1
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      const isHorizontal = orientation === 'horizontal'
      const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown'
      const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp'

      if (e.key === nextKey) {
        e.preventDefault()
        let newIndex = activeIndexRef.current + 1
        if (newIndex >= items.length) {
          newIndex = wrap ? 0 : items.length - 1
        }
        setActiveIndex(newIndex)
      } else if (e.key === prevKey) {
        e.preventDefault()
        let newIndex = activeIndexRef.current - 1
        if (newIndex < 0) {
          newIndex = wrap ? items.length - 1 : 0
        }
        setActiveIndex(newIndex)
      } else if (e.key === 'Home') {
        e.preventDefault()
        setActiveIndex(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        setActiveIndex(items.length - 1)
      }
    }

    const setActiveIndex = (index: number) => {
      items.forEach((item, i) => {
        item.tabIndex = i === index ? 0 : -1
      })
      items[index]?.focus()
      activeIndexRef.current = index
    }

    // Add event listeners to all items
    items.forEach((item, index) => {
      item.addEventListener('keydown', handleKeyDown)
      item.addEventListener('focus', () => setActiveIndex(index))
    })

    return () => {
      items.forEach((item) => {
        item.removeEventListener('keydown', handleKeyDown)
      })
    }
  }, [itemsRef, orientation, wrap])

  return activeIndexRef.current
}

export const useAnnouncement = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement)
      }
    }, 1000)
  }

  return { announce }
}

export const useFocusManagement = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }

  const focusElement = (element: HTMLElement) => {
    element.focus()
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return {
    saveFocus,
    restoreFocus,
    focusElement
  }
}

export const useAccessibleForm = (formRef: RefObject<HTMLFormElement>) => {
  const announce = useAnnouncement()

  const validateAndAnnounce = (errors: Record<string, string>) => {
    const errorCount = Object.keys(errors).length
    
    if (errorCount > 0) {
      announce.announce(
        `フォームに${errorCount}個のエラーがあります。最初のエラーフィールドにフォーカスを移動します。`,
        'assertive'
      )
      
      // Focus first error field
      const firstErrorField = formRef.current?.querySelector(`[name="${Object.keys(errors)[0]}"]`) as HTMLElement
      if (firstErrorField) {
        firstErrorField.focus()
      }
    } else {
      announce.announce('フォームが正常に送信されました。', 'polite')
    }
  }

  return { validateAndAnnounce }
}

export const useAccessibleModal = (
  modalRef: RefObject<HTMLElement>,
  options: {
    onClose?: () => void
    restoreFocus?: boolean
  } = {}
) => {
  const { onClose, restoreFocus = true } = options
  const { saveFocus, restoreFocus: doRestoreFocus } = useFocusManagement()
  const { announce } = useAnnouncement()

  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    if (restoreFocus) {
      saveFocus()
    }

    // Focus the modal
    modal.focus()

    // Announce modal opening
    const modalTitle = modal.querySelector('h1, h2, h3, [role="heading"]')?.textContent
    if (modalTitle) {
      announce(`${modalTitle} ダイアログが開かれました`, 'assertive')
    }

    // Setup focus trap
    const focusableElements = Array.from(modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[]

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable?.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable?.focus()
            e.preventDefault()
          }
        }
      } else if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }

    modal.addEventListener('keydown', handleKeyDown)

    // Focus first focusable element
    if (firstFocusable) {
      firstFocusable.focus()
    }

    return () => {
      modal.removeEventListener('keydown', handleKeyDown)
      if (restoreFocus) {
        doRestoreFocus()
      }
    }
  }, [modalRef, onClose, restoreFocus])
}