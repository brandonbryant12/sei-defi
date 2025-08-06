/**
 * Leverage Position Monitoring Dashboard
 * Tracks health, alerts, and automated management
 */

import { YeiFinanceClient } from '../contracts/yei-finance-real.js';
import { SeiClient } from '../utils/sei-client.js';

export interface MonitoringAlert {
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: Date;
  actionRequired: boolean;
}

export interface PositionSnapshot {
  timestamp: Date;
  collateral: number;
  debt: number;
  healthFactor: number;
  ltv: number;
  seiPrice: number;
  liquidationPrice: number;
  netPnL: number;
}

/**
 * Comprehensive leverage position monitoring system
 */
export class LeverageMonitor {
  private yeiClient: YeiFinanceClient;
  private seiClient: SeiClient;
  private walletAddress: string;
  private alerts: MonitoringAlert[] = [];
  private snapshots: PositionSnapshot[] = [];
  private isMonitoring: boolean = false;

  constructor(rpcUrl: string, walletAddress: string) {
    this.yeiClient = new YeiFinanceClient(rpcUrl);
    this.seiClient = new SeiClient(rpcUrl);
    this.walletAddress = walletAddress;
  }

  /**
   * Initialize monitoring system
   */
  async initialize(mnemonic: string): Promise<void> {
    await this.yeiClient.initialize(mnemonic);
    await this.seiClient.connect();
    console.log('🔍 Leverage monitoring system initialized');
  }

  /**
   * Start continuous monitoring (every 15 minutes)
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('⚠️ Monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🔄 Starting leverage position monitoring...');
    console.log('📊 Monitoring frequency: Every 15 minutes');
    console.log('🚨 Alerts: Health Factor < 1.5, Price movements > 10%');
    
    // Initial check
    this.performHealthCheck();
    
    // Schedule regular checks
    setInterval(() => {
      this.performHealthCheck();
    }, 15 * 60 * 1000); // 15 minutes
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      console.log('\n🔍 Performing health check...');
      
      const position = await this.yeiClient.getPositionHealth(this.walletAddress);
      const seiPrice = await this.yeiClient.getSEIPrice();
      const liquidationPrice = this.yeiClient.calculateLiquidationPrice(position.collateral, position.debt);
      
      // Create snapshot
      const snapshot: PositionSnapshot = {
        timestamp: new Date(),
        collateral: position.collateral,
        debt: position.debt,
        healthFactor: position.healthFactor,
        ltv: position.ltv,
        seiPrice,
        liquidationPrice,
        netPnL: this.calculatePnL(position.collateral, position.debt, seiPrice)
      };
      
      this.snapshots.push(snapshot);
      
      // Keep only last 100 snapshots (about 24 hours)
      if (this.snapshots.length > 100) {
        this.snapshots = this.snapshots.slice(-100);
      }
      
      // Display current status
      this.displayPositionStatus(snapshot);
      
      // Check for alerts
      this.checkAlertConditions(snapshot);
      
    } catch (error) {
      this.addAlert('CRITICAL', `Health check failed: ${error}`, true);
      console.error('❌ Health check failed:', error);
    }
  }

  /**
   * Display current position status
   */
  private displayPositionStatus(snapshot: PositionSnapshot): void {
    const status = snapshot.healthFactor > 2.0 ? '🟢 HEALTHY' : 
                  snapshot.healthFactor > 1.5 ? '🟡 STABLE' :
                  snapshot.healthFactor > 1.2 ? '🟠 WARNING' : '🔴 CRITICAL';
    
    console.log(`\n📊 Position Status: ${status}`);
    console.log(`⏰ Time: ${snapshot.timestamp.toLocaleString()}`);
    console.log(`💰 Collateral: ${snapshot.collateral.toFixed(4)} SEI`);
    console.log(`📉 Debt: ${snapshot.debt.toFixed(4)} SEI`);
    console.log(`🏥 Health Factor: ${snapshot.healthFactor.toFixed(3)}`);
    console.log(`📊 LTV: ${(snapshot.ltv * 100).toFixed(2)}%`);
    console.log(`💲 SEI Price: $${snapshot.seiPrice.toFixed(4)}`);
    console.log(`⚡ Liquidation Price: $${snapshot.liquidationPrice.toFixed(4)}`);
    console.log(`📈 Net P&L: ${snapshot.netPnL.toFixed(4)} SEI`);
  }

  /**
   * Check for alert conditions
   */
  private checkAlertConditions(snapshot: PositionSnapshot): void {
    // Critical health factor alert
    if (snapshot.healthFactor < 1.2) {
      this.addAlert('CRITICAL', `URGENT: Health factor ${snapshot.healthFactor.toFixed(3)} - Immediate action required!`, true);
      this.triggerEmergencyProcedures();
    } else if (snapshot.healthFactor < 1.5) {
      this.addAlert('WARNING', `Low health factor ${snapshot.healthFactor.toFixed(3)} - Consider adding collateral`, false);
    }
    
    // Price movement alerts
    if (this.snapshots.length >= 2) {
      const previousSnapshot = this.snapshots[this.snapshots.length - 2];
      const priceChange = (snapshot.seiPrice - previousSnapshot.seiPrice) / previousSnapshot.seiPrice;
      
      if (Math.abs(priceChange) > 0.1) { // 10% price movement
        const direction = priceChange > 0 ? 'increased' : 'decreased';
        this.addAlert('WARNING', `SEI price ${direction} by ${(Math.abs(priceChange) * 100).toFixed(2)}%`, false);
      }
    }
    
    // LTV alerts
    if (snapshot.ltv > 0.7) {
      this.addAlert('WARNING', `High LTV ${(snapshot.ltv * 100).toFixed(2)}% - Near liquidation threshold`, true);
    }
  }

  /**
   * Add alert to monitoring system
   */
  private addAlert(level: 'INFO' | 'WARNING' | 'CRITICAL', message: string, actionRequired: boolean): void {
    const alert: MonitoringAlert = {
      level,
      message,
      timestamp: new Date(),
      actionRequired
    };
    
    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
    
    // Display alert
    const emoji = level === 'CRITICAL' ? '🚨' : level === 'WARNING' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} ${level}: ${message}`);
    
    if (actionRequired) {
      console.log('🎯 ACTION REQUIRED - Review position immediately');
    }
  }

  /**
   * Trigger emergency procedures
   */
  private async triggerEmergencyProcedures(): Promise<void> {
    console.log('🚨 EMERGENCY PROCEDURES TRIGGERED');
    console.log('🔴 Position at high risk of liquidation');
    
    try {
      // Get current position
      const position = await this.yeiClient.getPositionHealth(this.walletAddress);
      
      // Calculate emergency repay amount (25% of debt)
      const repayAmount = position.debt * 0.25;
      
      console.log(`💊 Recommended emergency repay: ${repayAmount.toFixed(4)} SEI`);
      console.log(`🎯 This would improve health factor to ~${((position.collateral * 0.8) / (position.debt - repayAmount)).toFixed(3)}`);
      
      // Check if we have enough SEI balance
      const balance = await this.seiClient.getSeiBalance(this.walletAddress);
      
      if (parseFloat(balance) >= repayAmount + 1) { // +1 for gas
        console.log('✅ Sufficient balance for emergency repay');
        console.log('🤖 Auto-execution available (if enabled)');
        
        // In production, this could auto-execute:
        // await this.yeiClient.emergencyRepay(repayAmount);
      } else {
        console.log('❌ Insufficient balance for emergency repay');
        console.log('💡 Consider transferring more SEI or closing other positions');
      }
      
    } catch (error) {
      console.error('❌ Emergency procedure failed:', error);
    }
  }

  /**
   * Calculate P&L based on current position and price
   */
  private calculatePnL(collateral: number, debt: number, currentPrice: number): number {
    // Simplified P&L calculation
    // In production, this would consider entry price, fees, rewards, etc.
    const initialValue = collateral * 0.45; // Assuming entry price of $0.45
    const currentValue = collateral * currentPrice;
    const debtValue = debt * currentPrice;
    
    return (currentValue - initialValue) - (debtValue * 0.12 * (1/365)); // Daily borrow cost
  }

  /**
   * Get monitoring dashboard data
   */
  getDashboard(): {
    currentPosition: PositionSnapshot | null;
    recentAlerts: MonitoringAlert[];
    performance: {
      totalPnL: number;
      dailyYield: number;
      healthTrend: string;
    };
  } {
    const currentPosition = this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
    const recentAlerts = this.alerts.slice(-10);
    
    let healthTrend = 'STABLE';
    if (this.snapshots.length >= 3) {
      const recent = this.snapshots.slice(-3);
      const trend = recent[2].healthFactor - recent[0].healthFactor;
      healthTrend = trend > 0.1 ? 'IMPROVING' : trend < -0.1 ? 'DECLINING' : 'STABLE';
    }
    
    return {
      currentPosition,
      recentAlerts,
      performance: {
        totalPnL: currentPosition?.netPnL || 0,
        dailyYield: this.calculateDailyYield(),
        healthTrend
      }
    };
  }

  /**
   * Calculate daily yield estimate
   */
  private calculateDailyYield(): number {
    if (this.snapshots.length < 2) return 0;
    
    const latest = this.snapshots[this.snapshots.length - 1];
    const stakingAPY = 0.08;
    const totalExposure = latest.collateral + latest.debt;
    
    return (totalExposure * stakingAPY) / 365;
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🛑 Monitoring stopped');
  }

  /**
   * Generate monitoring report
   */
  generateReport(): string {
    const dashboard = this.getDashboard();
    const position = dashboard.currentPosition;
    
    if (!position) {
      return 'No position data available';
    }
    
    return `
📊 LEVERAGE POSITION REPORT
Generated: ${new Date().toLocaleString()}

🏦 POSITION OVERVIEW
├─ Collateral: ${position.collateral.toFixed(4)} SEI
├─ Debt: ${position.debt.toFixed(4)} SEI
├─ Health Factor: ${position.healthFactor.toFixed(3)}
├─ LTV: ${(position.ltv * 100).toFixed(2)}%
└─ Net P&L: ${position.netPnL.toFixed(4)} SEI

📈 PERFORMANCE
├─ Daily Yield: ${dashboard.performance.dailyYield.toFixed(4)} SEI
├─ Health Trend: ${dashboard.performance.healthTrend}
└─ Total Snapshots: ${this.snapshots.length}

🚨 RECENT ALERTS: ${dashboard.recentAlerts.length}
${dashboard.recentAlerts.slice(-3).map(alert => 
  `├─ ${alert.level}: ${alert.message}`
).join('\n')}

💡 RECOMMENDATIONS
${position.healthFactor < 1.5 ? '├─ ⚠️ Consider adding collateral or repaying debt' : '├─ ✅ Position is healthy'}
${position.ltv > 0.6 ? '├─ ⚠️ High leverage - monitor closely' : '├─ ✅ Safe leverage level'}
└─ 🔄 Continue monitoring every 15 minutes
`;
  }
}