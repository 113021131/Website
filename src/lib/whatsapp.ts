import { ownerValue } from "@/config/owner";

/**
 * Builds a wa.me link with a prefilled message.
 * Returns null while the shop's WhatsApp number is still a TODO_OWNER placeholder,
 * so the UI can show a disabled state instead of a link to nowhere.
 */
export function buildWhatsAppUrl(
  whatsappNumber: string | null | undefined,
  message: string,
): string | null {
  const raw = ownerValue(whatsappNumber);
  if (!raw) return null;

  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  if (digits.length < 8) return null;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
