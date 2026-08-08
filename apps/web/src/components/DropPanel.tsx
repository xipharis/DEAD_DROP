"use client";

import { useMemo } from "react";
import { formatEther } from "viem";
import { MAX_QR_PAYLOAD_BYTES, inspectRawTx } from "@dead-drop/protocol";
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
    <div className="transport">
      <span className={`lamp ${LAMP_FOR[state.status]}`} aria-hidden="true" />
      <span>
        <span className="transport__name">{name}</span>
        <span
          className={`transport__status ${
            state.status === "sent"
              ? "transport__status--sent"
              : state.status === "failed"
                ? "transport__status--failed"
                : ""
          }`}
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
    <div className="summary__row">
      <span className="summary__key">{label}</span>
      <span className={`summary__value ${accent ? "summary__value--accent" : ""}`}>{value}</span>
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
  const tx = useMemo(
    () => (drop ? inspectRawTx(drop.envelope.rawTx) : null),
    [drop],
  );

  return (
    <section className="column column--right" aria-labelledby="drop-heading">
      <h2 className="eyebrow" id="drop-heading">
        The drop
        <span className="eyebrow__note">
          {drop ? `${payloadBytes} bytes` : "nothing signed yet"}
        </span>
      </h2>

      {!drop ? (
        <>
          <p className="blurb">
            A signed transaction is just bytes. Once they exist, every route out of this
            machine is equivalent — and none of them is an RPC endpoint.
          </p>
          <div className="empty">
            <span className="empty__title">Awaiting signature</span>
            <span className="empty__body">
              Fill in the package and sign. The drop appears here as a QR code, a Nostr
              note, and a blob you can carry off by hand.
            </span>
          </div>
        </>
      ) : (
        <>
          <p className="blurb">
            Signed and sealed. Nothing below is reversible — the moment these bytes reach
            anyone, anyone can broadcast them.
          </p>

          {qrTooLarge ? (
            <div className="notice notice--warn">
              <span className="lamp" aria-hidden="true" />
              <span>
                <strong>Too large for a QR code.</strong> This drop is {payloadBytes} bytes,
                over the {MAX_QR_PAYLOAD_BYTES}-byte ceiling. Use Nostr or the clipboard.
              </span>
            </div>
          ) : qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URI, no loader
            <img className="qr" src={qrDataUrl} alt="QR code containing the signed drop" />
          ) : null}

          <div className="summary">
            <Row label="Hash" value={truncateHex(drop.hash, 14, 12)} accent />
            <Row label="From" value={truncateHex(drop.from, 14, 12)} />
            <Row label="To" value={tx?.to ? truncateHex(tx.to, 14, 12) : "contract creation"} />
            <Row label="Value" value={`${formatEther(tx?.value ?? 0n)} ETH`} />
            <Row label="Nonce" value={String(tx?.nonce ?? "—")} />
            <Row label="Chain" value={chainLabel(drop.envelope.chainId)} />
            <Row label="Signed" value={drop.darkForSeconds === null ? "with network up" : "dark"} />
            {drop.envelope.memo ? <Row label="Memo" value={drop.envelope.memo} /> : null}
          </div>

          <p className="legend">Transports</p>
          <Transport
            name="Nostr"
            state={nostr}
            action={
              <button
                className="action"
                type="button"
                onClick={onPublish}
                disabled={nostr.status === "working"}
              >
                {nostr.status === "sent" ? "Republish" : "Publish"}
              </button>
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
              <button className="action" type="button" onClick={onCopy}>
                Copy
              </button>
            }
          />

          <p className="legend">Envelope</p>
          <pre className="hexdump">{drop.encoded}</pre>

          <p className="blurb" style={{ marginTop: 20 }}>
            Relayers listening on {relays.map(relayLabel).join(", ")} will see the note and
            race to submit it. Whoever wins, the transaction hash is the same.
          </p>
        </>
      )}
    </section>
  );
}
