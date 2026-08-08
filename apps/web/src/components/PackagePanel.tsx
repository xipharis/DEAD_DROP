"use client";

import { Field } from "./Field";
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
    <section className="column" aria-labelledby="package-heading">
      <h1 className="eyebrow" id="package-heading">
        The package
        <span className="eyebrow__note">signed here, on this machine</span>
      </h1>
      <p className="blurb">
        Every value below is entered by hand. Nothing is fetched, so this works with the
        radio off — read the nonce and gas price from a block explorer beforehand.
      </p>

      <div className={`notice ${risky ? "notice--warn" : ""}`}>
        <span className="lamp" aria-hidden="true" />
        <span>
          {risky ? (
            <>
              <strong>{`Chain ${chainId} carries real value.`}</strong> A key pasted into a
              browser form should be one you can afford to lose.
            </>
          ) : (
            <>
              <strong>Keys stay in memory.</strong> Never written to storage, never sent
              anywhere. A compromised browser is still a compromised browser.
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
        <div className="fieldset">
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

        <p className="legend">Destination</p>
        <div className="fieldset">
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

        <p className="legend">Chain parameters</p>
        <div className="fieldset">
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

        <button className="sign" type="submit" disabled={signing}>
          {signing ? "Signing…" : "Sign offline"}
        </button>
      </form>
    </section>
  );
}
