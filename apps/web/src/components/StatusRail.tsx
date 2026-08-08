"use client";

import { chainLabel } from "@/lib/config";
import { formatDuration } from "@/lib/sign";
import { Badge } from "@/components/ui/Badge";

interface StatusRailProps {
  online: boolean | null;
  darkForSeconds: number | null;
  chainId: number;
}

/**
 * The one place the page reacts to the physical world. When the machine loses
 * its network the rail lights up and starts counting, which is the beat the
 * stage demo is built around.
 */
export function StatusRail({ online, darkForSeconds, chainId }: StatusRailProps) {
  const dark = online === false;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border rounded px-4 py-3 transition-colors duration-500 ${
        dark ? "border-[rgba(11,122,82,0.45)]" : "border-[color:var(--border-dim)]"
      }`}
      style={{ background: dark ? "rgba(11,122,82,0.06)" : "var(--bg-surface)" }}
    >
      <div className="flex items-center gap-3">
        <span className={`lamp ${dark ? "lamp--live" : ""}`} aria-hidden="true" />
        <span className="font-mono text-xs text-[color:var(--text-muted)]" role="status">
          {online === null
            ? "reading network state"
            : dark
              ? "browser reports no network"
              : "network up — signing still happens locally"}
        </span>
        {dark && darkForSeconds !== null ? (
          <Badge variant="live">{formatDuration(darkForSeconds)} dark</Badge>
        ) : null}
      </div>

      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[color:var(--text-subtle)]">
        {chainLabel(chainId)}
      </span>
    </div>
  );
}
