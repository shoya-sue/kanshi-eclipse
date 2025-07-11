import { useState } from 'react'
import TransactionSearch from '../components/TransactionAnalyzer/TransactionSearch'
import TransactionDetails from '../components/TransactionAnalyzer/TransactionDetails'
import { TransactionDetails as TransactionDetailsType } from '../types/transaction'

const TransactionAnalyzer = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetailsType | null>(null)

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">トランザクション解析ツール</h1>
        
        <TransactionSearch onTransactionSelect={setSelectedTransaction} />
        
        {selectedTransaction && (
          <div className="mt-6">
            <TransactionDetails transaction={selectedTransaction} />
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionAnalyzer