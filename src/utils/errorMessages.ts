export interface ErrorMessages {
  [key: string]: {
    ja: string
    en: string
  }
}

export const errorMessages: ErrorMessages = {
  // Network errors
  'network_error': {
    ja: 'ネットワークエラーが発生しました。接続を確認してください。',
    en: 'Network error occurred. Please check your connection.'
  },
  'timeout_error': {
    ja: 'リクエストがタイムアウトしました。',
    en: 'Request timed out.'
  },
  'connection_failed': {
    ja: '接続に失敗しました。',
    en: 'Connection failed.'
  },
  'rate_limit_exceeded': {
    ja: 'リクエスト制限を超過しました。しばらく待ってから再試行してください。',
    en: 'Rate limit exceeded. Please wait and try again.'
  },

  // Validation errors
  'validation_error': {
    ja: '入力値が正しくありません。',
    en: 'Invalid input.'
  },
  'required_field': {
    ja: 'この項目は必須です。',
    en: 'This field is required.'
  },
  'invalid_address': {
    ja: '無効なアドレスです。',
    en: 'Invalid address.'
  },
  'invalid_amount': {
    ja: '無効な金額です。',
    en: 'Invalid amount.'
  },
  'insufficient_balance': {
    ja: '残高が不足しています。',
    en: 'Insufficient balance.'
  },

  // Wallet errors
  'wallet_not_connected': {
    ja: 'ウォレットが接続されていません。',
    en: 'Wallet is not connected.'
  },
  'wallet_connection_failed': {
    ja: 'ウォレットの接続に失敗しました。',
    en: 'Failed to connect wallet.'
  },
  'transaction_rejected': {
    ja: 'トランザクションが拒否されました。',
    en: 'Transaction was rejected.'
  },
  'signature_failed': {
    ja: '署名に失敗しました。',
    en: 'Signature failed.'
  },
  'wallet_locked': {
    ja: 'ウォレットがロックされています。',
    en: 'Wallet is locked.'
  },
  'unsupported_wallet': {
    ja: 'サポートされていないウォレットです。',
    en: 'Unsupported wallet.'
  },

  // Blockchain errors
  'rpc_error': {
    ja: 'RPCエラーが発生しました。',
    en: 'RPC error occurred.'
  },
  'transaction_failed': {
    ja: 'トランザクションが失敗しました。',
    en: 'Transaction failed.'
  },
  'block_not_found': {
    ja: 'ブロックが見つかりません。',
    en: 'Block not found.'
  },
  'transaction_not_found': {
    ja: 'トランザクションが見つかりません。',
    en: 'Transaction not found.'
  },
  'account_not_found': {
    ja: 'アカウントが見つかりません。',
    en: 'Account not found.'
  },
  'simulation_failed': {
    ja: 'シミュレーションに失敗しました。',
    en: 'Simulation failed.'
  },

  // DEX errors
  'swap_failed': {
    ja: 'スワップに失敗しました。',
    en: 'Swap failed.'
  },
  'price_impact_high': {
    ja: '価格影響が大きすぎます。',
    en: 'Price impact is too high.'
  },
  'slippage_exceeded': {
    ja: 'スリッページが許容範囲を超えました。',
    en: 'Slippage exceeded tolerance.'
  },
  'liquidity_insufficient': {
    ja: '流動性が不足しています。',
    en: 'Insufficient liquidity.'
  },
  'token_not_found': {
    ja: 'トークンが見つかりません。',
    en: 'Token not found.'
  },
  'pair_not_found': {
    ja: 'ペアが見つかりません。',
    en: 'Pair not found.'
  },

  // System errors
  'system_error': {
    ja: 'システムエラーが発生しました。',
    en: 'System error occurred.'
  },
  'unknown_error': {
    ja: '不明なエラーが発生しました。',
    en: 'Unknown error occurred.'
  },
  'feature_unavailable': {
    ja: 'この機能は現在利用できません。',
    en: 'This feature is currently unavailable.'
  },
  'maintenance_mode': {
    ja: 'メンテナンス中です。',
    en: 'Under maintenance.'
  },
  'service_unavailable': {
    ja: 'サービスが利用できません。',
    en: 'Service unavailable.'
  },

  // Cache errors
  'cache_error': {
    ja: 'キャッシュエラーが発生しました。',
    en: 'Cache error occurred.'
  },
  'storage_quota_exceeded': {
    ja: 'ストレージ容量を超過しました。',
    en: 'Storage quota exceeded.'
  },
  'data_corruption': {
    ja: 'データが破損しています。',
    en: 'Data corruption detected.'
  },

  // Permission errors
  'permission_denied': {
    ja: 'アクセス権限がありません。',
    en: 'Permission denied.'
  },
  'unauthorized': {
    ja: '認証されていません。',
    en: 'Unauthorized.'
  },
  'forbidden': {
    ja: 'アクセスが禁止されています。',
    en: 'Access forbidden.'
  },

  // Configuration errors
  'config_error': {
    ja: '設定エラーが発生しました。',
    en: 'Configuration error.'
  },
  'invalid_config': {
    ja: '無効な設定です。',
    en: 'Invalid configuration.'
  },
  'missing_config': {
    ja: '設定が見つかりません。',
    en: 'Configuration not found.'
  }
}

export type Language = 'ja' | 'en'

export function getErrorMessage(
  errorKey: string, 
  language: Language = 'ja',
  fallback?: string
): string {
  const message = errorMessages[errorKey]
  if (message && message[language]) {
    return message[language]
  }
  
  if (fallback) {
    return fallback
  }
  
  return language === 'ja' 
    ? '不明なエラーが発生しました。'
    : 'Unknown error occurred.'
}

export function getErrorMessageFromError(
  error: Error,
  language: Language = 'ja',
  context?: string
): string {
  const message = error.message.toLowerCase()
  
  // Try to match error message to known patterns
  if (message.includes('network') || message.includes('fetch')) {
    return getErrorMessage('network_error', language)
  }
  if (message.includes('timeout')) {
    return getErrorMessage('timeout_error', language)
  }
  if (message.includes('connection')) {
    return getErrorMessage('connection_failed', language)
  }
  if (message.includes('rate limit')) {
    return getErrorMessage('rate_limit_exceeded', language)
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return getErrorMessage('validation_error', language)
  }
  if (message.includes('wallet')) {
    return getErrorMessage('wallet_connection_failed', language)
  }
  if (message.includes('rejected')) {
    return getErrorMessage('transaction_rejected', language)
  }
  if (message.includes('signature')) {
    return getErrorMessage('signature_failed', language)
  }
  if (message.includes('rpc')) {
    return getErrorMessage('rpc_error', language)
  }
  if (message.includes('transaction')) {
    return getErrorMessage('transaction_failed', language)
  }
  if (message.includes('swap')) {
    return getErrorMessage('swap_failed', language)
  }
  if (message.includes('slippage')) {
    return getErrorMessage('slippage_exceeded', language)
  }
  if (message.includes('liquidity')) {
    return getErrorMessage('liquidity_insufficient', language)
  }
  if (message.includes('cache') || message.includes('storage')) {
    return getErrorMessage('cache_error', language)
  }
  if (message.includes('permission') || message.includes('unauthorized')) {
    return getErrorMessage('permission_denied', language)
  }
  
  // If no pattern matches, return the original message with context
  if (context) {
    return `${context}: ${error.message}`
  }
  
  return error.message
}

export function formatErrorForUser(
  error: Error,
  language: Language = 'ja',
  context?: string
): {
  title: string
  message: string
  details?: string
} {
  const userMessage = getErrorMessageFromError(error, language, context)
  
  return {
    title: language === 'ja' ? 'エラー' : 'Error',
    message: userMessage,
    details: error.stack
  }
}