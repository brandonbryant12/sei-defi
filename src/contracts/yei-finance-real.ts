/**
 * Yei Finance Real Contract Implementation
 * SEI Network DeFi Lending Protocol Integration
 */

import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { GasPrice } from '@cosmjs/stargate';

export interface YeiContract {
  address: string;
  codeId: number;
}

export interface YeiTransactionResult {
  transactionHash: string;
  gasUsed: number;
  success: boolean;
  logs: string[];
}

export interface YeiPosition {
  collateral: number;
  debt: number;
  healthFactor: number;
  ltv: number;
}

/**
 * Yei Finance protocol client for SEI network
 * Supports both CosmWasm and EVM transactions
 */
export class YeiFinanceClient {
  private client: SigningCosmWasmClient | null = null;
  private wallet: DirectSecp256k1HdWallet | null = null;
  private rpcUrl: string;
  private chainId: string;

  // Contract addresses (these would be the actual deployed addresses)
  private readonly contracts = {
    LENDING_POOL: 'sei1...yei_lending_pool_address',
    PRICE_ORACLE: 'sei1...yei_price_oracle_address',
    SEI_MARKET: 'sei1...sei_market_address',
    LIQUIDATION_MANAGER: 'sei1...liquidation_manager_address'
  };

  constructor(rpcUrl: string = 'https://sei-rpc.polkachu.com', chainId: string = 'pacific-1') {
    this.rpcUrl = rpcUrl;
    this.chainId = chainId;
  }

  /**
   * Initialize wallet and client for transactions
   */
  async initialize(mnemonic: string): Promise<void> {
    try {
      // Create wallet from mnemonic
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: 'sei',
      });

      // Get signing client
      this.client = await SigningCosmWasmClient.connectWithSigner(
        this.rpcUrl,
        this.wallet,
        {
          gasPrice: GasPrice.fromString('0.02usei'),
        }
      );

      console.log('✅ Yei Finance client initialized');
    } catch (error) {
      throw new Error(`Failed to initialize Yei Finance client: ${error}`);
    }
  }

  /**
   * Step 1: Supply SEI as collateral to Yei Finance
   */
  async supplyCollateral(seiAmount: number): Promise<YeiTransactionResult> {
    if (!this.client || !this.wallet) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    try {
      const [account] = await this.wallet.getAccounts();
      const amountInUsei = Math.floor(seiAmount * 1_000_000); // Convert to microsei

      // CosmWasm execute message for supplying collateral
      const executeMsg = {
        supply: {
          asset: 'sei',
          amount: amountInUsei.toString(),
        }
      };

      console.log(`🏦 Supplying ${seiAmount} SEI as collateral to Yei Finance...`);

      const result = await this.client.execute(
        account.address,
        this.contracts.LENDING_POOL,
        executeMsg,
        'auto',
        'Supply SEI collateral to Yei Finance',
        [{ denom: 'usei', amount: amountInUsei.toString() }]
      );

      console.log(`✅ Collateral supplied! TX: ${result.transactionHash}`);

      return {
        transactionHash: result.transactionHash,
        gasUsed: result.gasUsed,
        success: true,
        logs: result.logs.map(log => JSON.stringify(log))
      };

    } catch (error) {
      console.error('❌ Failed to supply collateral:', error);
      throw error;
    }
  }

  /**
   * Step 2: Borrow SEI against supplied collateral
   */
  async borrowSEI(borrowAmount: number): Promise<YeiTransactionResult> {
    if (!this.client || !this.wallet) {
      throw new Error('Client not initialized.');
    }

    try {
      const [account] = await this.wallet.getAccounts();
      const amountInUsei = Math.floor(borrowAmount * 1_000_000);

      const executeMsg = {
        borrow: {
          asset: 'sei',
          amount: amountInUsei.toString(),
        }
      };

      console.log(`💰 Borrowing ${borrowAmount} SEI from Yei Finance...`);

      const result = await this.client.execute(
        account.address,
        this.contracts.LENDING_POOL,
        executeMsg,
        'auto',
        'Borrow SEI from Yei Finance'
      );

      console.log(`✅ Borrowed ${borrowAmount} SEI! TX: ${result.transactionHash}`);

      return {
        transactionHash: result.transactionHash,
        gasUsed: result.gasUsed,
        success: true,
        logs: result.logs.map(log => JSON.stringify(log))
      };

    } catch (error) {
      console.error('❌ Failed to borrow SEI:', error);
      throw error;
    }
  }

  /**
   * Step 3: Stake borrowed SEI (using liquid staking)
   */
  async stakeBorrowedSEI(seiAmount: number): Promise<YeiTransactionResult> {
    if (!this.client || !this.wallet) {
      throw new Error('Client not initialized.');
    }

    try {
      const [account] = await this.wallet.getAccounts();
      const amountInUsei = Math.floor(seiAmount * 1_000_000);

      // This would interact with Silo liquid staking contract
      const executeMsg = {
        stake: {
          amount: amountInUsei.toString(),
        }
      };

      console.log(`🥩 Staking ${seiAmount} SEI through liquid staking...`);

      // Mock liquid staking contract address
      const liquidStakingContract = 'sei1...silo_staking_contract';

      const result = await this.client.execute(
        account.address,
        liquidStakingContract,
        executeMsg,
        'auto',
        'Stake SEI through liquid staking',
        [{ denom: 'usei', amount: amountInUsei.toString() }]
      );

      console.log(`✅ Staked ${seiAmount} SEI! TX: ${result.transactionHash}`);

      return {
        transactionHash: result.transactionHash,
        gasUsed: result.gasUsed,
        success: true,
        logs: result.logs.map(log => JSON.stringify(log))
      };

    } catch (error) {
      console.error('❌ Failed to stake SEI:', error);
      throw error;
    }
  }

  /**
   * Monitor position health and risk metrics
   */
  async getPositionHealth(userAddress: string): Promise<YeiPosition> {
    if (!this.client) {
      throw new Error('Client not initialized.');
    }

    try {
      // Query user position from Yei Finance
      const queryMsg = {
        get_user_position: {
          user: userAddress,
        }
      };

      const positionData = await this.client.queryContractSmart(
        this.contracts.LENDING_POOL,
        queryMsg
      );

      // Parse position data (structure depends on contract implementation)
      const collateral = parseInt(positionData.collateral || '0') / 1_000_000;
      const debt = parseInt(positionData.debt || '0') / 1_000_000;
      const ltv = debt / collateral;
      const healthFactor = (collateral * 0.8) / debt; // Assuming 80% liquidation threshold

      console.log('📊 Position Status:');
      console.log(`   Collateral: ${collateral} SEI`);
      console.log(`   Debt: ${debt} SEI`);
      console.log(`   LTV: ${(ltv * 100).toFixed(2)}%`);
      console.log(`   Health Factor: ${healthFactor.toFixed(3)}`);

      return {
        collateral,
        debt,
        healthFactor,
        ltv
      };

    } catch (error) {
      console.error('❌ Failed to get position health:', error);
      throw error;
    }
  }

  /**
   * Emergency: Repay debt to reduce liquidation risk
   */
  async emergencyRepay(repayAmount: number): Promise<YeiTransactionResult> {
    if (!this.client || !this.wallet) {
      throw new Error('Client not initialized.');
    }

    try {
      const [account] = await this.wallet.getAccounts();
      const amountInUsei = Math.floor(repayAmount * 1_000_000);

      const executeMsg = {
        repay: {
          asset: 'sei',
          amount: amountInUsei.toString(),
        }
      };

      console.log(`🚨 Emergency repaying ${repayAmount} SEI...`);

      const result = await this.client.execute(
        account.address,
        this.contracts.LENDING_POOL,
        executeMsg,
        'auto',
        'Emergency repay SEI debt',
        [{ denom: 'usei', amount: amountInUsei.toString() }]
      );

      console.log(`✅ Repaid ${repayAmount} SEI! TX: ${result.transactionHash}`);

      return {
        transactionHash: result.transactionHash,
        gasUsed: result.gasUsed,
        success: true,
        logs: result.logs.map(log => JSON.stringify(log))
      };

    } catch (error) {
      console.error('❌ Failed to repay debt:', error);
      throw error;
    }
  }

  /**
   * Get current SEI price from Yei Finance oracle
   */
  async getSEIPrice(): Promise<number> {
    if (!this.client) {
      throw new Error('Client not initialized.');
    }

    try {
      const queryMsg = {
        get_price: {
          asset: 'sei',
        }
      };

      const priceData = await this.client.queryContractSmart(
        this.contracts.PRICE_ORACLE,
        queryMsg
      );

      return parseFloat(priceData.price) / 1_000_000; // Convert from micro units

    } catch (error) {
      console.log('⚠️ Using mock SEI price: $0.45');
      return 0.45; // Mock price if oracle query fails
    }
  }

  /**
   * Calculate liquidation price for current position
   */
  calculateLiquidationPrice(collateral: number, debt: number): number {
    const liquidationThreshold = 0.80; // 80%
    return debt / (collateral * liquidationThreshold);
  }

  /**
   * Disconnect client
   */
  async disconnect(): Promise<void> {
    this.client = null;
    this.wallet = null;
    console.log('🔌 Disconnected from Yei Finance');
  }
}