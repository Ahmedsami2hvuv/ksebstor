export function normalizeImageUrl(input?: string | null) {
  const value = String(input ?? "").trim().replace(/\\/g, "/");
  if (!value) return "/file.svg";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (!value.startsWith("/") && value.includes(".") && value.includes("/")) return `https://${value}`;
  return value.startsWith("/") ? value : `/${value}`;
}
