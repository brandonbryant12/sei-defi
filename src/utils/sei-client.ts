import { StargateClient } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/amino';

export interface BalanceInfo {
  address: string;
  balances: Coin[];
  totalSEI: string;
}

/**
 * SEI blockchain client for querying balances and network information
 */
export class SeiClient {
  private client: StargateClient | null = null;
  private rpcUrl: string;

  constructor(rpcUrl: string = 'https://sei-rpc.polkachu.com') {
    this.rpcUrl = rpcUrl;
  }

  /**
   * Connect to SEI network
   */
  async connect(): Promise<void> {
    try {
      this.client = await StargateClient.connect(this.rpcUrl);
      console.log(`Connected to SEI network at ${this.rpcUrl}`);
    } catch (error) {
      throw new Error(`Failed to connect to SEI network: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all balances for an address
   */
  async getBalances(address: string): Promise<BalanceInfo> {
    if (!this.client) {
      await this.connect();
    }

    try {
      const balances = await this.client!.getAllBalances(address);
      
      // Find SEI balance (native token)
      const seiBalance = balances.find(balance => balance.denom === 'usei');
      const totalSEI = seiBalance ? (parseInt(seiBalance.amount) / 1_000_000).toString() : '0';

      return {
        address,
        balances,
        totalSEI,
      };
    } catch (error) {
      throw new Error(`Failed to get balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get SEI balance only
   */
  async getSeiBalance(address: string): Promise<string> {
    const balanceInfo = await this.getBalances(address);
    return balanceInfo.totalSEI;
  }

  /**
   * Get network chain ID
   */
  async getChainId(): Promise<string> {
    if (!this.client) {
      await this.connect();
    }
    
    return await this.client!.getChainId();
  }

  /**
   * Get latest block height
   */
  async getHeight(): Promise<number> {
    if (!this.client) {
      await this.connect();
    }
    
    return await this.client!.getHeight();
  }

  /**
   * Disconnect from network
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
      console.log('Disconnected from SEI network');
    }
  }
}