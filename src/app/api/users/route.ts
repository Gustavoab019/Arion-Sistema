// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import User from "@/src/lib/models/User";
import { getCurrentUser } from "@/src/lib/getCurrentUser";

export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { message: "Não autenticado." },
      { status: 401 }
    );
  }

  if (user.role !== "gerente") {
    return NextResponse.json(
      { message: "Apenas gerentes podem listar usuários." },
      { status: 403 }
    );
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const roles = searchParams.getAll("role");

  const filtro: Record<string, unknown> = { ativo: true };
  if (roles.length > 0) {
    filtro.role = { $in: roles };
  }

  const usuarios = await User.find(filtro)
    .select("nome email role")
    .sort({ nome: 1 });

  return NextResponse.json(
    usuarios.map((usuario) => ({
      _id: String(usuario._id),
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
    }))
  );
}
