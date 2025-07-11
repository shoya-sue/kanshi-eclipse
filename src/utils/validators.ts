import { PublicKey } from '@solana/web3.js'

export const isValidPublicKey = (address: string): boolean => {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

export const isValidTransactionSignature = (signature: string): boolean => {
  // Transaction signatures are base58 encoded and typically 88 characters long
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/
  return base58Regex.test(signature)
}

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const isValidRPCUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false
  const urlObj = new URL(url)
  return urlObj.protocol === 'https:' || urlObj.protocol === 'http:'
}

export const isValidWebSocketUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false
  const urlObj = new URL(url)
  return urlObj.protocol === 'wss:' || urlObj.protocol === 'ws:'
}

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '')
}

export const validateGasFee = (fee: number): boolean => {
  return fee >= 0 && fee <= 1_000_000_000 // Maximum 1 SOL
}

export const validateSlot = (slot: number): boolean => {
  return slot >= 0 && Number.isInteger(slot)
}