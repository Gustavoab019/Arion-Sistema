// src/app/api/obras/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Obra from "@/src/lib/models/Obra";

export async function GET() {
  await connectDB();
  const obras = await Obra.find().sort({ createdAt: -1 });
  return NextResponse.json(obras);
}

export async function POST(req: Request) {
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