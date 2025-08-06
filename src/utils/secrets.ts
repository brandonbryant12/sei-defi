/**
 * Utility functions for accessing stored wallet credentials
 * These functions work with GitHub Actions secrets and environment variables
 */

export interface WalletCredentials {
  address: string;
  privateKey?: string;
  mnemonic?: string;
}

/**
 * Get wallet credentials from environment variables (GitHub Actions)
 */
export function getWalletCredentials(): WalletCredentials {
  const address = process.env.SEI_WALLET_ADDRESS;
  const privateKey = process.env.SEI_WALLET_PRIVATE_KEY;
  const mnemonic = process.env.SEI_WALLET_MNEMONIC;

  if (!address) {
    throw new Error('SEI_WALLET_ADDRESS environment variable is required');
  }

  return {
    address,
    privateKey,
    mnemonic,
  };
}

/**
 * Get wallet address only (safe for logging)
 */
export function getWalletAddress(): string {
  const address = process.env.SEI_WALLET_ADDRESS;
  
  if (!address) {
    throw new Error('SEI_WALLET_ADDRESS environment variable is required');
  }

  return address;
}

/**
 * Check if wallet credentials are available
 */
export function hasWalletCredentials(): boolean {
  return !!(process.env.SEI_WALLET_ADDRESS);
}

/**
 * Validate wallet credentials format
 */
export function validateWalletCredentials(credentials: WalletCredentials): boolean {
  // Check address format (should start with 'sei1')
  if (!credentials.address.startsWith('sei1')) {
    return false;
  }

  // Check private key format (should be 64 hex characters)
  if (credentials.privateKey && !/^[a-fA-F0-9]{64}$/.test(credentials.privateKey)) {
    return false;
  }

  // Check mnemonic format (should be 12 or 24 words)
  if (credentials.mnemonic) {
    const words = credentials.mnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      return false;
    }
  }

  return true;
}