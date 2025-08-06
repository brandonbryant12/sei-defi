/**
 * Combined Yei Finance + DragonSwap Leverage Strategy
 * Strategy 1: Yei Finance Borrowing + Staking
 * Strategy 2: Yei Finance Borrowing + DragonSwap LP
 */

import { YeiFinance, YeiPosition } from '../protocols/yei-finance.js';
import { DragonSwap } from '../protocols/dragonswap.js';

export interface LeverageStrategy {
  name: string;
  type: 'YEI_STAKING' | 'YEI_LP' | 'YEI_HYBRID';
  initialSEI: number;
  borrowedSEI: number;
  totalExposure: number;
  expectedAPY: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  liquidationRisk: number;
  steps: string[];
}

export interface PositionMonitoring {
  healthFactor: number;
  ltv: number;
  pnl: number;
  alerts: string[];
  actions: string[];
}

/**
 * Advanced leverage strategy combining Yei Finance lending with DragonSwap DEX
 */
export class YeiDragonSwapLeverage {
  private yeiFinance: YeiFinance;
  private dragonSwap: DragonSwap;
  
  constructor(rpcUrl: string) {
    this.yeiFinance = new YeiFinance(rpcUrl);
    this.dragonSwap = new DragonSwap(rpcUrl);
  }

  /**
   * Strategy 1: Yei Finance Leveraged Staking (Conservative)
   */
  async createYeiStakingStrategy(seiAmount: number): Promise<LeverageStrategy> {
    const leverageParams = this.yeiFinance.calculateLeverageParams(seiAmount, 1.8, 0.25);
    const marketData = await this.yeiFinance.getSEIMarketData();
    
    const stakingAPY = 0.08; // 8% staking rewards
    const netAPYCalc = this.yeiFinance.calculateNetAPY(
      seiAmount,
      leverageParams.safeBorrowAmount,
      marketData.supplyAPY,
      marketData.borrowAPY,
      stakingAPY
    );
    
    return {
      name: 'Yei Finance Leveraged Staking',
      type: 'YEI_STAKING',
      initialSEI: seiAmount,
      borrowedSEI: leverageParams.safeBorrowAmount,
      totalExposure: seiAmount + leverageParams.safeBorrowAmount,
      expectedAPY: netAPYCalc.netAPY,
      riskLevel: leverageParams.healthFactor > 2.0 ? 'LOW' : 'MEDIUM',
      liquidationRisk: 1 - (leverageParams.healthFactor / 3),
      steps: [
        `1. Deposit ${seiAmount} SEI as collateral on Yei Finance`,
        `2. Borrow ${leverageParams.safeBorrowAmount.toFixed(4)} SEI (${(leverageParams.resultingLTV * 100).toFixed(1)}% LTV)`,
        `3. Stake borrowed SEI through Silo liquid staking → Get iSEI`,
        `4. Earn staking rewards on ${(seiAmount + leverageParams.safeBorrowAmount).toFixed(4)} SEI total`,
        `5. Health Factor: ${leverageParams.healthFactor.toFixed(2)} (Safe above 1.5)`,
        `6. Expected Net APY: ${(netAPYCalc.netAPY * 100).toFixed(2)}%`
      ]
    };
  }

  /**
   * Strategy 2: Yei Finance + DragonSwap LP (Higher Yield)
   */
  async createYeiLPStrategy(
    seiAmount: number,
    poolType: 'SEI-USDC' | 'SEI-WETH' | 'iSEI-SEI' = 'SEI-USDC'
  ): Promise<LeverageStrategy> {
    
    const leverageParams = this.yeiFinance.calculateLeverageParams(seiAmount, 2.0, 0.20);
    const lpCalculation = await this.dragonSwap.calculateLPLeverage(
      seiAmount,
      leverageParams.safeBorrowAmount,
      poolType
    );
    
    // Calculate combined yields
    const marketData = await this.yeiFinance.getSEIMarketData();
    const supplyCost = seiAmount * marketData.supplyAPY;
    const borrowCost = leverageParams.safeBorrowAmount * marketData.borrowAPY;
    const lpYield = lpCalculation.totalSEI * lpCalculation.estimatedAPR;
    const netYield = supplyCost + lpYield - borrowCost;
    const netAPY = netYield / seiAmount;
    
    return {
      name: `Yei Finance + DragonSwap ${poolType} LP`,
      type: 'YEI_LP',
      initialSEI: seiAmount,
      borrowedSEI: leverageParams.safeBorrowAmount,
      totalExposure: lpCalculation.totalSEI,
      expectedAPY: netAPY,
      riskLevel: poolType === 'iSEI-SEI' ? 'MEDIUM' : 'HIGH',
      liquidationRisk: 1 - (leverageParams.healthFactor / 2.5),
      steps: [
        `1. Deposit ${seiAmount} SEI as collateral on Yei Finance`,
        `2. Borrow ${leverageParams.safeBorrowAmount.toFixed(4)} SEI`,
        `3. Convert ${(lpCalculation.totalSEI / 2).toFixed(4)} SEI to pair token`,
        `4. Add liquidity to DragonSwap ${poolType} pool`,
        `5. Earn LP fees + rewards: ~${(lpCalculation.estimatedAPR * 100).toFixed(1)}% APR`,
        `6. Net APY: ${(netAPY * 100).toFixed(2)}%`,
        `7. Impermanent Loss Risk: ${lpCalculation.impermanentLossRisk}`
      ]
    };
  }

  /**
   * Strategy 3: Hybrid Strategy (Balanced Risk/Reward)
   */
  async createHybridStrategy(seiAmount: number): Promise<LeverageStrategy> {
    const leverageParams = this.yeiFinance.calculateLeverageParams(seiAmount, 1.9, 0.22);
    
    // Split borrowed SEI: 60% staking, 40% LP
    const stakingSEI = leverageParams.safeBorrowAmount * 0.6;
    const lpSEI = leverageParams.safeBorrowAmount * 0.4;
    
    const lpCalculation = await this.dragonSwap.calculateLPLeverage(
      seiAmount * 0.3, // Use 30% of original SEI for LP
      lpSEI,
      'iSEI-SEI' // Lower IL risk
    );
    
    // Calculate blended yields
    const stakingYield = (seiAmount * 0.7 + stakingSEI) * 0.08; // 8% on staking portion
    const lpYield = lpCalculation.totalSEI * lpCalculation.estimatedAPR;
    const marketData = await this.yeiFinance.getSEIMarketData();
    const borrowCost = leverageParams.safeBorrowAmount * marketData.borrowAPY;
    const netYield = stakingYield + lpYield - borrowCost;
    const netAPY = netYield / seiAmount;
    
    return {
      name: 'Hybrid Yei + DragonSwap Strategy',
      type: 'YEI_HYBRID',
      initialSEI: seiAmount,
      borrowedSEI: leverageParams.safeBorrowAmount,
      totalExposure: seiAmount + leverageParams.safeBorrowAmount,
      expectedAPY: netAPY,
      riskLevel: 'MEDIUM',
      liquidationRisk: 1 - (leverageParams.healthFactor / 2.2),
      steps: [
        `1. Deposit ${seiAmount} SEI as collateral on Yei Finance`,
        `2. Borrow ${leverageParams.safeBorrowAmount.toFixed(4)} SEI`,
        `3. Stake ${(seiAmount * 0.7 + stakingSEI).toFixed(4)} SEI (70% + borrowed portion)`,
        `4. Use ${lpCalculation.totalSEI.toFixed(4)} SEI for iSEI-SEI LP on DragonSwap`,
        `5. Blended yield: ${(netAPY * 100).toFixed(2)}% APY`,
        `6. Balanced risk exposure across staking + LP`
      ]
    };
  }

  /**
   * Advanced position monitoring with alerts
   */
  async monitorLeveragePosition(
    strategy: LeverageStrategy,
    currentPosition: YeiPosition
  ): Promise<PositionMonitoring> {
    
    const monitoring = await this.yeiFinance.monitorPosition(currentPosition);
    const alerts: string[] = [];
    const actions: string[] = [];
    
    // Health factor alerts
    if (monitoring.healthFactor < 1.3) {
      alerts.push('🚨 LOW HEALTH FACTOR - Liquidation risk high');
      actions.push('Consider repaying debt or adding collateral');
    } else if (monitoring.healthFactor < 1.8) {
      alerts.push('⚠️ MODERATE HEALTH FACTOR - Monitor closely');
      actions.push('Prepare emergency funds for position management');
    }
    
    // Market condition alerts
    const currentAPY = this.calculateCurrentAPY(strategy, currentPosition);
    if (currentAPY < 0.05) { // Below 5%
      alerts.push('📉 Low yield environment - consider position adjustment');
      actions.push('Review strategy efficiency');
    }
    
    // Liquidation proximity
    if (monitoring.liquidationRisk > 0.7) {
      alerts.push('🔴 HIGH LIQUIDATION RISK');
      actions.push('URGENT: Reduce leverage immediately');
    } else if (monitoring.liquidationRisk > 0.4) {
      alerts.push('🟡 Elevated liquidation risk');
      actions.push('Consider partial position closure');
    }
    
    return {
      healthFactor: monitoring.healthFactor,
      ltv: currentPosition.ltv,
      pnl: this.calculatePnL(strategy, currentPosition),
      alerts,
      actions
    };
  }

  /**
   * Emergency position management
   */
  async emergencyUnwind(
    strategy: LeverageStrategy,
    currentPosition: YeiPosition
  ): Promise<{
    steps: string[];
    estimatedGasUsed: number;
    minimumSEINeeded: number;
    timeEstimate: string;
  }> {
    
    const repayAmount = currentPosition.borrowedAmount;
    const gasPerTransaction = 0.01; // SEI per transaction
    
    let steps: string[] = [];
    let estimatedGasUsed = 0;
    
    if (strategy.type === 'YEI_STAKING') {
      steps = [
        '1. Unstake liquid staking tokens (iSEI → SEI)',
        '2. Repay borrowed SEI on Yei Finance',
        '3. Withdraw remaining collateral',
        '4. Verify position closure'
      ];
      estimatedGasUsed = gasPerTransaction * 4;
    } else if (strategy.type === 'YEI_LP') {
      steps = [
        '1. Remove liquidity from DragonSwap pool',
        '2. Swap received tokens back to SEI if needed',
        '3. Repay borrowed SEI on Yei Finance',
        '4. Withdraw remaining collateral',
        '5. Verify position closure'
      ];
      estimatedGasUsed = gasPerTransaction * 5;
    }
    
    return {
      steps,
      estimatedGasUsed,
      minimumSEINeeded: repayAmount + estimatedGasUsed,
      timeEstimate: '2-5 minutes (depending on network congestion)'
    };
  }

  /**
   * Calculate current P&L for position
   */
  private calculatePnL(strategy: LeverageStrategy, position: YeiPosition): number {
    // Simplified P&L calculation
    const currentValue = position.collateralAmount * 1.02; // Assume 2% price appreciation
    const borrowCost = position.borrowedAmount * position.apy.borrow * (1/365); // Daily borrow cost
    const yieldEarned = strategy.totalExposure * strategy.expectedAPY * (1/365); // Daily yield
    
    return yieldEarned - borrowCost;
  }

  /**
   * Calculate current effective APY
   */
  private calculateCurrentAPY(strategy: LeverageStrategy, position: YeiPosition): number {
    return (position.apy.net + strategy.expectedAPY) / 2; // Simplified current APY
  }
}