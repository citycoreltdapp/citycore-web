import { SESSION_COOKIE } from "@/constant/auth";
import { type NextRequest, NextResponse } from "next/server";

const SIGN_IN = "/dashboard/signin";
const PUBLIC_AUTH = [
  "/dashboard/signin",
  "/dashboard/signup",
  "/dashboard/forgot-password",
  "/dashboard/reset-password",
];
const SIGNED_IN_REDIRECT = ["/dashboard/signin", "/dashboard/signup"];

const startsWithAny = (path: string, prefixes: string[]) =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!process.env.NEXT_PUBLIC_API_URL || !startsWithAny(pathname, ["/dashboard"])) return NextResponse.next();

  const signedIn = req.cookies.get(SESSION_COOKIE)?.value === "1";

  if (!signedIn && !startsWithAny(pathname, PUBLIC_AUTH)) {
    const url = new URL(SIGN_IN, req.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (signedIn && SIGNED_IN_REDIRECT.includes(pathname)) return NextResponse.redirect(new URL("/dashboard", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|_static/|assets/|images/|_vercel|api/|[\\w-]+\\.\\w+).*)"],
};
