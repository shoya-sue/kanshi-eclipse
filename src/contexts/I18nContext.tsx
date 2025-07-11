import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { i18n, Language } from '../i18n'

interface I18nContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  formatCurrency: (value: number, currency?: string) => string
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string
  formatRelativeTime: (date: Date) => string
  pluralize: (count: number, key: string) => string
  availableLanguages: Language[]
  isRTL: boolean
  direction: 'ltr' | 'rtl'
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

interface I18nProviderProps {
  children: ReactNode
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(i18n.getLanguage())

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setLanguageState(event.detail.language)
    }

    window.addEventListener('language-change', handleLanguageChange as EventListener)
    
    return () => {
      window.removeEventListener('language-change', handleLanguageChange as EventListener)
    }
  }, [])

  const setLanguage = (newLanguage: Language) => {
    i18n.setLanguage(newLanguage)
    setLanguageState(newLanguage)
    
    // Update document language
    document.documentElement.lang = newLanguage
    
    // Update document direction
    document.documentElement.dir = i18n.getDirection()
  }

  const value: I18nContextType = {
    language,
    setLanguage,
    t: i18n.t.bind(i18n),
    formatNumber: i18n.formatNumber.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n),
    formatDate: i18n.formatDate.bind(i18n),
    formatRelativeTime: i18n.formatRelativeTime.bind(i18n),
    pluralize: i18n.pluralize.bind(i18n),
    availableLanguages: i18n.getAvailableLanguages(),
    isRTL: i18n.isRTL(),
    direction: i18n.getDirection(),
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}