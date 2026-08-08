import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Martian_Mono } from "next/font/google";
import "./globals.css";

// next/font self-hosts these at build time, so the running app makes no font
// requests — which matters when the whole point is signing with no network.
const display = Martian_Mono({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-display",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Dead Drop — offline signer",
  description:
    "Sign an Ethereum transaction with no network, then send it out over Nostr, QR, or clipboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
