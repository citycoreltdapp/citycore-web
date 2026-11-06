export interface TenantUrls {
  admin?: string;
  dashboard?: string;
  app?: string;
}

const hostOf = (url: string | undefined) => {
  if (!url?.trim()) return null;

  try {
    return new URL(url.trim()).host.toLowerCase();
  } catch {
    return null;
  }
};

/**
 * Which app/ folder serves a host. Anything unrecognised gets the public landing site, so a stray host,
 * IP address or preview URL can never land on a private tenant.
 */
export const tenantPrefixForHost = (host: string, urls: TenantUrls) => {
  const requestHost = host.toLowerCase();

  if (requestHost === hostOf(urls.admin)) return "/admin";
  if (requestHost === hostOf(urls.dashboard)) return "/dashboard";

  return "/landing";
};
