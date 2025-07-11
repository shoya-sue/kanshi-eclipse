import { useState } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Copy, 
  ExternalLink, 
  Clock, 
  Hash,
  Wallet,
  Code,
  AlertTriangle
} from 'lucide-react'
import { TransactionDetails as TransactionDetailsType } from '../../types/transaction'
import { formatLamports, formatTime, formatAddress } from '../../utils/formatters'
import InstructionDecoder from './InstructionDecoder'
import Card from '../Common/Card'
import Button from '../Common/Button'

interface TransactionDetailsProps {
  transaction: TransactionDetailsType
}

const TransactionDetails = ({ transaction }: TransactionDetailsProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'instructions' | 'logs'>('overview')

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const openInExplorer = (signature: string) => {
    window.open(`https://eclipse.xyz/tx/${signature}`, '_blank')
  }

  const tabs = [
    { id: 'overview', label: '概要', icon: Hash },
    { id: 'instructions', label: 'インストラクション', icon: Code },
    { id: 'logs', label: 'ログ', icon: AlertTriangle },
  ]

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {transaction.success ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <XCircle className="w-6 h-6 text-red-500" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">
            トランザクション詳細
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openInExplorer(transaction.signature)}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          エクスプローラーで見る
        </Button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-eclipse-primary text-eclipse-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  署名
                </label>
                <div className="flex items-center space-x-2">
                  <code className="text-sm font-mono text-gray-900 break-all">
                    {formatAddress(transaction.signature, 16)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(transaction.signature)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ステータス
                </label>
                <div className="flex items-center space-x-2">
                  {transaction.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 font-medium">成功</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 font-medium">失敗</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  手数料
                </label>
                <span className="text-sm text-gray-900">
                  {formatLamports(transaction.fee)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ブロック時刻
                </label>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-900">
                    {formatTime(transaction.blockTime)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  スロット
                </label>
                <span className="text-sm text-gray-900">
                  {transaction.slot.toLocaleString()}
                </span>
              </div>

              {transaction.err && (
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    エラー
                  </label>
                  <code className="text-sm text-red-600 break-all">
                    {transaction.err}
                  </code>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              関連アカウント ({transaction.accounts.length})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {transaction.accounts.map((account, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <code className="text-sm font-mono text-gray-900 break-all">
                    {formatAddress(account, 16)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(account)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'instructions' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-eclipse-primary" />
            <h4 className="text-lg font-semibold text-gray-900">
              インストラクション ({transaction.instructions.length})
            </h4>
          </div>
          <div className="space-y-3">
            {transaction.instructions.map((instruction, index) => (
              <InstructionDecoder
                key={index}
                instruction={instruction}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-eclipse-primary" />
            <h4 className="text-lg font-semibold text-gray-900">
              ログメッセージ ({transaction.logMessages.length})
            </h4>
          </div>
          
          {transaction.logMessages.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transaction.logMessages.map((log, index) => (
                <div key={index} className="p-3 bg-gray-900 text-green-400 rounded font-mono text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-500 select-none">{index + 1}.</span>
                    <span className="break-all">{log}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              ログメッセージがありません
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default TransactionDetails