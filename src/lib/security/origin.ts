export function isTrustedMutationOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite === "cross-site") return false;
  if (!origin) {
    return (
      !fetchSite || fetchSite === "same-origin" || fetchSite === "same-site"
    );
  }

  const allowedOrigins = new Set([new URL(request.url).origin]);
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredAppUrl) {
    try {
      allowedOrigins.add(new URL(configuredAppUrl).origin);
    } catch {
      return false;
    }
  }

  return allowedOrigins.has(origin);
}
