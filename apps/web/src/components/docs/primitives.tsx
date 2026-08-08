"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerReveal({
  children,
  className = "",
  stagger = 0.08,
}: {
  children: React.ReactNode[];
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children.map((child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 22, scale: 0.97 },
            show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export function ParallaxSection({
  children,
  className = "",
  speed = 40,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/* Editorial line-mask reveal: each line rises out of an overflow-hidden
   wrapper, staggered — type appears to be unmasked rather than faded in.
   The in-view trigger MUST live on the (unclipped) container: the lines
   start fully clipped by the mask, so observing them directly would never
   report an intersection and the reveal would never fire. */
const maskLineVariant = {
  hidden: { y: "112%" },
  show: { y: "0%", transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as const } },
};

export function MaskLines({
  lines,
  className = "",
  lineClassName = "",
  delay = 0,
}: {
  lines: React.ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-70px" }}
      custom={delay}
      variants={{
        hidden: {},
        show: (d: number) => ({ transition: { staggerChildren: 0.09, delayChildren: d } }),
      }}
    >
      {lines.map((line, index) => (
        <span key={index} className="block overflow-hidden">
          <motion.span variants={maskLineVariant} className={`block ${lineClassName}`}>
            {line}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
}

export function SectionHead({
  num,
  title,
  sub,
}: {
  num: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-10">
      <Reveal>
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C8102E] mb-3">
          {num}
        </p>
      </Reveal>
      <MaskLines
        lines={[title]}
        delay={0.05}
        className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-[color:var(--text-primary)]"
      />
      {sub && (
        <Reveal delay={0.18}>
          <p className="font-serif italic text-base mt-3 max-w-xl text-[color:var(--text-muted)]">
            {sub}
          </p>
        </Reveal>
      )}
    </div>
  );
}

export function Plate({
  label,
  children,
  tone = "dim",
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  tone?: "dim" | "signal" | "live";
  className?: string;
}) {
  const border =
    tone === "signal"
      ? "border-[rgba(200,16,46,0.35)]"
      : tone === "live"
        ? "border-[rgba(11,122,82,0.3)]"
        : "border-[color:var(--border-dim)]";
  const labelTone =
    tone === "live" ? "text-[#0B7A52]" : "text-[#C8102E]";

  return (
    <div
      className={`border ${border} rounded p-5 h-full ${className}`}
      style={{ background: "var(--bg-surface)" }}
    >
      <p className={`font-mono text-[10px] tracking-[0.25em] uppercase ${labelTone} mb-3`}>
        {label}
      </p>
      {children}
    </div>
  );
}
