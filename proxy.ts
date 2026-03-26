import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/regulamin",
  "/polityka-prywatnosci",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path)
  );
}

function isStaticOrInternal(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/uploads") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$/) !== null
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isStaticOrInternal(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const role = token?.role as string | undefined;

  if (isPublicPath(pathname)) {
    if (isAuthenticated) {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      if (role === "CLIENT") {
        return NextResponse.redirect(new URL("/panel", req.url));
      }
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/panel", req.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/panel")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (role !== "CLIENT") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/regulamin",
    "/polityka-prywatnosci",
    "/dashboard/:path*",
    "/panel/:path*",
  ],
};