import { keccak256, parseTransaction, type TransactionSerialized } from "viem";
import type { DropEnvelope } from "./envelope.js";

export class TxRejected extends Error {}

export interface InspectedTx {
  hash: `0x${string}`;
  chainId: number | undefined;
  to: `0x${string}` | null | undefined;
  value: bigint | undefined;
  nonce: number | undefined;
  gas: bigint | undefined;
  maxFeePerGas: bigint | undefined;
}

/**
 * Decodes a signed transaction with no network access, so both the signer (to
 * preview) and the relayer (to vet) reason about the same bytes.
 */
export function inspectRawTx(rawTx: `0x${string}`): InspectedTx {
  const tx = parseTransaction(rawTx as TransactionSerialized);
  return {
    hash: keccak256(rawTx),
    chainId: tx.chainId,
    to: tx.to,
    value: tx.value,
    nonce: tx.nonce,
    gas: tx.gas,
    maxFeePerGas: "maxFeePerGas" in tx ? tx.maxFeePerGas : undefined,
  };
}

export interface RelayPolicy {
  /** Chain the relayer serves. Anything else is refused before any RPC call. */
  chainId: number;
  /** Minimum tip in wei. 0 (the default) relays altruistically. */
  minTipWei?: bigint;
  /** Address the tip must be paid to. Required once `minTipWei` is above zero. */
  tipAddress?: `0x${string}` | undefined;
}

/**
 * The tip a transaction pays a given address.
 *
 * Only a direct transfer counts: the relayer can read `to` and `value` straight
 * out of the signed bytes, with no chain state and no trust in the sender. A
 * tip routed through a contract call may well be there, but proving it would
 * mean simulating the call — so this returns zero and the drop is judged on
 * what can be verified offline.
 */
export function tipTo(tx: InspectedTx, address: `0x${string}`): bigint {
  if (!tx.to || tx.to.toLowerCase() !== address.toLowerCase()) return 0n;
  return tx.value ?? 0n;
}

/**
 * Relayer-side admission control. Runs before any RPC call, so a malformed,
 * wrong-chain or unpaid drop costs nothing.
 */
export function assertRelayable(
  envelope: DropEnvelope,
  policy: RelayPolicy,
): InspectedTx {
  const tx = inspectRawTx(envelope.rawTx);

  if (envelope.chainId !== policy.chainId) {
    throw new TxRejected(
      `envelope chainId ${envelope.chainId} != relayer chainId ${policy.chainId}`,
    );
  }
  if (tx.chainId !== undefined && tx.chainId !== policy.chainId) {
    throw new TxRejected(
      `signed chainId ${tx.chainId} != relayer chainId ${policy.chainId}`,
    );
  }

  const minTip = policy.minTipWei ?? 0n;
  if (minTip > 0n) {
    if (!policy.tipAddress) {
      throw new TxRejected("relayer requires a tip but has no tip address configured");
    }
    const tip = tipTo(tx, policy.tipAddress);
    if (tip < minTip) {
      throw new TxRejected(`tip ${tip} wei is below the configured minimum ${minTip} wei`);
    }
  }

  return tx;
}
