export interface TransactionDetails {
  signature: string
  slot: number
  blockTime: number
  fee: number
  success: boolean
  err?: string
  accounts: string[]
  instructions: InstructionDetail[]
  logMessages: string[]
}

export interface InstructionDetail {
  programId: string
  accounts: string[]
  data: string
  decodedData?: any
  instructionType?: string
}

export interface AccountInfo {
  address: string
  balance: number
  owner: string
  executable: boolean
  rentEpoch: number
  data?: {
    program: string
    parsed?: any
    space: number
  }
}

export interface TransactionSearchResult {
  signature: string
  slot: number
  blockTime: number
  fee: number
  success: boolean
  accounts: string[]
}