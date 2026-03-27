export function normalizeImageUrl(input?: string | null) {
  const value = String(input ?? "").trim();
  if (!value) return "/file.svg";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  return value.startsWith("/") ? value : `/${value}`;
}
