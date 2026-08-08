import { DEFAULT_TAG, DROP_KIND, SUBSCRIBE_GRACE_SECONDS } from "./constants.js";
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
    // Publish time, deliberately not `envelope.createdAt`. The whole point is
    // that a drop is signed while dark and published whenever connectivity
    // returns — which can be much later. Relayers subscribe with `since`, and
    // relays honour it against this field, so stamping it with the signing time
    // would make every genuinely offline drop invisible to the swarm. The
    // signing time is still in the envelope, where it is advisory.
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["t", tag],
      ["chain", String(envelope.chainId)],
    ],
    content: encodeEnvelope(envelope),
  };
}

/**
 * Subscription filter the relayer daemon uses. `since` avoids replaying the
 * whole history of the tag on every restart, backed off by a grace window so a
 * publisher whose clock runs slightly behind ours is not silently filtered out.
 */
export function dropFilter(
  tag: string = DEFAULT_TAG,
  since: number = Math.floor(Date.now() / 1000) - SUBSCRIBE_GRACE_SECONDS,
) {
  return { kinds: [DROP_KIND], "#t": [tag], since };
}
