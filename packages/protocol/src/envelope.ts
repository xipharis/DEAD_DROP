import { ENVELOPE_VERSION } from "./constants.js";

/**
 * The payload that travels over every transport (Nostr note content, QR code,
 * clipboard blob). Deliberately plain JSON and self-describing: a relayer that
 * has never spoken to the signer must be able to act on it alone.
 */
export interface DropEnvelope {
  /** Envelope format version. See {@link ENVELOPE_VERSION}. */
  v: number;
  /** Chain the transaction was signed for. Relayers MUST refuse mismatches. */
  chainId: number;
  /** RLP-encoded signed transaction, 0x-prefixed hex. */
  rawTx: `0x${string}`;
  /** Unix seconds at which the drop was created. Advisory only. */
  createdAt: number;
  /** Optional free-form label shown in relayer logs and the demo UI. */
  memo?: string;
}

export class EnvelopeError extends Error {}

export function createEnvelope(input: {
  chainId: number;
  rawTx: `0x${string}`;
  memo?: string;
}): DropEnvelope {
  return {
    v: ENVELOPE_VERSION,
    chainId: input.chainId,
    rawTx: input.rawTx,
    createdAt: Math.floor(Date.now() / 1000),
    ...(input.memo ? { memo: input.memo } : {}),
  };
}

export function encodeEnvelope(envelope: DropEnvelope): string {
  return JSON.stringify(envelope);
}

/**
 * Parses and validates untrusted input from any transport. Never assume the
 * bytes came from our own web app — anyone can post to a public relay.
 */
export function decodeEnvelope(raw: string): DropEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new EnvelopeError("payload is not valid JSON");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new EnvelopeError("payload is not an object");
  }

  const candidate = parsed as Record<string, unknown>;

  if (candidate.v !== ENVELOPE_VERSION) {
    throw new EnvelopeError(`unsupported envelope version: ${String(candidate.v)}`);
  }
  if (typeof candidate.chainId !== "number" || !Number.isInteger(candidate.chainId)) {
    throw new EnvelopeError("chainId must be an integer");
  }
  if (typeof candidate.rawTx !== "string" || !/^0x[0-9a-fA-F]+$/.test(candidate.rawTx)) {
    throw new EnvelopeError("rawTx must be 0x-prefixed hex");
  }
  if (typeof candidate.createdAt !== "number") {
    throw new EnvelopeError("createdAt must be a number");
  }
  if (candidate.memo !== undefined && typeof candidate.memo !== "string") {
    throw new EnvelopeError("memo must be a string when present");
  }

  return {
    v: ENVELOPE_VERSION,
    chainId: candidate.chainId,
    rawTx: candidate.rawTx as `0x${string}`,
    createdAt: candidate.createdAt,
    ...(candidate.memo === undefined ? {} : { memo: candidate.memo }),
  };
}
