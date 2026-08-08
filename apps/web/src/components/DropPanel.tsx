"use client";

import { useMemo } from "react";
import { formatEther } from "viem";
import { MAX_QR_PAYLOAD_BYTES, inspectRawTx } from "@dead-drop/protocol";
import { Button } from "@/components/ui/Button";
import { chainLabel } from "@/lib/config";
import { relayLabel } from "@/lib/nostr";
import { truncateHex, type SignedDrop } from "@/lib/sign";

export type TransportStatus = "idle" | "working" | "sent" | "failed";

export interface TransportState {
  status: TransportStatus;
  detail: string;
}

export interface DropPanelProps {
  drop: SignedDrop | null;
  qrDataUrl: string | null;
  qrTooLarge: boolean;
  payloadBytes: number;
  nostr: TransportState;
  clipboard: TransportState;
  relays: string[];
  onPublish: () => void;
  onCopy: () => void;
}

const LAMP_FOR: Record<TransportStatus, string> = {
  idle: "",
  working: "lamp--working",
  sent: "lamp--sent",
  failed: "lamp--failed",
};

const STATUS_TONE: Record<TransportStatus, string> = {
  idle: "text-[color:var(--text-subtle)]",
  working: "text-[#C8102E]",
  sent: "text-[#0B7A52]",
  failed: "text-[#B42318]",
};

function Transport({
  name,
  state,
  action,
}: {
  name: string;
  state: TransportState;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3.5 border-b border-[color:var(--border-dim)]">
      <span className={`lamp ${LAMP_FOR[state.status]}`} aria-hidden="true" />
      <span className="min-w-0">
        <span className="block font-mono text-sm tracking-[0.06em] text-[color:var(--text-primary)]">
          {name}
        </span>
        <span
          className={`block font-mono text-[10px] tracking-[0.1em] ${STATUS_TONE[state.status]}`}
          role="status"
        >
          {state.detail}
        </span>
      </span>
      {action ?? <span />}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[92px_minmax(0,1fr)] gap-1 sm:gap-3 px-3 py-2.5 bg-[color:var(--bg-surface)]">
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-[color:var(--text-subtle)] pt-0.5">
        {label}
      </span>
      <span
        className={`font-mono text-[13px] break-all ${
          accent ? "text-[#C8102E]" : "text-[color:var(--text-primary)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Everything downstream of the signature. The drop already exists by the time
 * this panel has anything to show — the transports below only decide who finds
 * out about it, which is why none of them can fail in a way that loses the
 * transaction.
 */
export function DropPanel({
  drop,
  qrDataUrl,
  qrTooLarge,
  payloadBytes,
  nostr,
  clipboard,
  relays,
  onPublish,
  onCopy,
}: DropPanelProps) {
  // Re-derived from the signed bytes rather than from the form, so the panel
  // shows what was actually signed — not what the user meant to sign.
  const tx = useMemo(() => (drop ? inspectRawTx(drop.envelope.rawTx) : null), [drop]);

  return (
    <section
      aria-labelledby="drop-heading"
      className="lg:border-l lg:border-[color:var(--border-dim)] lg:pl-12"
    >
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C8102E] mb-3">
        02 / The drop {drop ? `· ${payloadBytes} bytes` : ""}
      </p>
      <h2
        id="drop-heading"
        className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-[color:var(--text-primary)]"
      >
        {drop ? "Out of your hands" : "Nothing signed yet"}
      </h2>

      {!drop ? (
        <>
          <p className="font-serif italic text-base mt-3 mb-7 max-w-md text-[color:var(--text-muted)]">
            A signed transaction is just bytes. Once they exist, every route out of this machine
            is equivalent — and none of them is an RPC endpoint.
          </p>
          <div
            className="grid place-content-center gap-2 min-h-[320px] px-8 py-10 border border-dashed border-[color:var(--border)] rounded text-center"
            style={{ background: "var(--bg-surface)" }}
          >
            <span className="font-display font-bold text-[11px] tracking-[0.2em] uppercase text-[color:var(--text-subtle)]">
              Awaiting signature
            </span>
            <span className="font-serif text-sm max-w-[32ch] text-[color:var(--text-muted)]">
              Fill in the package and sign. The drop appears here as a QR code, a Nostr note,
              and a blob you can carry off by hand.
            </span>
          </div>
        </>
      ) : (
        <>
          <p className="font-serif italic text-base mt-3 mb-7 max-w-md text-[color:var(--text-muted)]">
            Signed and sealed. Nothing below is reversible — the moment these bytes reach
            anyone, anyone can broadcast them.
          </p>

          {qrTooLarge ? (
            <div
              className="flex gap-3 border border-[rgba(180,35,24,0.45)] rounded px-4 py-3 text-sm"
              style={{ background: "rgba(180,35,24,0.06)" }}
            >
              <span className="lamp lamp--failed mt-1.5" aria-hidden="true" />
              <span className="font-serif leading-relaxed text-[color:var(--text-muted)]">
                <strong className="font-display font-bold text-[#B42318]">
                  Too large for a QR code.
                </strong>{" "}
                This drop is {payloadBytes} bytes, over the {MAX_QR_PAYLOAD_BYTES}-byte ceiling.
                Use Nostr or the clipboard.
              </span>
            </div>
          ) : qrDataUrl ? (
            <div
              className="border border-[color:var(--border-dim)] rounded p-5"
              style={{ background: "var(--bg-surface)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- data URI, no loader */}
              <img
                src={qrDataUrl}
                alt="QR code containing the signed drop"
                className="block w-full max-w-[300px] mx-auto"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          ) : null}

          <div className="grid gap-px mt-7 bg-[color:var(--border-dim)] border border-[color:var(--border-dim)] rounded overflow-hidden">
            <Row label="Hash" value={truncateHex(drop.hash, 14, 12)} accent />
            <Row label="From" value={truncateHex(drop.from, 14, 12)} />
            <Row label="To" value={tx?.to ? truncateHex(tx.to, 14, 12) : "contract creation"} />
            <Row label="Value" value={`${formatEther(tx?.value ?? 0n)} ETH`} />
            <Row label="Nonce" value={String(tx?.nonce ?? "—")} />
            <Row label="Chain" value={chainLabel(drop.envelope.chainId)} />
            <Row
              label="Signed"
              value={drop.darkForSeconds === null ? "with network up" : "dark"}
            />
            {drop.envelope.memo ? <Row label="Memo" value={drop.envelope.memo} /> : null}
          </div>

          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[color:var(--text-subtle)] mt-8 mb-1">
            Transports
          </p>
          <Transport
            name="Nostr"
            state={nostr}
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={onPublish}
                disabled={nostr.status === "working"}
              >
                {nostr.status === "sent" ? "Republish" : "Publish"}
              </Button>
            }
          />
          <Transport
            name="QR"
            state={
              qrTooLarge
                ? { status: "failed", detail: "payload exceeds QR capacity" }
                : { status: qrDataUrl ? "sent" : "working", detail: "on screen — scan to relay" }
            }
          />
          <Transport
            name="Clipboard"
            state={clipboard}
            action={
              <Button variant="muted" size="sm" onClick={onCopy}>
                Copy
              </Button>
            }
          />

          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[color:var(--text-subtle)] mt-8 mb-3">
            Envelope
          </p>
          <pre
            className="border border-[color:var(--border-dim)] rounded p-3 max-h-[140px] overflow-auto font-mono text-[11px] leading-relaxed text-[color:var(--text-muted)] break-all whitespace-pre-wrap"
            style={{ background: "var(--bg-surface)" }}
          >
            {drop.encoded}
          </pre>

          <p className="font-serif text-sm leading-relaxed mt-6 text-[color:var(--text-muted)]">
            Relayers listening on {relays.map(relayLabel).join(", ")} will see the note and race
            to submit it. Whoever wins, the transaction hash is the same.
          </p>
        </>
      )}
    </section>
  );
}
