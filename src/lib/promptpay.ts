// Thai PromptPay QR (EMVCo Merchant-Presented) payload builder.
// Pure, no deps. Produces a string that QrCodeView renders into a scannable,
// bank-app-payable QR. Supports mobile number, national/tax ID, and e-wallet id.

/** Tag-Length-Value field: 2-digit id + 2-digit length + value. */
function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) over the payload, upper-case hex. */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Classify a PromptPay proxy id and normalise it to the value used in tag 29.
 * - 13 digits  -> national / tax id (sub-tag 02)
 * - 15 digits  -> e-wallet id (sub-tag 03)
 * - otherwise  -> mobile number, normalised to 0066xxxxxxxxx (sub-tag 01)
 */
function resolveTarget(idRaw: string): { tag: string; value: string } | null {
  const digits = idRaw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 13) return { tag: "02", value: digits };
  if (digits.length === 15) return { tag: "03", value: digits };
  let mobile = digits.startsWith("0") ? digits.slice(1) : digits;
  if (!mobile.startsWith("66")) mobile = `66${mobile}`;
  return { tag: "01", value: mobile.padStart(13, "0") };
}

/**
 * Build a PromptPay payload for `promptpayId`, optionally fixing `amount` (THB).
 * Returns null when the id is empty/invalid. With an amount the QR is one-time
 * (dynamic); without, it is a static reusable QR.
 */
export function promptPayPayload(
  promptpayId: string | undefined | null,
  amount?: number,
): string | null {
  if (!promptpayId) return null;
  const target = resolveTarget(promptpayId);
  if (!target) return null;

  const hasAmount = typeof amount === "number" && amount > 0;
  const merchant = tlv(
    "29",
    tlv("00", "A000000677010111") + tlv(target.tag, target.value),
  );
  const payload =
    tlv("00", "01") +
    tlv("01", hasAmount ? "12" : "11") +
    merchant +
    tlv("53", "764") +
    (hasAmount ? tlv("54", amount!.toFixed(2)) : "") +
    tlv("58", "TH") +
    "6304"; // CRC tag (63) + length (04) precede the checksum
  return payload + crc16(payload);
}
