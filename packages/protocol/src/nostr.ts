import { DEFAULT_TAG, DROP_KIND } from "./constants.js";
import { encodeEnvelope, type DropEnvelope } from "./envelope.js";

/** An unsigned Nostr event, ready to be finalized with a throwaway key. */
export interface UnsignedDropEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
}

/**
 * Wraps an envelope in a Nostr note. The `t` tag is what relayers filter on;
 * the `chain` tag lets a relayer skip decoding drops for chains it does not
 * serve.
 */
export function buildDropEvent(
  envelope: DropEnvelope,
  tag: string = DEFAULT_TAG,
): UnsignedDropEvent {
  return {
    kind: DROP_KIND,
    created_at: envelope.createdAt,
    tags: [
      ["t", tag],
      ["chain", String(envelope.chainId)],
    ],
    content: encodeEnvelope(envelope),
  };
}

/** Subscription filter the relayer daemon uses. `since` avoids replaying history. */
export function dropFilter(
  tag: string = DEFAULT_TAG,
  since: number = Math.floor(Date.now() / 1000),
) {
  return { kinds: [DROP_KIND], "#t": [tag], since };
}
