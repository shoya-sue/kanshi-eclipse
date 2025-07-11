import { useState } from 'react'
import { useSendTransaction } from '../../hooks/useWallet'
import { isValidPublicKey } from '../../utils/validators'
import { Send, AlertCircle } from 'lucide-react'
import Button from '../Common/Button'
import Card from '../Common/Card'

const SendTransaction = () => {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const sendTransaction = useSendTransaction()

  const validateForm = () => {
    if (!recipient) {
      setValidationError('受信者アドレスを入力してください')
      return false
    }

    if (!isValidPublicKey(recipient)) {
      setValidationError('無効なアドレスです')
      return false
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setValidationError('有効な金額を入力してください')
      return false
    }

    setValidationError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await sendTransaction.mutateAsync({
        to: recipient,
        amount: Number(amount),
        memo: memo || undefined,
      })
      
      // Reset form on success
      setRecipient('')
      setAmount('')
      setMemo('')
    } catch (error) {
      console.error('Send transaction failed:', error)
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Send className="w-5 h-5 text-eclipse-primary" />
          <h3 className="text-lg font-semibold text-gray-900">送金</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              受信者アドレス
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Eclipse アドレスを入力..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eclipse-primary focus:border-eclipse-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              金額 (SOL)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.000001"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eclipse-primary focus:border-eclipse-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メモ (オプション)
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="送金の目的など..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eclipse-primary focus:border-eclipse-primary"
            />
          </div>

          {validationError && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{validationError}</span>
            </div>
          )}

          {sendTransaction.error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>
                送金に失敗しました: {
                  sendTransaction.error instanceof Error 
                    ? sendTransaction.error.message 
                    : '不明なエラー'
                }
              </span>
            </div>
          )}

          {sendTransaction.isSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="text-green-800 text-sm">
                送金が完了しました！
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={sendTransaction.isPending}
            disabled={!recipient || !amount || sendTransaction.isPending}
          >
            {sendTransaction.isPending ? '送金中...' : '送金する'}
          </Button>
        </form>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• 送金には手数料がかかります</p>
          <p>• アドレスは必ず確認してから送金してください</p>
          <p>• 送金後の取り消しはできません</p>
        </div>
      </div>
    </Card>
  )
}

export default SendTransaction