export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('0051')) {
    cleaned = '+51' + cleaned.slice(4);
  } else if (cleaned.startsWith('+51')) {
    // already canonical
  } else if (cleaned.startsWith('51') && cleaned.length === 11) {
    cleaned = '+' + cleaned;
  } else if (/^9\d{8}$/.test(cleaned)) {
    cleaned = '+51' + cleaned;
  }

  return cleaned;
}
