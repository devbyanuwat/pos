// ESC/POS command builder for RAW network thermal printers (TCP port 9100).
//
// Pure and dependency-free so it can run inside a Node route handler. Bytes are
// accumulated as a number[] and turned into a Buffer at the socket boundary.
//
// Thai text is encoded to single-byte TIS-620 and paired with an `ESC t`
// code-page selection. The correct page number is printer-specific, so it is
// configurable (`EscposOptions.codepage`) and meant to be calibrated with the
// built-in test print.

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export type Align = "left" | "center" | "right";

export interface EscposOptions {
  /** `ESC t n` code page used for Thai. Printer-specific — tune if Thai is garbled. */
  codepage?: number;
}

/** Fluent builder that emits a flat ESC/POS byte stream. */
export class Escpos {
  private buf: number[] = [];
  private readonly codepage: number;

  constructor(opts: EscposOptions = {}) {
    this.codepage = opts.codepage ?? 21;
  }

  /** Reset the printer and select the Thai code page. Call once, first. */
  init(): this {
    this.buf.push(ESC, 0x40); // ESC @  — initialize
    this.buf.push(ESC, 0x74, this.codepage & 0xff); // ESC t n — select character code table
    return this;
  }

  align(a: Align): this {
    const n = a === "center" ? 1 : a === "right" ? 2 : 0;
    this.buf.push(ESC, 0x61, n); // ESC a n
    return this;
  }

  bold(on: boolean): this {
    this.buf.push(ESC, 0x45, on ? 1 : 0); // ESC E n
    return this;
  }

  /** Character magnification, 1..8 for width and height. */
  size(width: number, height: number): this {
    const w = clamp(width, 1, 8) - 1;
    const h = clamp(height, 1, 8) - 1;
    this.buf.push(GS, 0x21, (w << 4) | h); // GS ! n
    return this;
  }

  /** Append TIS-620 text without a line break. */
  text(s: string): this {
    return this.raw(encodeTis620(s));
  }

  /** Append a line of TIS-620 text followed by a line feed. */
  line(s = ""): this {
    return this.raw(encodeTis620(s)).feed(1);
  }

  feed(lines = 1): this {
    for (let i = 0; i < lines; i++) this.buf.push(LF);
    return this;
  }

  /**
   * Print a Model-2 QR code. `moduleSize` is the dot size of one module (1..16);
   * keep it small enough that the code fits the paper width.
   */
  qr(data: string, moduleSize = 6): this {
    const bytes = encodeAscii(data);
    const len = bytes.length + 3;
    const pL = len & 0xff;
    const pH = (len >> 8) & 0xff;
    // Function 165: select model (50 = model 2)
    this.buf.push(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // Function 167: module size
    this.buf.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, clamp(moduleSize, 1, 16));
    // Function 169: error correction (48=L,49=M,50=Q,51=H)
    this.buf.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);
    // Function 180: store the data in the symbol storage area
    this.buf.push(GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
    this.raw(bytes);
    // Function 181: print the stored symbol
    this.buf.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    return this;
  }

  /** Feed a few lines then full-cut the paper. */
  cut(): this {
    this.feed(4);
    this.buf.push(GS, 0x56, 0x00); // GS V 0 — full cut
    return this;
  }

  raw(bytes: number[]): this {
    for (const b of bytes) this.buf.push(b & 0xff);
    return this;
  }

  bytes(): number[] {
    return this.buf;
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/** ASCII-only encoding (anything else becomes '?'). Used for QR payloads / URLs. */
function encodeAscii(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0x3f;
    out.push(cp < 0x80 ? cp : 0x3f);
  }
  return out;
}

/**
 * Encode a string to TIS-620 bytes. ASCII passes through; the Thai block
 * U+0E01..U+0E5B maps linearly to 0xA1..0xFB; everything else becomes '?'.
 */
export function encodeTis620(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0x3f;
    if (cp < 0x80) out.push(cp);
    else if (cp >= 0x0e01 && cp <= 0x0e5b) out.push(cp - 0x0e00 + 0xa0);
    else out.push(0x3f);
  }
  return out;
}
