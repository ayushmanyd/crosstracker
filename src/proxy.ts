import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/server/auth/jwt";

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  const session = token
    ? await verifySessionToken(token, process.env.SESSION_SECRET ?? "")
    : null;

  if (!session && !PUBLIC_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session && PUBLIC_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/report", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
