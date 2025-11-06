// src/app/api/ambientes/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Ambiente, { IAmbiente } from "@/src/lib/models/Ambiente";

// mesmos tipos da outra rota
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

// Next 13/14 app router entrega o contexto assim:
type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_req: Request, { params }: RouteContext) {
  await connectDB();
  const ambiente = await Ambiente.findById(params.id);
  if (!ambiente) {
    return NextResponse.json(
      { message: "Ambiente não encontrado" },
      { status: 404 }
    );
  }
  return NextResponse.json(ambiente);
}

export async function PATCH(req: Request, { params }: RouteContext) {
  await connectDB();
  const patchData = (await req.json()) as Partial<AmbienteInput>;

  const atual = await Ambiente.findById(params.id);
  if (!atual) {
    return NextResponse.json(
      { message: "Ambiente não encontrado" },
      { status: 404 }
    );
  }

  // montar objeto completo (atual + patch)
  const atualObj = atual.toObject() as IAmbiente;

  const bodyCompleto: AmbienteInput = {
    obraId: patchData.obraId ?? (atualObj.obraId?.toString() ?? undefined),
    andar: patchData.andar ?? atualObj.andar,
    quarto: patchData.quarto ?? atualObj.quarto,
    prefixo: patchData.prefixo ?? atualObj.prefixo,
    sequencia: patchData.sequencia ?? atualObj.sequencia,
    codigo: patchData.codigo ?? atualObj.codigo,
    medidas: {
      largura: patchData.medidas?.largura ?? atualObj.medidas?.largura,
      altura: patchData.medidas?.altura ?? atualObj.medidas?.altura,
      recuo: patchData.medidas?.recuo ?? atualObj.medidas?.recuo,
      instalacao:
        patchData.medidas?.instalacao ?? atualObj.medidas?.instalacao,
    },
    variaveis: {
      calha: patchData.variaveis?.calha ?? atualObj.variaveis?.calha,
      tecidoPrincipal:
        patchData.variaveis?.tecidoPrincipal ??
        atualObj.variaveis?.tecidoPrincipal,
      tecidoSecundario:
        patchData.variaveis?.tecidoSecundario ??
        atualObj.variaveis?.tecidoSecundario,
      regras: {
        calhaDesconto:
          patchData.variaveis?.regras?.calhaDesconto ??
          atualObj.variaveis?.regras?.calhaDesconto,
        blackoutAlturaDesconto:
          patchData.variaveis?.regras?.blackoutAlturaDesconto ??
          atualObj.variaveis?.regras?.blackoutAlturaDesconto,
        voileAlturaDesconto:
          patchData.variaveis?.regras?.voileAlturaDesconto ??
          atualObj.variaveis?.regras?.voileAlturaDesconto,
        alturaInstalacaoOffset:
          patchData.variaveis?.regras?.alturaInstalacaoOffset ??
          atualObj.variaveis?.regras?.alturaInstalacaoOffset,
      },
    },
    observacoes: patchData.observacoes ?? atualObj.observacoes,
    status: patchData.status ?? atualObj.status,
  };

  const calculado = montarCalculado(bodyCompleto);

  const atualizado = await Ambiente.findByIdAndUpdate(
    params.id,
    {
      ...patchData,
      calculado,
    },
    { new: true }
  );

  return NextResponse.json(atualizado);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  await connectDB();

  const deleted = await Ambiente.findByIdAndDelete(params.id);
  if (!deleted) {
    return NextResponse.json(
      { message: "Ambiente não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}