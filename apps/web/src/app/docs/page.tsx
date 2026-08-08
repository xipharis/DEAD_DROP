"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { PageShell } from "@/components/layout/PageShell";
import { ScrollStory } from "@/components/docs/ScrollStory";
import {
  MaskLines,
  ParallaxSection,
  Plate,
  Reveal,
  SectionHead,
  StaggerReveal,
} from "@/components/docs/primitives";

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-[#C8102E] origin-left z-50"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

/* ── the protocol in numbers — multi-speed parallax columns ─────────────── */

const STAT_COLUMNS: { v: string; label: string }[][] = [
  [
    { v: "0", label: "RPC calls made by the signing browser, by construction" },
    { v: "3", label: "transports out — Nostr, QR, clipboard — all equivalent" },
  ],
  [
    { v: "1", label: "envelope format, self-describing, understood by any relayer" },
    { v: "∞", label: "relayers may race the same drop; the hash is unchanged" },
  ],
  [
    { v: "2.5KB", label: "ceiling on a QR-carried drop before it must take another door" },
    { v: "1", label: "chain ID checked twice — envelope and signature must agree" },
  ],
];

function StatColumn({ column, speed }: { column: { v: string; label: string }[]; speed: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);

  return (
    <motion.div ref={ref} style={{ y }} className="space-y-12">
      {column.map((cell) => (
        <div key={cell.label}>
          <p className="font-serif text-5xl sm:text-6xl leading-none text-[#C8102E]">{cell.v}</p>
          <p className="font-serif text-sm leading-relaxed mt-3 text-[color:var(--text-muted)]">
            {cell.label}
          </p>
        </div>
      ))}
    </motion.div>
  );
}

function StatsWall() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-8">
      <SectionHead
        num="06 / In numbers"
        title="What the design costs"
        sub="Everything the protocol promises reduces to a handful of constants."
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
        {STAT_COLUMNS.map((column, i) => (
          <StatColumn key={i} column={column} speed={[26, 54, 14][i] ?? 20} />
        ))}
      </div>
    </section>
  );
}

/* ── static content ─────────────────────────────────────────────────────── */

const ADMISSION = [
  {
    label: "Envelope shape",
    lines: ["v === 1", "chainId is an integer", "rawTx matches /^0x[0-9a-f]+$/"],
    note: "Anyone can post to a public relay, so nothing that arrives is trusted. Malformed payloads are discarded before they cost anything.",
  },
  {
    label: "Chain agreement",
    lines: ["envelope.chainId === policy.chainId", "signed chainId === policy.chainId"],
    note: "Checked twice, because the envelope is only a claim. The signature is the fact — an envelope that lies about its chain is refused.",
  },
  {
    label: "Tip policy",
    lines: ["tip = (tx.to === me) ? tx.value : 0", "tip >= MIN_TIP_WEI"],
    note: "Only a direct transfer counts. A tip routed through a contract call cannot be verified without simulating it, so it counts as zero.",
  },
  {
    label: "Deduplication",
    lines: ["key = keccak256(rawTx)", "seen.has(key) → drop it"],
    note: "Keyed on the transaction hash, not the note id, so the same drop republished under a fresh throwaway key is still recognised.",
  },
];

const THREAT = [
  {
    label: "What it hides",
    quote: "The relayer's IP appears on chain, not yours.",
    note: "Your network never carries an Ethereum request, so there is no IP-to-address correlation for a provider to log.",
  },
  {
    label: "What it does not hide",
    quote: "A drop on a public relay is readable by anyone.",
    note: "It reveals what the mempool would have revealed a moment later — to a different audience, slightly earlier. Unrecallable once published.",
  },
  {
    label: "What a relayer can do",
    quote: "Delay a drop, or ignore it entirely.",
    note: "Resistance comes from having many relayers, not from trusting one. Any single relayer refusing you is survivable by design.",
  },
  {
    label: "What a relayer cannot do",
    quote: "Alter a single byte of your transaction.",
    note: "Any edit invalidates the signature. The worst a hostile relayer manages is silence.",
  },
];

export default function DocsPage() {
  return (
    <PageShell>
      <ScrollProgress />
      <div className="overflow-x-clip">
        {/* ── hero ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-10">
          <Reveal>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C8102E] mb-4">
              Dead Drop · protocol notes
            </p>
          </Reveal>
          <MaskLines
            lines={["Remove the pipe,", "keep the transaction"]}
            delay={0.05}
            className="font-display font-extrabold text-4xl sm:text-6xl tracking-tight leading-[1.05] text-[color:var(--text-primary)]"
          />
          <Reveal delay={0.25}>
            <p className="font-serif italic text-lg mt-6 max-w-2xl text-[color:var(--text-muted)]">
              A signed transaction is just bytes. Nothing about it requires a JSON-RPC
              connection — that is merely the pipe everyone happens to use. Scroll the story.
            </p>
          </Reveal>
        </section>

        <ScrollStory />

        <StatsWall />

        {/* ── 07 / THE ENVELOPE ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-8">
          <SectionHead
            num="07 / The envelope"
            title="One payload, every transport"
            sub="Deliberately plain JSON. A relayer that has never spoken to the signer must be able to act on it alone."
          />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
            <Reveal className="md:col-span-3">
              <Plate label="drop envelope · v1" tone="signal">
                <div className="font-mono text-[13px] leading-relaxed whitespace-pre text-[color:var(--text-primary)] overflow-x-auto">
                  {`{
  "v": 1,
  "chainId": 11155111,
  "rawTx": "0x02f8720183…",
  "createdAt": 1754640000,
  "memo": "devcon demo"
}`}
                </div>
              </Plate>
            </Reveal>
            <Reveal delay={0.12} className="md:col-span-2">
              <div className="h-full flex flex-col justify-center space-y-4">
                <p className="font-serif text-[15px] leading-relaxed text-[color:var(--text-muted)]">
                  <strong className="text-[color:var(--text-primary)]">rawTx</strong> is the whole
                  transaction — RLP-encoded and already signed. Everything around it exists so a
                  stranger can decide whether to act without asking anyone.
                </p>
                <p className="font-serif text-[15px] leading-relaxed text-[color:var(--text-muted)]">
                  <strong className="text-[color:var(--text-primary)]">createdAt</strong> is
                  advisory only. The Nostr note carries its own publish time, because a drop signed
                  hours ago while dark must still reach relayers subscribing from now.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── 08 / ADMISSION CONTROL ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-8">
          <SectionHead
            num="08 / Admission control"
            title="Four checks, no network"
            sub="Everything a relayer decides, it decides offline — before a single RPC call is made."
          />
          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ADMISSION.map((plate) => (
              <Plate key={plate.label} label={plate.label}>
                <div className="font-mono text-[13px] leading-relaxed whitespace-pre text-[color:var(--text-primary)] overflow-x-auto">
                  {plate.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <p className="font-serif text-sm leading-relaxed mt-4 text-[color:var(--text-muted)]">
                  {plate.note}
                </p>
              </Plate>
            ))}
          </StaggerReveal>
        </section>

        {/* ── 09 / TWO ROLES ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-8">
          <SectionHead
            num="09 / Two roles"
            title="Senders and relayers"
            sub="Neither needs to know the other exists. That is the only property that matters."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Reveal>
              <Plate label="Senders" tone="live">
                <ol className="space-y-3.5">
                  {[
                    "Read a nonce and gas price from anywhere — a block explorer, a friend, a screenshot.",
                    "Enter them by hand and sign locally. The radio can be off the whole time.",
                    "Push the bytes out any door: publish to Nostr, show the QR, copy the blob.",
                    "Optionally build a tip into the transaction so relaying pays for itself.",
                  ].map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="font-mono text-xs text-[#0B7A52] mt-0.5 flex-shrink-0">
                        0{i + 1}
                      </span>
                      <span className="font-serif text-sm leading-relaxed text-[color:var(--text-muted)]">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </Plate>
            </Reveal>
            <Reveal delay={0.1}>
              <Plate label="Relayers" tone="signal">
                <ol className="space-y-3.5">
                  {[
                    "Subscribe to the tag on as many Nostr relays as you like.",
                    "Decode and vet each drop offline; refuse the wrong chain or too small a tip.",
                    "Dedupe on the transaction hash, then submit through your own RPC.",
                    "Broadcasting costs you bandwidth, never gas — the sender already signed for it.",
                  ].map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="font-mono text-xs text-[#C8102E] mt-0.5 flex-shrink-0">
                        0{i + 1}
                      </span>
                      <span className="font-serif text-sm leading-relaxed text-[color:var(--text-muted)]">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </Plate>
            </Reveal>
          </div>
        </section>

        {/* ── 10 / ARCHITECTURE ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-8">
          <SectionHead
            num="10 / Architecture"
            title="One shared protocol, two ends"
            sub="Signer and relayer never talk to each other. They only agree on a file."
          />
          <ParallaxSection speed={18} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
            <Reveal className="md:col-span-2">
              <div className="h-full flex flex-col justify-center space-y-4">
                <p className="font-serif text-[15px] leading-relaxed text-[color:var(--text-muted)]">
                  The <strong className="text-[color:var(--text-primary)]">protocol</strong> package
                  holds the envelope format, the Nostr event shape, and the validation both sides
                  run. Because both import the same source, a drop the signer can build is a drop
                  a relayer can read.
                </p>
                <p className="font-serif text-[15px] leading-relaxed text-[color:var(--text-muted)]">
                  Signing itself never touches an RPC. The one exception: right after signing, the
                  web app makes a single automatic call to check the account&apos;s real next
                  nonce and warn if what was entered does not match — a courtesy check, not a
                  requirement, and it fails soft if unreachable.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.12} className="md:col-span-3">
              <div
                className="border border-[color:var(--border-dim)] rounded p-5 font-mono text-xs leading-loose text-[color:var(--text-muted)] overflow-x-auto"
                style={{ background: "var(--bg-surface)" }}
              >
                <p className="text-[#C8102E]">@dead-drop/protocol</p>
                <p className="pl-3">├─ envelope.ts ── create · encode · decode</p>
                <p className="pl-3">├─ nostr.ts ───── buildDropEvent · dropFilter</p>
                <p className="pl-3">├─ tx.ts ──────── inspectRawTx · assertRelayable</p>
                <p className="pl-3">└─ imported by ↓</p>
                <p className="pl-6 text-[color:var(--text-primary)]">apps/web ─── signs, never fetches</p>
                <p className="pl-6 text-[color:var(--text-primary)]">apps/relayer ─ listens, vets, broadcasts</p>
              </div>
            </Reveal>
          </ParallaxSection>
          <Reveal delay={0.2}>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 font-mono text-[10px] tracking-[0.15em] uppercase text-[color:var(--text-subtle)]">
              <span>viem EIP-1559</span>
              <span className="text-[#C8102E]">·</span>
              <span>Nostr kind-1</span>
              <span className="text-[#C8102E]">·</span>
              <span>Throwaway keys per drop</span>
              <span className="text-[#C8102E]">·</span>
              <span>Idempotent broadcast</span>
              <span className="text-[#C8102E]">·</span>
              <span>Non-custodial</span>
            </div>
          </Reveal>
        </section>

        {/* ── 11 / THREAT MODEL ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-8">
          <SectionHead
            num="11 / Threat model"
            title="What this actually buys you"
            sub="Stated plainly, including the parts that are not flattering."
          />
          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {THREAT.map((item) => (
              <Plate key={item.label} label={item.label}>
                <p className="font-serif italic text-[15px] leading-relaxed text-[color:var(--text-primary)]">
                  {item.quote}
                </p>
                <p className="font-serif text-sm leading-relaxed mt-3 text-[color:var(--text-muted)]">
                  {item.note}
                </p>
              </Plate>
            ))}
          </StaggerReveal>
          <Reveal delay={0.2}>
            <p className="font-mono text-[11px] mt-8 text-[color:var(--text-subtle)]">
              This is hackathon software, and the default configuration targets a testnet. Keys
              entered in the browser stay in memory and are never persisted or transmitted — a
              property of the code, not of your machine.
            </p>
          </Reveal>
        </section>

        {/* ── source ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <Reveal>
            <a
              href="https://github.com/PhAnToMxSD/DEAD_DROP"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-4 border border-[color:var(--border-dim)] rounded px-5 py-4 hover:border-[#C8102E] transition-colors duration-200 group"
              style={{ background: "var(--bg-surface)" }}
            >
              <span className="font-mono text-xs tracking-widest uppercase text-[color:var(--text-muted)] group-hover:text-[#C8102E] transition-colors duration-200">
                Read the source
              </span>
              <span className="font-mono text-xs text-[color:var(--text-subtle)] group-hover:text-[#C8102E] transition-colors duration-200">
                github.com/PhAnToMxSD/DEAD_DROP ↗
              </span>
            </a>
          </Reveal>
        </section>

        {/* ── closing CTA ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16">
          <Reveal>
            <div
              className="border border-[color:var(--border-dim)] rounded px-6 py-14 sm:py-16 text-center relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(120deg, var(--bg-surface) 0%, rgba(200,16,46,0.08) 50%, var(--bg-surface) 100%)",
                backgroundSize: "200% 200%",
                animation: "cta-gradient 8s ease infinite",
              }}
            >
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C8102E] mb-4 relative">
                End of transmission
              </p>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-[color:var(--text-primary)] relative">
                Sign something with the radio off
              </h2>
              <p className="font-serif italic text-base mt-4 max-w-md mx-auto text-[color:var(--text-muted)] relative">
                Switch off your Wi-Fi first. The signer will notice, and start counting.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8 relative">
                <Link
                  href="/sign"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-[#c8102e] text-white font-display font-bold text-sm tracking-wider rounded hover:bg-[#a5001b] active:scale-[0.98] transition-all"
                  style={{ boxShadow: "0 0 28px rgba(200,16,46,0.35)" }}
                >
                  Enter Protocol →
                </Link>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-[color:var(--border)] font-display font-semibold text-sm tracking-wider rounded text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:border-[#C8102E] transition-all"
                >
                  Replay the story ↑
                </button>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </PageShell>
  );
}
