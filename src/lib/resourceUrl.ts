// Returns a safe http(s) URL, or null. Resource links are rendered as <a href>
// for every dealer, so anything that isn't plain http(s) (javascript:, data:…)
// must be rejected. A bare "drive.google.com/…" is accepted as https.
export function normalizeResourceUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  try {
    const url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
