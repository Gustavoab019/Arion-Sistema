// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/src/lib/db";
import User, { IUser } from "@/src/lib/models/User";
import {
  signAuthToken,
  createAuthCookie,
} from "@/src/lib/auth";

type LoginBody = {
  email: string;
  senha: string;
};

export async function POST(req: Request) {
  await connectDB();

  const body = (await req.json()) as LoginBody;
  const { email, senha } = body;

  if (!email || !senha) {
    return NextResponse.json(
      { message: "E-mail e senha obrigatórios." },
      { status: 400 }
    );
  }

  // pegamos o usuário
  // .lean() pra vir objeto plano e poder acessar as props
  const user = await User.findOne({ email }).lean<IUser & { senha?: string; senhaHash?: string }>();
  if (!user) {
    return NextResponse.json({ message: "Usuário não encontrado." }, { status: 401 });
  }

  // seu schema pode ter "senha" ou "senhaHash"
  const storedHash = user.senha ?? user.senhaHash;
  if (!storedHash) {
    return NextResponse.json(
      { message: "Usuário sem senha definida." },
      { status: 500 }
    );
  }

  const senhaOk = await bcrypt.compare(senha, storedHash);
  if (!senhaOk) {
    return NextResponse.json({ message: "Credenciais inválidas." }, { status: 401 });
  }

  // monta o token
  const token = signAuthToken({
    userId: String(user._id),
    email: user.email,
    role: user.role,
  });

  const res = NextResponse.json({
    _id: String(user._id),
    nome: user.nome,
    email: user.email,
    role: user.role,
  });

  // seta o cookie no response
  res.headers.set("Set-Cookie", createAuthCookie(token));

  return res;
}