import { isAddress, parseEther, parseGwei, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  createEnvelope,
  encodeEnvelope,
  inspectRawTx,
  type DropEnvelope,
} from "@dead-drop/protocol";

/**
 * Raw form state. Everything is a string because it comes straight from inputs;
 * parsing and validation happen in one place, in `validateDraft`.
 */
export interface Draft {
  privateKey: string;
  to: string;
  valueEth: string;
  data: string;
  nonce: string;
  gas: string;
  maxFeeGwei: string;
  priorityFeeGwei: string;
  chainId: string;
  memo: string;
}

export type DraftErrors = Partial<Record<keyof Draft, string>>;

export const EMPTY_DRAFT: Draft = {
  privateKey: "",
  to: "",
  valueEth: "0",
  data: "",
  nonce: "",
  gas: "21000",
  maxFeeGwei: "30",
  priorityFeeGwei: "1.5",
  chainId: "",
  memo: "",
};

/** A signed drop, plus everything derivable from it without a network. */
export interface SignedDrop {
  envelope: DropEnvelope;
  encoded: string;
  hash: Hex;
  from: Hex;
  /** Seconds the browser had reported no network when this was signed. */
  darkForSeconds: number | null;
}

function normalizePrivateKey(input: string): Hex | null {
  const trimmed = input.trim();
  const body = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  if (!/^[0-9a-fA-F]{64}$/.test(body)) return null;
  return `0x${body}` as Hex;
}

function parseIntegerField(input: string): bigint | null {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return BigInt(trimmed);
}

function parseDecimalField(input: string, parser: (value: string) => bigint): bigint | null {
  const trimmed = input.trim();
  if (!/^\d*\.?\d+$/.test(trimmed)) return null;
  try {
    return parser(trimmed);
  } catch {
    return null;
  }
}

export function validateDraft(draft: Draft): DraftErrors {
  const errors: DraftErrors = {};

  if (!draft.privateKey.trim()) {
    errors.privateKey = "Required to sign.";
  } else if (!normalizePrivateKey(draft.privateKey)) {
    errors.privateKey = "Must be 64 hex characters.";
  }

  if (!draft.to.trim()) {
    errors.to = "Required.";
  } else if (!isAddress(draft.to.trim())) {
    errors.to = "Not a valid address.";
  }

  if (parseDecimalField(draft.valueEth, parseEther) === null) {
    errors.valueEth = "Use a decimal amount, like 0.001.";
  }

  const data = draft.data.trim();
  if (data && !/^0x[0-9a-fA-F]*$/.test(data)) {
    errors.data = "Must be 0x-prefixed hex.";
  }

  if (parseIntegerField(draft.nonce) === null) {
    errors.nonce = "Required. Read it from a block explorer.";
  }

  const gas = parseIntegerField(draft.gas);
  if (gas === null) {
    errors.gas = "Required.";
  } else if (gas < 21_000n) {
    errors.gas = "Minimum is 21000.";
  }

  const maxFee = parseDecimalField(draft.maxFeeGwei, parseGwei);
  if (maxFee === null) errors.maxFeeGwei = "Required, in gwei.";

  const priorityFee = parseDecimalField(draft.priorityFeeGwei, parseGwei);
  if (priorityFee === null) {
    errors.priorityFeeGwei = "Required, in gwei.";
  } else if (maxFee !== null && priorityFee > maxFee) {
    errors.priorityFeeGwei = "Cannot exceed the max fee.";
  }

  if (parseIntegerField(draft.chainId) === null) {
    errors.chainId = "Required.";
  }

  return errors;
}

/**
 * Signs locally. There is no network call anywhere in this path — that is the
 * entire premise of the app, so keep it that way.
 */
export async function signDraft(
  draft: Draft,
  darkForSeconds: number | null,
): Promise<SignedDrop> {
  const privateKey = normalizePrivateKey(draft.privateKey);
  if (!privateKey) throw new Error("Private key is not valid.");

  const chainId = Number(parseIntegerField(draft.chainId));
  const account = privateKeyToAccount(privateKey);
  const data = draft.data.trim();

  const rawTx = await account.signTransaction({
    type: "eip1559",
    chainId,
    to: draft.to.trim() as Hex,
    value: parseEther(draft.valueEth.trim() || "0"),
    nonce: Number(parseIntegerField(draft.nonce)),
    gas: parseIntegerField(draft.gas)!,
    maxFeePerGas: parseDecimalField(draft.maxFeeGwei, parseGwei)!,
    maxPriorityFeePerGas: parseDecimalField(draft.priorityFeeGwei, parseGwei)!,
    ...(data ? { data: data as Hex } : {}),
  });

  const memo = buildMemo(draft.memo.trim(), darkForSeconds);
  const envelope = createEnvelope({ chainId, rawTx, ...(memo ? { memo } : {}) });

  return {
    envelope,
    encoded: encodeEnvelope(envelope),
    hash: inspectRawTx(rawTx).hash,
    from: account.address,
    darkForSeconds,
  };
}

/**
 * Stamps the drop with how long the machine had been dark when it was signed.
 * Unverifiable by anyone downstream, so it stays a human-readable note rather
 * than a structured field a relayer might be tempted to trust.
 */
function buildMemo(memo: string, darkForSeconds: number | null): string {
  if (darkForSeconds === null) return memo;
  const stamp = `signed ${formatDuration(darkForSeconds)} dark`;
  return memo ? `${memo} · ${stamp}` : stamp;
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function truncateHex(value: string, lead = 10, tail = 8): string {
  if (value.length <= lead + tail + 1) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}
