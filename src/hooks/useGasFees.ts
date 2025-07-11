import { useQuery } from '@tanstack/react-query'
import { gasTrackerService } from '../services/gasTracker'
import { GasFeeData, GasFeeStats } from '../types/eclipse'

export const useGasFees = (timeRange: '24h' | '7d' | '30d' = '24h') => {
  return useQuery<GasFeeData[]>({
    queryKey: ['gasFees', timeRange],
    queryFn: () => gasTrackerService.getHistoricalData(timeRange),
    refetchInterval: 15000,
    staleTime: 10000,
  })
}

export const useGasFeeStats = () => {
  return useQuery<GasFeeStats>({
    queryKey: ['gasFeeStats'],
    queryFn: () => gasTrackerService.getGasFeeStats(),
    refetchInterval: 15000,
    staleTime: 10000,
  })
}

export const useCurrentGasFees = () => {
  return useQuery<GasFeeData[]>({
    queryKey: ['currentGasFees'],
    queryFn: () => gasTrackerService.getCurrentGasFees(),
    refetchInterval: 15000,
    staleTime: 10000,
  })
}

export const useEstimatedFee = (feeType: 'transfer' | 'swap' | 'nft' | 'program' = 'transfer') => {
  return useQuery<number>({
    queryKey: ['estimatedFee', feeType],
    queryFn: () => gasTrackerService.estimateTransactionFee(feeType),
    refetchInterval: 30000,
    staleTime: 20000,
  })
}