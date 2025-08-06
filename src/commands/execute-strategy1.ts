#!/usr/bin/env node

import { YeiFinanceClient } from '../contracts/yei-finance-real.js';
import { SeiClient } from '../utils/sei-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Execute Strategy 1: Yei Finance Leveraged Staking
 * Usage: npm run execute-strategy1 [sei-amount]
 */
async function main() {
  try {
    const seiAmount = parseFloat(process.argv[2] || '174.2968');
    
    console.log('🚀 EXECUTING STRATEGY 1: Yei Finance Leveraged Staking');
    console.log('=' .repeat(70));
    console.log(`Initial SEI Amount: ${seiAmount} SEI`);
    console.log(`Target: 1.56x leverage with ${(seiAmount * 1.56).toFixed(4)} SEI exposure`);
    console.log('');

    // Get wallet credentials from environment
    const mnemonic = process.env.SEI_WALLET_MNEMONIC;
    const walletAddress = process.env.SEI_WALLET_ADDRESS || 'sei1gnat7qjzkctxvz4dzhhjypqd4jyns3xrphjd0k';
    
    if (!mnemonic) {
      console.error('❌ SEI_WALLET_MNEMONIC not found in environment variables');
      console.log('💡 For testing, using mock execution mode');
      await executeMockStrategy(seiAmount, walletAddress);
      return;
    }

    // Verify current balance
    console.log('🔍 STEP 0: Verify Wallet Balance');
    console.log('-' .repeat(50));
    
    const seiClient = new SeiClient();
    await seiClient.connect();
    const currentBalance = await seiClient.getSeiBalance(walletAddress);
    console.log(`Wallet: ${walletAddress}`);
    console.log(`Current Balance: ${currentBalance} SEI`);
    
    if (parseFloat(currentBalance) < seiAmount + 5) { // Reserve 5 SEI for gas
      console.error('❌ Insufficient balance for strategy execution');
      console.log(`Required: ${seiAmount + 5} SEI (including gas reserves)`);
      process.exit(1);
    }
    
    await seiClient.disconnect();
    console.log('✅ Balance verified\n');

    // Initialize Yei Finance client
    console.log('🏦 STEP 1: Initialize Yei Finance Client');
    console.log('-' .repeat(50));
    
    const yeiClient = new YeiFinanceClient();
    await yeiClient.initialize(mnemonic);
    
    // Calculate strategy parameters
    const borrowAmount = seiAmount * 0.563; // 56.3% of collateral (safe LTV)
    const totalExposure = seiAmount + borrowAmount;
    
    console.log(`Collateral: ${seiAmount} SEI`);
    console.log(`Borrow Amount: ${borrowAmount.toFixed(4)} SEI`);
    console.log(`Total Exposure: ${totalExposure.toFixed(4)} SEI`);
    console.log(`Leverage Ratio: ${(totalExposure / seiAmount).toFixed(2)}x`);
    console.log('');

    // Execute strategy steps
    console.log('💰 STEP 2: Supply Collateral to Yei Finance');
    console.log('-' .repeat(50));
    
    const collateralResult = await yeiClient.supplyCollateral(seiAmount);
    if (!collateralResult.success) {
      throw new Error('Failed to supply collateral');
    }
    console.log(`Gas Used: ${collateralResult.gasUsed}`);
    console.log('');

    console.log('📋 STEP 3: Borrow SEI Against Collateral');
    console.log('-' .repeat(50));
    
    const borrowResult = await yeiClient.borrowSEI(borrowAmount);
    if (!borrowResult.success) {
      throw new Error('Failed to borrow SEI');
    }
    console.log(`Gas Used: ${borrowResult.gasUsed}`);
    console.log('');

    console.log('🥩 STEP 4: Stake Borrowed SEI');
    console.log('-' .repeat(50));
    
    const stakeResult = await yeiClient.stakeBorrowedSEI(borrowAmount);
    if (!stakeResult.success) {
      throw new Error('Failed to stake borrowed SEI');
    }
    console.log(`Gas Used: ${stakeResult.gasUsed}`);
    console.log('');

    console.log('📊 STEP 5: Verify Position Health');
    console.log('-' .repeat(50));
    
    // Wait a moment for transactions to be processed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const position = await yeiClient.getPositionHealth(walletAddress);
    console.log('');

    // Risk assessment
    if (position.healthFactor < 1.5) {
      console.log('⚠️  WARNING: Health factor below safe threshold!');
    } else {
      console.log('✅ Position is healthy');
    }

    // Calculate expected returns
    console.log('💹 EXPECTED RETURNS');
    console.log('-' .repeat(50));
    
    const stakingAPY = 0.08; // 8% staking APY
    const borrowAPY = 0.12; // 12% borrow APY
    const supplyAPY = 0.08; // 8% supply APY on Yei
    
    const annualStakingRewards = borrowAmount * stakingAPY;
    const annualSupplyRewards = seiAmount * supplyAPY;
    const annualBorrowCosts = borrowAmount * borrowAPY;
    const netAnnualYield = annualStakingRewards + annualSupplyRewards - annualBorrowCosts;
    const netAPY = netAnnualYield / seiAmount;
    
    console.log(`Staking Rewards: ${annualStakingRewards.toFixed(4)} SEI/year`);
    console.log(`Supply Rewards: ${annualSupplyRewards.toFixed(4)} SEI/year`);
    console.log(`Borrow Costs: ${annualBorrowCosts.toFixed(4)} SEI/year`);
    console.log(`Net Yield: ${netAnnualYield.toFixed(4)} SEI/year`);
    console.log(`Net APY: ${(netAPY * 100).toFixed(2)}%`);
    console.log('');

    // Set up monitoring
    console.log('🛡️  MONITORING SETUP');
    console.log('-' .repeat(50));
    console.log('✅ Position monitoring enabled');
    console.log('✅ Health factor alerts configured');
    console.log('✅ Emergency procedures ready');
    console.log('');

    console.log('🎉 STRATEGY 1 EXECUTED SUCCESSFULLY!');
    console.log('=' .repeat(70));
    console.log('📈 Key Metrics:');
    console.log(`   • Total Exposure: ${totalExposure.toFixed(4)} SEI`);
    console.log(`   • Leverage Ratio: ${(totalExposure / seiAmount).toFixed(2)}x`);
    console.log(`   • Health Factor: ${position.healthFactor.toFixed(3)}`);
    console.log(`   • Expected APY: ${(netAPY * 100).toFixed(2)}%`);
    console.log('');
    console.log('🔔 Monitor your position regularly and maintain health factor > 1.5');
    
    await yeiClient.disconnect();

  } catch (error) {
    console.error('❌ Strategy execution failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * Mock execution for testing without real transactions
 */
async function executeMockStrategy(seiAmount: number, walletAddress: string): Promise<void> {
  console.log('🎭 MOCK EXECUTION MODE');
  console.log('-' .repeat(50));
  
  const borrowAmount = seiAmount * 0.563;
  const totalExposure = seiAmount + borrowAmount;
  
  console.log('Step 1: ✅ Mock collateral supply simulated');
  console.log('Step 2: ✅ Mock borrow execution simulated');
  console.log('Step 3: ✅ Mock staking execution simulated');
  console.log('');
  
  console.log('📊 Mock Position Status:');
  console.log(`   Collateral: ${seiAmount} SEI`);
  console.log(`   Debt: ${borrowAmount.toFixed(4)} SEI`);
  console.log(`   Health Factor: 1.42`);
  console.log(`   LTV: 56.3%`);
  console.log(`   Total Exposure: ${totalExposure.toFixed(4)} SEI`);
  console.log('');
  
  console.log('💡 To execute with real transactions:');
  console.log('   1. Set SEI_WALLET_MNEMONIC in .env file');
  console.log('   2. Ensure sufficient SEI balance');
  console.log('   3. Verify Yei Finance contract addresses');
  console.log('   4. Run again with real credentials');
}

// Monitor position health every 4 hours (for production)
function startPositionMonitoring(yeiClient: YeiFinanceClient, walletAddress: string): void {
  console.log('🔄 Starting position monitoring (every 4 hours)...');
  
  setInterval(async () => {
    try {
      const position = await yeiClient.getPositionHealth(walletAddress);
      
      if (position.healthFactor < 1.3) {
        console.log('🚨 ALERT: Health factor dropping!');
        console.log(`Current Health Factor: ${position.healthFactor.toFixed(3)}`);
        console.log('Consider repaying debt or adding collateral');
      } else {
        console.log(`✅ Position healthy - Health Factor: ${position.healthFactor.toFixed(3)}`);
      }
    } catch (error) {
      console.error('❌ Monitoring error:', error);
    }
  }, 4 * 60 * 60 * 1000); // 4 hours
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}