import { PublicKey } from '@solana/web3.js'
import { eclipseRPCService } from './eclipseRPC'
import { TransactionDetails, InstructionDetail, AccountInfo } from '../types/transaction'
import { isValidTransactionSignature } from '../utils/validators'
import { errorLogger } from './errorLogger'
import { toastService } from './toastService'
import { withBlockchainRetry } from '../utils/retry'

export class TransactionDecoderService {
  async getTransactionDetails(signature: string): Promise<TransactionDetails | null> {
    if (!isValidTransactionSignature(signature)) {
      const error = new Error('Invalid transaction signature format')
      errorLogger.logError(error, {
        category: 'TRANSACTION_DECODER',
        context: { signature },
        severity: 'medium'
      })
      throw error
    }

    try {
      return await withBlockchainRetry(async () => {
        const transaction = await eclipseRPCService.getTransaction(signature)
        
        if (!transaction) {
          return null
        }

        const instructions: InstructionDetail[] = []
        const message = transaction.transaction.message
        
        // Handle both legacy and versioned transactions
        if ('instructions' in message && message.instructions) {
          let accountKeys: any
          if ('accountKeys' in message) {
            accountKeys = message.accountKeys
          } else {
            // For versioned transactions, we need to get account keys differently
            accountKeys = []
          }
          
          for (const instruction of message.instructions) {
            const programId = accountKeys[instruction.programIdIndex]
            
            instructions.push({
              programId: programId?.toString() || 'Unknown',
              accounts: instruction.accounts.map((index: number) => 
                accountKeys[index]?.toString() || 'Unknown'
              ),
              data: instruction.data,
              decodedData: await this.decodeInstructionData(instruction.data, programId),
              instructionType: this.getInstructionType(programId),
            })
          }
        }

        return {
          signature,
          slot: transaction.slot,
          blockTime: transaction.blockTime || 0,
          fee: transaction.meta?.fee || 0,
          success: transaction.meta?.err === null,
          err: transaction.meta?.err ? JSON.stringify(transaction.meta.err) : undefined,
          accounts: 'accountKeys' in transaction.transaction.message 
            ? transaction.transaction.message.accountKeys.map((key: any) => key.toString())
            : [],
          instructions,
          logMessages: transaction.meta?.logMessages || [],
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get transaction details: ${errorMessage}`), {
        category: 'TRANSACTION_DECODER',
        context: { signature },
        severity: 'high'
      })
      toastService.showError('Failed to fetch transaction details')
      throw error
    }
  }

  private async decodeInstructionData(data: string, programId: PublicKey): Promise<any> {
    try {
      // Basic decoding for common programs
      if (programId.toString() === '11111111111111111111111111111111') {
        // System Program
        return this.decodeSystemProgramInstruction(data)
      } else if (programId.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        // Token Program
        return this.decodeTokenProgramInstruction(data)
      }
      
      return { raw: data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to decode instruction data: ${errorMessage}`), {
        category: 'TRANSACTION_DECODER',
        context: { programId: programId.toString(), data: data.substring(0, 100) },
        severity: 'low'
      })
      return { raw: data, error: 'Failed to decode' }
    }
  }

  private decodeSystemProgramInstruction(data: string): any {
    try {
      const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0))
      if (bytes.length === 0) return { type: 'unknown' }
      
      const dataView = new DataView(bytes.buffer)
      const instruction = dataView.getUint32(0, true) // true for little-endian
      
      switch (instruction) {
        case 0:
          return { type: 'CreateAccount' }
        case 1:
          return { type: 'Assign' }
        case 2:
          return { type: 'Transfer', amount: bytes.length >= 12 ? dataView.getBigUint64(4, true) : 0 }
        case 3:
          return { type: 'CreateAccountWithSeed' }
        case 4:
          return { type: 'AdvanceNonceAccount' }
        case 5:
          return { type: 'WithdrawNonceAccount' }
        case 6:
          return { type: 'InitializeNonceAccount' }
        case 7:
          return { type: 'AuthorizeNonceAccount' }
        case 8:
          return { type: 'Allocate' }
        case 9:
          return { type: 'AllocateWithSeed' }
        case 10:
          return { type: 'AssignWithSeed' }
        case 11:
          return { type: 'TransferWithSeed' }
        default:
          return { type: 'Unknown', instruction }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to decode system program instruction: ${errorMessage}`), {
        category: 'TRANSACTION_DECODER',
        context: { data: data.substring(0, 100) },
        severity: 'low'
      })
      return { type: 'Unknown', error: 'Failed to decode' }
    }
  }

  private decodeTokenProgramInstruction(data: string): any {
    try {
      const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0))
      if (bytes.length === 0) return { type: 'unknown' }
      
      const instruction = bytes[0]
      
      switch (instruction) {
        case 0:
          return { type: 'InitializeMint' }
        case 1:
          return { type: 'InitializeAccount' }
        case 2:
          return { type: 'InitializeMultisig' }
        case 3:
          return { type: 'Transfer', amount: bytes.length >= 9 ? new DataView(bytes.buffer).getBigUint64(1, true) : 0 }
        case 4:
          return { type: 'Approve' }
        case 5:
          return { type: 'Revoke' }
        case 6:
          return { type: 'SetAuthority' }
        case 7:
          return { type: 'MintTo' }
        case 8:
          return { type: 'Burn' }
        case 9:
          return { type: 'CloseAccount' }
        case 10:
          return { type: 'FreezeAccount' }
        case 11:
          return { type: 'ThawAccount' }
        case 12:
          return { type: 'TransferChecked' }
        case 13:
          return { type: 'ApproveChecked' }
        case 14:
          return { type: 'MintToChecked' }
        case 15:
          return { type: 'BurnChecked' }
        case 16:
          return { type: 'InitializeAccount2' }
        case 17:
          return { type: 'SyncNative' }
        case 18:
          return { type: 'InitializeAccount3' }
        case 19:
          return { type: 'InitializeMultisig2' }
        case 20:
          return { type: 'InitializeMint2' }
        default:
          return { type: 'Unknown', instruction }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to decode token program instruction: ${errorMessage}`), {
        category: 'TRANSACTION_DECODER',
        context: { data: data.substring(0, 100) },
        severity: 'low'
      })
      return { type: 'Unknown', error: 'Failed to decode' }
    }
  }

  private getInstructionType(programId: PublicKey): string {
    const programIdString = programId.toString()
    
    switch (programIdString) {
      case '11111111111111111111111111111111':
        return 'System Program'
      case 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA':
        return 'Token Program'
      case 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL':
        return 'Associated Token Program'
      case 'BPFLoaderUpgradeab1e11111111111111111111111':
        return 'BPF Loader'
      case 'Vote111111111111111111111111111111111111111':
        return 'Vote Program'
      case 'Stake11111111111111111111111111111111111111':
        return 'Stake Program'
      default:
        return 'Unknown Program'
    }
  }

  async getAccountInfo(address: string): Promise<AccountInfo | null> {
    try {
      return await withBlockchainRetry(async () => {
        const publicKey = new PublicKey(address)
        const accountInfo = await eclipseRPCService.getAccountInfo(publicKey)
        
        if (!accountInfo) {
          return null
        }

        return {
          address,
          balance: accountInfo.lamports,
          owner: accountInfo.owner.toString(),
          executable: accountInfo.executable,
          rentEpoch: accountInfo.rentEpoch || 0,
          data: accountInfo.data ? {
            program: accountInfo.owner.toString(),
            space: accountInfo.data.length,
            parsed: await this.parseAccountData(accountInfo.data, accountInfo.owner),
          } : undefined,
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to get account info: ${errorMessage}`), {
        category: 'TRANSACTION_DECODER',
        context: { address },
        severity: 'medium'
      })
      toastService.showError('Failed to fetch account information')
      throw error
    }
  }

  private async parseAccountData(data: Buffer, owner: PublicKey): Promise<any> {
    try {
      const ownerString = owner.toString()
      
      if (ownerString === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        return this.parseTokenAccountData(data)
      }
      
      return { raw: data.toString('base64') }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to parse account data: ${errorMessage}`), {
        category: 'TRANSACTION_DECODER',
        context: { owner: owner.toString(), dataLength: data.length },
        severity: 'low'
      })
      return { raw: data.toString('base64'), error: 'Failed to parse' }
    }
  }

  private parseTokenAccountData(data: Buffer): any {
    if (data.length < 165) {
      return { error: 'Invalid token account data length' }
    }

    try {
      const mint = new PublicKey(data.slice(0, 32))
      const owner = new PublicKey(data.slice(32, 64))
      const amount = data.readBigUInt64LE(64)
      const delegateOption = data.readUInt32LE(72)
      const delegate = delegateOption === 0 ? null : new PublicKey(data.slice(76, 108))
      const state = data.readUInt8(108)
      const isNativeOption = data.readUInt32LE(109)
      const isNative = isNativeOption === 0 ? null : data.readBigUInt64LE(113)
      const delegatedAmount = data.readBigUInt64LE(121)
      const closeAuthorityOption = data.readUInt32LE(129)
      const closeAuthority = closeAuthorityOption === 0 ? null : new PublicKey(data.slice(133, 165))

      return {
        mint: mint.toString(),
        owner: owner.toString(),
        amount: amount.toString(),
        delegate: delegate?.toString(),
        state: ['Uninitialized', 'Initialized', 'Frozen'][state] || 'Unknown',
        isNative: isNative?.toString(),
        delegatedAmount: delegatedAmount.toString(),
        closeAuthority: closeAuthority?.toString(),
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to parse token account data: ${errorMessage}`), {
        category: 'TRANSACTION_DECODER',
        context: { dataLength: data.length },
        severity: 'low'
      })
      return { error: 'Failed to parse token account data' }
    }
  }

  async searchTransactions(
    address: string,
    options?: {
      limit?: number
      before?: string
      until?: string
    }
  ) {
    try {
      return await withBlockchainRetry(async () => {
        const publicKey = new PublicKey(address)
        const signatures = await eclipseRPCService.getSignaturesForAddress(publicKey, options)
        
        return signatures.map(sig => ({
          signature: sig.signature,
          slot: sig.slot || 0,
          blockTime: sig.blockTime || 0,
          fee: 0, // Fee is not available in signature info
          success: sig.err === null,
          accounts: [], // This would need to be populated by fetching each transaction
        }))
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errorLogger.logError(new Error(`Failed to search transactions: ${errorMessage}`), {
        category: 'TRANSACTION_DECODER',
        context: { address, options },
        severity: 'medium'
      })
      toastService.showError('Failed to search transactions')
      throw error
    }
  }
}

export const transactionDecoderService = new TransactionDecoderService()