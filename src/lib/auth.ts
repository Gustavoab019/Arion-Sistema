// src/lib/auth.ts
import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: "gerente" | "instalador" | "producao";
}

export const AUTH_COOKIE_NAME = "app_auth";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 8; // 8h

/**
 * Obtém o AUTH_SECRET do ambiente
 * ✅ Com validação melhorada
 */
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("❌ AUTH_SECRET não está definido no ambiente!");
    console.error("Certifique-se de que o arquivo .env.local contém:");
    console.error("AUTH_SECRET=sua_chave_secreta_aqui");
    throw new Error("AUTH_SECRET não definido no .env");
  }
  return secret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const secret = getAuthSecret();
  return jwt.sign(payload, secret, { expiresIn: AUTH_COOKIE_MAX_AGE });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const secret = getAuthSecret();
    return jwt.verify(token, secret) as AuthTokenPayload;
  } catch (error) {
    // ✅ Agora loga o erro para debug
    if (error instanceof Error) {
      if (error.message.includes("AUTH_SECRET")) {
        console.error("❌ Erro de configuração:", error.message);
      } else {
        console.error("❌ Token inválido:", error.message);
      }
    }
    return null;
  }
}

/**
 * Cria o valor do header Set-Cookie para definir o cookie de auth.
 * Usamos isso nas rotas (/api/auth/login, /api/auth/register, /api/auth/logout)
 */
export function createAuthCookie(token: string): string {
  // path=/ e httpOnly são os mais importantes; secure deixo opcional p/ dev
  return `${AUTH_COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${AUTH_COOKIE_MAX_AGE}`;
}

/**
 * Cria um Set-Cookie que apaga o cookie
 */
export function createClearAuthCookie(): string {
  return `${AUTH_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
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
    if (c.startsWith(AUTH_COOKIE_NAME + "=")) {
      return c.substring(AUTH_COOKIE_NAME.length + 1);
    }
  }
  return null;
}