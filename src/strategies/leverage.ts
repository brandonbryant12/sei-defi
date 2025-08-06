/**
 * SEI 2x Leverage Strategies Implementation
 * WARNING: Leveraged positions carry liquidation risk
 */

export interface LeveragePosition {
  strategy: 'silo-borrow' | 'liquid-staking-loop' | 'lp-leverage';
  collateralAmount: number; // SEI amount
  borrowedAmount: number; // SEI borrowed
  leverageRatio: number; // Target leverage (2.0 for 2x)
  liquidationThreshold: number; // Price at which liquidation occurs
  currentLTV: number; // Loan-to-Value ratio
}

export interface LeverageStrategy {
  maxLTV: number; // Maximum safe LTV (e.g., 0.75 = 75%)
  targetLeverage: number; // Target leverage multiplier
  liquidationBuffer: number; // Safety buffer (e.g., 0.1 = 10%)
}

/**
 * Calculate optimal leverage parameters for 2x SEI exposure
 */
export class SEILeverageCalculator {
  
  /**
   * Calculate borrowing parameters for 2x leverage
   * Formula: Leverage = 1 / (1 - LTV)
   * For 2x leverage: LTV = 0.5, but we use lower for safety
   */
  static calculateLeverageParams(
    collateralSEI: number, 
    targetLeverage: number = 2.0,
    safetyBuffer: number = 0.15
  ): LeveragePosition {
    
    // Safe LTV for 2x leverage (with safety buffer)
    const maxSafeLTV = (1 - 1/targetLeverage) - safetyBuffer;
    const borrowAmount = collateralSEI * maxSafeLTV;
    const totalExposure = collateralSEI + borrowAmount;
    const actualLeverage = totalExposure / collateralSEI;
    
    return {
      strategy: 'silo-borrow',
      collateralAmount: collateralSEI,
      borrowedAmount: borrowAmount,
      leverageRatio: actualLeverage,
      liquidationThreshold: 0, // To be calculated based on protocol
      currentLTV: maxSafeLTV
    };
  }

  /**
   * Silo Finance Leveraged Staking Strategy
   */
  static async createSiloLeverageStrategy(seiAmount: number): Promise<{
    steps: string[];
    params: LeveragePosition;
    risks: string[];
  }> {
    
    const params = this.calculateLeverageParams(seiAmount, 2.0, 0.2);
    
    return {
      steps: [
        `1. Deposit ${seiAmount} SEI as collateral on Silo Finance`,
        `2. Borrow ${params.borrowedAmount.toFixed(4)} SEI (LTV: ${(params.currentLTV * 100).toFixed(1)}%)`,
        `3. Stake borrowed SEI through Kriptonite → Get stSEI`,
        `4. Monitor position for liquidation risk`,
        `5. Earn staking rewards on ${(seiAmount + params.borrowedAmount).toFixed(4)} SEI total exposure`
      ],
      params,
      risks: [
        `Liquidation risk if SEI price drops significantly`,
        `Borrowing interest costs reduce net APY`,
        `Smart contract risks on Silo Finance`,
        `Impermanent loss risk if using stSEI as collateral`
      ]
    };
  }

  /**
   * Liquid Staking Loop Strategy (Recursive)
   */
  static async createLiquidStakingLoop(seiAmount: number): Promise<{
    steps: string[];
    totalExposure: number;
    iterations: Array<{round: number, stake: number, borrow: number}>;
  }> {
    
    const iterations: Array<{round: number, stake: number, borrow: number}> = [];
    let currentSEI = seiAmount;
    let totalStaked = 0;
    let round = 1;
    
    // Recursive staking loop (max 5 iterations for safety)
    while (round <= 5 && currentSEI > 1) {
      const stakeAmount = currentSEI;
      const borrowAmount = currentSEI * 0.7; // 70% LTV for safety
      
      iterations.push({
        round,
        stake: stakeAmount,
        borrow: borrowAmount
      });
      
      totalStaked += stakeAmount;
      currentSEI = borrowAmount;
      round++;
    }
    
    return {
      steps: [
        `Recursive liquid staking strategy:`,
        ...iterations.map(iter => 
          `Round ${iter.round}: Stake ${iter.stake.toFixed(4)} SEI → Borrow ${iter.borrow.toFixed(4)} SEI`
        ),
        `Final: ${totalStaked.toFixed(4)} SEI total staked exposure`
      ],
      totalExposure: totalStaked,
      iterations
    };
  }

  /**
   * Calculate liquidation price for leveraged position
   */
  static calculateLiquidationPrice(
    collateralValue: number,
    borrowedAmount: number,
    liquidationLTV: number
  ): number {
    return (borrowedAmount) / (collateralValue * liquidationLTV);
  }

  /**
   * Risk assessment for leverage strategies
   */
  static assessRisk(position: LeveragePosition): {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    warnings: string[];
    recommendations: string[];
  } {
    
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    
    if (position.currentLTV > 0.7) {
      riskLevel = 'HIGH';
      warnings.push('Very high LTV - liquidation risk');
    } else if (position.currentLTV > 0.5) {
      riskLevel = 'MEDIUM';
      warnings.push('Moderate liquidation risk');
    }
    
    if (position.leverageRatio > 2.5) {
      warnings.push('High leverage increases volatility');
    }
    
    recommendations.push('Monitor position daily');
    recommendations.push('Set up liquidation alerts');
    recommendations.push('Keep additional SEI for emergency paydown');
    
    return { riskLevel, warnings, recommendations };
  }
}

/**
 * Example usage and strategy comparison
 */
export const LEVERAGE_STRATEGIES = {
  CONSERVATIVE: {
    maxLTV: 0.6,
    targetLeverage: 1.67,
    liquidationBuffer: 0.25
  },
  BALANCED: {
    maxLTV: 0.7,
    targetLeverage: 2.0,
    liquidationBuffer: 0.2
  },
  AGGRESSIVE: {
    maxLTV: 0.8,
    targetLeverage: 2.5,
    liquidationBuffer: 0.1
  }
} as const;