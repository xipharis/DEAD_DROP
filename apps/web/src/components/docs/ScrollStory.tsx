"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

/* ════════════════════════════════════════════════════════════════════════
   Stage geometry — one fixed viewBox that every chapter reuses.

   The endpoints never move: a signer on the left, a chain on the right.
   Only the middle changes, which is the whole argument. Chapter 00 puts a
   single RPC provider in that gap and strikes it out; the rest of the story
   builds what replaces it.
   ════════════════════════════════════════════════════════════════════════ */

const VB_W = 1000;
const VB_H = 560;

const SIGNER = { x: 55, y: 232, w: 150, h: 96 };
const CHAIN = { x: 845, y: 232, w: 130, h: 96 };
const RPC = { x: 430, y: 240, w: 180, h: 80 };
const ENVELOPE = { x: 255, y: 222, w: 170, h: 116 };

const T_X = 465;
const T_W = 150;
const T_H = 72;
const TRANSPORTS = [
  { y: 110, name: "NOSTR", sub: "kind-1 note" },
  { y: 244, name: "QR", sub: "on screen" },
  { y: 378, name: "CLIPBOARD", sub: "by hand" },
];

const R_CX = 740;
const R_R = 17;
const RELAYERS = [130, 230, 330, 430];

const INK = "#231812";
const CRIMSON = "#C8102E";
const EMERALD = "#0B7A52";
const SURFACE = "#FDF8EE";
const HAIR = "rgba(62,44,30,0.30)";

const cy = (box: { y: number; h: number }) => box.y + box.h / 2;
const right = (box: { x: number; w: number }) => box.x + box.w;

/* ── primitives ──────────────────────────────────────────────────────── */

function Wire({
  from,
  to,
  opacity,
  dashed = false,
  tone = HAIR,
}: {
  from: [number, number];
  to: [number, number];
  opacity: MotionValue<number>;
  dashed?: boolean;
  tone?: string;
}) {
  return (
    <motion.line
      x1={from[0]}
      y1={from[1]}
      x2={to[0]}
      y2={to[1]}
      stroke={tone}
      strokeWidth={1}
      strokeDasharray={dashed ? "3 4" : undefined}
      style={{ opacity }}
    />
  );
}

function Arrow({ x, y, opacity }: { x: number; y: number; opacity: MotionValue<number> }) {
  return (
    <motion.path
      d={`M${x - 6},${y - 4} L${x},${y} L${x - 6},${y + 4}`}
      stroke={HAIR}
      strokeWidth={1}
      fill="none"
      style={{ opacity }}
    />
  );
}

/* ── the pinned story ────────────────────────────────────────────────── */

export function ScrollStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Wheel/trackpad scrolling arrives in discrete steps; driving the stage
  // straight from it makes every chapter jump a frame at a time. A critically
  // damped spring turns those steps into a continuous glide — every transform
  // below inherits the smoothing for free.
  const t = useSpring(scrollYProgress, { stiffness: 110, damping: 28, restDelta: 0.0001 });

  /* — endpoints: present from the first frame, never leave — */
  const endsO = useTransform(t, [0.01, 0.06], [0, 1]);

  /* — chapter 00: the chokepoint — */
  const rpcO = useTransform(t, [0.02, 0.07, 0.13, 0.17], [0, 1, 1, 0]);
  const rpcWireO = useTransform(t, [0.03, 0.08, 0.13, 0.17], [0, 1, 1, 0]);
  const strikeO = useTransform(t, [0.09, 0.13, 0.14, 0.17], [0, 1, 1, 0]);
  const strikeLen = useTransform(t, [0.09, 0.13], [0, 1]);

  /* — chapter 01: signing dark — */
  const darkO = useTransform(t, [0.18, 0.23], [0, 1]);
  const darkLampO = useTransform(t, [0.19, 0.24, 0.99, 1], [0, 1, 1, 1]);

  /* — chapter 02: the envelope — */
  const envO = useTransform(t, [0.34, 0.4], [0, 1]);
  const envY = useTransform(t, [0.34, 0.41], [16, 0]);
  const envWireO = useTransform(t, [0.36, 0.42], [0, 1]);

  /* — chapter 03: the transports — */
  const tWireO = useTransform(t, [0.5, 0.57], [0, 1]);

  /* — chapter 04: the swarm — */
  const rWireO = useTransform(t, [0.68, 0.74], [0, 1]);
  const vetO = useTransform(t, [0.72, 0.77], [0, 1]);

  /* — chapter 05: the race — */
  const cWireO = useTransform(t, [0.85, 0.9], [0, 1]);
  const hashO = useTransform(t, [0.89, 0.94], [0, 1]);
  const hashY = useTransform(t, [0.89, 0.94], [12, 0]);

  const phase = useTransform(t, (v): string => {
    if (v < 0.16) return "00 — THE CHOKEPOINT";
    if (v < 0.33) return "01 — SIGN WITH THE RADIO OFF";
    if (v < 0.49) return "02 — ONE SELF-DESCRIBING ENVELOPE";
    if (v < 0.66) return "03 — EVERY DOOR IS EQUIVALENT";
    if (v < 0.84) return "04 — A SWARM OF STRANGERS";
    return "05 — THE RACE IS HARMLESS";
  });

  return (
    <div ref={ref} className="relative h-[620vh]">
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden flex flex-col items-center justify-start">
        <div className="w-full max-w-6xl px-4 pt-6">
          <motion.p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C8102E]">
            {phase}
          </motion.p>
        </div>

        <div className="relative w-full max-w-6xl flex-1 px-2">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-[78%] mt-2"
            aria-hidden="true"
          >
            {/* ── watermark ── */}
            <text
              x={VB_W - 12}
              y={VB_H - 12}
              textAnchor="end"
              className="font-mono"
              fontSize={10}
              fill={HAIR}
              letterSpacing={2}
            >
              DEAD DROP
            </text>

            {/* ── endpoints ── */}
            <motion.g style={{ opacity: endsO }}>
              <rect
                x={SIGNER.x}
                y={SIGNER.y}
                width={SIGNER.w}
                height={SIGNER.h}
                rx={4}
                fill={SURFACE}
                stroke={HAIR}
                strokeWidth={1}
              />
              <text
                x={SIGNER.x + SIGNER.w / 2}
                y={SIGNER.y + 34}
                textAnchor="middle"
                className="font-mono"
                fontSize={11}
                fill={CRIMSON}
              >
                SIGNER
              </text>
              <text
                x={SIGNER.x + SIGNER.w / 2}
                y={SIGNER.y + 56}
                textAnchor="middle"
                className="font-mono"
                fontSize={12}
                fill={INK}
              >
                browser
              </text>
              <motion.g style={{ opacity: darkLampO }}>
                <circle cx={SIGNER.x + 26} cy={SIGNER.y + 76} r={4} fill={EMERALD} />
                <text
                  x={SIGNER.x + 38}
                  y={SIGNER.y + 80}
                  className="font-mono"
                  fontSize={10}
                  fill={EMERALD}
                >
                  no network
                </text>
              </motion.g>

              <rect
                x={CHAIN.x}
                y={CHAIN.y}
                width={CHAIN.w}
                height={CHAIN.h}
                rx={4}
                fill={SURFACE}
                stroke={HAIR}
                strokeWidth={1}
              />
              <text
                x={CHAIN.x + CHAIN.w / 2}
                y={CHAIN.y + 34}
                textAnchor="middle"
                className="font-mono"
                fontSize={11}
                fill={CRIMSON}
              >
                CHAIN
              </text>
              <text
                x={CHAIN.x + CHAIN.w / 2}
                y={CHAIN.y + 58}
                textAnchor="middle"
                className="font-mono"
                fontSize={12}
                fill={INK}
              >
                sepolia
              </text>
            </motion.g>

            {/* ── 00 · the single pipe, struck out ── */}
            <Wire
              from={[right(SIGNER), cy(SIGNER)]}
              to={[RPC.x, cy(RPC)]}
              opacity={rpcWireO}
            />
            <Wire from={[right(RPC), cy(RPC)]} to={[CHAIN.x, cy(CHAIN)]} opacity={rpcWireO} />
            <motion.g style={{ opacity: rpcO }}>
              <rect
                x={RPC.x}
                y={RPC.y}
                width={RPC.w}
                height={RPC.h}
                rx={4}
                fill={SURFACE}
                stroke="rgba(200,16,46,0.5)"
                strokeWidth={1.5}
              />
              <text
                x={RPC.x + RPC.w / 2}
                y={RPC.y + 32}
                textAnchor="middle"
                className="font-mono"
                fontSize={11}
                fill={CRIMSON}
              >
                RPC PROVIDER
              </text>
              <text
                x={RPC.x + RPC.w / 2}
                y={RPC.y + 55}
                textAnchor="middle"
                className="font-mono"
                fontSize={12}
                fill={INK}
              >
                sees your IP
              </text>
            </motion.g>
            <motion.line
              x1={RPC.x - 10}
              y1={RPC.y + RPC.h + 10}
              x2={RPC.x + RPC.w + 10}
              y2={RPC.y - 10}
              stroke={CRIMSON}
              strokeWidth={2.5}
              style={{ opacity: strikeO, pathLength: strikeLen }}
            />

            {/* ── 02 · the envelope ── */}
            <Wire
              from={[right(SIGNER), cy(SIGNER)]}
              to={[ENVELOPE.x, cy(ENVELOPE)]}
              opacity={envWireO}
            />
            <Arrow x={ENVELOPE.x - 2} y={cy(ENVELOPE)} opacity={envWireO} />
            <motion.g style={{ opacity: envO, y: envY }}>
              <rect
                x={ENVELOPE.x}
                y={ENVELOPE.y}
                width={ENVELOPE.w}
                height={ENVELOPE.h}
                rx={4}
                fill={SURFACE}
                stroke="rgba(200,16,46,0.45)"
                strokeWidth={1}
              />
              <text
                x={ENVELOPE.x + 14}
                y={ENVELOPE.y + 26}
                className="font-mono"
                fontSize={10}
                fill={CRIMSON}
              >
                ENVELOPE
              </text>
              {["v: 1", "chainId: 11155111", "rawTx: 0x02f872…", "createdAt: …"].map((line, i) => (
                <text
                  key={line}
                  x={ENVELOPE.x + 14}
                  y={ENVELOPE.y + 48 + i * 17}
                  className="font-mono"
                  fontSize={11}
                  fill={INK}
                >
                  {line}
                </text>
              ))}
            </motion.g>

            {/* ── 03 · the transports ── */}
            {TRANSPORTS.map((transport, i) => {
              const inS = 0.51 + i * 0.03;
              return (
                <TransportLane
                  key={transport.name}
                  t={t}
                  transport={transport}
                  inS={inS}
                  wireO={tWireO}
                />
              );
            })}

            {/* ── 04 · the swarm ── */}
            {RELAYERS.map((ry, i) => (
              <Relayer key={ry} t={t} y={ry} i={i} vetO={vetO} />
            ))}

            {/* transports → relayers, and relayers → chain */}
            {TRANSPORTS.map((transport) =>
              RELAYERS.map((ry) => (
                <Wire
                  key={`${transport.name}-${ry}`}
                  from={[T_X + T_W, transport.y + T_H / 2]}
                  to={[R_CX - R_R, ry]}
                  opacity={rWireO}
                  dashed
                />
              )),
            )}
            {RELAYERS.map((ry) => (
              <Wire
                key={`c-${ry}`}
                from={[R_CX + R_R, ry]}
                to={[CHAIN.x, cy(CHAIN)]}
                opacity={cWireO}
              />
            ))}
            <Arrow x={CHAIN.x - 2} y={cy(CHAIN)} opacity={cWireO} />

            {/* ── 05 · one hash, however many submitters ── */}
            <motion.g style={{ opacity: hashO, y: hashY }}>
              <rect
                x={CHAIN.x - 34}
                y={CHAIN.y + CHAIN.h + 22}
                width={198}
                height={46}
                rx={4}
                fill={SURFACE}
                stroke="rgba(11,122,82,0.5)"
                strokeWidth={1.5}
              />
              <text
                x={CHAIN.x + 65}
                y={CHAIN.y + CHAIN.h + 41}
                textAnchor="middle"
                className="font-mono"
                fontSize={10}
                fill={EMERALD}
              >
                ONE TRANSACTION HASH
              </text>
              <text
                x={CHAIN.x + 65}
                y={CHAIN.y + CHAIN.h + 59}
                textAnchor="middle"
                className="font-mono"
                fontSize={11}
                fill={INK}
              >
                0xdaead9c2…9abf34
              </text>
            </motion.g>
          </svg>

          {/* ── captions ── */}
          <Caption
            t={t}
            win={[0.0, 0.03, 0.13, 0.16]}
            num="00 / The chokepoint"
            title="One pipe, and everyone uses it"
            foot="Wallet → RPC provider → mempool. The provider learns which address you are, and from where."
          >
            Self-custody ends at the RPC endpoint. A handful of providers carry almost every
            transaction, and each one can filter an address, refuse a region, or simply write
            down who asked.
          </Caption>

          <Caption
            t={t}
            win={[0.18, 0.22, 0.31, 0.34]}
            num="01 / Sign dark"
            title="A signature needs no connection"
            foot="viem signs locally. The only inputs from outside are a nonce, a gas price, and a chain ID."
          >
            Signing is arithmetic over a key you already hold. Turn the radio off and it still
            works — the browser produces the same bytes it always would.
          </Caption>

          <Caption
            t={t}
            win={[0.35, 0.39, 0.47, 0.5]}
            num="02 / The envelope"
            title="Self-describing, so strangers can act"
            foot="A relayer that has never spoken to the signer must be able to act on the payload alone."
          >
            The signed transaction is wrapped in plain JSON: version, chain, raw bytes, a
            timestamp, an optional memo. No handshake, no session — everything needed to
            broadcast travels with it.
          </Caption>

          <Caption
            t={t}
            win={[0.51, 0.55, 0.63, 0.66]}
            num="03 / Every door out"
            title="Transport is a solved problem"
            foot="Nostr note · QR on screen · clipboard blob. None of them knows it is carrying Ethereum."
          >
            Once bytes exist, moving them is somebody else&apos;s solved problem. A note on a
            public relay, a square on a screen, a string in a paste buffer — the envelope does
            not care which.
          </Caption>

          <Caption
            t={t}
            win={[0.67, 0.71, 0.81, 0.84]}
            num="04 / The swarm"
            title="Untrusted, and that is the point"
            foot="Validate → dedupe → submit. Every check runs offline, before any RPC call is made."
          >
            Volunteers subscribe to the tag, decode what they find, and refuse anything for the
            wrong chain or below their tip. They can delay a drop or ignore it — they cannot
            alter it, because any edit voids the signature.
          </Caption>

          <Caption
            t={t}
            win={[0.85, 0.89, 0.98, 1.0]}
            num="05 / The race"
            title="A hundred submitters, one transaction"
            foot="Relaying is idempotent at the chain level, so redundancy costs nothing but bandwidth."
          >
            The same signed bytes produce the same hash no matter who sends them. Losers of the
            race get &ldquo;already known&rdquo; and stop. Censorship resistance here comes from
            having many relayers, not from trusting any one.
          </Caption>
        </div>
      </div>
    </div>
  );
}

/* ── a transport lane: box + wire in from the envelope ───────────────── */

function TransportLane({
  t,
  transport,
  inS,
  wireO,
}: {
  t: MotionValue<number>;
  transport: (typeof TRANSPORTS)[number];
  inS: number;
  wireO: MotionValue<number>;
}) {
  const opacity = useTransform(t, [inS, inS + 0.05], [0, 1]);
  const x = useTransform(t, [inS, inS + 0.06], [-14, 0]);
  const laneY = transport.y + T_H / 2;

  return (
    <>
      <Wire from={[right(ENVELOPE), cy(ENVELOPE)]} to={[T_X, laneY]} opacity={wireO} />
      <motion.g style={{ opacity, x }}>
        <rect
          x={T_X}
          y={transport.y}
          width={T_W}
          height={T_H}
          rx={4}
          fill={SURFACE}
          stroke={HAIR}
          strokeWidth={1}
        />
        <text
          x={T_X + T_W / 2}
          y={transport.y + 30}
          textAnchor="middle"
          className="font-mono"
          fontSize={12}
          fill={INK}
        >
          {transport.name}
        </text>
        <text
          x={T_X + T_W / 2}
          y={transport.y + 50}
          textAnchor="middle"
          className="font-mono"
          fontSize={10}
          fill="rgba(35,24,18,0.52)"
        >
          {transport.sub}
        </text>
      </motion.g>
    </>
  );
}

/* ── one relayer: a node that lights up once it has vetted the drop ──── */

function Relayer({
  t,
  y,
  i,
  vetO,
}: {
  t: MotionValue<number>;
  y: number;
  i: number;
  vetO: MotionValue<number>;
}) {
  const inS = 0.66 + i * 0.025;
  const opacity = useTransform(t, [inS, inS + 0.05], [0, 1]);
  const dy = useTransform(t, [inS, inS + 0.06], [12, 0]);

  return (
    <motion.g style={{ opacity, y: dy }}>
      <circle cx={R_CX} cy={y} r={R_R} fill={SURFACE} stroke="rgba(200,16,46,0.5)" strokeWidth={1.5} />
      <text
        x={R_CX}
        y={y + 4}
        textAnchor="middle"
        className="font-mono"
        fontSize={10}
        fill={CRIMSON}
      >
        R{i + 1}
      </text>
      <motion.g style={{ opacity: vetO }}>
        <text
          x={R_CX + R_R + 8}
          y={y + 4}
          className="font-mono"
          fontSize={9}
          fill={EMERALD}
          style={{ animation: "relayer-ok-pulse 1.4s ease-in-out infinite" }}
        >
          ok
        </text>
      </motion.g>
    </motion.g>
  );
}

/* ── crossfading caption, one per chapter ────────────────────────────── */

function Caption({
  t,
  win,
  num,
  title,
  children,
  foot,
}: {
  t: MotionValue<number>;
  win: [number, number, number, number];
  num: string;
  title: string;
  children: React.ReactNode;
  foot?: string;
}) {
  const opacity = useTransform(t, win, [0, 1, 1, 0]);
  const y = useTransform(t, win, [28, 0, 0, -18]);

  return (
    <motion.div
      style={{ opacity, y, background: SURFACE, boxShadow: "0 10px 32px rgba(62,44,30,0.14)" }}
      className="absolute left-4 right-4 bottom-2 sm:left-8 sm:right-auto sm:bottom-6 sm:max-w-md border border-[rgba(62,44,30,0.18)] rounded p-5 sm:p-6 pointer-events-none"
    >
      <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C8102E] mb-2">
        {num}
      </p>
      <h3 className="font-display font-bold text-lg sm:text-xl mb-2 text-[#231812]">{title}</h3>
      <p className="font-serif text-sm sm:text-[15px] leading-relaxed text-[rgba(35,24,18,0.85)]">
        {children}
      </p>
      {foot && (
        <p className="font-mono text-[10px] leading-relaxed mt-3 pt-3 border-t border-[rgba(62,44,30,0.14)] text-[rgba(35,24,18,0.62)]">
          {foot}
        </p>
      )}
    </motion.div>
  );
}
