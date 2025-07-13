import { useState, useEffect } from 'react'

export interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // Check if app is already installed
  useEffect(() => {
    const checkInstallation = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
    }

    checkInstallation()
    window.addEventListener('resize', checkInstallation)
    
    return () => window.removeEventListener('resize', checkInstallation)
  }, [])

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as PWAInstallPrompt)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          // Service Worker registered successfully
          setServiceWorkerRegistration(registration)
        })
        .catch(() => {
          // Service Worker registration failed
        })
    }
  }, [])

  const installApp = async () => {
    if (!installPrompt) return false

    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      
      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
        setInstallPrompt(null)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Installation failed:', error)
      return false
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      // This browser does not support notifications
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) return false

    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        ...options,
      })
      return true
    }

    return false
  }

  const sendPushNotification = async (title: string, body: string, data?: Record<string, unknown>) => {
    if (!serviceWorkerRegistration) return false

    try {
      await serviceWorkerRegistration.showNotification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        data
      })
      return true
    } catch (error) {
      console.error('Push notification failed:', error)
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    requestNotificationPermission,
    showNotification,
    sendPushNotification,
    serviceWorkerRegistration,
  }
}