import type { Metadata } from "next";
import { DM_Serif_Text, JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";

// next/font self-hosts these at build time, so the running app makes no font
// requests — which matters when the whole point is signing with no network.
const display = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
});

const serif = DM_Serif_Text({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Dead Drop — Broadcast Without a Pipe",
  description:
    "Sign an Ethereum transaction with no network, then send it out over Nostr, QR, or clipboard. A volunteer swarm puts it on chain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body className={`${display.variable} ${serif.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
