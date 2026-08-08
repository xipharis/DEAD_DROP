import { DEFAULT_RELAYS, DEFAULT_TAG } from "@dead-drop/protocol";

// NEXT_PUBLIC_* must be referenced statically for Next to inline it at build time.
const rawChainId = process.env.NEXT_PUBLIC_CHAIN_ID;
const rawRelays = process.env.NEXT_PUBLIC_NOSTR_RELAYS;
const rawTag = process.env.NEXT_PUBLIC_NOSTR_TAG;

/** Sepolia unless told otherwise. */
export const CHAIN_ID = Number(rawChainId ?? 11155111);

export const NOSTR_RELAYS: string[] = (rawRelays ?? DEFAULT_RELAYS.join(","))
  .split(",")
  .map((relay) => relay.trim())
  .filter(Boolean);

export const NOSTR_TAG = rawTag ?? DEFAULT_TAG;

/** Chains where a mistake costs real money. Drives the warning banner. */
const VALUE_BEARING_CHAINS = new Set([1, 10, 56, 137, 8453, 42161, 43114]);

export function isValueBearingChain(chainId: number): boolean {
  return VALUE_BEARING_CHAINS.has(chainId);
}

export function chainLabel(chainId: number): string {
  const names: Record<number, string> = {
    1: "ethereum",
    10: "optimism",
    137: "polygon",
    8453: "base",
    42161: "arbitrum",
    11155111: "sepolia",
    17000: "holesky",
    31337: "anvil",
  };
  return names[chainId] ?? `chain ${chainId}`;
}
