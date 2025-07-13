import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers)

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IndexedDB
const mockIDBRequest = {
  onsuccess: null,
  onerror: null,
  result: null,
  transaction: null,
  source: null,
  readyState: 'pending' as IDBRequestReadyState,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}

const mockIDBDatabase = {
  name: 'test-db',
  version: 1,
  objectStoreNames: [],
  createObjectStore: vi.fn(),
  deleteObjectStore: vi.fn(),
  transaction: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  onabort: null,
  onclose: null,
  onerror: null,
  onversionchange: null,
} as any

// @ts-ignore
const mockIDBObjectStore = {
  name: 'test-store',
  keyPath: 'id',
  indexNames: [],
  transaction: mockIDBDatabase.transaction,
  autoIncrement: false,
  add: vi.fn(() => mockIDBRequest),
  clear: vi.fn(() => mockIDBRequest),
  count: vi.fn(() => mockIDBRequest),
  createIndex: vi.fn(),
  delete: vi.fn(() => mockIDBRequest),
  deleteIndex: vi.fn(),
  get: vi.fn(() => mockIDBRequest),
  getAll: vi.fn(() => mockIDBRequest),
  getAllKeys: vi.fn(() => mockIDBRequest),
  getKey: vi.fn(() => mockIDBRequest),
  index: vi.fn(),
  openCursor: vi.fn(() => mockIDBRequest),
  openKeyCursor: vi.fn(() => mockIDBRequest),
  put: vi.fn(() => mockIDBRequest),
}

// @ts-ignore
global.indexedDB = {
  open: vi.fn(() => ({
    ...mockIDBRequest,
    onupgradeneeded: null,
    onblocked: null,
    result: mockIDBDatabase as IDBDatabase,
    error: null,
    source: mockIDBDatabase as any,
  })) as any,
  deleteDatabase: vi.fn(() => ({
    ...mockIDBRequest,
    onblocked: null,
    onupgradeneeded: null,
    error: null,
    result: null as any,
    source: null as any,
  })) as any,
  databases: vi.fn(() => Promise.resolve([])),
  cmp: vi.fn(),
}

// Mock performance API
// @ts-ignore
global.performance = {
  ...global.performance,
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  now: vi.fn(() => Date.now()),
  navigation: {
    type: 0,
    redirectCount: 0,
    toJSON: () => ({ type: 0, redirectCount: 0 }),
    TYPE_NAVIGATE: 0,
    TYPE_RELOAD: 1,
    TYPE_BACK_FORWARD: 2,
    TYPE_RESERVED: 255,
  },
}

// Mock PerformanceObserver
// @ts-ignore
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}))
// @ts-ignore
global.PerformanceObserver.supportedEntryTypes = ['measure', 'navigation']

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

global.localStorage = localStorageMock

// Mock sessionStorage
global.sessionStorage = localStorageMock

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
    userAgent: 'test-user-agent',
    clipboard: {
      writeText: vi.fn(() => Promise.resolve()),
      readText: vi.fn(() => Promise.resolve('test')),
    },
  },
})

// Mock crypto
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid'),
    getRandomValues: vi.fn((arr) => arr),
  },
})

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
) as any

// Mock WebSocket
// @ts-ignore
global.WebSocket = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}))
// @ts-ignore
global.WebSocket.CONNECTING = 0
// @ts-ignore
global.WebSocket.OPEN = 1
// @ts-ignore
global.WebSocket.CLOSING = 2
// @ts-ignore
global.WebSocket.CLOSED = 3

// Mock URL
// @ts-ignore
global.URL = class URL {
  constructor(url: string) {
    this.href = url
  }
  href: string
  origin: string = 'http://localhost'
  protocol: string = 'http:'
  pathname: string = '/'
  search: string = ''
  hash: string = ''
  host: string = 'localhost'
  hostname: string = 'localhost'
  port: string = ''
  static createObjectURL = vi.fn(() => 'blob:mock-url')
  static revokeObjectURL = vi.fn()
  username: string = ''
  password: string = ''
  searchParams: URLSearchParams = new URLSearchParams()
  toString() {
    return this.href
  }
  toJSON() {
    return this.href
  }
}

// Mock URLSearchParams
// @ts-ignore
global.URLSearchParams = class URLSearchParams {
  private params: Map<string, string> = new Map()

  constructor(init?: string | URLSearchParams | string[][] | Record<string, string>) {
    if (typeof init === 'string') {
      // Parse query string
      init.split('&').forEach(param => {
        const [key, value] = param.split('=')
        if (key) this.params.set(key, value || '')
      })
    }
  }

  append(name: string, value: string) {
    this.params.set(name, value)
  }

  delete(name: string) {
    this.params.delete(name)
  }

  get(name: string) {
    return this.params.get(name)
  }

  getAll(name: string) {
    return this.params.has(name) ? [this.params.get(name)!] : []
  }

  has(name: string) {
    return this.params.has(name)
  }

  set(name: string, value: string) {
    this.params.set(name, value)
  }

  toString() {
    return Array.from(this.params.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('&')
  }
}

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})