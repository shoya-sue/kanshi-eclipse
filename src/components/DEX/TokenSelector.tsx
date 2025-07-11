import { useState } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { TokenInfo } from '../../types/dex'
import { useTokenSearch } from '../../hooks/useDEX'
import Button from '../Common/Button'

interface TokenSelectorProps {
  selectedToken: TokenInfo | null
  onTokenSelect: (token: TokenInfo) => void
  excludeToken?: TokenInfo
  disabled?: boolean
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onTokenSelect,
  excludeToken,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchResults = useTokenSearch(searchQuery)

  const handleTokenSelect = (token: TokenInfo) => {
    onTokenSelect(token)
    setIsOpen(false)
    setSearchQuery('')
  }

  const filteredResults = searchResults.filter(
    token => !excludeToken || token.address !== excludeToken.address
  )

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center space-x-2 px-3 py-2 min-w-[120px]"
      >
        {selectedToken ? (
          <>
            {selectedToken.logoURI && (
              <img 
                src={selectedToken.logoURI} 
                alt={selectedToken.symbol}
                className="w-5 h-5 rounded-full"
              />
            )}
            <span className="font-medium">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="text-gray-500">Select Token</span>
        )}
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eclipse-primary focus:border-eclipse-primary"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredResults.length > 0 ? (
              <div className="py-2">
                {filteredResults.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleTokenSelect(token)}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-left"
                  >
                    {token.logoURI ? (
                      <img 
                        src={token.logoURI} 
                        alt={token.symbol}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {token.symbol.slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{token.symbol}</span>
                        {token.tags && token.tags.includes('verified') && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">{token.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No tokens found' : 'Start typing to search tokens'}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TokenSelector