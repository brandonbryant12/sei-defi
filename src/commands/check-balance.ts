#!/usr/bin/env node

import { SeiClient } from '../utils/sei-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Command to check SEI wallet balance
 * Usage: npm run check-balance <address>
 * Usage: npm run check-balance (uses WALLET_ADDRESS from .env)
 */
async function main() {
  try {
    // Get address from command line argument or environment variable
    const address = process.argv[2] || process.env.WALLET_ADDRESS;
    
    if (!address) {
      console.error('❌ Error: No wallet address provided');
      console.log('Usage: npm run check-balance <sei-address>');
      console.log('   or: Set WALLET_ADDRESS in .env file');
      console.log('');
      console.log('Example: npm run check-balance sei1abc123...');
      process.exit(1);
    }

    // Validate address format (basic check)
    if (!address.startsWith('sei1') || address.length < 20) {
      console.error('❌ Error: Invalid SEI address format');
      console.log('SEI addresses should start with "sei1"');
      process.exit(1);
    }

    console.log(`💰 Checking balance for: ${address}\n`);
    
    // Connect to SEI network
    const client = new SeiClient(process.env.SEI_RPC_URL);
    await client.connect();
    
    const chainId = await client.getChainId();
    const height = await client.getHeight();
    
    console.log(`Network: ${chainId} (Block ${height})`);
    console.log('='.repeat(50));
    
    // Get balance information
    const balanceInfo = await client.getBalances(address);
    
    // Display SEI balance prominently
    console.log(`🪙  SEI Balance: ${balanceInfo.totalSEI} SEI`);
    
    // Display all token balances
    if (balanceInfo.balances.length === 0) {
      console.log('📝 No tokens found in this wallet');
    } else {
      console.log('\n📊 All Token Balances:');
      balanceInfo.balances.forEach(balance => {
        const denom = balance.denom;
        const amount = balance.amount;
        
        if (denom === 'usei') {
          // Already displayed above
          console.log(`   • ${denom}: ${amount} (${balanceInfo.totalSEI} SEI)`);
        } else {
          // Other tokens
          console.log(`   • ${denom}: ${amount}`);
        }
      });
    }
    
    // Show helpful information
    console.log('\n💡 Tips:');
    if (parseFloat(balanceInfo.totalSEI) === 0) {
      console.log('• This wallet has no SEI balance');
      console.log('• You can fund it from an exchange or faucet');
      console.log('• SEI is needed for transaction fees');
    } else {
      console.log('• SEI is the native token for transaction fees');
      console.log('• You can stake SEI to earn rewards');
      console.log('• Use DeFi protocols like DragonSwap and Silo for yield');
    }
    
    await client.disconnect();
    
  } catch (error) {
    console.error('❌ Error checking balance:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}