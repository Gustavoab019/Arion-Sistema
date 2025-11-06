// src/app/api/ambientes/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Ambiente, { IAmbiente } from "@/src/lib/models/Ambiente";
import { getCurrentUser } from "@/src/lib/getCurrentUser";
import mongoose from "mongoose";

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

// ✅ Next.js 15+ params é uma Promise
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  req: Request,
  context: RouteContext
) {
  // ✅ AWAIT params
  const params = await context.params;
  
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { message: "Não autenticado." },
      { status: 401 }
    );
  }

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

export async function PATCH(
  req: Request,
  context: RouteContext
) {
  try {
    // ✅ AWAIT params PRIMEIRO
    const params = await context.params;
    
    console.log("🔵 [PATCH] params.id:", params.id);

    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    await connectDB();
    const patchData = (await req.json()) as Partial<AmbienteInput>;

    console.log("[PATCH /api/ambientes/:id] user", user._id, "params.id", params.id);
    console.log("[PATCH /api/ambientes/:id] patchData", JSON.stringify(patchData));

    // ✅ Validação de ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      console.error("❌ [PATCH] ID inválido:", params.id);
      return NextResponse.json(
        { message: "ID inválido" },
        { status: 400 }
      );
    }

    const atual = await Ambiente.findById(params.id);
    if (!atual) {
      console.log("[PATCH /api/ambientes/:id] ambiente não encontrado", params.id);
      return NextResponse.json(
        { message: "Ambiente não encontrado" },
        { status: 404 }
      );
    }

    console.log("✅ [PATCH] Ambiente encontrado:", atual.codigo);

    // Se for apenas status (otimização)
    if (patchData.status && Object.keys(patchData).length === 1) {
      console.log("🔵 [PATCH] Atualizando apenas status:", patchData.status);
      atual.status = patchData.status;
      atual.updatedBy = new mongoose.Types.ObjectId(user._id);
      await atual.save();
      console.log("✅ [PATCH] Status atualizado com sucesso");
      return NextResponse.json(atual);
    }

    // Atualização completa
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
        updatedBy: user._id,
      },
      { new: true }
    );

    console.log("✅ [PATCH] Ambiente atualizado com sucesso");
    return NextResponse.json(atualizado);
  } catch (error) {
    console.error("❌ [PATCH] Erro:", error);
    return NextResponse.json(
      { 
        message: "Erro ao atualizar ambiente",
        error: process.env.NODE_ENV === "development" 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext
) {
  // ✅ AWAIT params
  const params = await context.params;
  
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { message: "Não autenticado." },
      { status: 401 }
    );
  }

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