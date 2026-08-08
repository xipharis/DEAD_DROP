import QRCode from "qrcode";

/**
 * Dark modules on a light ground. The palette is dark, but scanners are far
 * more reliable this way and a judge's phone gets one attempt on stage — so the
 * QR keeps light-on-dark discipline even though it fights the page.
 */
const QR_OPTIONS = {
  errorCorrectionLevel: "L" as const,
  margin: 2,
  scale: 8,
  color: { dark: "#090C11ff", light: "#E8E3D8ff" },
};

export async function renderQr(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, QR_OPTIONS);
}

export function payloadBytes(payload: string): number {
  return new TextEncoder().encode(payload).length;
}
