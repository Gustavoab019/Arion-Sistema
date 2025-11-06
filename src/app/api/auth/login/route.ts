// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/src/lib/db";
import User, { IUser } from "@/src/lib/models/User";
import { signAuthToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from "@/src/lib/auth";

type LoginBody = {
  email: string;
  senha: string;
};

export async function POST(req: Request) {
  try {
    console.log("🔵 [Login API] Iniciando processo de login");
    
    await connectDB();
    console.log("✅ [Login API] Conectado ao banco");

    const body = (await req.json()) as LoginBody;
    const { email, senha } = body;

    console.log("🔵 [Login API] Email recebido:", email);

    if (!email || !senha) {
      console.error("❌ [Login API] Email ou senha não fornecidos");
      return NextResponse.json(
        { message: "E-mail e senha obrigatórios." },
        { status: 400 }
      );
    }

    // ✅ Busca o usuário (senhaHash já vem por padrão pois não tem select: false)
    console.log("🔵 [Login API] Buscando usuário...");
    const user = await User.findOne({ email: email.toLowerCase() }).lean<IUser>();

    if (!user) {
      console.error("❌ [Login API] Usuário não encontrado:", email);
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    console.log("✅ [Login API] Usuário encontrado:", user.email);

    // ✅ Verifica se o usuário está ativo
    if (!user.ativo) {
      console.error("❌ [Login API] Usuário inativo:", email);
      return NextResponse.json(
        { message: "Usuário desativado. Contate o administrador." },
        { status: 403 }
      );
    }

    // ✅ Acessa senhaHash diretamente
    if (!user.senhaHash) {
      console.error("❌ [Login API] Usuário sem senha definida:", user.email);
      return NextResponse.json(
        { message: "Usuário sem senha definida." },
        { status: 500 }
      );
    }

    console.log("🔵 [Login API] Verificando senha...");
    const senhaOk = await bcrypt.compare(senha, user.senhaHash);
    
    if (!senhaOk) {
      console.error("❌ [Login API] Senha incorreta para:", email);
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    console.log("✅ [Login API] Senha correta");

    // Monta o token
    console.log("🔵 [Login API] Criando token JWT...");
    const token = signAuthToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });

    console.log("✅ [Login API] Token criado");

    const res = NextResponse.json({
      success: true,
      user: {
        _id: String(user._id),
        nome: user.nome,
        email: user.email,
        role: user.role,
      }
    });

    // Seta o cookie
    console.log("🔵 [Login API] Setando cookie de autenticação...");
    res.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
      // secure: process.env.NODE_ENV === 'production',
    });

    console.log("✅ [Login API] Login concluído com sucesso para:", email);

    return res;
  } catch (error) {
    console.error("❌ [Login API] Erro no servidor:", error);
    
    if (error instanceof Error) {
      console.error("❌ [Login API] Mensagem:", error.message);
      console.error("❌ [Login API] Stack:", error.stack);
    }

    return NextResponse.json(
      { 
        message: "Erro interno do servidor",
        error: process.env.NODE_ENV === "development" 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}

// Endpoint de teste GET - remova em produção
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "API de login funcionando",
    endpoint: "/api/auth/login",
    method: "POST",
    requiredFields: ["email", "senha"],
  });
}