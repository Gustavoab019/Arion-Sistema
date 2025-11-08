// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/src/lib/auth";

// ✅ FORÇA o middleware a usar Node.js Runtime
export const runtime = 'nodejs';

const PROTECTED_PATHS = ["/", "/dashboard", "/medicoes", "/obras", "/calhas"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // se não for rota protegida, deixa passar
  const isProtected = PROTECTED_PATHS.some((p) =>
    pathname === p || pathname.startsWith(p + "/")
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  // pega cookie direto do request
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    console.error("[Middleware] Token não encontrado no cookie");
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  // ✅ AGORA pode usar jsonwebtoken porque está no Node.js Runtime
  const payload = verifyAuthToken(token);
  if (!payload) {
    console.error("[Middleware] Token inválido");
    const url = new URL("/login", req.url);
    const response = NextResponse.redirect(url);
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  console.log("[Middleware] Token válido para:", payload.email);
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/medicoes/:path*", "/obras/:path*", "/calhas/:path*"],
};
