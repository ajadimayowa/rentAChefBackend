/**
 * Capitalises the first letter of each word ("sadiq kausara" → "Sadiq Kausara").
 * Only the first letter is touched, so names like "McDonald" are left intact.
 */
export const formatPersonName = (name: unknown): string =>
  String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
