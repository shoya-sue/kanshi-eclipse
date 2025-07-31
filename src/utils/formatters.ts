export const formatLamports = (lamports: number): string => {
  const sol = lamports / 1_000_000_000
  if (sol < 0.001) {
    return `${lamports} lamports`
  }
  return `${sol.toFixed(6)} SOL`
}

export const formatWei = (wei: number): string => {
  // 1 ETH = 10^18 wei
  const eth = wei / 1_000_000_000_000_000_000
  if (eth < 0.000001) {
    // Show in Gwei (10^9 wei)
    const gwei = wei / 1_000_000_000
    if (gwei < 0.001) {
      return `${wei} wei`
    }
    return `${gwei.toFixed(3)} Gwei`
  }
  return `${eth.toFixed(6)} ETH`
}

// For Eclipse chain, we use ETH as gas token
export const formatGasPrice = formatWei

export const formatNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  return num.toString()
}

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`
  }
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

export const formatAddress = (address: string, length: number = 8): string => {
  if (address.length <= length * 2) {
    return address
  }
  return `${address.slice(0, length)}...${address.slice(-length)}`
}

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`
}

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}