# Dead Drop

**Broadcast an Ethereum transaction without ever touching an RPC endpoint.**

A signed transaction is just bytes. Nothing about it requires a JSON-RPC connection — that's
merely the pipe everyone happens to use. Dead Drop removes the pipe.

The browser signs offline. The resulting raw transaction leaves the machine over transports that
have nothing to do with Ethereum infrastructure — a Nostr note, a QR code on screen, a blob on the
clipboard. A swarm of volunteer relayers picks it up from wherever it lands and submits it to the
chain on the sender's behalf. The sender's network never proves they touched Ethereum, because it
never did.

> Built for the Road to Devcon hack.

---

## Why this matters

Every "self-custody" wallet still funnels through a small number of RPC providers. That chokepoint
is the soft underbelly of censorship resistance:

| Failure mode | What happens today | With Dead Drop |
| --- | --- | --- |
| RPC provider geoblocks or filters an address | Transaction never reaches a mempool | Any relayer anywhere can submit it |
| Network operator blocks known RPC hosts | Wallet is dead on that network | Nostr, QR, or clipboard carry the bytes out |
| Provider logs IP ↔ address correlation | Sender is deanonymized by metadata | Relayer's IP appears on-chain, not the sender's |
| Machine has no internet at all | Nothing can be sent | Sign on an airgapped device, scan the QR |

The signing device needs exactly one thing from the outside world: a nonce, gas price, and chain ID.
Everything after that is a transport problem, and transport problems have many solutions.

---

## How it works

```
┌──────────────────────────┐
│  Browser (airplane mode) │
│                          │
│  viem.signTransaction()  │  no network calls, no wallet extension
└────────────┬─────────────┘
             │ 0x02f8… raw signed tx
             ▼
    ┌────────────────────┐
    │   Drop envelope    │  { v, chainId, rawTx, createdAt, memo? }
    └─────────┬──────────┘
              │
   ┌──────────┼──────────┬──────────────┐
   ▼          ▼          ▼              ▼
┌──────┐  ┌───────┐  ┌───────────┐  ┌────────────┐
│Nostr │  │  QR   │  │ Clipboard │  │  BLE/NFC   │
│ note │  │ code  │  │   blob    │  │ (stretch)  │
└──┬───┘  └───┬───┘  └─────┬─────┘  └─────┬──────┘
   │          │            │              │
   │      judge scans   airdrop /      side channel
   │      with phone    sneakernet
   ▼          ▼            ▼              ▼
        ┌───────────────────────────┐
        │   Volunteer relayer swarm │  subscribes to #ethrelay
        │                           │  validates → dedupes → submits
        └────────────┬──────────────┘
                     │ eth_sendRawTransaction
                     ▼
              ┌─────────────┐
              │   Sepolia   │
              └─────────────┘
```

### The envelope

One self-describing JSON payload rides every transport. A relayer that has never spoken to the
signer must be able to act on it alone:

```json
{
  "v": 1,
  "chainId": 11155111,
  "rawTx": "0x02f8720183...",
  "createdAt": 1754640000,
  "memo": "devcon demo"
}
```

### The Nostr hop

Drops publish as ordinary kind-1 notes tagged `#ethrelay`, signed with a throwaway Nostr key
generated per drop. Relays are dumb pipes here — they see a text note with a hex blob and have no
idea it's a transaction. Relayers subscribe with `{ kinds: [1], "#t": ["ethrelay"] }`.

### Relayer incentives

Broadcasting costs a relayer nothing but bandwidth — they don't pay gas, the sender already signed
for it. But there's still no reason to run one. So the sender can build a tip directly into the
transaction (a transfer to the relayer's address, or a call to a tip-splitting contract), making the
swarm incentive-compatible rather than purely altruistic. A relayer configures `MIN_TIP_WEI` and
ignores drops that don't clear its bar.

Because relaying is idempotent at the chain level — the same signed bytes produce the same
transaction hash no matter who submits them — a hundred relayers racing to broadcast is harmless.
First one wins, the rest get "already known" and move on. Redundancy is the whole point.

---

## Repository layout

```
dead-drop/
├── apps/
│   ├── web/                 Next.js offline signer + transport UI
│   │   └── src/
│   │       ├── app/         routes
│   │       ├── components/  signer form, QR panel, drop status
│   │       └── lib/         signing, nostr client, transport adapters
│   └── relayer/             Node daemon: subscribe → validate → broadcast
│       └── src/
├── packages/
│   └── protocol/            shared envelope format, Nostr schema, tx validation
│       └── src/
├── docs/                    architecture notes, demo script, threat model
├── .env.example             every knob, documented
└── pnpm-workspace.yaml
```

**Why a monorepo:** the signer and the relayer must agree byte-for-byte on the envelope format and
on what counts as a valid drop. `packages/protocol` is that contract, imported by both, so a change
to the wire format can't silently desync the two halves.

### `packages/protocol`

The shared contract. Envelope encode/decode with strict validation of untrusted input, the Nostr
event and filter schema, and offline transaction inspection (decode a raw tx to its hash, chain ID,
recipient and value without any RPC call). Both the browser preview and the relayer's admission
control run the same code.

### `apps/web`

Signs offline. Takes a private key or mnemonic, chain parameters entered by hand, and produces the
raw transaction locally via viem — no wallet extension, no provider object, no `fetch`. Then renders
the envelope as a QR code, publishes it to Nostr relays, and offers it as copyable text.

### `apps/relayer`

The volunteer daemon. Subscribes to tagged notes, decodes each envelope, rejects anything whose
signed chain ID doesn't match its configured chain or whose tip is below its threshold, dedupes by
transaction hash, and calls `eth_sendRawTransaction`. Small enough to read in one sitting and run on
a Raspberry Pi.

---

## Getting started

```bash
pnpm install
cp .env.example .env      # defaults point at Sepolia + public Nostr relays
```

Run the signer:

```bash
pnpm dev                  # http://localhost:3000
```

Run a relayer (separate terminal):

```bash
pnpm dev:relayer
```

Set `DRY_RUN=true` to watch the swarm without broadcasting: the relayer validates and logs
every drop it sees but never calls an RPC, so it needs no `RPC_URL` at all. It is the honest
way to rehearse the demo.

Everything is configured through `.env` — see `.env.example`, where each variable is documented
inline. `RPC_URL` belongs to the **relayer** and is the only endpoint that ever broadcasts a
transaction. The web app carries a separate, optional `NEXT_PUBLIC_NONCE_CHECK_RPC_URL`: right
after signing, it makes one automatic read-only call to look up the account's real next nonce and
warn if what was typed doesn't match. That check never broadcasts anything, fails soft if the
endpoint is unreachable, and signing itself still requires no network at all.

---

## Security notes

This is hackathon software. Read before pointing it at anything valuable.

- **Testnet only.** Default config targets Sepolia. Don't put mainnet keys in a web form.
- **Key handling.** Keys entered in the browser stay in memory and are never persisted or
  transmitted. That's a property of the code, not of your machine — a compromised browser is still a
  compromised browser.
- **Drops are public.** A raw signed transaction on a public Nostr relay is readable by anyone. It
  reveals the same information the mempool would have revealed a moment later, but it reveals it to
  a different audience, slightly earlier. Anyone can broadcast it. That's the design, not a leak —
  but it does mean the drop is unrecallable the instant it's published.
- **Relayers are untrusted.** They can delay a drop or drop it entirely; they cannot alter it, since
  any edit invalidates the signature. Censorship resistance here comes from having many relayers,
  not from trusting any one.
- **Replay across chains** is blocked by validating the signed chain ID against the relayer's
  configured chain before broadcasting.

## License

MIT — see [LICENSE](LICENSE).
