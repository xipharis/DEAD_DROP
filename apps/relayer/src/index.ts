import { SimplePool, useWebSocketImplementation, type SubCloser } from "nostr-tools/pool";
import {
  EnvelopeError,
  TxRejected,
  decodeEnvelope,
  dropFilter,
  tipTo,
  assertRelayable,
} from "@dead-drop/protocol";
import { ConfigError, loadConfig, type RelayerConfig } from "./config.ts";
import { createBroadcaster, verifyRpc } from "./broadcast.ts";
import { amber, bone, dim, log } from "./log.ts";

/** Node had no global WebSocket before 22; nostr-tools needs one either way. */
async function ensureWebSocket(): Promise<void> {
  if (typeof globalThis.WebSocket !== "undefined") return;
  const { WebSocket } = await import("ws");
  useWebSocketImplementation(WebSocket);
}

/**
 * Remembers transaction hashes we have already acted on.
 *
 * The same drop legitimately arrives many times — one copy per relay we
 * subscribe to, plus whatever a sender rebroadcasts — and every copy carries
 * identical bytes. Keyed on the transaction hash rather than the Nostr event id
 * so a drop republished under a fresh throwaway key is still recognised.
 */
function createSeenSet(limit = 5_000) {
  const seen = new Set<string>();
  return {
    add(key: string): boolean {
      if (seen.has(key)) return false;
      if (seen.size >= limit) {
        // Insertion-ordered, so the oldest key is the first one out.
        const oldest = seen.values().next().value;
        if (oldest !== undefined) seen.delete(oldest);
      }
      seen.add(key);
      return true;
    },
    get size() {
      return seen.size;
    },
  };
}

const RETRY_BASE_MS = 5_000;
const RETRY_MAX_MS = 60_000;

const relayName = (url: string) => url.replace(/^wss?:\/\//, "").replace(/\/$/, "");

function shortHex(value: string, lead = 10, tail = 6): string {
  return value.length <= lead + tail + 1 ? value : `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

function describeTip(config: RelayerConfig): string {
  if (config.minTipWei === 0n) return "altruistic (no minimum tip)";
  return `≥ ${config.minTipWei} wei to ${shortHex(config.tipAddress ?? "")}`;
}

function banner(config: RelayerConfig): void {
  log.banner([
    bone("  dead drop · relayer"),
    dim("  ─────────────────────────────────────────────"),
    `  ${dim("chain  ")} ${config.chainId}${config.dryRun ? amber("  (dry run — nothing is broadcast)") : ""}`,
    `  ${dim("rpc    ")} ${config.dryRun ? dim("not used") : new URL(config.rpcUrl).host}`,
    `  ${dim("tag    ")} #${config.tag}`,
    `  ${dim("tip    ")} ${describeTip(config)}`,
    `  ${dim("relays ")} ${config.relays.map(relayName).join(", ")}`,
  ]);
}

async function main(): Promise<void> {
  const config = loadConfig();
  await ensureWebSocket();
  banner(config);

  await verifyRpc(config);

  const broadcast = createBroadcaster(config);
  const seen = createSeenSet();

  // A relayer earns its keep by being there when a drop lands, which may be
  // hours after it started and long after every relay has gone quiet. Ping to
  // keep the sockets from being reaped as idle, and reconnect when one drops
  // anyway — a daemon that dies silently is worse than one that never ran.
  const pool = new SimplePool({ enablePing: true, enableReconnect: true });

  // nostr-tools hangs up on a connection it considers idle after 20s, which is
  // the right default for a client that asks a question and leaves. A relayer
  // does the opposite — it holds the line open and waits, possibly for hours —
  // so idle closing is disabled rather than reconnected around.
  pool.idleTimeout = 0;

  let relayed = 0;

  const handleDrop = async (content: string, eventId: string): Promise<void> => {
    let envelope;
    try {
      envelope = decodeEnvelope(content);
    } catch (error) {
      // Kind-1 notes tagged #ethrelay are open to the world; most of what does
      // not parse is noise, not an attack. Stay quiet about it.
      if (error instanceof EnvelopeError) return;
      throw error;
    }

    let tx;
    try {
      tx = assertRelayable(envelope, {
        chainId: config.chainId,
        minTipWei: config.minTipWei,
        tipAddress: config.tipAddress,
      });
    } catch (error) {
      if (error instanceof TxRejected) {
        log.refused(`refused ${shortHex(eventId)}`, error.message);
        return;
      }
      log.refused(`undecodable transaction in ${shortHex(eventId)}`, String(error));
      return;
    }

    if (!seen.add(tx.hash)) return;

    const tip = config.tipAddress ? tipTo(tx, config.tipAddress) : 0n;
    log.seen(
      `drop ${shortHex(tx.hash)}`,
      [
        `to ${shortHex(tx.to ?? "contract creation", 8, 6)}`,
        `nonce ${tx.nonce ?? "?"}`,
        tip > 0n ? `tip ${tip} wei` : null,
        envelope.memo ? `“${envelope.memo}”` : null,
      ]
        .filter(Boolean)
        .join("  "),
    );

    const outcome = await broadcast(envelope.rawTx);
    switch (outcome.status) {
      case "sent":
        relayed += 1;
        log.sent(`relayed ${shortHex(outcome.hash)}`, `${relayed} total`);
        break;
      case "duplicate":
        log.info(`already on the wire ${shortHex(tx.hash)}`, outcome.reason);
        break;
      case "rejected":
        log.refused(`chain refused ${shortHex(tx.hash)}`, outcome.reason);
        break;
      case "error":
        log.error(`could not submit ${shortHex(tx.hash)}`, outcome.reason);
        break;
      case "held":
        log.info(`held ${shortHex(tx.hash)}`, "dry run — valid, but not broadcast");
        break;
    }
  };

  let subscription: SubCloser | null = null;
  let retryTimer: NodeJS.Timeout | null = null;
  let retryDelay = RETRY_BASE_MS;

  const open = () => {
    // Re-reading a little history on every reconnect is harmless — dedupe is
    // keyed on the transaction hash, so a replayed drop is recognised and
    // ignored rather than broadcast twice.
    subscription = pool.subscribeMany(config.relays, dropFilter(config.tag), {
      onevent(event) {
        // Never let one bad drop take the daemon down; it must outlive the demo.
        void handleDrop(event.content, event.id).catch((error) => {
          log.error("handler crashed", String(error));
        });
      },
      oneose() {
        retryDelay = RETRY_BASE_MS;
        log.info("subscribed", `listening for #${config.tag}`);
      },
      onclose(reasons) {
        reopen(reasons.map((entry) => `${relayName(entry.url)}: ${entry.reason}`).join("; "));
      },
    });
  };

  /**
   * Relays close idle connections and go down for maintenance; a volunteer
   * daemon is expected to ride that out unattended. Resubscribing immediately
   * only throws again — the sockets are still on their way down — so back off,
   * and collapse the several failures one outage produces into a single retry.
   */
  const reopen = (why: string) => {
    if (retryTimer) return;
    subscription?.close();
    subscription = null;
    log.error("subscription lost", `${why} — retrying in ${Math.round(retryDelay / 1000)}s`);
    retryTimer = setTimeout(() => {
      retryTimer = null;
      retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
      open();
    }, retryDelay);
  };

  // nostr-tools reports a send on a closing socket as a rejected promise deep
  // inside the pool, where there is nothing to catch it. Treat it as one more
  // way to learn the subscription is gone, rather than as grounds to exit.
  process.on("unhandledRejection", (reason) => {
    reopen(reason instanceof Error ? reason.message : String(reason));
  });

  open();

  // Node exits the moment nothing is left holding the event loop. Without this,
  // a relayer waiting out a backoff with no open sockets would vanish with a
  // zero exit code and an empty log, which is exactly how you lose a demo.
  const heartbeat = setInterval(() => {}, 30_000);

  const shutdown = () => {
    clearInterval(heartbeat);
    if (retryTimer) clearTimeout(retryTimer);
    subscription?.close();
    pool.close(config.relays);
    log.info("stopped", `${relayed} transaction${relayed === 1 ? "" : "s"} relayed`);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  if (error instanceof ConfigError) {
    log.error("configuration", error.message);
  } else {
    log.error("fatal", error instanceof Error ? error.message : String(error));
  }
  process.exit(1);
});
