"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ShaderBackground from "@/components/ui/ShaderBackground";
import { Wordmark } from "@/components/layout/Navbar";
import { CHAIN_ID, NOSTR_RELAYS, chainLabel } from "@/lib/config";

const fadeUp = (delay: number, duration = 0.7) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration, ease: [0.22, 1, 0.36, 1] as const },
});

const STATS = [
  { value: "0", label: "RPC calls" },
  { value: String(NOSTR_RELAYS.length), label: "Relays" },
  { value: "3", label: "Transports" },
];

export default function Landing() {
  useEffect(() => {
    document.body.classList.add("shader-bg");
    return () => document.body.classList.remove("shader-bg");
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <ShaderBackground />

      {/* ── Nav ── */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-40 px-6 h-14 flex items-center justify-between border-b backdrop-blur-md bg-[rgba(250,244,232,0.85)] border-[rgba(62,44,30,0.16)]"
        {...fadeUp(0.1, 1)}
      >
        <Link href="/" aria-label="Dead Drop home">
          <Wordmark />
        </Link>

        <div className="flex items-center gap-5">
          <Link
            href="/docs"
            className="text-xs font-display tracking-widest uppercase text-[rgba(35,24,18,0.62)] hover:text-[#231812] transition-colors duration-200"
          >
            Docs
          </Link>
          <Link
            href="/sign"
            className="text-xs font-display tracking-widest uppercase text-[#C8102E] hover:text-[#A50D24] transition-colors duration-200"
          >
            Enter →
          </Link>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center pt-14 px-6 relative">
        {/* Scrim — keeps ink text crisp over the red shader lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(247,240,227,0.85) 0%, rgba(247,240,227,0.40) 60%, transparent 100%)",
          }}
        />

        <div className="w-full text-center relative z-10 flex flex-col items-center gap-8 py-24">
          <motion.p
            className="font-mono text-[10px] sm:text-[11px] tracking-[0.3em] uppercase text-[#C8102E]"
            style={{ textShadow: "0 1px 14px rgba(247,240,227,0.95)" }}
            {...fadeUp(0.25, 1)}
          >
            Transmit · Anyone Relays · Nobody Traces
          </motion.p>

          <motion.h1
            className="font-display font-extrabold tracking-tight leading-none text-[#231812]"
            style={{
              fontSize: "clamp(2.1rem, 6.5vw, 5.5rem)",
              textShadow:
                "0 2px 28px rgba(247,240,227,0.95), 0 0 56px rgba(247,240,227,0.85)",
            }}
            {...fadeUp(0.4, 1)}
          >
            No Pipe, <span className="text-[#C8102E]">No Trace</span>
          </motion.h1>

          <motion.p
            className="font-serif italic text-base sm:text-lg max-w-lg mx-auto leading-relaxed text-[rgba(35,24,18,0.78)]"
            style={{ textShadow: "0 1px 14px rgba(247,240,227,0.95)" }}
            {...fadeUp(0.75, 1)}
          >
            A signed transaction is just bytes. Sign them with the radio off, drop them into
            any medium, and let a swarm of strangers put them on chain.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            {...fadeUp(1.05, 1)}
          >
            <Link
              href="/sign"
              className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-[#c8102e] text-white font-display font-bold text-sm tracking-wider rounded hover:bg-[#a5001b] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              style={{ boxShadow: "0 10px 32px rgba(200,16,46,0.30)" }}
            >
              Enter Protocol →
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 px-9 py-4 border font-display font-semibold text-sm tracking-wider rounded transition-all duration-200 border-[rgba(62,44,30,0.40)] text-[rgba(35,24,18,0.82)] hover:border-[#C8102E] hover:text-[#C8102E] hover:-translate-y-0.5 bg-[rgba(253,248,238,0.55)]"
              style={{ backdropFilter: "blur(8px)" }}
            >
              How It Works
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-3 gap-8 max-w-xs mx-auto pt-8 border-t border-[rgba(62,44,30,0.22)]"
            {...fadeUp(1.05, 1)}
          >
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p
                  className="font-mono text-xl text-[#C8102E]"
                  style={{ textShadow: "0 1px 14px rgba(247,240,227,0.95)" }}
                >
                  {value}
                </p>
                <p className="text-[9px] font-display tracking-widest uppercase mt-1 text-[rgba(35,24,18,0.55)]">
                  {label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* ── Tech strip ── */}
      <motion.div
        className="border-t py-4 px-6 border-[rgba(62,44,30,0.16)] bg-[rgba(250,244,232,0.70)] backdrop-blur-sm"
        {...fadeUp(0.3, 1)}
      >
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-mono tracking-wider uppercase text-[rgba(35,24,18,0.48)]">
          <span>Offline EIP-1559 Signing</span>
          <span className="text-[#C8102E]">·</span>
          <span>Nostr · QR · Clipboard</span>
          <span className="text-[#C8102E]">·</span>
          <span>Volunteer Relayer Swarm</span>
          <span className="text-[#C8102E]">·</span>
          <span>{chainLabel(CHAIN_ID)}</span>
          <span className="text-[#C8102E]">·</span>
          <span>Non-Custodial</span>
        </div>
      </motion.div>
    </div>
  );
}
