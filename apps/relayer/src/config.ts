import { DEFAULT_RELAYS, DEFAULT_TAG } from "@dead-drop/protocol";

export class ConfigError extends Error {}

export interface RelayerConfig {
  /** The one piece of Ethereum infrastructure in the whole system. */
  rpcUrl: string;
  chainId: number;
  relays: string[];
  tag: string;
  minTipWei: bigint;
  tipAddress: `0x${string}` | undefined;
  /** Validate and log drops without broadcasting. Useful with no RPC to hand. */
  dryRun: boolean;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ConfigError(`${name} is not set — copy .env.example to .env and fill it in.`);
  }
  return value;
}

function integer(name: string, fallback?: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    if (fallback !== undefined) return fallback;
    throw new ConfigError(`${name} is not set.`);
  }
  const value = Number(raw);
  if (!Number.isInteger(value)) throw new ConfigError(`${name} must be an integer, got "${raw}".`);
  return value;
}

function wei(name: string): bigint {
  const raw = process.env[name]?.trim();
  if (!raw) return 0n;
  if (!/^\d+$/.test(raw)) throw new ConfigError(`${name} must be a whole number of wei.`);
  return BigInt(raw);
}

function list(name: string, fallback: readonly string[]): string[] {
  const raw = process.env[name]?.trim();
  const entries = (raw ? raw.split(",") : [...fallback]).map((item) => item.trim()).filter(Boolean);
  if (entries.length === 0) throw new ConfigError(`${name} resolved to an empty list.`);
  return entries;
}

export function loadConfig(): RelayerConfig {
  const dryRun = /^(1|true|yes)$/i.test(process.env.DRY_RUN?.trim() ?? "");
  const minTipWei = wei("MIN_TIP_WEI");

  const rawTipAddress = process.env.RELAYER_ADDRESS?.trim();
  const tipAddress =
    rawTipAddress && rawTipAddress.toLowerCase() !== ZERO_ADDRESS
      ? (rawTipAddress as `0x${string}`)
      : undefined;

  if (tipAddress && !/^0x[0-9a-fA-F]{40}$/.test(tipAddress)) {
    throw new ConfigError("RELAYER_ADDRESS is not a valid 20-byte address.");
  }
  if (minTipWei > 0n && !tipAddress) {
    throw new ConfigError("MIN_TIP_WEI is set but RELAYER_ADDRESS is not — nowhere to be paid.");
  }

  return {
    // A dry run never opens an RPC connection, so it should not demand one.
    rpcUrl: dryRun ? (process.env.RPC_URL?.trim() ?? "") : required("RPC_URL"),
    chainId: integer("CHAIN_ID", 11155111),
    relays: list("NOSTR_RELAYS", DEFAULT_RELAYS),
    tag: process.env.NOSTR_TAG?.trim() || DEFAULT_TAG,
    minTipWei,
    tipAddress,
    dryRun,
  };
}
