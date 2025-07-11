import React from 'react'
import { Languages } from 'lucide-react'
import { useI18n } from '../../contexts/I18nContext'

const LanguageToggle: React.FC = () => {
  const { language, setLanguage, availableLanguages } = useI18n()

  const toggleLanguage = () => {
    const currentIndex = availableLanguages.indexOf(language)
    const nextIndex = (currentIndex + 1) % availableLanguages.length
    setLanguage(availableLanguages[nextIndex])
  }

  const getLanguageDisplayName = (lang: string) => {
    const names = {
      ja: '日本語',
      en: 'English'
    }
    return names[lang as keyof typeof names] || lang
  }

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
      aria-label={`Switch to ${getLanguageDisplayName(availableLanguages.find(l => l !== language) || 'en')}`}
      title={`Current: ${getLanguageDisplayName(language)}`}
    >
      <Languages className="w-5 h-5 text-gray-700 dark:text-gray-300" />
    </button>
  )
}

export default LanguageToggle