/** Bumped whenever the envelope shape changes incompatibly. */
export const ENVELOPE_VERSION = 1;

/** Nostr `t` tag that marks a note as carrying a raw Ethereum transaction. */
export const DEFAULT_TAG = "ethrelay";

/** Nostr kind used for drops. 1 = short text note, so any relay will carry it. */
export const DROP_KIND = 1;

export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
] as const;

/**
 * A QR code tops out around 2.9 KB of alphanumeric data at the error correction
 * level we use. Drops above this are transport-limited to Nostr and clipboard.
 */
export const MAX_QR_PAYLOAD_BYTES = 2_500;

/**
 * How far before startup a relayer asks relays to look. Absorbs clock skew
 * between a publisher and the daemon; dedupe handles anything it replays.
 */
export const SUBSCRIBE_GRACE_SECONDS = 120;
