// src/app/api/obras/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Obra from "@/src/lib/models/Obra";
import { getCurrentUser } from "@/src/lib/getCurrentUser";

export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { message: "Não autenticado." },
      { status: 401 }
    );
  }

  await connectDB();
  const obras = await Obra.find().sort({ createdAt: -1 });
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

  await connectDB();
  const body = await req.json();

  // validação simples
  if (!body.nome) {
    return NextResponse.json(
      { message: "Nome da obra é obrigatório" },
      { status: 400 }
    );
  }

  const nova = await Obra.create({
    nome: body.nome,
    cliente: body.cliente,
    endereco: body.endereco,
    andarInicial: body.andarInicial,
    andarFinal: body.andarFinal,
    status: body.status,
    observacoes: body.observacoes,
  });

  return NextResponse.json(nova, { status: 201 });
}
