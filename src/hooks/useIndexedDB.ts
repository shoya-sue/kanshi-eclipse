import { useState, useEffect } from 'react'
import { getDBInstance, CACHE_KEYS, CACHE_TTL } from '../services/indexedDBService'

export const useIndexedDB = () => {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const initDB = async () => {
      try {
        await getDBInstance()
        setIsReady(true)
      } catch (err) {
        setError(err as Error)
      }
    }

    initDB()
  }, [])

  const setCache = async <T>(
    store: string,
    key: string,
    data: T,
    ttl?: number
  ): Promise<void> => {
    try {
      const db = await getDBInstance()
      await db.set(store, key, data, ttl)
    } catch (err) {
      console.error('Failed to set cache:', err)
      throw err
    }
  }

  const getCache = async <T>(
    store: string,
    key: string
  ): Promise<T | null> => {
    try {
      const db = await getDBInstance()
      return await db.get<T>(store, key)
    } catch (err) {
      console.error('Failed to get cache:', err)
      return null
    }
  }

  const deleteCache = async (store: string, key: string): Promise<void> => {
    try {
      const db = await getDBInstance()
      await db.delete(store, key)
    } catch (err) {
      console.error('Failed to delete cache:', err)
      throw err
    }
  }

  const clearCache = async (store: string): Promise<void> => {
    try {
      const db = await getDBInstance()
      await db.clear(store)
    } catch (err) {
      console.error('Failed to clear cache:', err)
      throw err
    }
  }

  const cleanupExpired = async (store: string): Promise<number> => {
    try {
      const db = await getDBInstance()
      return await db.cleanupExpired(store)
    } catch (err) {
      console.error('Failed to cleanup expired cache:', err)
      return 0
    }
  }

  return {
    isReady,
    error,
    setCache,
    getCache,
    deleteCache,
    clearCache,
    cleanupExpired,
    CACHE_KEYS,
    CACHE_TTL
  }
}

export const useCachedData = <T>(
  store: string,
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { isReady, getCache, setCache } = useIndexedDB()

  useEffect(() => {
    if (!isReady) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to get from cache first
        const cachedData = await getCache<T>(store, key)
        if (cachedData) {
          setData(cachedData)
          setLoading(false)
          return
        }

        // If not in cache, fetch from source
        const freshData = await fetcher()
        setData(freshData)
        
        // Cache the fresh data
        await setCache(store, key, freshData, ttl)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isReady, store, key, ttl, fetcher, getCache, setCache])

  const refresh = async () => {
    try {
      setLoading(true)
      setError(null)

      const freshData = await fetcher()
      setData(freshData)
      await setCache(store, key, freshData, ttl)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    refresh
  }
}

export const useDBStats = () => {
  const [stats, setStats] = useState<{
    totalSize: number
    storesSizes: { [key: string]: number }
    totalEntries: number
    storesEntries: { [key: string]: number }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const { isReady } = useIndexedDB()

  useEffect(() => {
    if (!isReady) return

    const fetchStats = async () => {
      try {
        const db = await getDBInstance()
        const stores = ['gas_fees', 'transactions', 'rpc_data', 'token_prices', 'wallet_data', 'dex_data']
        
        let totalSize = 0
        let totalEntries = 0
        const storesSizes: { [key: string]: number } = {}
        const storesEntries: { [key: string]: number } = {}

        for (const store of stores) {
          try {
            const size = await db.getStorageSize(store)
            const entries = await db.getAllKeys(store)
            
            storesSizes[store] = size
            storesEntries[store] = entries.length
            totalSize += size
            totalEntries += entries.length
          } catch (err) {
            console.warn(`Failed to get stats for store ${store}:`, err)
            storesSizes[store] = 0
            storesEntries[store] = 0
          }
        }

        setStats({
          totalSize,
          storesSizes,
          totalEntries,
          storesEntries
        })
      } catch (err) {
        console.error('Failed to fetch DB stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isReady])

  return { stats, loading }
}

export const useDBMaintenance = () => {
  const { isReady } = useIndexedDB()

  const cleanupAll = async (): Promise<number> => {
    if (!isReady) return 0

    const db = await getDBInstance()
    const stores = ['gas_fees', 'transactions', 'rpc_data', 'token_prices', 'wallet_data', 'dex_data']
    let totalCleaned = 0

    for (const store of stores) {
      try {
        const cleaned = await db.cleanupExpired(store)
        totalCleaned += cleaned
      } catch (err) {
        console.warn(`Failed to cleanup store ${store}:`, err)
      }
    }

    return totalCleaned
  }

  const clearAll = async (): Promise<void> => {
    if (!isReady) return

    const db = await getDBInstance()
    const stores = ['gas_fees', 'transactions', 'rpc_data', 'token_prices', 'wallet_data', 'dex_data']

    for (const store of stores) {
      try {
        await db.clear(store)
      } catch (err) {
        console.warn(`Failed to clear store ${store}:`, err)
      }
    }
  }

  const exportAll = async (): Promise<{ [key: string]: string }> => {
    if (!isReady) return {}

    const db = await getDBInstance()
    const stores = ['gas_fees', 'transactions', 'rpc_data', 'token_prices', 'wallet_data', 'dex_data']
    const exports: { [key: string]: string } = {}

    for (const store of stores) {
      try {
        exports[store] = await db.exportData(store)
      } catch (err) {
        console.warn(`Failed to export store ${store}:`, err)
        exports[store] = '[]'
      }
    }

    return exports
  }

  return {
    cleanupAll,
    clearAll,
    exportAll
  }
}