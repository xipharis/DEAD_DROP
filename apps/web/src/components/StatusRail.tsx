"use client";

import { chainLabel } from "@/lib/config";
import { formatDuration } from "@/lib/sign";

interface StatusRailProps {
  online: boolean | null;
  darkForSeconds: number | null;
  chainId: number;
}

/**
 * The one place the page reacts to the physical world. When the machine loses
 * its network the rail warms up and starts counting, which is the beat the
 * stage demo is built around.
 */
export function StatusRail({ online, darkForSeconds, chainId }: StatusRailProps) {
  const dark = online === false;

  return (
    <header className="rail">
      <div className="rail__state">
        <span
          className={`lamp ${dark ? "lamp--live" : ""}`}
          aria-hidden="true"
        />
        <span className="rail__text" role="status">
          {online === null
            ? "reading network state"
            : dark
              ? "browser reports no network"
              : "network up — signing still happens locally"}
        </span>
        {dark && darkForSeconds !== null ? (
          <span className="rail__timer" aria-label="time since network loss">
            {formatDuration(darkForSeconds)} dark
          </span>
        ) : null}
      </div>

      <div className="rail__brand">
        <span className="rail__wordmark">Dead Drop</span>
        <span className="rail__chain">{chainLabel(chainId)}</span>
      </div>
    </header>
  );
}
