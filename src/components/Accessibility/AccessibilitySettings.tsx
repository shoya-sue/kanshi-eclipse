import React, { useState, useEffect } from 'react'
import { Eye, Keyboard, Volume2, Zap, Monitor, Type } from 'lucide-react'
import { accessibilityManager, AccessibilityConfig } from '../../utils/accessibility'
import Card from '../Common/Card'
import Button from '../Common/Button'

interface AccessibilitySettingsProps {
  onClose?: () => void
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ onClose }) => {
  const [config, setConfig] = useState<AccessibilityConfig>({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: false
  })

  useEffect(() => {
    setConfig(accessibilityManager.getConfig())
  }, [])

  const handleConfigChange = (key: keyof AccessibilityConfig, value: boolean) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    accessibilityManager.updateConfig({ [key]: value })
    
    // Announce change to screen reader
    accessibilityManager.announceToScreenReader(
      `${key} が ${value ? '有効' : '無効'} になりました`
    )
  }

  const resetToDefaults = () => {
    const defaultConfig: AccessibilityConfig = {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      screenReader: false,
      keyboardNavigation: false
    }
    
    setConfig(defaultConfig)
    accessibilityManager.updateConfig(defaultConfig)
    accessibilityManager.announceToScreenReader('設定がリセットされました')
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              アクセシビリティ設定
            </h2>
          </div>
          {onClose && (
            <Button variant="secondary" onClick={onClose}>
              閉じる
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Reduced Motion */}
          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    動きを抑制
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    アニメーションや動きのある効果を減らします
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.reducedMotion}
                    onChange={(e) => handleConfigChange('reducedMotion', e.target.checked)}
                    className="sr-only peer"
                    aria-describedby="reduced-motion-description"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div id="reduced-motion-description" className="sr-only">
                動きのある効果を減らして、動きに敏感な方や集中力を保ちたい方に配慮します
              </div>
            </div>
          </div>

          {/* High Contrast */}
          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    高コントラスト
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    テキストと背景のコントラストを強化します
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.highContrast}
                    onChange={(e) => handleConfigChange('highContrast', e.target.checked)}
                    className="sr-only peer"
                    aria-describedby="high-contrast-description"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div id="high-contrast-description" className="sr-only">
                視覚的な区別を明確にして、文字や要素を見やすくします
              </div>
            </div>
          </div>

          {/* Large Text */}
          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Type className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    大きな文字
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    フォントサイズを大きくして読みやすくします
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.largeText}
                    onChange={(e) => handleConfigChange('largeText', e.target.checked)}
                    className="sr-only peer"
                    aria-describedby="large-text-description"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div id="large-text-description" className="sr-only">
                文字サイズを大きくして、視覚的な負担を軽減します
              </div>
            </div>
          </div>

          {/* Screen Reader */}
          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    スクリーンリーダー最適化
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    スクリーンリーダーでの操作を最適化します
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.screenReader}
                    onChange={(e) => handleConfigChange('screenReader', e.target.checked)}
                    className="sr-only peer"
                    aria-describedby="screen-reader-description"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div id="screen-reader-description" className="sr-only">
                スクリーンリーダーでの読み上げを改善し、音声による操作を最適化します
              </div>
            </div>
          </div>

          {/* Keyboard Navigation */}
          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    キーボードナビゲーション
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    キーボードでの操作を強化します
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.keyboardNavigation}
                    onChange={(e) => handleConfigChange('keyboardNavigation', e.target.checked)}
                    className="sr-only peer"
                    aria-describedby="keyboard-navigation-description"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div id="keyboard-navigation-description" className="sr-only">
                キーボードのみでの操作を可能にし、フォーカス表示を改善します
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            キーボードショートカット
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ナビゲーション</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Tab</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">戻る</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Shift+Tab</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">実行</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">キャンセル</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">上下移動</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">左右移動</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">←→</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">選択</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Space</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ヘルプ</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">?</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="danger"
            onClick={resetToDefaults}
            className="flex items-center space-x-2"
          >
            <span>デフォルトに戻す</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => accessibilityManager.announceToScreenReader('設定が保存されました')}
            className="flex items-center space-x-2"
          >
            <span>設定をテスト</span>
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            使い方のヒント
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• 設定は自動的に保存され、次回のアクセス時に復元されます</li>
            <li>• ブラウザのシステム設定も自動的に検出されます</li>
            <li>• キーボードでの操作は Tab キーで要素を移動できます</li>
            <li>• 困ったときは Esc キーで設定を閉じることができます</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}

export default AccessibilitySettings