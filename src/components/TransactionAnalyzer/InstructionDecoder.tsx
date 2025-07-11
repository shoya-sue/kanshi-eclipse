import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Code2 } from 'lucide-react'
import { InstructionDetail } from '../../types/transaction'
import { formatAddress } from '../../utils/formatters'

interface InstructionDecoderProps {
  instruction: InstructionDetail
  index: number
}

const InstructionDecoder = ({ instruction, index }: InstructionDecoderProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getProgramName = (programId: string) => {
    const commonPrograms: { [key: string]: string } = {
      '11111111111111111111111111111111': 'System Program',
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Program',
      'BPFLoaderUpgradeab1e11111111111111111111111': 'BPF Loader Upgradeable',
      'Vote111111111111111111111111111111111111111': 'Vote Program',
      'Stake11111111111111111111111111111111111111': 'Stake Program',
    }
    
    return commonPrograms[programId] || 'Unknown Program'
  }

  const getInstructionTypeColor = (type: string) => {
    switch (type) {
      case 'System Program':
        return 'bg-blue-100 text-blue-800'
      case 'Token Program':
        return 'bg-green-100 text-green-800'
      case 'Associated Token Program':
        return 'bg-purple-100 text-purple-800'
      case 'BPF Loader Upgradeable':
        return 'bg-orange-100 text-orange-800'
      case 'Vote Program':
        return 'bg-yellow-100 text-yellow-800'
      case 'Stake Program':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            <span className="text-sm font-medium text-gray-900">
              インストラクション #{index + 1}
            </span>
          </div>
          
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getInstructionTypeColor(instruction.instructionType || 'Unknown')}`}>
            {getProgramName(instruction.programId)}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">
            {instruction.accounts.length} アカウント
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プログラムID
              </label>
              <div className="flex items-center space-x-2">
                <code className="text-sm font-mono text-gray-900 break-all">
                  {formatAddress(instruction.programId, 16)}
                </code>
                <button
                  onClick={() => copyToClipboard(instruction.programId)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                データ長
              </label>
              <span className="text-sm text-gray-900">
                {instruction.data.length} bytes
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              使用アカウント
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {instruction.accounts.map((account, accountIndex) => (
                <div key={accountIndex} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-500 w-6">
                    {accountIndex}
                  </span>
                  <code className="text-sm font-mono text-gray-900 break-all flex-1">
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

          {instruction.decodedData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                デコード済みデータ
              </label>
              <div className="p-3 bg-gray-900 text-green-400 rounded font-mono text-sm">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(instruction.decodedData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生データ
            </label>
            <div className="p-3 bg-gray-100 rounded">
              <code className="text-sm font-mono text-gray-900 break-all">
                {instruction.data}
              </code>
              <button
                onClick={() => copyToClipboard(instruction.data)}
                className="ml-2 p-1 text-gray-500 hover:text-gray-700"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InstructionDecoder