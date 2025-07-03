import { useState, useEffect } from 'react';

// UTXO interface
export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey?: string;
}

// Bitcoin wallet types
export interface BitcoinWallet {
  name: string;
  icon?: string;
  connect: () => Promise<string[]>;
  disconnect: () => Promise<void>;
  signMessage: (message: string, address: string) => Promise<string>;
  signPsbt: (psbt: string) => Promise<string>;
  getAccounts: () => Promise<string[]>;
  getNetwork: () => Promise<'mainnet' | 'testnet' | 'regtest'>;
  getPublicKey: () => Promise<string>;
  getUtxos?: (address: string) => Promise<UTXO[]>;
  getBalance?: () => Promise<number>;
  getPrivateKey?: () => Promise<string>;
}

// Private key management interface
export interface PrivateKeyManager {
  setPrivateKey: (privateKey: string) => void;
  getPrivateKey: () => string | null;
  clearPrivateKey: () => void;
  hasPrivateKey: () => boolean;
  validatePrivateKey: (privateKey: string) => boolean;
}

// Wallet connection state
export interface WalletState {
  connected: boolean;
  address: string | null;
  publicKey: string | null;
  network: 'mainnet' | 'testnet' | 'regtest' | null;
  wallet: BitcoinWallet | null;
  balance: number;
}

// Unisat wallet integration
class UnisatWallet implements BitcoinWallet {
  name = 'Unisat';
  icon = '/wallets/unisat.png';

  async connect(): Promise<string[]> {
    if (typeof window === 'undefined' || !window.unisat) {
      throw new Error('Unisat wallet not found. Please install Unisat extension.');
    }

    try {
      const accounts = await window.unisat.requestAccounts();
      return accounts;
    } catch (error) {
      throw new Error('Failed to connect to Unisat wallet');
    }
  }

  async disconnect(): Promise<void> {
    // Unisat doesn't have a disconnect method, but we can clear local state
    return Promise.resolve();
  }

  async signMessage(message: string, address: string): Promise<string> {
    if (!window.unisat) {
      throw new Error('Unisat wallet not found');
    }
    return await window.unisat.signMessage(message, address);
  }

  async signPsbt(psbt: string): Promise<string> {
    if (!window.unisat) {
      throw new Error('Unisat wallet not found');
    }
    return await window.unisat.signPsbt(psbt);
  }

  async getAccounts(): Promise<string[]> {
    if (!window.unisat) {
      throw new Error('Unisat wallet not found');
    }
    return await window.unisat.getAccounts();
  }

  async getNetwork(): Promise<'mainnet' | 'testnet' | 'regtest'> {
    if (!window.unisat) {
      throw new Error('Unisat wallet not found');
    }
    const network = await window.unisat.getNetwork();
    return network as 'mainnet' | 'testnet' | 'regtest';
  }

  async getPublicKey(): Promise<string> {
    if (!window.unisat) {
      throw new Error('Unisat wallet not found');
    }
    return await window.unisat.getPublicKey();
  }

  async getBalance(): Promise<number> {
    if (!window.unisat) {
      throw new Error('Unisat wallet not found');
    }
    const balance = await window.unisat.getBalance();
    return balance.total;
  }

  async getUtxos(address: string): Promise<UTXO[]> {
    if (!window.unisat) {
      throw new Error('Unisat wallet not found');
    }
    // Unisat doesn't have a direct getUtxos method, so we'll use a fallback
    return await fetchUtxosFromAPI(address);
  }
}

// OKX wallet integration
class OKXWallet implements BitcoinWallet {
  name = 'OKX';
  icon = '/wallets/okx.png';

  async connect(): Promise<string[]> {
    if (typeof window === 'undefined' || !window.okxwallet?.bitcoin) {
      throw new Error('OKX wallet not found. Please install OKX extension.');
    }

    try {
      const accounts = await window.okxwallet.bitcoin.requestAccounts();
      return accounts;
    } catch (error) {
      throw new Error('Failed to connect to OKX wallet');
    }
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async signMessage(message: string, address: string): Promise<string> {
    if (!window.okxwallet?.bitcoin) {
      throw new Error('OKX wallet not found');
    }
    return await window.okxwallet.bitcoin.signMessage(message, address);
  }

  async signPsbt(psbt: string): Promise<string> {
    if (!window.okxwallet?.bitcoin) {
      throw new Error('OKX wallet not found');
    }
    return await window.okxwallet.bitcoin.signPsbt(psbt);
  }

  async getAccounts(): Promise<string[]> {
    if (!window.okxwallet?.bitcoin) {
      throw new Error('OKX wallet not found');
    }
    return await window.okxwallet.bitcoin.getAccounts();
  }

  async getNetwork(): Promise<'mainnet' | 'testnet' | 'regtest'> {
    if (!window.okxwallet?.bitcoin) {
      throw new Error('OKX wallet not found');
    }
    const network = await window.okxwallet.bitcoin.getNetwork();
    return network as 'mainnet' | 'testnet' | 'regtest';
  }

  async getPublicKey(): Promise<string> {
    if (!window.okxwallet?.bitcoin) {
      throw new Error('OKX wallet not found');
    }
    return await window.okxwallet.bitcoin.getPublicKey();
  }

  async getBalance(): Promise<number> {
    // OKX doesn't have a direct balance method, use API fallback
    const accounts = await this.getAccounts();
    if (accounts.length === 0) throw new Error('No accounts found');
    return await fetchBalanceFromAPI(accounts[0]);
  }

  async getUtxos(address: string): Promise<UTXO[]> {
    return await fetchUtxosFromAPI(address);
  }
}

// Available wallets
export const AVAILABLE_WALLETS: BitcoinWallet[] = [
  new UnisatWallet(),
  new OKXWallet(),
];

// Utility functions
export const detectWallets = (): BitcoinWallet[] => {
  if (typeof window === 'undefined') return [];
  
  const detected: BitcoinWallet[] = [];
  
  if (window.unisat) {
    detected.push(new UnisatWallet());
  }
  
  if (window.okxwallet?.bitcoin) {
    detected.push(new OKXWallet());
  }
  
  return detected;
};

export const formatAddress = (address: string, length = 8): string => {
  if (!address) return '';
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

export const formatBalance = (balance: number): string => {
  return (balance / 100000000).toFixed(8); // Convert satoshis to BTC
};

// Wallet storage utilities
export const saveWalletConnection = (walletName: string, address: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('wallet_connection', JSON.stringify({ walletName, address }));
  }
};

export const getSavedWalletConnection = (): { walletName: string; address: string } | null => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('wallet_connection');
    return saved ? JSON.parse(saved) : null;
  }
  return null;
};

export const clearWalletConnection = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wallet_connection');
  }
};

// Private key management utilities
class PrivateKeyManagerImpl implements PrivateKeyManager {
  private privateKey: string | null = null;
  private readonly STORAGE_KEY = 'temp_private_key';

  setPrivateKey(privateKey: string): void {
    if (!this.validatePrivateKey(privateKey)) {
      throw new Error('Invalid private key format');
    }
    this.privateKey = privateKey;
    // Optionally store in sessionStorage for temporary use
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.STORAGE_KEY, privateKey);
    }
  }

  getPrivateKey(): string | null {
    if (this.privateKey) {
      return this.privateKey;
    }
    // Try to get from sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored && this.validatePrivateKey(stored)) {
        this.privateKey = stored;
        return stored;
      }
    }
    return null;
  }

  clearPrivateKey(): void {
    this.privateKey = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }

  hasPrivateKey(): boolean {
    return this.getPrivateKey() !== null;
  }

  validatePrivateKey(privateKey: string): boolean {
    if (!privateKey || typeof privateKey !== 'string') {
      return false;
    }
    
    // WIF format validation
    // Mainnet: starts with 5, K, or L (51 chars)
    // Testnet: starts with 9 or c (51 chars)
    const wifRegex = /^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$|^[9c][1-9A-HJ-NP-Za-km-z]{49,50}$/;
    return wifRegex.test(privateKey.trim());
  }
}

// Export singleton instance
export const privateKeyManager = new PrivateKeyManagerImpl();

// Utility functions for private key operations
export const validateWIFPrivateKey = (privateKey: string): boolean => {
  return privateKeyManager.validatePrivateKey(privateKey);
};

export const setTemporaryPrivateKey = (privateKey: string): void => {
  privateKeyManager.setPrivateKey(privateKey);
};

export const getTemporaryPrivateKey = (): string | null => {
  return privateKeyManager.getPrivateKey();
};

export const clearTemporaryPrivateKey = (): void => {
  privateKeyManager.clearPrivateKey();
};

export const hasTemporaryPrivateKey = (): boolean => {
  return privateKeyManager.hasPrivateKey();
};

// Bitcoin API utilities for UTXO fetching
export const fetchUtxosFromAPI = async (address: string): Promise<UTXO[]> => {
  console.log('Fetching UTXOs for address:', address);
  
  try {
    // First try to get address info from local ORC API
    try {
      const API_BASE_URL = 'https://orc-backend-production.up.railway.app/api/v1';
      const orcResponse = await fetch(`${API_BASE_URL}/address/${address}`);
      if (orcResponse.ok) {
        const orcData = await orcResponse.json();
        console.log('ORC API response for address:', orcData);
        
        // If the address exists in ORC database, we still need UTXOs from blockchain
        // Continue to external API call
      }
    } catch (orcError) {
      console.log('ORC API not available or address not found, continuing with external API');
    }
    
    // Use mempool.space API for all networks
    const isTestnet = address.startsWith('tb1') || address.startsWith('2') || address.startsWith('m') || address.startsWith('n');
    const isTestnet4 = address.startsWith('ms');
    
    let baseUrl;
     if (isTestnet4) {
       baseUrl = 'https://mempool.space/testnet4/api';
     } else if (isTestnet) {
       baseUrl = 'https://mempool.space/testnet/api';
     } else {
       baseUrl = 'https://mempool.space/api';
     }
    
    console.log('Fetching UTXOs from:', `${baseUrl}/address/${address}/utxo`);
    
    const response = await fetch(`${baseUrl}/address/${address}/utxo`);
    console.log('Mempool API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mempool API error response:', errorText);
      throw new Error(`Failed to fetch UTXOs: ${response.status} ${response.statusText}`);
    }
    
    const utxos = await response.json();
    console.log('Raw UTXOs from Mempool:', utxos);
    
    const mappedUtxos = utxos.map((utxo: any) => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
      scriptPubKey: utxo.scriptpubkey
    }));
    
    console.log('Mapped UTXOs:', mappedUtxos);
    return mappedUtxos;
  } catch (error) {
    console.error('Error fetching UTXOs:', error);
    
    // Return mock UTXOs for testing if we're in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning mock UTXOs for development');
      return [
        {
          txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          vout: 0,
          value: 100000, // 0.001 BTC
          scriptPubKey: '76a914' + '0'.repeat(40) + '88ac'
        },
        {
          txid: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
          vout: 1,
          value: 50000, // 0.0005 BTC
          scriptPubKey: '76a914' + '1'.repeat(40) + '88ac'
        }
      ];
    }
    
    return [];
  }
};

export const fetchBalanceFromAPI = async (address: string): Promise<number> => {
  try {
    const isTestnet = address.startsWith('tb1') || address.startsWith('2') || address.startsWith('m') || address.startsWith('n');
    const isTestnet4 = address.startsWith('ms');
    
    let baseUrl;
     if (isTestnet4) {
       baseUrl = 'https://mempool.space/testnet4/api';
     } else if (isTestnet) {
       baseUrl = 'https://mempool.space/testnet/api';
     } else {
       baseUrl = 'https://mempool.space/api';
     }
    
    const response = await fetch(`${baseUrl}/address/${address}`);
    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }
    
    const data = await response.json();
    return data.chain_stats.funded_txo_sum;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
};

// Estimate fee rate (simplified)
export const estimateFeeRate = async (): Promise<number> => {
  try {
    const response = await fetch('https://mempool.space/api/v1/fees/recommended');
    if (!response.ok) {
      return 10; // Default fee rate
    }
    
    const feeEstimates = await response.json();
    // Use hourFee (1 hour confirmation target)
    return Math.ceil(feeEstimates.hourFee || 10);
  } catch (error) {
    console.error('Error estimating fee rate:', error);
    return 10; // Default fee rate
  }
};

// Declare global window extensions
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
    okxwallet?: {
      bitcoin?: {
        requestAccounts: () => Promise<string[]>;
        getAccounts: () => Promise<string[]>;
        getNetwork: () => Promise<string>;
        getPublicKey: () => Promise<string>;
        signMessage: (message: string, address: string) => Promise<string>;
        signPsbt: (psbt: string) => Promise<string>;
      };
    };
  }
}