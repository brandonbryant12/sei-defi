#!/usr/bin/env node

import { SEILeverageCalculator } from '../strategies/leverage.js';

/**
 * Command to simulate 2x leverage strategies on SEI
 * Usage: npm run simulate-leverage [amount]
 */
async function main() {
  try {
    const seiAmount = parseFloat(process.argv[2] || '174.2968'); // Default to current balance
    
    console.log('🚀 SEI 2x Leverage Strategy Simulator');
    console.log('=' .repeat(50));
    console.log(`Initial SEI Amount: ${seiAmount} SEI`);
    console.log('');

    // Strategy 1: Silo Finance Leveraged Staking
    console.log('📊 STRATEGY 1: Silo Finance Leveraged Staking');
    console.log('-'.repeat(50));
    
    const siloStrategy = await SEILeverageCalculator.createSiloLeverageStrategy(seiAmount);
    
    console.log('Steps:');
    siloStrategy.steps.forEach(step => console.log(`   ${step}`));
    
    console.log('');
    console.log('Position Details:');
    console.log(`   Collateral: ${siloStrategy.params.collateralAmount} SEI`);
    console.log(`   Borrowed: ${siloStrategy.params.borrowedAmount.toFixed(4)} SEI`);
    console.log(`   Total Exposure: ${(siloStrategy.params.collateralAmount + siloStrategy.params.borrowedAmount).toFixed(4)} SEI`);
    console.log(`   Leverage Ratio: ${siloStrategy.params.leverageRatio.toFixed(2)}x`);
    console.log(`   LTV: ${(siloStrategy.params.currentLTV * 100).toFixed(1)}%`);
    
    const risk = SEILeverageCalculator.assessRisk(siloStrategy.params);
    console.log(`   Risk Level: ${risk.riskLevel}`);
    
    console.log('');
    console.log('Risks:');
    siloStrategy.risks.forEach(risk => console.log(`   ⚠️  ${risk}`));
    
    console.log('');
    console.log('=' .repeat(50));
    
    // Strategy 2: Liquid Staking Loop
    console.log('📊 STRATEGY 2: Liquid Staking Loop (Recursive)');
    console.log('-'.repeat(50));
    
    const loopStrategy = await SEILeverageCalculator.createLiquidStakingLoop(seiAmount);
    
    console.log('Execution Plan:');
    loopStrategy.steps.forEach(step => console.log(`   ${step}`));
    
    console.log('');
    console.log('Loop Iterations:');
    loopStrategy.iterations.forEach(iter => {
      console.log(`   Round ${iter.round}: Stake ${iter.stake.toFixed(4)} → Borrow ${iter.borrow.toFixed(4)}`);
    });
    
    const leverageMultiple = loopStrategy.totalExposure / seiAmount;
    console.log('');
    console.log(`Total SEI Exposure: ${loopStrategy.totalExposure.toFixed(4)} SEI`);
    console.log(`Effective Leverage: ${leverageMultiple.toFixed(2)}x`);
    
    console.log('');
    console.log('=' .repeat(50));
    
    // Yield Projections
    console.log('💰 YIELD PROJECTIONS (Annual)');
    console.log('-'.repeat(50));
    
    const stakingAPY = 0.08; // 8% staking APY estimate
    const borrowCost = 0.06; // 6% borrow APY estimate
    
    // Silo strategy yield
    const siloExposure = siloStrategy.params.collateralAmount + siloStrategy.params.borrowedAmount;
    const siloGrossYield = siloExposure * stakingAPY;
    const siloBorrowCost = siloStrategy.params.borrowedAmount * borrowCost;
    const siloNetYield = siloGrossYield - siloBorrowCost;
    const siloNetAPY = siloNetYield / seiAmount;
    
    console.log(`Silo Strategy:`);
    console.log(`   Gross Staking Yield: ${siloGrossYield.toFixed(4)} SEI (${(stakingAPY * 100).toFixed(1)}% on ${siloExposure.toFixed(2)} SEI)`);
    console.log(`   Borrow Cost: ${siloBorrowCost.toFixed(4)} SEI (${(borrowCost * 100).toFixed(1)}% on ${siloStrategy.params.borrowedAmount.toFixed(2)} SEI)`);
    console.log(`   Net Annual Yield: ${siloNetYield.toFixed(4)} SEI`);
    console.log(`   Net APY on Initial: ${(siloNetAPY * 100).toFixed(2)}%`);
    
    // Loop strategy yield
    const loopGrossYield = loopStrategy.totalExposure * stakingAPY;
    const totalBorrowed = loopStrategy.iterations.reduce((sum, iter) => sum + iter.borrow, 0);
    const loopBorrowCost = totalBorrowed * borrowCost;
    const loopNetYield = loopGrossYield - loopBorrowCost;
    const loopNetAPY = loopNetYield / seiAmount;
    
    console.log('');
    console.log(`Loop Strategy:`);
    console.log(`   Gross Staking Yield: ${loopGrossYield.toFixed(4)} SEI (${(stakingAPY * 100).toFixed(1)}% on ${loopStrategy.totalExposure.toFixed(2)} SEI)`);
    console.log(`   Borrow Cost: ${loopBorrowCost.toFixed(4)} SEI (${(borrowCost * 100).toFixed(1)}% on ${totalBorrowed.toFixed(2)} SEI)`);
    console.log(`   Net Annual Yield: ${loopNetYield.toFixed(4)} SEI`);
    console.log(`   Net APY on Initial: ${(loopNetAPY * 100).toFixed(2)}%`);
    
    console.log('');
    console.log('⚠️  IMPORTANT WARNINGS:');
    console.log('   • Leveraged positions carry liquidation risk');
    console.log('   • Market volatility can cause rapid losses');
    console.log('   • Smart contract risks apply');
    console.log('   • Interest rates can change');
    console.log('   • Always maintain liquidation buffers');
    
    console.log('');
    console.log('📈 Next Steps:');
    console.log('   1. Research current APYs on Silo Finance and Kriptonite');
    console.log('   2. Start with smaller amounts to test strategies');
    console.log('   3. Set up automated monitoring and alerts');
    console.log('   4. Implement gradual position sizing');
    
  } catch (error) {
    console.error('❌ Error simulating leverage:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}