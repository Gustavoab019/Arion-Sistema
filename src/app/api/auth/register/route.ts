// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/src/lib/db";
import User, { IUser } from "@/src/lib/models/User";
import { signAuthToken, createAuthCookie } from "@/src/lib/auth";

type RegisterBody = {
  nome: string;
  email: string;
  senha: string;
  role?: "gerente" | "instalador" | "producao";
};

export async function POST(req: Request) {
  await connectDB();

  const body = (await req.json()) as RegisterBody;
  const { nome, email, senha, role = "instalador" } = body;

  if (!nome || !email || !senha) {
    return NextResponse.json(
      { message: "Nome, e-mail e senha são obrigatórios." },
      { status: 400 }
    );
  }

  const jaExiste = await User.findOne({ email }).lean<IUser | null>();
  if (jaExiste) {
    return NextResponse.json(
      { message: "E-mail já cadastrado." },
      { status: 409 }
    );
  }

  const hash = await bcrypt.hash(senha, 10);

  const novo = await User.create({
    nome,
    email,
    senhaHash: hash, // aqui seguimos o nome "senhaHash"
    role,
  });

  // já loga
  const token = signAuthToken({
    userId: String(novo._id),
    email: novo.email,
    role: novo.role,
  });

  const res = NextResponse.json({
    _id: String(novo._id),
    nome: novo.nome,
    email: novo.email,
    role: novo.role,
  });

  res.headers.set("Set-Cookie", createAuthCookie(token));

  return res;
}