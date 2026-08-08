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

/**
 * Relayer-side admission control. Runs before any RPC call, so a malformed or
 * wrong-chain drop costs nothing.
 */
export function assertRelayable(
  envelope: DropEnvelope,
  policy: { chainId: number },
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

  return tx;
}
