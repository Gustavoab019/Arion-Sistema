// src/lib/auth.ts
import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: "gerente" | "instalador" | "producao";
}

const COOKIE_NAME = "app_auth";
const DEFAULT_MAX_AGE = 60 * 60 * 8; // 8h

export function signAuthToken(payload: AuthTokenPayload): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não definido no .env");
  }
  return jwt.sign(payload, secret, { expiresIn: DEFAULT_MAX_AGE });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    return jwt.verify(token, secret) as AuthTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Cria o valor do header Set-Cookie para definir o cookie de auth.
 * Usamos isso nas rotas (/api/auth/login, /api/auth/register, /api/auth/logout)
 */
export function createAuthCookie(token: string): string {
  // path=/ e httpOnly são os mais importantes; secure deixo opcional p/ dev
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${DEFAULT_MAX_AGE}`;
}

/**
 * Cria um Set-Cookie que apaga o cookie
 */
export function createClearAuthCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

/**
 * Para usar DENTRO de route handlers (/api/**)
 * Pega o cookie do próprio Request (não usa next/headers)
 */
export function getAuthTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith(COOKIE_NAME + "=")) {
      return c.substring(COOKIE_NAME.length + 1);
    }
  }
  return null;
}