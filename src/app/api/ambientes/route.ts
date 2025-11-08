// src/app/api/ambientes/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Ambiente from "@/src/lib/models/Ambiente";
import Obra from "@/src/lib/models/Obra";
import { getCurrentUser } from "@/src/lib/getCurrentUser";
import mongoose from "mongoose";

// tipos auxiliares só pra essa rota
type MedidasInput = {
  largura?: number;
  altura?: number;
  recuo?: number;
  instalacao?: "teto" | "parede" | "embutida";
};

type VariaveisRegrasInput = {
  calhaDesconto?: number;
  blackoutAlturaDesconto?: number;
  voileAlturaDesconto?: number;
  alturaInstalacaoOffset?: number;
};

type VariaveisInput = {
  calha?: string;
  tecidoPrincipal?: string;
  tecidoSecundario?: string;
  regras?: VariaveisRegrasInput;
};

type AmbienteInput = {
  obraId?: string;
  andar?: number;
  quarto?: string;
  prefixo?: string;
  sequencia?: number;
  codigo?: string;
  medidas?: MedidasInput;
  variaveis?: VariaveisInput;
  observacoes?: string;
  status?: "pendente" | "revisar" | "completo";
};

// helper que monta o campo calculado
function montarCalculado(data: AmbienteInput) {
  const largura = data.medidas?.largura ?? 0;
  const altura = data.medidas?.altura ?? 0;

  const calhaDesconto = data.variaveis?.regras?.calhaDesconto ?? 0;
  const voileAlturaDesconto = data.variaveis?.regras?.voileAlturaDesconto ?? 0;
  const blackoutAlturaDesconto =
    data.variaveis?.regras?.blackoutAlturaDesconto ?? 0;

  const larguraCalha =
    largura > 0 ? Number((largura - calhaDesconto).toFixed(1)) : undefined;

  const alturaVoile =
    altura > 0 ? Number((altura - voileAlturaDesconto).toFixed(1)) : undefined;

  const alturaBlackout =
    altura > 0
      ? Number((altura - blackoutAlturaDesconto).toFixed(1))
      : undefined;

  return {
    larguraCalha,
    alturaVoile,
    alturaBlackout,
  };
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

  const { searchParams } = new URL(req.url);
  const quarto = searchParams.get("quarto");
  const obraId = searchParams.get("obraId");

  // sem `any` aqui
  const filtro: Record<string, unknown> = {};
  if (quarto) filtro.quarto = quarto;
  if (obraId) filtro.obraId = obraId;

  if (user.role !== "gerente") {
    const minhasObras = await Obra.find({
      "responsaveis.userId": new mongoose.Types.ObjectId(user._id),
    }).select("_id");
    const idsPermitidos = minhasObras.map((obra) => obra._id.toString());

    if (idsPermitidos.length === 0) {
      return NextResponse.json([]);
    }

    if (obraId) {
      if (!idsPermitidos.includes(obraId)) {
        return NextResponse.json({ message: "Sem permissão." }, { status: 403 });
      }
      filtro.obraId = new mongoose.Types.ObjectId(obraId);
    } else {
      filtro.obraId = {
        $in: idsPermitidos.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
  }

  const ambientes = await Ambiente.find(filtro).sort({ createdAt: -1 });
  return NextResponse.json(ambientes);
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
  const data = (await req.json()) as AmbienteInput;

  if (user.role !== "gerente") {
    if (!data.obraId) {
      return NextResponse.json(
        { message: "Obra obrigatória para criar ambiente." },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(data.obraId)) {
      return NextResponse.json(
        { message: "Obra inválida." },
        { status: 400 }
      );
    }

    const obraPermitida = await Obra.exists({
      _id: new mongoose.Types.ObjectId(data.obraId),
      "responsaveis.userId": new mongoose.Types.ObjectId(user._id),
    });
    if (!obraPermitida) {
      return NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    }
  }

  const { prefixo, quarto } = data;

  // se não veio sequência, calcula
  let sequencia = data.sequencia;
  if (!sequencia) {
    const count = await Ambiente.countDocuments({
      ...(prefixo ? { prefixo } : {}),
      ...(quarto ? { quarto } : {}),
      ...(data.obraId ? { obraId: data.obraId } : {}),
    });
    sequencia = count + 1;
  }

  // se não veio código, monta
  let codigo = data.codigo;
  if (!codigo) {
    // garante que não vai dar `AMBundefined-1` caso falte quarto
    const safePrefixo = prefixo ?? "AMB";
    const safeQuarto = quarto ?? "";
    codigo = `${safePrefixo}${safeQuarto}-${sequencia}`;
  }

  const calculado = montarCalculado(data);

  const novo = await Ambiente.create({
    ...data,
    sequencia,
    codigo,
    calculado,
    medidoPor: user.nome,
    medidoPorId: user._id,
    createdBy: user._id,
    updatedBy: user._id,
  });

  return NextResponse.json(novo, { status: 201 });
}
