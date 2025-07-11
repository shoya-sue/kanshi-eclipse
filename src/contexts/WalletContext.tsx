import React, { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  MathWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

interface WalletContextProviderProps {
  children: React.ReactNode
}

export const WalletContextProvider: React.FC<WalletContextProviderProps> = ({ children }) => {
  // Use Eclipse mainnet endpoint instead of Solana
  const endpoint = useMemo(() => {
    return process.env.VITE_ECLIPSE_RPC_URL || 'https://mainnetbeta-rpc.eclipse.xyz'
  }, [])

  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new MathWalletAdapter(),
  ], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}