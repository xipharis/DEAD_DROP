import { SimplePool, finalizeEvent, generateSecretKey } from "nostr-tools";
import { buildDropEvent, type DropEnvelope } from "@dead-drop/protocol";
import { NOSTR_RELAYS, NOSTR_TAG } from "./config";

export interface PublishResult {
  relay: string;
  ok: boolean;
  error?: string;
}

/**
 * Publishes a drop to every configured relay with a throwaway key, so drops are
 * not linkable to each other through a persistent Nostr identity.
 *
 * Resolves once every relay has settled. Partial success is still success —
 * one relay carrying the note is enough for the swarm to see it.
 */
export async function publishDrop(
  envelope: DropEnvelope,
  relays: string[] = NOSTR_RELAYS,
): Promise<PublishResult[]> {
  const secretKey = generateSecretKey();
  const event = finalizeEvent(buildDropEvent(envelope, NOSTR_TAG), secretKey);

  const pool = new SimplePool();
  try {
    const settled = await Promise.allSettled(pool.publish(relays, event));
    return settled.map((outcome, index) => ({
      relay: relays[index] ?? "unknown",
      ok: outcome.status === "fulfilled",
      ...(outcome.status === "rejected"
        ? { error: String(outcome.reason?.message ?? outcome.reason) }
        : {}),
    }));
  } finally {
    pool.close(relays);
  }
}

/** Strips `wss://` so relay names fit the panel without wrapping. */
export function relayLabel(relay: string): string {
  return relay.replace(/^wss?:\/\//, "").replace(/\/$/, "");
}
