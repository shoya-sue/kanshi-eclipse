/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ECLIPSE_RPC_URL: string
  readonly VITE_ECLIPSE_WS_URL: string
  readonly VITE_BACKUP_RPC_URLS: string
  readonly VITE_GAS_FEE_UPDATE_INTERVAL: string
  readonly VITE_RPC_HEALTH_CHECK_INTERVAL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}