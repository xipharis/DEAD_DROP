"use client";

import { Field } from "./Field";
import { Button } from "@/components/ui/Button";
import { isValueBearingChain } from "@/lib/config";
import type { Draft, DraftErrors } from "@/lib/sign";

interface PackagePanelProps {
  draft: Draft;
  errors: DraftErrors;
  showErrors: boolean;
  signing: boolean;
  onChange: (field: keyof Draft, value: string) => void;
  onSign: () => void;
}

export function PackagePanel({
  draft,
  errors,
  showErrors,
  signing,
  onChange,
  onSign,
}: PackagePanelProps) {
  const errorFor = (field: keyof Draft) => (showErrors ? errors[field] : undefined);
  const chainId = Number(draft.chainId);
  const risky = Number.isInteger(chainId) && isValueBearingChain(chainId);

  return (
    <section aria-labelledby="package-heading">
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C8102E] mb-3">
        01 / The package
      </p>
      <h1
        id="package-heading"
        className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-[color:var(--text-primary)]"
      >
        Signed here, on this machine
      </h1>
      <p className="font-serif italic text-base mt-3 mb-7 max-w-md text-[color:var(--text-muted)]">
        Every value below is entered by hand. Nothing is fetched, so this works with the radio
        off — read the nonce and gas price from a block explorer beforehand.
      </p>

      <div
        className={`flex gap-3 border rounded px-4 py-3 mb-7 text-sm ${
          risky ? "border-[rgba(180,35,24,0.45)]" : "border-[color:var(--border-dim)]"
        }`}
        style={{ background: risky ? "rgba(180,35,24,0.06)" : "var(--bg-surface)" }}
      >
        <span className={`lamp mt-1.5 ${risky ? "lamp--failed" : ""}`} aria-hidden="true" />
        <span className="font-serif leading-relaxed text-[color:var(--text-muted)]">
          {risky ? (
            <>
              <strong className="font-display font-bold text-[#B42318]">
                Chain {chainId} carries real value.
              </strong>{" "}
              A key pasted into a browser form should be one you can afford to lose.
            </>
          ) : (
            <>
              <strong className="font-display font-bold text-[color:var(--text-primary)]">
                Keys stay in memory.
              </strong>{" "}
              Never written to storage, never sent anywhere. A compromised browser is still a
              compromised browser.
            </>
          )}
        </span>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSign();
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            id="privateKey"
            label="Signing key"
            type="password"
            wide
            placeholder="0x…"
            value={draft.privateKey}
            error={errorFor("privateKey")}
            hint="64 hex characters. Use a throwaway."
            onChange={(value) => onChange("privateKey", value)}
          />
        </div>

        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[color:var(--text-subtle)] mt-7 mb-3">
          Destination
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            id="to"
            label="Recipient"
            wide
            placeholder="0x…"
            value={draft.to}
            error={errorFor("to")}
            onChange={(value) => onChange("to", value)}
          />
          <Field
            id="valueEth"
            label="Amount"
            unit="ETH"
            value={draft.valueEth}
            error={errorFor("valueEth")}
            onChange={(value) => onChange("valueEth", value)}
          />
          <Field
            id="nonce"
            label="Nonce"
            placeholder="0"
            value={draft.nonce}
            error={errorFor("nonce")}
            onChange={(value) => onChange("nonce", value)}
          />
          <Field
            id="data"
            label="Calldata"
            wide
            placeholder="0x — leave empty for a plain transfer"
            value={draft.data}
            error={errorFor("data")}
            onChange={(value) => onChange("data", value)}
          />
        </div>

        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[color:var(--text-subtle)] mt-7 mb-3">
          Chain parameters
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            id="chainId"
            label="Chain ID"
            value={draft.chainId}
            error={errorFor("chainId")}
            onChange={(value) => onChange("chainId", value)}
          />
          <Field
            id="gas"
            label="Gas limit"
            value={draft.gas}
            error={errorFor("gas")}
            onChange={(value) => onChange("gas", value)}
          />
          <Field
            id="maxFeeGwei"
            label="Max fee"
            unit="gwei"
            value={draft.maxFeeGwei}
            error={errorFor("maxFeeGwei")}
            onChange={(value) => onChange("maxFeeGwei", value)}
          />
          <Field
            id="priorityFeeGwei"
            label="Priority fee"
            unit="gwei"
            value={draft.priorityFeeGwei}
            error={errorFor("priorityFeeGwei")}
            hint="Paid to the validator, not the relayer."
            onChange={(value) => onChange("priorityFeeGwei", value)}
          />
          <Field
            id="memo"
            label="Memo"
            wide
            placeholder="Optional. Travels with the drop, not on chain."
            value={draft.memo}
            error={errorFor("memo")}
            onChange={(value) => onChange("memo", value)}
          />
        </div>

        <Button type="submit" size="lg" loading={signing} className="w-full mt-8">
          {signing ? "Signing…" : "Sign Offline →"}
        </Button>
      </form>
    </section>
  );
}
