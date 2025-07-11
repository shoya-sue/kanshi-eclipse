export type Language = 'ja' | 'en'

export interface I18nConfig {
  language: Language
  fallbackLanguage: Language
  debug: boolean
}

export interface TranslationKey {
  [key: string]: string | TranslationKey
}

export interface Translations {
  [key: string]: TranslationKey
}

class I18nManager {
  private currentLanguage: Language = 'ja'
  private fallbackLanguage: Language = 'en'
  private translations: Translations = {}
  private debug = false

  constructor(config?: Partial<I18nConfig>) {
    if (config) {
      this.currentLanguage = config.language || this.currentLanguage
      this.fallbackLanguage = config.fallbackLanguage || this.fallbackLanguage
      this.debug = config.debug || this.debug
    }
    
    this.detectLanguage()
    this.loadTranslations()
  }

  private detectLanguage(): void {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'ja' || savedLanguage === 'en')) {
      this.currentLanguage = savedLanguage
      return
    }

    // Check browser language
    const browserLanguage = navigator.language
    if (browserLanguage.startsWith('ja')) {
      this.currentLanguage = 'ja'
    } else if (browserLanguage.startsWith('en')) {
      this.currentLanguage = 'en'
    }
    
    // Save detected language
    localStorage.setItem('language', this.currentLanguage)
  }

  private async loadTranslations(): Promise<void> {
    try {
      const [ja, en] = await Promise.all([
        import('./translations/ja.ts'),
        import('./translations/en.ts'),
      ])
      
      this.translations = {
        ja: ja.default,
        en: en.default,
      }
    } catch (error) {
      console.error('Failed to load translations:', error)
    }
  }

  public getLanguage(): Language {
    return this.currentLanguage
  }

  public setLanguage(language: Language): void {
    this.currentLanguage = language
    localStorage.setItem('language', language)
    
    // Trigger language change event
    window.dispatchEvent(new CustomEvent('language-change', { 
      detail: { language } 
    }))
  }

  public t(key: string, params?: Record<string, string | number>): string {
    const translation = this.getTranslation(key, this.currentLanguage)
    
    if (translation) {
      return this.interpolate(translation, params)
    }
    
    // Try fallback language
    const fallbackTranslation = this.getTranslation(key, this.fallbackLanguage)
    if (fallbackTranslation) {
      if (this.debug) {
        console.warn(`Translation missing for key "${key}" in language "${this.currentLanguage}", using fallback`)
      }
      return this.interpolate(fallbackTranslation, params)
    }
    
    // Return key as fallback
    if (this.debug) {
      console.warn(`Translation missing for key "${key}" in both languages`)
    }
    return key
  }

  private getTranslation(key: string, language: Language): string | null {
    const keys = key.split('.')
    let current: any = this.translations[language]
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        return null
      }
    }
    
    return typeof current === 'string' ? current : null
  }

  private interpolate(template: string, params?: Record<string, string | number>): string {
    if (!params) {
      return template
    }
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = params[key]
      return value !== undefined ? String(value) : match
    })
  }

  public getAvailableLanguages(): Language[] {
    return ['ja', 'en']
  }

  public getLanguageNativeName(language: Language): string {
    const names = {
      ja: '日本語',
      en: 'English'
    }
    return names[language] || language
  }

  public formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLanguage, options).format(value)
  }

  public formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat(this.currentLanguage, {
      style: 'currency',
      currency,
    }).format(value)
  }

  public formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.currentLanguage, options).format(date)
  }

  public formatRelativeTime(date: Date): string {
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    
    const rtf = new Intl.RelativeTimeFormat(this.currentLanguage, { numeric: 'auto' })
    
    if (Math.abs(diffSeconds) < 60) {
      return rtf.format(diffSeconds, 'second')
    } else if (Math.abs(diffSeconds) < 3600) {
      return rtf.format(Math.floor(diffSeconds / 60), 'minute')
    } else if (Math.abs(diffSeconds) < 86400) {
      return rtf.format(Math.floor(diffSeconds / 3600), 'hour')
    } else if (Math.abs(diffSeconds) < 2592000) {
      return rtf.format(Math.floor(diffSeconds / 86400), 'day')
    } else if (Math.abs(diffSeconds) < 31536000) {
      return rtf.format(Math.floor(diffSeconds / 2592000), 'month')
    } else {
      return rtf.format(Math.floor(diffSeconds / 31536000), 'year')
    }
  }

  public pluralize(count: number, key: string): string {
    const rules = new Intl.PluralRules(this.currentLanguage)
    const rule = rules.select(count)
    
    const pluralKey = `${key}.${rule}`
    const translation = this.getTranslation(pluralKey, this.currentLanguage)
    
    if (translation) {
      return this.interpolate(translation, { count })
    }
    
    // Fallback to singular form
    return this.t(key, { count })
  }

  public isRTL(): boolean {
    return false // Neither Japanese nor English are RTL
  }

  public getDirection(): 'ltr' | 'rtl' {
    return 'ltr'
  }

  public addTranslations(language: Language, translations: TranslationKey): void {
    if (!this.translations[language]) {
      this.translations[language] = {}
    }
    
    this.translations[language] = {
      ...this.translations[language],
      ...translations
    }
  }

  public hasTranslation(key: string, language?: Language): boolean {
    const lang = language || this.currentLanguage
    return this.getTranslation(key, lang) !== null
  }

  public getAllTranslations(language?: Language): TranslationKey {
    const lang = language || this.currentLanguage
    return this.translations[lang] || {}
  }

  public setDebug(debug: boolean): void {
    this.debug = debug
  }

  public getInterpolatedKeys(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g)
    if (!matches) return []
    
    return matches.map(match => match.slice(2, -2))
  }

  public validateTranslations(): { missing: string[], invalid: string[] } {
    const missing: string[] = []
    const invalid: string[] = []
    
    const allKeys = new Set<string>()
    
    // Collect all keys from all languages
    Object.values(this.translations).forEach(translation => {
      this.collectKeys(translation, '', allKeys)
    })
    
    // Check each language for missing keys
    Object.keys(this.translations).forEach(lang => {
      allKeys.forEach(key => {
        if (!this.hasTranslation(key, lang as Language)) {
          missing.push(`${lang}.${key}`)
        }
      })
    })
    
    return { missing, invalid }
  }

  private collectKeys(obj: any, prefix: string, keys: Set<string>): void {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof obj[key] === 'string') {
        keys.add(fullKey)
      } else if (typeof obj[key] === 'object') {
        this.collectKeys(obj[key], fullKey, keys)
      }
    })
  }
}

export const i18n = new I18nManager()

// React hook for using i18n
export function useI18n() {
  return {
    t: i18n.t.bind(i18n),
    language: i18n.getLanguage(),
    setLanguage: i18n.setLanguage.bind(i18n),
    availableLanguages: i18n.getAvailableLanguages(),
    formatNumber: i18n.formatNumber.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n),
    formatDate: i18n.formatDate.bind(i18n),
    formatRelativeTime: i18n.formatRelativeTime.bind(i18n),
    pluralize: i18n.pluralize.bind(i18n),
    isRTL: i18n.isRTL(),
    direction: i18n.getDirection(),
  }
}