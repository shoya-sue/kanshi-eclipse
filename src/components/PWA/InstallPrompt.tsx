import { useState } from 'react'
import { usePWA } from '../../hooks/usePWA'
import { Download, X, Smartphone } from 'lucide-react'
import Button from '../Common/Button'

const InstallPrompt = () => {
  const { isInstallable, isInstalled, installApp } = usePWA()
  const [isVisible, setIsVisible] = useState(true)
  const [isInstalling, setIsInstalling] = useState(false)

  if (!isInstallable || isInstalled || !isVisible) {
    return null
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    const success = await installApp()
    setIsInstalling(false)
    
    if (success) {
      setIsVisible(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Remember user dismissed (could save to localStorage)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-eclipse-primary rounded-lg flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            アプリをインストール
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Eclipse Chain Tools をホーム画面に追加して、より便利にお使いいただけます。
          </p>
          
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={handleInstall}
              loading={isInstalling}
              disabled={isInstalling}
              className="flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>インストール</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              disabled={isInstalling}
            >
              後で
            </Button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
          disabled={isInstalling}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default InstallPrompt