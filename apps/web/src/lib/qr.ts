import QRCode from "qrcode";

/**
 * Warm ink modules on the page's own paper. Scanners want maximum contrast and
 * a judge's phone gets one attempt on stage, so this stays near-black on
 * near-white rather than reaching for the crimson accent.
 */
const QR_OPTIONS = {
  errorCorrectionLevel: "L" as const,
  margin: 2,
  scale: 8,
  color: { dark: "#231812ff", light: "#FDF8EEff" },
};

export async function renderQr(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, QR_OPTIONS);
}

export function payloadBytes(payload: string): number {
  return new TextEncoder().encode(payload).length;
}
