'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  BitcoinWallet,
  WalletState,
  detectWallets,
  saveWalletConnection,
  getSavedWalletConnection,
  clearWalletConnection,
  AVAILABLE_WALLETS,
  privateKeyManager,
  setTemporaryPrivateKey,
  getTemporaryPrivateKey,
  clearTemporaryPrivateKey,
  hasTemporaryPrivateKey,
  validateWIFPrivateKey
} from '@/utils/wallet';

// Wallet actions
type WalletAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: { wallet: BitcoinWallet; address: string; publicKey: string; network: 'mainnet' | 'testnet' | 'regtest' } }
  | { type: 'SET_DISCONNECTED' }
  | { type: 'SET_BALANCE'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null };

// Extended wallet state
interface ExtendedWalletState extends WalletState {
  loading: boolean;
  error: string | null;
}

// Wallet context type
interface WalletContextType {
  state: ExtendedWalletState;
  connect: (wallet: BitcoinWallet) => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signPsbt: (psbt: string) => Promise<string>;
  getAvailableWallets: () => BitcoinWallet[];
  refreshBalance: () => Promise<void>;
  // Private key management
  setPrivateKey: (privateKey: string) => void;
  getPrivateKey: () => string | null;
  clearPrivateKey: () => void;
  hasPrivateKey: () => boolean;
  validatePrivateKey: (privateKey: string) => boolean;
}

// Initial state
const initialState: ExtendedWalletState = {
  connected: false,
  address: null,
  publicKey: null,
  network: null,
  wallet: null,
  balance: 0,
  loading: false,
  error: null,
};

// Wallet reducer
const walletReducer = (state: ExtendedWalletState, action: WalletAction): ExtendedWalletState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: null };
    case 'SET_CONNECTED':
      return {
        ...state,
        connected: true,
        wallet: action.payload.wallet,
        address: action.payload.address,
        publicKey: action.payload.publicKey,
        network: action.payload.network,
        loading: false,
        error: null,
      };
    case 'SET_DISCONNECTED':
      return {
        ...initialState,
        loading: false,
      };
    case 'SET_BALANCE':
      return { ...state, balance: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Wallet provider component
export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // Connect to wallet
  const connect = async (wallet: BitcoinWallet) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const accounts = await wallet.connect();
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      const publicKey = await wallet.getPublicKey();
      const network = await wallet.getNetwork();

      dispatch({
        type: 'SET_CONNECTED',
        payload: { wallet, address, publicKey, network },
      });

      // Save connection to localStorage
      saveWalletConnection(wallet.name, address);

      // Get initial balance
      await refreshBalance();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    try {
      if (state.wallet) {
        await state.wallet.disconnect();
      }
      clearWalletConnection();
      dispatch({ type: 'SET_DISCONNECTED' });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // Still disconnect locally even if wallet disconnect fails
      clearWalletConnection();
      dispatch({ type: 'SET_DISCONNECTED' });
    }
  };

  // Sign message
  const signMessage = async (message: string): Promise<string> => {
    if (!state.wallet || !state.address) {
      throw new Error('Wallet not connected');
    }
    return await state.wallet.signMessage(message, state.address);
  };

  // Sign PSBT
  const signPsbt = async (psbt: string): Promise<string> => {
    if (!state.wallet) {
      throw new Error('Wallet not connected');
    }
    return await state.wallet.signPsbt(psbt);
  };

  // Get available wallets
  const getAvailableWallets = (): BitcoinWallet[] => {
    return detectWallets();
  };

  // Refresh balance
  const refreshBalance = async () => {
    if (!state.wallet || !state.connected) {
      return;
    }

    try {
      // For Unisat wallet, we can get balance directly
      if (state.wallet.name === 'Unisat' && window.unisat) {
        const balance = await window.unisat.getBalance();
        dispatch({ type: 'SET_BALANCE', payload: balance.total });
      }
      // For other wallets, we might need to use a different approach
      // or integrate with a Bitcoin API service
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  // Private key management methods
  const setPrivateKey = (privateKey: string): void => {
    try {
      setTemporaryPrivateKey(privateKey);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid private key';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const getPrivateKey = (): string | null => {
    return getTemporaryPrivateKey();
  };

  const clearPrivateKey = (): void => {
    clearTemporaryPrivateKey();
  };

  const hasPrivateKey = (): boolean => {
    return hasTemporaryPrivateKey();
  };

  const validatePrivateKey = (privateKey: string): boolean => {
    return validateWIFPrivateKey(privateKey);
  };

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      const savedConnection = getSavedWalletConnection();
      if (!savedConnection) return;

      const availableWallets = detectWallets();
      const wallet = availableWallets.find(w => w.name === savedConnection.walletName);
      
      if (wallet) {
        try {
          const accounts = await wallet.getAccounts();
          if (accounts.includes(savedConnection.address)) {
            await connect(wallet);
          } else {
            // Clear saved connection if account is no longer available
            clearWalletConnection();
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
          clearWalletConnection();
        }
      }
    };

    autoConnect();
  }, []);

  // Listen for account changes
  useEffect(() => {
    const handleAccountsChanged = async () => {
      if (state.connected && state.wallet) {
        try {
          const accounts = await state.wallet.getAccounts();
          if (accounts.length === 0 || !accounts.includes(state.address!)) {
            await disconnect();
          }
        } catch (error) {
          console.error('Error handling account change:', error);
          await disconnect();
        }
      }
    };

    // Listen for Unisat account changes
    if (typeof window !== 'undefined' && window.unisat) {
      window.unisat.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (typeof window !== 'undefined' && window.unisat) {
        window.unisat.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [state.connected, state.wallet, state.address]);

  const contextValue: WalletContextType = {
    state,
    connect,
    disconnect,
    signMessage,
    signPsbt,
    getAvailableWallets,
    refreshBalance,
    setPrivateKey,
    getPrivateKey,
    clearPrivateKey,
    hasPrivateKey,
    validatePrivateKey,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Hook to use wallet context
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Extend window type for event listeners
declare global {
  interface Window {
    unisat?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      getNetwork: () => Promise<string>;
      getPublicKey: () => Promise<string>;
      getBalance: () => Promise<{ total: number; confirmed: number; unconfirmed: number }>;
      signMessage: (message: string, address: string) => Promise<string>;
      signPsbt: (psbt: string) => Promise<string>;
      on: (event: string, callback: () => void) => void;
      removeListener: (event: string, callback: () => void) => void;
    };
  }
}