import { createPublicClient, http, type Hex } from "viem";
import { NONCE_CHECK_RPC_URL } from "./config";

/**
 * Looks up the account's real next nonce, purely so the drop panel can warn
 * before publishing. Distinct from `signDraft` on purpose: signing must stay
 * network-free, this check does not have to.
 *
 * Fails soft — an unreachable or slow RPC should never block publishing, so
 * this returns null instead of throwing.
 */
export async function fetchExpectedNonce(address: Hex, chainId: number): Promise<number | null> {
  try {
    const client = createPublicClient({ transport: http(NONCE_CHECK_RPC_URL) });
    const [actualChainId, nonce] = await Promise.all([
      client.getChainId(),
      client.getTransactionCount({ address, blockTag: "pending" }),
    ]);
    if (actualChainId !== chainId) return null;
    return nonce;
  } catch {
    return null;
  }
}
