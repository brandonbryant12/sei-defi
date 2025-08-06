/**
 * Yei Finance Protocol Integration
 * SEI's first borrowing and lending protocol (Aave V3 fork)
 * Captured 63% of SEI's TVL with $14.8 million
 */

export interface YeiPosition {
  collateralAmount: number;
  borrowedAmount: number;
  healthFactor: number;
  ltv: number;
  liquidationThreshold: number;
  apy: {
    supply: number;
    borrow: number;
    net: number;
  };
}

export interface YeiMarketData {
  asset: string;
  supplyAPY: number;
  borrowAPY: number;
  totalSupply: number;
  totalBorrow: number;
  utilizationRate: number;
  ltv: number;
  liquidationThreshold: number;
  liquidationPenalty: number;
}

/**
 * Yei Finance lending protocol utilities
 * Based on Aave V3 architecture
 */
export class YeiFinance {
  private rpcUrl: string;
  
  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  /**
   * Get current market data for SEI on Yei Finance
   */
  async getSEIMarketData(): Promise<YeiMarketData> {
    // Mock data based on typical Aave V3 parameters
    // In production, this would fetch from Yei Finance contracts
    return {
      asset: 'SEI',
      supplyAPY: 0.08, // 8% supply APY
      borrowAPY: 0.12, // 12% borrow APY
      totalSupply: 14800000, // $14.8M TVL
      totalBorrow: 8000000, // Estimated
      utilizationRate: 0.54, // 54% utilization
      ltv: 0.75, // 75% Loan-to-Value
      liquidationThreshold: 0.80, // 80% liquidation threshold
      liquidationPenalty: 0.05 // 5% liquidation penalty
    };
  }

  /**
   * Calculate optimal borrowing parameters for leverage
   */
  calculateLeverageParams(
    collateralSEI: number,
    targetLeverage: number = 2.0,
    safetyBuffer: number = 0.15
  ): {
    maxBorrowAmount: number;
    safeBorrowAmount: number;
    resultingLTV: number;
    healthFactor: number;
    liquidationPrice: number;
  } {
    
    const marketData = {
      ltv: 0.75,
      liquidationThreshold: 0.80,
      liquidationPenalty: 0.05
    };
    
    // Calculate maximum borrowable amount
    const maxBorrowAmount = collateralSEI * marketData.ltv;
    
    // Apply safety buffer
    const safeBorrowAmount = maxBorrowAmount * (1 - safetyBuffer);
    
    // Calculate resulting metrics
    const resultingLTV = safeBorrowAmount / collateralSEI;
    const healthFactor = (collateralSEI * marketData.liquidationThreshold) / safeBorrowAmount;
    const liquidationPrice = safeBorrowAmount / (collateralSEI * marketData.liquidationThreshold);
    
    return {
      maxBorrowAmount,
      safeBorrowAmount,
      resultingLTV,
      healthFactor,
      liquidationPrice
    };
  }

  /**
   * Monitor position health and liquidation risk
   */
  async monitorPosition(position: YeiPosition): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    healthFactor: number;
    liquidationRisk: number;
    recommendations: string[];
  }> {
    
    const recommendations: string[] = [];
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    
    // Health factor analysis
    if (position.healthFactor < 1.1) {
      status = 'CRITICAL';
      recommendations.push('URGENT: Repay debt or add collateral immediately');
      recommendations.push('Position at high liquidation risk');
    } else if (position.healthFactor < 1.3) {
      status = 'WARNING';
      recommendations.push('Consider repaying some debt or adding collateral');
      recommendations.push('Monitor position closely');
    } else {
      recommendations.push('Position is healthy');
      recommendations.push('Continue monitoring market conditions');
    }
    
    const liquidationRisk = Math.max(0, (1.5 - position.healthFactor) / 0.5);
    
    return {
      status,
      healthFactor: position.healthFactor,
      liquidationRisk,
      recommendations
    };
  }

  /**
   * Calculate net APY for leveraged position
   */
  calculateNetAPY(
    collateralAmount: number,
    borrowedAmount: number,
    supplyAPY: number,
    borrowAPY: number,
    stakingAPY: number = 0.08
  ): {
    totalExposure: number;
    grossYield: number;
    borrowCost: number;
    netYield: number;
    netAPY: number;
  } {
    
    const totalExposure = collateralAmount + borrowedAmount;
    const grossYield = (collateralAmount * supplyAPY) + (borrowedAmount * stakingAPY);
    const borrowCost = borrowedAmount * borrowAPY;
    const netYield = grossYield - borrowCost;
    const netAPY = netYield / collateralAmount;
    
    return {
      totalExposure,
      grossYield,
      borrowCost,
      netYield,
      netAPY
    };
  }

  /**
   * Emergency position management
   */
  async emergencyRepay(
    position: YeiPosition,
    repayAmount: number
  ): Promise<{
    newHealthFactor: number;
    newLTV: number;
    status: string;
  }> {
    
    const newBorrowedAmount = Math.max(0, position.borrowedAmount - repayAmount);
    const newLTV = newBorrowedAmount / position.collateralAmount;
    const newHealthFactor = (position.collateralAmount * 0.80) / newBorrowedAmount;
    
    return {
      newHealthFactor,
      newLTV,
      status: newHealthFactor > 1.5 ? 'SAFE' : newHealthFactor > 1.2 ? 'WARNING' : 'CRITICAL'
    };
  }
}

/**
 * Mock Yei Finance contract addresses (SEI mainnet)
 * These would be the actual deployed contract addresses
 */
export const YEI_FINANCE_CONTRACTS = {
  LENDING_POOL: '0x...', // Main lending pool contract
  LENDING_POOL_CORE: '0x...', // Core lending logic
  PRICE_ORACLE: '0x...', // Price oracle contract
  SEI_ATOKEN: '0x...', // SEI interest-bearing token
  SEI_DEBT_TOKEN: '0x...', // SEI debt token
} as const;

/**
 * Yei Finance transaction utilities
 */
export const YEI_TRANSACTIONS = {
  // Supply SEI as collateral
  SUPPLY: 'supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
  
  // Borrow SEI
  BORROW: 'borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
  
  // Repay borrowed SEI
  REPAY: 'repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf)',
  
  // Withdraw collateral
  WITHDRAW: 'withdraw(address asset, uint256 amount, address to)',
} as const;