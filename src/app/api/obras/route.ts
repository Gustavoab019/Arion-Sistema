// src/app/api/obras/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Obra from "@/src/lib/models/Obra";
import User from "@/src/lib/models/User";
import { getCurrentUser } from "@/src/lib/getCurrentUser";
import mongoose from "mongoose";

async function montarResponsaveis(responsavelIds?: unknown) {
  if (!Array.isArray(responsavelIds) || responsavelIds.length === 0) {
    return [];
  }

  const ids = Array.from(new Set(responsavelIds));
  const validos = ids.filter(
    (id): id is string =>
      typeof id === "string" && mongoose.Types.ObjectId.isValid(id)
  );
  if (validos.length === 0) return [];

  const usuarios = await User.find({
    _id: { $in: validos },
    ativo: true,
  })
    .select("nome role")
    .lean();

  return usuarios.map((usuario) => ({
    userId: usuario._id,
    nome: usuario.nome,
    role: usuario.role,
  }));
}

export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { message: "Não autenticado." },
      { status: 401 }
    );
  }

  await connectDB();
  const filtro =
    user.role === "gerente"
      ? {}
      : { "responsaveis.userId": new mongoose.Types.ObjectId(user._id) };

  const obras = await Obra.find(filtro).sort({ createdAt: -1 });
  return NextResponse.json(obras);
}

export async function POST(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { message: "Não autenticado." },
      { status: 401 }
    );
  }

  if (user.role !== "gerente") {
    return NextResponse.json(
      { message: "Apenas gerentes podem criar obras." },
      { status: 403 }
    );
  }

  await connectDB();
  const body = await req.json();

  // validação simples
  if (!body.nome) {
    return NextResponse.json(
      { message: "Nome da obra é obrigatório" },
      { status: 400 }
    );
  }

  const responsaveis = await montarResponsaveis(body.responsavelIds);

  const nova = await Obra.create({
    nome: body.nome,
    cliente: body.cliente,
    endereco: body.endereco,
    andarInicial: body.andarInicial,
    andarFinal: body.andarFinal,
    status: body.status,
    observacoes: body.observacoes,
    responsaveis,
  });

  return NextResponse.json(nova, { status: 201 });
}
