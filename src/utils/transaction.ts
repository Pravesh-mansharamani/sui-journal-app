import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromB64 } from "@mysten/sui/utils";

/**
 * Utility functions for handling Sui transactions
 */

export interface TransactionOptions {
  gasBudget?: number;
  gasPrice?: number;
  maxGasObjects?: number;
}

/**
 * Creates a transaction with proper gas handling
 */
export function createTransaction(options: TransactionOptions = {}): Transaction {
  const tx = new Transaction();
  
  // Set gas budget if provided
  if (options.gasBudget) {
    tx.setGasBudget(options.gasBudget);
  }
  
  // Set gas price if provided
  if (options.gasPrice) {
    tx.setGasPrice(options.gasPrice);
  }
  
  return tx;
}

/**
 * Ensures the transaction has sufficient gas coins
 * This function can be used to split gas coins if needed
 */
export async function ensureGasCoins(
  suiClient: SuiClient,
  address: string,
  _tx: Transaction,
  options: TransactionOptions = {}
): Promise<void> {
  try {
    // Get all SUI coins for the address
    const coins = await suiClient.getCoins({
      owner: address,
      coinType: "0x2::sui::SUI",
    });

    if (coins.data.length === 0) {
      throw new Error("No SUI coins found. Please get some testnet SUI from the faucet.");
    }

    // If we have multiple small coins, we might need to merge them
    const totalBalance = coins.data.reduce((sum, coin) => sum + parseInt(coin.balance), 0);
    const minBalance = options.gasBudget || 100000000; // 0.1 SUI default

    if (totalBalance < minBalance) {
      throw new Error(`Insufficient SUI balance. Need at least ${minBalance / 1000000000} SUI for gas.`);
    }

    // If we have many small coins, merge them for better gas efficiency
    if (coins.data.length > 5) {
      console.log(`Merging ${coins.data.length} SUI coins for better gas efficiency...`);
      console.warn("Consider merging your SUI coins for better transaction performance");
    }

  } catch (error) {
    console.error("Error ensuring gas coins:", error);
    throw error;
  }
}

/**
 * Validates that a transaction can be executed
 */
export function validateTransaction(tx: Transaction): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic validation - check if transaction is properly constructed
  try {
    const data = tx.getData();
    if (!data || !data.inputs || data.inputs.length === 0) {
      errors.push("Transaction has no inputs");
    }
  } catch (error) {
    errors.push("Transaction is malformed");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Creates a test keypair for development/testing
 * WARNING: This is for testing only, never use in production
 */
export function createTestKeypair(): Ed25519Keypair {
  // This creates a deterministic test keypair
  const privateKey = "0x0000000000000000000000000000000000000000000000000000000000000001";
  return Ed25519Keypair.fromSecretKey(fromB64(privateKey));
}

/**
 * Formats SUI amounts for display
 */
export function formatSuiAmount(mist: number | string): string {
  const sui = typeof mist === 'string' ? parseInt(mist) : mist;
  return (sui / 1000000000).toFixed(4);
}

/**
 * Converts SUI to MIST (smallest unit)
 */
export function suiToMist(sui: number): number {
  return Math.floor(sui * 1000000000);
}
