import { createPublicClient, http, type PublicClient } from "viem";
import type { RelayerConfig } from "./config.ts";

/**
 * What happened when we handed the bytes to a node.
 *
 * `duplicate` is not a failure. Many relayers racing to submit the same signed
 * transaction is the design — whoever loses the race gets "already known" back,
 * and the drop is on its way regardless.
 */
export type BroadcastOutcome =
  | { status: "sent"; hash: `0x${string}` }
  | { status: "duplicate"; reason: string }
  | { status: "rejected"; reason: string }
  | { status: "error"; reason: string }
  | { status: "held" };

const DUPLICATE_PATTERNS = [
  "already known",
  "already imported",
  "known transaction",
  "transaction already exists",
  "alreadyknown",
];

/**
 * Errors the chain will never accept no matter how long we wait — a stale
 * nonce, an underfunded sender. Worth distinguishing from transport failures so
 * the log tells an operator whether the problem is theirs.
 */
const REJECTION_PATTERNS = [
  "nonce too low",
  "insufficient funds",
  "intrinsic gas too low",
  "exceeds block gas limit",
  "fee cap less than block base fee",
  "max fee per gas less than block base fee",
  "transaction underpriced",
  "gas price too low",
  "invalid sender",
];

function classify(message: string): BroadcastOutcome {
  const haystack = message.toLowerCase();
  if (DUPLICATE_PATTERNS.some((needle) => haystack.includes(needle))) {
    return { status: "duplicate", reason: message };
  }
  if (REJECTION_PATTERNS.some((needle) => haystack.includes(needle))) {
    return { status: "rejected", reason: message };
  }
  return { status: "error", reason: message };
}

export function createBroadcaster(config: RelayerConfig) {
  const client: PublicClient | null = config.dryRun
    ? null
    : createPublicClient({ transport: http(config.rpcUrl) });

  return async function broadcast(rawTx: `0x${string}`): Promise<BroadcastOutcome> {
    if (!client) return { status: "held" };

    try {
      const hash = await client.sendRawTransaction({ serializedTransaction: rawTx });
      return { status: "sent", hash };
    } catch (error) {
      // viem wraps RPC errors in several layers; the useful text is in the
      // details/shortMessage rather than the stringified error.
      const detail =
        error && typeof error === "object" && "details" in error
          ? String((error as { details?: unknown }).details ?? "")
          : "";
      const short =
        error && typeof error === "object" && "shortMessage" in error
          ? String((error as { shortMessage?: unknown }).shortMessage ?? "")
          : "";
      const message = [detail, short].filter(Boolean).join(" — ") || String(error);
      return classify(message);
    }
  };
}

/** Confirms the RPC endpoint is reachable and serving the chain we expect. */
export async function verifyRpc(config: RelayerConfig): Promise<void> {
  if (config.dryRun) return;
  const client = createPublicClient({ transport: http(config.rpcUrl) });
  const actual = await client.getChainId();
  if (actual !== config.chainId) {
    throw new Error(
      `RPC_URL serves chain ${actual}, but CHAIN_ID is ${config.chainId}. Refusing to start.`,
    );
  }
}
