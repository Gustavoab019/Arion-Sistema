import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { getCurrentUser } from "@/src/lib/getCurrentUser";
import MountingOption from "@/src/lib/models/MountingOption";
import type { TipoMontagem } from "@/src/lib/calhas-config";

type MountingInput = {
  nome?: string;
  descricao?: string;
  tipoBase?: TipoMontagem;
};

export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  await connectDB();
  const itens = await MountingOption.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(itens);
}

export async function POST(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }
  if (user.role !== "gerente") {
    return NextResponse.json({ message: "Somente gerentes podem cadastrar tipos de montagem." }, { status: 403 });
  }

  await connectDB();
  const payload = (await req.json()) as MountingInput;
  const nome = payload.nome?.trim();
  const descricao = payload.descricao?.trim();
  const tipoBase = payload.tipoBase;

  if (!nome) {
    return NextResponse.json({ message: "Nome é obrigatório." }, { status: 400 });
  }
  const tiposValidos: TipoMontagem[] = [
    "simples",
    "dupla_paralela",
    "dupla_cruzada",
    "tripla",
    "painel_fixo_movel",
    "sistema_quadruplo",
    "motorizada_ondas",
    "sistema_misto",
  ];
  if (!tipoBase || !tiposValidos.includes(tipoBase)) {
    return NextResponse.json({ message: "Tipo base inválido." }, { status: 400 });
  }

  const novo = await MountingOption.create({
    nome,
    descricao,
    tipoBase,
    createdBy: user._id,
    updatedBy: user._id,
  });

  return NextResponse.json(novo, { status: 201 });
}
