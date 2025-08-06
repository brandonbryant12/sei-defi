import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

export interface WalletInfo {
  address: string;
  mnemonic: string;
  privateKey: string;
}

/**
 * Generate a new SEI wallet with mnemonic and address
 */
export async function createWallet(): Promise<WalletInfo> {
  try {
    // Generate 24-word mnemonic
    const mnemonic = generateMnemonic(256);
    
    // Create wallet from mnemonic with SEI prefix
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: 'sei',
    });
    
    // Get the first account
    const [account] = await wallet.getAccounts();
    
    // Get private key (for display purposes only - handle securely in production)
    const seed = mnemonicToSeedSync(mnemonic);
    const privateKey = seed.toString('hex').slice(0, 64);
    
    return {
      address: account.address,
      mnemonic,
      privateKey,
    };
  } catch (error) {
    throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Restore wallet from mnemonic
 */
export async function restoreWallet(mnemonic: string): Promise<DirectSecp256k1HdWallet> {
  try {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: 'sei',
    });
    
    return wallet;
  } catch (error) {
    throw new Error(`Failed to restore wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get address from mnemonic
 */
export async function getAddressFromMnemonic(mnemonic: string): Promise<string> {
  const wallet = await restoreWallet(mnemonic);
  const [account] = await wallet.getAccounts();
  return account.address;
}