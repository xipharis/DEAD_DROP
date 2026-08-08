import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseEther, parseGwei } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ENVELOPE_VERSION } from "./constants.js";
import { EnvelopeError, createEnvelope, decodeEnvelope, encodeEnvelope } from "./envelope.js";
import { buildDropEvent, dropFilter } from "./nostr.js";
import { TxRejected, assertRelayable, inspectRawTx, tipTo } from "./tx.js";

const CHAIN_ID = 11155111;
const RELAYER = "0x00000000000000000000000000000000000000A1" as const;

// Fixed key so failures are reproducible. Testnet-shaped and worthless.
const account = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
);

async function sign(overrides: { to?: `0x${string}`; value?: bigint; chainId?: number } = {}) {
  return account.signTransaction({
    type: "eip1559",
    chainId: overrides.chainId ?? CHAIN_ID,
    to: overrides.to ?? "0x000000000000000000000000000000000000dEaD",
    value: overrides.value ?? parseEther("0.001"),
    nonce: 7,
    gas: 21_000n,
    maxFeePerGas: parseGwei("30"),
    maxPriorityFeePerGas: parseGwei("1.5"),
  });
}

describe("envelope", () => {
  it("survives a round trip through the wire format", async () => {
    const rawTx = await sign();
    const envelope = createEnvelope({ chainId: CHAIN_ID, rawTx, memo: "devcon demo" });

    assert.deepEqual(decodeEnvelope(encodeEnvelope(envelope)), envelope);
  });

  it("omits an absent memo rather than encoding a null", async () => {
    const envelope = createEnvelope({ chainId: CHAIN_ID, rawTx: await sign() });

    assert.equal("memo" in envelope, false);
    assert.equal(encodeEnvelope(envelope).includes("memo"), false);
  });
});

describe("decodeEnvelope rejects untrusted input", () => {
  const cases: Array<[string, string]> = [
    ["not json at all", "not valid JSON"],
    ["[]", "not an object"],
    [JSON.stringify({ v: 99, chainId: 1, rawTx: "0xab", createdAt: 0 }), "version"],
    [JSON.stringify({ v: ENVELOPE_VERSION, chainId: 1.5, rawTx: "0xab", createdAt: 0 }), "chainId"],
    [JSON.stringify({ v: ENVELOPE_VERSION, chainId: 1, rawTx: "nope", createdAt: 0 }), "rawTx"],
    [
      JSON.stringify({ v: ENVELOPE_VERSION, chainId: 1, rawTx: "0xab", createdAt: 0, memo: 4 }),
      "memo",
    ],
  ];

  for (const [input, expected] of cases) {
    it(`refuses ${expected}`, () => {
      assert.throws(() => decodeEnvelope(input), EnvelopeError);
    });
  }
});

describe("buildDropEvent", () => {
  it("stamps the note with publish time, not signing time", async () => {
    // The failure this guards against is silent: a drop signed hours ago while
    // dark, then published, carries an old `created_at` and every relayer's
    // `since` filter drops it. The swarm simply never sees the transaction.
    const envelope = {
      ...createEnvelope({ chainId: CHAIN_ID, rawTx: await sign() }),
      createdAt: Math.floor(Date.now() / 1000) - 7 * 3600,
    };

    const event = buildDropEvent(envelope);

    assert.ok(
      event.created_at >= Math.floor(Date.now() / 1000) - 5,
      "note timestamp must be now, or relays will filter the drop out",
    );
    assert.ok(event.created_at > dropFilter().since!);
    // The signing time survives inside the envelope, where it is advisory.
    assert.equal(decodeEnvelope(event.content).createdAt, envelope.createdAt);
  });

  it("tags the note so relayers can filter without decoding", async () => {
    const envelope = createEnvelope({ chainId: CHAIN_ID, rawTx: await sign() });

    assert.deepEqual(buildDropEvent(envelope).tags, [
      ["t", "ethrelay"],
      ["chain", String(CHAIN_ID)],
    ]);
  });
});

describe("inspectRawTx", () => {
  it("reads the transaction back out of the signed bytes", async () => {
    const rawTx = await sign({ value: parseEther("0.25") });
    const tx = inspectRawTx(rawTx);

    assert.equal(tx.chainId, CHAIN_ID);
    assert.equal(tx.value, parseEther("0.25"));
    assert.equal(tx.nonce, 7);
    assert.match(tx.hash, /^0x[0-9a-f]{64}$/);
  });
});

describe("assertRelayable", () => {
  it("accepts a matching chain", async () => {
    const envelope = createEnvelope({ chainId: CHAIN_ID, rawTx: await sign() });

    assert.equal(assertRelayable(envelope, { chainId: CHAIN_ID }).chainId, CHAIN_ID);
  });

  it("refuses a chain the relayer does not serve", async () => {
    const envelope = createEnvelope({ chainId: CHAIN_ID, rawTx: await sign() });

    assert.throws(() => assertRelayable(envelope, { chainId: 1 }), TxRejected);
  });

  it("refuses an envelope that lies about the signed chain", async () => {
    // The envelope claims mainnet; the signature says Sepolia. Trust the bytes.
    const rawTx = await sign({ chainId: CHAIN_ID });
    const envelope = { ...createEnvelope({ chainId: CHAIN_ID, rawTx }), chainId: 1 };

    assert.throws(() => assertRelayable(envelope, { chainId: 1 }), TxRejected);
  });

  it("refuses a tip below the relayer's bar", async () => {
    const rawTx = await sign({ to: RELAYER, value: parseEther("0.0001") });
    const envelope = createEnvelope({ chainId: CHAIN_ID, rawTx });

    assert.throws(
      () =>
        assertRelayable(envelope, {
          chainId: CHAIN_ID,
          minTipWei: parseEther("0.01"),
          tipAddress: RELAYER,
        }),
      TxRejected,
    );
  });

  it("accepts a tip that clears the bar", async () => {
    const rawTx = await sign({ to: RELAYER, value: parseEther("0.02") });
    const envelope = createEnvelope({ chainId: CHAIN_ID, rawTx });

    const tx = assertRelayable(envelope, {
      chainId: CHAIN_ID,
      minTipWei: parseEther("0.01"),
      tipAddress: RELAYER,
    });
    assert.equal(tipTo(tx, RELAYER), parseEther("0.02"));
  });

  it("refuses to enforce a tip it has nowhere to receive", async () => {
    const envelope = createEnvelope({ chainId: CHAIN_ID, rawTx: await sign() });

    assert.throws(
      () => assertRelayable(envelope, { chainId: CHAIN_ID, minTipWei: 1n }),
      TxRejected,
    );
  });
});

describe("tipTo", () => {
  it("matches the recipient regardless of checksum casing", async () => {
    const tx = inspectRawTx(await sign({ to: RELAYER, value: parseEther("0.5") }));

    assert.equal(tipTo(tx, RELAYER.toLowerCase() as `0x${string}`), parseEther("0.5"));
  });

  it("counts nothing for a transfer to someone else", async () => {
    const tx = inspectRawTx(await sign({ value: parseEther("0.5") }));

    assert.equal(tipTo(tx, RELAYER), 0n);
  });
});
