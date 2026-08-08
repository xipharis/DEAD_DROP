import { Navbar } from "./Navbar";
import { chainLabel } from "@/lib/config";
import { CHAIN_ID } from "@/lib/config";

/** Nav + footer chrome shared by every page except the landing hero. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[rgba(62,44,30,0.18)] py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono text-[rgba(35,24,18,0.50)]">
            Dead Drop — {chainLabel(CHAIN_ID)} testnet · signing never touches an RPC
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-[rgba(35,24,18,0.50)]">
            <a
              href="https://github.com/PhAnToMxSD/DEAD_DROP"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#C8102E] transition-colors duration-200"
            >
              Source ↗
            </a>
            <span>·</span>
            <span>v0.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
