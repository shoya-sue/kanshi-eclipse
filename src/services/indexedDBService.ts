export interface CacheEntry<T = any> {
  key: string
  data: T
  timestamp: number
  expiryTime: number
}

export interface DBConfig {
  name: string
  version: number
  stores: {
    name: string
    keyPath: string
    indexes?: { name: string; keyPath: string; unique: boolean }[]
  }[]
}

export class IndexedDBService {
  private db: IDBDatabase | null = null
  private dbName: string
  private dbVersion: number
  private stores: DBConfig['stores']

  constructor(config: DBConfig) {
    this.dbName = config.name
    this.dbVersion = config.version
    this.stores = config.stores
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error}`))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create stores if they don't exist
        for (const store of this.stores) {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, {
              keyPath: store.keyPath
            })

            // Create indexes if specified
            if (store.indexes) {
              for (const index of store.indexes) {
                objectStore.createIndex(index.name, index.keyPath, {
                  unique: index.unique
                })
              }
            }
          }
        }
      }
    })
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  async set<T>(storeName: string, key: string, data: T, ttl?: number): Promise<void> {
    if (!this.db) throw new Error('Database not connected')

    const expiryTime = ttl ? Date.now() + ttl : 0
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiryTime
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(entry)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) throw new Error('Database not connected')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        const entry: CacheEntry<T> | undefined = request.result
        
        if (!entry) {
          resolve(null)
          return
        }

        // Check if entry has expired
        if (entry.expiryTime > 0 && Date.now() > entry.expiryTime) {
          // Remove expired entry
          this.delete(storeName, key)
          resolve(null)
          return
        }

        resolve(entry.data)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) throw new Error('Database not connected')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not connected')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getAllKeys(storeName: string): Promise<string[]> {
    if (!this.db) throw new Error('Database not connected')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAllKeys()

      request.onsuccess = () => resolve(request.result as string[])
      request.onerror = () => reject(request.error)
    })
  }

  async getAll<T>(storeName: string): Promise<CacheEntry<T>[]> {
    if (!this.db) throw new Error('Database not connected')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async cleanupExpired(storeName: string): Promise<number> {
    if (!this.db) throw new Error('Database not connected')

    const allEntries = await this.getAll(storeName)
    const now = Date.now()
    let cleanedCount = 0

    for (const entry of allEntries) {
      if (entry.expiryTime > 0 && now > entry.expiryTime) {
        await this.delete(storeName, entry.key)
        cleanedCount++
      }
    }

    return cleanedCount
  }

  async getStorageSize(storeName: string): Promise<number> {
    const allEntries = await this.getAll(storeName)
    return JSON.stringify(allEntries).length
  }

  async exportData(storeName: string): Promise<string> {
    const allEntries = await this.getAll(storeName)
    return JSON.stringify(allEntries, null, 2)
  }

  async importData(storeName: string, jsonData: string): Promise<void> {
    const entries = JSON.parse(jsonData)
    
    for (const entry of entries) {
      await this.set(storeName, entry.key, entry.data, 
        entry.expiryTime > 0 ? entry.expiryTime - Date.now() : undefined)
    }
  }
}

// Default configuration for Eclipse Chain Tools
export const DEFAULT_DB_CONFIG: DBConfig = {
  name: 'eclipse_chain_tools',
  version: 1,
  stores: [
    {
      name: 'gas_fees',
      keyPath: 'key',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp', unique: false }
      ]
    },
    {
      name: 'transactions',
      keyPath: 'key',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp', unique: false }
      ]
    },
    {
      name: 'rpc_data',
      keyPath: 'key',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp', unique: false }
      ]
    },
    {
      name: 'token_prices',
      keyPath: 'key',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp', unique: false }
      ]
    },
    {
      name: 'wallet_data',
      keyPath: 'key',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp', unique: false }
      ]
    },
    {
      name: 'dex_data',
      keyPath: 'key',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp', unique: false }
      ]
    }
  ]
}

// Singleton instance
let dbInstance: IndexedDBService | null = null

export const getDBInstance = async (): Promise<IndexedDBService> => {
  if (!dbInstance) {
    dbInstance = new IndexedDBService(DEFAULT_DB_CONFIG)
    await dbInstance.connect()
  }
  return dbInstance
}

// Cache utilities
export const CACHE_KEYS = {
  GAS_FEES: 'gas_fees',
  TRANSACTIONS: 'transactions',
  RPC_HEALTH: 'rpc_health',
  TOKEN_PRICES: 'token_prices',
  WALLET_BALANCE: 'wallet_balance',
  DEX_STATS: 'dex_stats',
  TOKEN_LIST: 'token_list'
} as const

export const CACHE_TTL = {
  SHORT: 30 * 1000, // 30 seconds
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const