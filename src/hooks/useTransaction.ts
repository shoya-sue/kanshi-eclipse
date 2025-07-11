import { useQuery, useMutation } from '@tanstack/react-query'
import { transactionDecoderService } from '../services/transactionDecoder'
import { TransactionDetails, AccountInfo, TransactionSearchResult } from '../types/transaction'

export const useTransaction = (signature: string | null) => {
  return useQuery<TransactionDetails | null>({
    queryKey: ['transaction', signature],
    queryFn: () => signature ? transactionDecoderService.getTransactionDetails(signature) : null,
    enabled: !!signature,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAccountInfo = (address: string | null) => {
  return useQuery<AccountInfo | null>({
    queryKey: ['accountInfo', address],
    queryFn: () => address ? transactionDecoderService.getAccountInfo(address) : null,
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const useTransactionSearch = () => {
  return useMutation<TransactionSearchResult[], Error, {
    address: string
    options?: {
      limit?: number
      before?: string
      until?: string
    }
  }>({
    mutationFn: ({ address, options }) => 
      transactionDecoderService.searchTransactions(address, options),
  })
}