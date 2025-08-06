#!/usr/bin/env node

import { createWallet } from '../utils/wallet.js';
import { SeiClient } from '../utils/sei-client.js';

/**
 * Command to create a new SEI wallet
 * Usage: npm run create-wallet
 */
async function main() {
  try {
    console.log('🔐 Creating new SEI wallet...\n');
    
    // Create new wallet
    const walletInfo = await createWallet();
    
    // Try to connect to SEI network for verification (optional)
    let networkInfo = '';
    try {
      const client = new SeiClient();
      await client.connect();
      const chainId = await client.getChainId();
      const height = await client.getHeight();
      networkInfo = `Network: ${chainId} (Block ${height})`;
      await client.disconnect();
    } catch (error) {
      networkInfo = 'Network: Unable to connect (wallet created offline)';
    }
    
    // Display wallet information
    console.log('✅ SEI Wallet Created Successfully!');
    console.log('='.repeat(50));
    console.log(networkInfo);
    console.log('');
    console.log(`Address: ${walletInfo.address}`);
    console.log('');
    console.log('Mnemonic (24 words):');
    console.log(`${walletInfo.mnemonic}`);
    console.log('');
    console.log(`Private Key: ${walletInfo.privateKey}`);
    console.log('');
    console.log('⚠️  SECURITY WARNING:');
    console.log('• Store your mnemonic phrase securely and offline');
    console.log('• Never share your private key or mnemonic with anyone');
    console.log('• Consider using a hardware wallet for large amounts');
    console.log('• This wallet starts with 0 SEI balance');
    console.log('');
    console.log('💰 To check balance: npm run check-balance <address>');
    console.log(`💰 Example: npm run check-balance ${walletInfo.address}`);
    
  } catch (error) {
    console.error('❌ Error creating wallet:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}