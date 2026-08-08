/**
 * A relayer is something you leave running in a terminal on a projector, so the
 * log is the entire UI. One line per event, aligned, colour only where it earns
 * attention.
 */

const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;

const paint = (code: string, text: string) => (COLOR ? `\u001b[${code}m${text}\u001b[0m` : text);

const dim = (text: string) => paint("2", text);
const amber = (text: string) => paint("33", text);
const rust = (text: string) => paint("31", text);
const lock = (text: string) => paint("36", text);
const bone = (text: string) => paint("1", text);

function stamp(): string {
  // Wall-clock only; a relayer's log is read live, not correlated after the fact.
  return dim(new Date().toISOString().slice(11, 19));
}

function emit(mark: string, message: string, detail?: string): void {
  const line = `${stamp()} ${mark} ${message}${detail ? ` ${dim(detail)}` : ""}`;
  process.stdout.write(`${line}\n`);
}

export const log = {
  /** Something happened that needs no judgement. */
  info(message: string, detail?: string) {
    emit(dim("·"), message, detail);
  },
  /** A drop arrived and is being worked on. */
  seen(message: string, detail?: string) {
    emit(amber("▸"), message, detail);
  },
  /** A drop made it to the chain. */
  sent(message: string, detail?: string) {
    emit(lock("✓"), bone(message), detail);
  },
  /** A drop was refused by policy. Routine, not a fault. */
  refused(message: string, detail?: string) {
    emit(dim("✗"), dim(message), detail);
  },
  /** Something is wrong with the relayer or the network. */
  error(message: string, detail?: string) {
    emit(rust("!"), rust(message), detail);
  },
  banner(lines: string[]) {
    process.stdout.write(`\n${lines.join("\n")}\n\n`);
  },
};

export { bone, dim, amber };
