import { tenantPrefixForHost } from "@/lib/tenant-routing";
import { NextRequest, NextResponse } from "next/server";

export default async function proxy(req: NextRequest): Promise<NextResponse> {
  const host = req.headers.get("host");

  if (!host) return new NextResponse("Missing Host header", { status: 400 });

  const url = req.nextUrl.clone();

  const prefix = tenantPrefixForHost(host, {
    admin: process.env.NEXT_PUBLIC_ADMIN_URL,
    dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL,
    app: process.env.NEXT_PUBLIC_APP_URL,
  });

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-url", `${req.nextUrl.pathname}${req.nextUrl.search}`);

  url.pathname = `${prefix}${url.pathname}`;

  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /_next (Next.js internals)
     * 2. /_static (inside /public)
     * 3. /assets (images inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!_next/|_static/|assets/|images/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};
