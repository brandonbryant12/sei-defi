#!/usr/bin/env node

import { LeverageMonitor } from '../monitoring/leverage-monitor.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Command to monitor leverage position in real-time
 * Usage: npm run monitor-position
 */
async function main() {
  try {
    const walletAddress = 'sei1gnat7qjzkctxvz4dzhhjypqd4jyns3xrphjd0k';
    const mnemonic = process.env.SEI_WALLET_MNEMONIC;
    
    console.log('🔍 LEVERAGE POSITION MONITOR');
    console.log('=' .repeat(50));
    console.log(`Wallet: ${walletAddress}`);
    console.log('');
    
    if (!mnemonic) {
      console.log('💡 Mock monitoring mode (no mnemonic provided)');
      await runMockMonitoring();
      return;
    }

    // Initialize real monitoring
    const monitor = new LeverageMonitor('https://sei-rpc.polkachu.com', walletAddress);
    await monitor.initialize(mnemonic);
    
    // Display initial dashboard
    console.log('📊 INITIAL DASHBOARD');
    console.log('-' .repeat(50));
    const dashboard = monitor.getDashboard();
    console.log(monitor.generateReport());
    
    // Start continuous monitoring
    monitor.startMonitoring();
    
    // Keep process alive and display periodic updates
    let updateCount = 0;
    setInterval(() => {
      updateCount++;
      console.log(`\n⏰ Monitoring update #${updateCount} - ${new Date().toLocaleTimeString()}`);
      
      const currentDashboard = monitor.getDashboard();
      if (currentDashboard.recentAlerts.length > 0) {
        console.log(`🚨 Active alerts: ${currentDashboard.recentAlerts.length}`);
      } else {
        console.log('✅ No alerts - position stable');
      }
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down monitor...');
      monitor.stopMonitoring();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Monitoring failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * Mock monitoring for demonstration
 */
async function runMockMonitoring(): Promise<void> {
  console.log('🎭 MOCK MONITORING DASHBOARD');
  console.log('-' .repeat(50));
  
  // Simulate position data
  const mockPosition = {
    collateral: 174.2968,
    debt: 98.1291,
    healthFactor: 1.42,
    ltv: 0.563,
    seiPrice: 0.45,
    totalExposure: 272.43
  };
  
  console.log('📊 Current Position Status: 🟡 STABLE');
  console.log(`💰 Collateral: ${mockPosition.collateral} SEI`);
  console.log(`📉 Debt: ${mockPosition.debt} SEI`);
  console.log(`🏥 Health Factor: ${mockPosition.healthFactor}`);
  console.log(`📊 LTV: ${(mockPosition.ltv * 100).toFixed(1)}%`);
  console.log(`💲 SEI Price: $${mockPosition.seiPrice}`);
  console.log(`📈 Total Exposure: ${mockPosition.totalExposure} SEI`);
  console.log('');
  
  console.log('🔄 Monitoring Features:');
  console.log('   ✅ Health factor tracking (alert < 1.5)');
  console.log('   ✅ Price movement alerts (> 10%)');
  console.log('   ✅ LTV monitoring (alert > 70%)');
  console.log('   ✅ Emergency procedures (auto-repay)');
  console.log('   ✅ Performance tracking');
  console.log('   ✅ Alert history');
  console.log('');
  
  console.log('💡 Risk Assessment:');
  if (mockPosition.healthFactor < 1.5) {
    console.log('   🟠 WARNING: Health factor below safe threshold');
    console.log('   🎯 Recommendation: Add collateral or repay debt');
  } else {
    console.log('   🟢 Position is within safe parameters');
    console.log('   🎯 Continue monitoring for market changes');
  }
  
  console.log('');
  console.log('📈 Expected Performance:');
  const dailyYield = (mockPosition.totalExposure * 0.0575) / 365; // 5.75% APY
  console.log(`   Daily Yield: ${dailyYield.toFixed(4)} SEI`);
  console.log(`   Monthly Yield: ${(dailyYield * 30).toFixed(4)} SEI`);
  console.log(`   Annual Yield: ${(mockPosition.totalExposure * 0.0575).toFixed(4)} SEI`);
  
  console.log('');
  console.log('🚀 To start real monitoring:');
  console.log('   1. Set SEI_WALLET_MNEMONIC in .env file');
  console.log('   2. Run: npm run monitor-position');
  console.log('   3. Monitor will run continuously');
  console.log('   4. Press Ctrl+C to stop');
  
  console.log('');
  console.log('⏰ Mock monitoring simulation running...');
  console.log('   (Press Ctrl+C to exit)');
  
  // Simulate monitoring updates
  let mockUpdateCount = 0;
  const mockInterval = setInterval(() => {
    mockUpdateCount++;
    
    // Simulate some market movement
    const priceChange = (Math.random() - 0.5) * 0.02; // ±1% price movement
    const newPrice = mockPosition.seiPrice * (1 + priceChange);
    const newHealthFactor = mockPosition.healthFactor * (1 + priceChange * 0.5);
    
    console.log(`\n⏰ Mock Update #${mockUpdateCount} - ${new Date().toLocaleTimeString()}`);
    console.log(`💲 SEI Price: $${newPrice.toFixed(4)} (${priceChange > 0 ? '+' : ''}${(priceChange * 100).toFixed(2)}%)`);
    console.log(`🏥 Health Factor: ${newHealthFactor.toFixed(3)}`);
    
    if (newHealthFactor < 1.5) {
      console.log('⚠️ WARNING: Health factor dropping!');
    } else {
      console.log('✅ Position healthy');
    }
    
    // Update mock position
    mockPosition.seiPrice = newPrice;
    mockPosition.healthFactor = newHealthFactor;
    
  }, 10000); // Every 10 seconds for demo
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping mock monitoring...');
    clearInterval(mockInterval);
    process.exit(0);
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}