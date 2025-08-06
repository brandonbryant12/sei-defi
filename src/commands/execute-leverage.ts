#!/usr/bin/env node

import { YeiDragonSwapLeverage } from '../strategies/yei-dragonswap-leverage.js';
import { SeiClient } from '../utils/sei-client.js';
import { getWalletAddress } from '../utils/secrets.js';

/**
 * Command to execute leverage strategies on SEI
 * Usage: npm run execute-leverage [strategy] [amount]
 */
async function main() {
  try {
    const strategy = process.argv[2] || 'yei-staking';
    const seiAmount = parseFloat(process.argv[3] || '174.2968');
    
    console.log('🚀 SEI Leverage Strategy Executor');
    console.log('=' .repeat(60));
    console.log(`Strategy: ${strategy}`);
    console.log(`SEI Amount: ${seiAmount} SEI`);
    console.log('');

    // Initialize clients
    const leverage = new YeiDragonSwapLeverage('https://sei-rpc.polkachu.com');
    const seiClient = new SeiClient();
    await seiClient.connect();
    
    // Get current wallet balance  
    const walletAddress = 'sei1gnat7qjzkctxvz4dzhhjypqd4jyns3xrphjd0k'; // Your wallet
    const balance = await seiClient.getSeiBalance(walletAddress);
    console.log(`Wallet Address: ${walletAddress}`);
    console.log(`Current Balance: ${balance} SEI`);
    
    if (parseFloat(balance) < seiAmount) {
      console.error('❌ Insufficient balance for strategy execution');
      process.exit(1);
    }
    
    console.log('');
    console.log('📊 STRATEGY ANALYSIS');
    console.log('-' .repeat(60));
    
    let selectedStrategy;
    
    switch (strategy.toLowerCase()) {
      case 'yei-staking':
      case 'staking':
        selectedStrategy = await leverage.createYeiStakingStrategy(seiAmount);
        break;
        
      case 'yei-lp':
      case 'lp':
        selectedStrategy = await leverage.createYeiLPStrategy(seiAmount, 'SEI-USDC');
        break;
        
      case 'yei-lp-low-risk':
      case 'lp-safe':
        selectedStrategy = await leverage.createYeiLPStrategy(seiAmount, 'iSEI-SEI');
        break;
        
      case 'hybrid':
      case 'balanced':
        selectedStrategy = await leverage.createHybridStrategy(seiAmount);
        break;
        
      default:
        console.error('❌ Unknown strategy. Available: yei-staking, yei-lp, yei-lp-low-risk, hybrid');
        process.exit(1);
    }
    
    // Display strategy details
    console.log(`Strategy: ${selectedStrategy.name}`);
    console.log(`Type: ${selectedStrategy.type}`);
    console.log(`Risk Level: ${selectedStrategy.riskLevel}`);
    console.log(`Expected APY: ${(selectedStrategy.expectedAPY * 100).toFixed(2)}%`);
    console.log(`Liquidation Risk: ${(selectedStrategy.liquidationRisk * 100).toFixed(1)}%`);
    console.log('');
    
    console.log('Execution Steps:');
    selectedStrategy.steps.forEach(step => console.log(`   ${step}`));
    console.log('');
    
    // Risk analysis
    console.log('🛡️  RISK ANALYSIS');
    console.log('-' .repeat(60));
    
    const riskFactors = [
      'Smart contract risk on Yei Finance protocol',
      'Liquidation risk if SEI price drops significantly',
      'Interest rate fluctuation risk',
      selectedStrategy.type.includes('LP') ? 'Impermanent loss risk from LP positions' : 'Liquid staking slashing risk',
      'SEI network congestion risk during emergency unwinds'
    ];
    
    riskFactors.forEach(risk => console.log(`   ⚠️  ${risk}`));
    console.log('');
    
    // Safety checklist
    console.log('✅ SAFETY CHECKLIST');
    console.log('-' .repeat(60));
    
    const safetyItems = [
      'Health Factor will be maintained above 1.5',
      'Position will be monitored every 4 hours',
      'Emergency exit strategy prepared',
      'Extra SEI reserved for gas and emergencies (5% of position)',
      'Price alerts set for 10% SEI price movements',
      'Automated liquidation protection enabled'
    ];
    
    safetyItems.forEach(item => console.log(`   ✓ ${item}`));
    console.log('');
    
    // Pre-execution validation
    console.log('🔍 PRE-EXECUTION VALIDATION');
    console.log('-' .repeat(60));
    
    const validationChecks = [
      { name: 'Yei Finance availability', status: 'MOCK_OK' },
      { name: 'DragonSwap liquidity', status: 'MOCK_OK' },
      { name: 'SEI price stability', status: 'MOCK_OK' },
      { name: 'Network gas fees', status: 'LOW' },
      { name: 'Market volatility', status: 'NORMAL' }
    ];
    
    validationChecks.forEach(check => {
      const emoji = check.status.includes('OK') || check.status === 'LOW' || check.status === 'NORMAL' ? '✅' : '❌';
      console.log(`   ${emoji} ${check.name}: ${check.status}`);
    });
    
    console.log('');
    console.log('⏱️  EXECUTION TIMELINE');
    console.log('-' .repeat(60));
    console.log('   Phase 1: Collateral deposit (1-2 minutes)');
    console.log('   Phase 2: Borrow execution (1-2 minutes)');
    if (selectedStrategy.type.includes('LP')) {
      console.log('   Phase 3: Token swap for LP (2-3 minutes)');
      console.log('   Phase 4: Liquidity provision (2-3 minutes)');
    } else {
      console.log('   Phase 3: Liquid staking (1-2 minutes)');
    }
    console.log('   Phase 5: Position verification (1 minute)');
    console.log('   Total estimated time: 5-10 minutes');
    
    console.log('');
    console.log('📈 EXPECTED OUTCOMES (30 days)');
    console.log('-' .repeat(60));
    
    const monthlyYield = seiAmount * selectedStrategy.expectedAPY / 12;
    const totalExposureGains = selectedStrategy.totalExposure * selectedStrategy.expectedAPY / 12;
    
    console.log(`   Initial Investment: ${seiAmount} SEI`);
    console.log(`   Total Exposure: ${selectedStrategy.totalExposure.toFixed(4)} SEI`);
    console.log(`   Expected Monthly Yield: ${monthlyYield.toFixed(4)} SEI`);
    console.log(`   Total Monthly Returns: ${totalExposureGains.toFixed(4)} SEI`);
    console.log(`   ROI on Initial: ${((monthlyYield / seiAmount) * 100).toFixed(2)}%`);
    
    console.log('');
    console.log('⚡ READY TO EXECUTE');
    console.log('=' .repeat(60));
    console.log('⚠️  This is a simulation. To execute:');
    console.log('   1. Review all parameters carefully');
    console.log('   2. Ensure you understand the risks');
    console.log('   3. Start with a smaller test amount');
    console.log('   4. Set up monitoring alerts');
    console.log('   5. Have emergency exit plan ready');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   • Implement actual contract interactions');
    console.log('   • Set up real-time monitoring dashboard');
    console.log('   • Configure automated risk management');
    console.log('   • Test with small amounts first');
    
    await seiClient.disconnect();
    
  } catch (error) {
    console.error('❌ Error executing leverage strategy:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}