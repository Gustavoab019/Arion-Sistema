// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { verifyAuthToken } from "@/src/lib/auth";

const PROTECTED_PATHS = ["/medicoes", "/obras"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // se não for rota protegida, deixa passar
  const isProtected = PROTECTED_PATHS.some((p) =>
    pathname === p || pathname.startsWith(p + "/")
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  // pega cookie direto do request (middleware pode fazer isso)
  const token = req.cookies.get("app_auth")?.value;
  if (!token) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  // tudo certo
  return NextResponse.next();
}

// defina quais rotas o middleware deve observar
export const config = {
  matcher: ["/medicoes/:path*", "/obras/:path*"],
};