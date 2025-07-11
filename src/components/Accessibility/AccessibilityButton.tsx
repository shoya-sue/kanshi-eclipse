import React, { useState } from 'react'
import { Eye, X } from 'lucide-react'
import AccessibilitySettings from './AccessibilitySettings'
import { accessibilityManager } from '../../utils/accessibility'

const AccessibilityButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      accessibilityManager.announceToScreenReader('アクセシビリティ設定が開かれました')
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    accessibilityManager.announceToScreenReader('アクセシビリティ設定が閉じられました')
  }

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={handleToggle}
        className="fixed bottom-4 right-4 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="アクセシビリティ設定を開く"
        title="アクセシビリティ設定"
      >
        <Eye className="w-5 h-5" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="accessibility-settings-title"
        >
          <div 
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h2 id="accessibility-settings-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                  アクセシビリティ設定
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="閉じる"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <AccessibilitySettings onClose={handleClose} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AccessibilityButton