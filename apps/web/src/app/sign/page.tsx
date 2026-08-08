"use client";

import { useCallback, useEffect, useState } from "react";
import { MAX_QR_PAYLOAD_BYTES } from "@dead-drop/protocol";
import { PageShell } from "@/components/layout/PageShell";
import { PackagePanel } from "@/components/PackagePanel";
import { DropPanel, type TransportState } from "@/components/DropPanel";
import { StatusRail } from "@/components/StatusRail";
import { CHAIN_ID, NOSTR_RELAYS } from "@/lib/config";
import { publishDrop, relayLabel } from "@/lib/nostr";
import { fetchExpectedNonce } from "@/lib/nonceCheck";
import { payloadBytes, renderQr } from "@/lib/qr";
import { useAirgap } from "@/lib/useAirgap";
import {
  EMPTY_DRAFT,
  signDraft,
  validateDraft,
  type Draft,
  type SignedDrop,
} from "@/lib/sign";

const IDLE: TransportState = { status: "idle", detail: "not sent" };

export default function SignPage() {
  const { online, darkForSeconds } = useAirgap();

  const [draft, setDraft] = useState<Draft>({ ...EMPTY_DRAFT, chainId: String(CHAIN_ID) });
  const [showErrors, setShowErrors] = useState(false);
  const [signing, setSigning] = useState(false);
  const [drop, setDrop] = useState<SignedDrop | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [nostr, setNostr] = useState<TransportState>(IDLE);
  const [clipboard, setClipboard] = useState<TransportState>(IDLE);
  const [expectedNonce, setExpectedNonce] = useState<number | null>(null);
  const [checkingNonce, setCheckingNonce] = useState(false);

  const errors = validateDraft(draft);
  const encodedBytes = drop ? payloadBytes(drop.encoded) : 0;
  const qrTooLarge = encodedBytes > MAX_QR_PAYLOAD_BYTES;

  const handleChange = useCallback((field: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  }, []);

  const handleSign = useCallback(async () => {
    if (Object.keys(validateDraft(draft)).length > 0) {
      setShowErrors(true);
      return;
    }
    setSigning(true);
    try {
      const signed = await signDraft(draft, darkForSeconds);
      setDrop(signed);
      // A new signature invalidates whatever the old one had been through.
      setNostr(IDLE);
      setClipboard(IDLE);
      setShowErrors(false);
    } catch (error) {
      setShowErrors(true);
      console.error(error);
    } finally {
      setSigning(false);
    }
  }, [draft, darkForSeconds]);

  // The QR is rendered from the signed payload, never from the draft — there is
  // nothing to show until bytes exist.
  useEffect(() => {
    if (!drop || payloadBytes(drop.encoded) > MAX_QR_PAYLOAD_BYTES) {
      setQrDataUrl(null);
      return;
    }

    let live = true;
    renderQr(drop.encoded)
      .then((url) => {
        if (live) setQrDataUrl(url);
      })
      .catch(() => {
        if (live) setQrDataUrl(null);
      });
    return () => {
      live = false;
    };
  }, [drop]);

  // Runs automatically once a drop exists — the one place this app touches an
  // RPC. It only informs the warning below; a slow or unreachable check never
  // blocks publishing.
  useEffect(() => {
    if (!drop) {
      setExpectedNonce(null);
      return;
    }
    let live = true;
    setCheckingNonce(true);
    setExpectedNonce(null);
    fetchExpectedNonce(drop.from, drop.envelope.chainId)
      .then((nonce) => {
        if (live) setExpectedNonce(nonce);
      })
      .finally(() => {
        if (live) setCheckingNonce(false);
      });
    return () => {
      live = false;
    };
  }, [drop]);

  const handlePublish = useCallback(async () => {
    if (!drop) return;
    setNostr({ status: "working", detail: `reaching ${NOSTR_RELAYS.length} relays` });
    try {
      const results = await publishDrop(drop.envelope);
      const accepted = results.filter((result) => result.ok);
      if (accepted.length === 0) {
        setNostr({ status: "failed", detail: "no relay accepted the note" });
        return;
      }
      // One relay carrying the note is enough for the swarm to find it, so a
      // partial publish is still a success — just name who took it.
      setNostr({
        status: "sent",
        detail: `accepted by ${accepted.map((result) => relayLabel(result.relay)).join(", ")}`,
      });
    } catch (error) {
      setNostr({ status: "failed", detail: String(error) });
    }
  }, [drop]);

  const handleCopy = useCallback(async () => {
    if (!drop) return;
    try {
      await navigator.clipboard.writeText(drop.encoded);
      setClipboard({ status: "sent", detail: "envelope copied — carry it off by hand" });
    } catch {
      setClipboard({ status: "failed", detail: "clipboard blocked; select the envelope below" });
    }
  }, [drop]);

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4">
        <StatusRail online={online} darkForSeconds={darkForSeconds} chainId={CHAIN_ID} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pb-8">
        <PackagePanel
          draft={draft}
          errors={errors}
          showErrors={showErrors}
          signing={signing}
          onChange={handleChange}
          onSign={() => void handleSign()}
        />
        <DropPanel
          drop={drop}
          qrDataUrl={qrDataUrl}
          qrTooLarge={qrTooLarge}
          payloadBytes={encodedBytes}
          nostr={nostr}
          clipboard={clipboard}
          relays={NOSTR_RELAYS}
          expectedNonce={expectedNonce}
          checkingNonce={checkingNonce}
          onPublish={() => void handlePublish()}
          onCopy={() => void handleCopy()}
        />
      </div>
    </PageShell>
  );
}
