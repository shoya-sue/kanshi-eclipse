import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import Button from '../components/Common/Button'
import { useI18n } from '../contexts/I18nContext'

const NotFound: React.FC = () => {
  const { language } = useI18n()

  const content = {
    en: {
      title: '404',
      subtitle: 'Page Not Found',
      description: 'The page you are looking for does not exist or has been moved.',
      backHome: 'Back to Home',
      goBack: 'Go Back'
    },
    ja: {
      title: '404',
      subtitle: 'ページが見つかりません',
      description: 'お探しのページは存在しないか、移動された可能性があります。',
      backHome: 'ホームに戻る',
      goBack: '前のページに戻る'
    }
  }

  const t = content[language]

  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-bold text-gray-300 dark:text-gray-700">
          {t.title}
        </h1>
        <h2 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">
          {t.subtitle}
        </h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          {t.description}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="primary" className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              {t.backHome}
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.goBack}
          </Button>
        </div>
        
        {/* Decorative Eclipse animation */}
        <div className="mt-12 relative">
          <div className="w-32 h-32 mx-auto relative">
            <div className="absolute inset-0 rounded-full bg-purple-600 opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-purple-500 opacity-30 animate-pulse animation-delay-200"></div>
            <div className="absolute inset-4 rounded-full bg-purple-400 opacity-40 animate-pulse animation-delay-400"></div>
            <div className="absolute inset-6 rounded-full bg-purple-300 opacity-50"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound