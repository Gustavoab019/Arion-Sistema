// src/app/api/ambientes/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Ambiente, { IAmbiente } from "@/src/lib/models/Ambiente";
import { getCurrentUser } from "@/src/lib/getCurrentUser";
import Obra from "@/src/lib/models/Obra";
import mongoose from "mongoose";
import { dispatchNotificationsForStatus } from "@/src/lib/notifications";
import { validateStatusTransition, type AmbienteStatus as ValidatedStatus } from "@/src/lib/statusValidation";

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
  tipoMontagem?:
    | "simples"
    | "dupla_paralela"
    | "dupla_cruzada"
    | "tripla"
    | "painel_fixo_movel"
    | "sistema_quadruplo"
    | "motorizada_ondas"
    | "sistema_misto";
  tecidoPrincipal?: string;
  tecidoSecundario?: string;
  regras?: VariaveisRegrasInput;
};

type AmbienteStatus =
  | "medicao_pendente"
  | "aguardando_validacao"
  | "em_producao"
  | "producao_calha"
  | "producao_cortina"
  | "estoque_deposito"
  | "em_transito"
  | "aguardando_instalacao"
  | "instalado";

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
  status?: AmbienteStatus;
  producaoCortinaResponsavel?: string;
  producaoCalhaResponsavel?: string;
  instaladorResponsavel?: string;
  depositoPalete?: string;
  depositoLocal?: string;
  depositoRecebidoPor?: string;
  depositoRecebidoEm?: Date | string;
  expedicaoRomaneio?: string;
  expedicaoRetiradoPor?: string;
  expedicaoRetiradoEm?: Date | string;
};

type WorkflowState = {
  validadoEm?: Date;
  producaoCalhaInicio?: Date;
  producaoCalhaFim?: Date;
  producaoCortinaInicio?: Date;
  producaoCortinaFim?: Date;
  depositoEntrada?: Date;
  depositoSaida?: Date;
  expedicaoSaida?: Date;
  instalacaoInicio?: Date;
  instalacaoFim?: Date;
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

function updateWorkflowForTransition(
  workflow: WorkflowState | undefined,
  previousStatus: AmbienteStatus | null,
  nextStatus: AmbienteStatus,
  timestamp: Date
) {
  const nextWorkflow: WorkflowState = { ...(workflow ?? {}) };
  const ensure = (key: keyof WorkflowState) => {
    if (!nextWorkflow[key]) {
      nextWorkflow[key] = timestamp;
    }
  };

  if (previousStatus === "producao_calha" && nextStatus !== "producao_calha") {
    if (!nextWorkflow.producaoCalhaFim) {
      nextWorkflow.producaoCalhaFim = timestamp;
    }
  }
  if (previousStatus === "producao_cortina" && nextStatus !== "producao_cortina") {
    if (!nextWorkflow.producaoCortinaFim) {
      nextWorkflow.producaoCortinaFim = timestamp;
    }
  }

  switch (nextStatus) {
    case "aguardando_validacao":
      ensure("validadoEm");
      break;
    case "em_producao":
    case "producao_calha":
      ensure("producaoCalhaInicio");
      break;
    case "producao_cortina":
      ensure("producaoCortinaInicio");
      if (!nextWorkflow.producaoCalhaFim) {
        nextWorkflow.producaoCalhaFim = timestamp;
      }
      break;
    case "estoque_deposito":
      ensure("depositoEntrada");
      if (!nextWorkflow.producaoCalhaFim) {
        nextWorkflow.producaoCalhaFim = timestamp;
      }
      if (!nextWorkflow.producaoCortinaFim) {
        nextWorkflow.producaoCortinaFim = timestamp;
      }
      break;
    case "em_transito":
      ensure("depositoSaida");
      ensure("expedicaoSaida");
      if (!nextWorkflow.depositoEntrada) {
        nextWorkflow.depositoEntrada = timestamp;
      }
      break;
    case "aguardando_instalacao":
      ensure("instalacaoInicio");
      if (!nextWorkflow.depositoSaida) {
        nextWorkflow.depositoSaida = timestamp;
      }
      if (!nextWorkflow.expedicaoSaida) {
        nextWorkflow.expedicaoSaida = timestamp;
      }
      if (!nextWorkflow.producaoCalhaFim) {
        nextWorkflow.producaoCalhaFim = timestamp;
      }
      if (!nextWorkflow.producaoCortinaFim) {
        nextWorkflow.producaoCortinaFim = timestamp;
      }
      break;
    case "instalado":
      nextWorkflow.instalacaoFim = timestamp;
      break;
    default:
      break;
  }

  return nextWorkflow;
}

function normalizeWorkflow(
  input: IAmbiente["workflow"] | WorkflowState | undefined
): WorkflowState {
  if (!input) return {};
  const maybeDoc = input as mongoose.Document & WorkflowState;
  if (typeof maybeDoc.toObject === "function") {
    return maybeDoc.toObject();
  }
  return input as WorkflowState;
}

function shouldAutoEnviarParaProducao(data: AmbienteInput): boolean {
  const larguraValida =
    typeof data.medidas?.largura === "number" && data.medidas.largura > 0;
  const alturaValida =
    typeof data.medidas?.altura === "number" && data.medidas.altura > 0;
  const hasMedidas = larguraValida && alturaValida;
  const hasCalha = Boolean(data.variaveis?.calha && data.variaveis?.tipoMontagem);
  const hasTecidoPrincipal = Boolean(data.variaveis?.tecidoPrincipal);
  return hasMedidas && hasCalha && hasTecidoPrincipal;
}

async function usuarioPodeAcessarObra(
  user: { _id: string; role: string },
  obraId?: mongoose.Types.ObjectId | null
) {
  if (user.role === "gerente") return true;
  if (!obraId) return false;

  const permitido = await Obra.exists({
    _id: obraId,
    "responsaveis.userId": new mongoose.Types.ObjectId(user._id),
  });

  return Boolean(permitido);
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
  if (!(await usuarioPodeAcessarObra(user, ambiente.obraId))) {
    return NextResponse.json({ message: "Sem permissão." }, { status: 403 });
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

    if (!(await usuarioPodeAcessarObra(user, atual.obraId))) {
      return NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    }

    console.log("✅ [PATCH] Ambiente encontrado:", atual.codigo);

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
    tipoMontagem:
      patchData.variaveis?.tipoMontagem ??
      atualObj.variaveis?.tipoMontagem,
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
    depositoPalete: patchData.depositoPalete ?? atualObj.depositoPalete,
    depositoLocal: patchData.depositoLocal ?? atualObj.depositoLocal,
    depositoRecebidoPor:
      patchData.depositoRecebidoPor ??
      (atualObj.depositoRecebidoPor
        ? atualObj.depositoRecebidoPor.toString()
        : undefined),
    depositoRecebidoEm:
      patchData.depositoRecebidoEm ?? atualObj.depositoRecebidoEm,
    expedicaoRomaneio:
      patchData.expedicaoRomaneio ?? atualObj.expedicaoRomaneio,
    expedicaoRetiradoPor:
      patchData.expedicaoRetiradoPor ??
      (atualObj.expedicaoRetiradoPor
        ? atualObj.expedicaoRetiradoPor.toString()
        : undefined),
    expedicaoRetiradoEm:
      patchData.expedicaoRetiradoEm ?? atualObj.expedicaoRetiradoEm,
  };

    const calculado = montarCalculado(bodyCompleto);

    const duplicateQuery: Record<string, unknown> = {
      _id: { $ne: new mongoose.Types.ObjectId(params.id) },
      codigo: bodyCompleto.codigo,
    };
    if (bodyCompleto.obraId) {
      duplicateQuery.obraId = new mongoose.Types.ObjectId(bodyCompleto.obraId);
    }
    const codigoExistente = await Ambiente.exists(duplicateQuery);
    if (codigoExistente) {
      return NextResponse.json(
        { message: "Já existe um ambiente com essa etiqueta nesta obra." },
        { status: 409 }
      );
    }

    const statusAnterior = (atualObj.status ?? "medicao_pendente") as AmbienteStatus;
    const gerentePodeEnviar =
      user.role === "gerente" &&
      shouldAutoEnviarParaProducao(bodyCompleto) &&
      (statusAnterior === "medicao_pendente" || statusAnterior === "aguardando_validacao");

    let novoStatus = (patchData.status ?? statusAnterior) as AmbienteStatus;
    if (
      gerentePodeEnviar &&
      (!patchData.status || patchData.status === "aguardando_validacao")
    ) {
      novoStatus = "producao_calha";
    }

    // ✅ VALIDATE STATUS TRANSITION
    if (patchData.status && patchData.status !== statusAnterior) {
      const validation = validateStatusTransition(
        statusAnterior as ValidatedStatus,
        patchData.status as ValidatedStatus,
        user.role
      );

      if (!validation.valid) {
        console.log("❌ [PATCH] Transição de status inválida:", statusAnterior, "→", patchData.status);
        return NextResponse.json(
          { message: validation.message || "Transição de status inválida" },
          { status: 400 }
        );
      }

      console.log("✅ [PATCH] Transição de status válida:", statusAnterior, "→", patchData.status);
    }

    bodyCompleto.status = novoStatus;

    const statusAlterado = novoStatus !== statusAnterior;
    const now = new Date();

    let workflowData = normalizeWorkflow(atual.workflow as WorkflowState | undefined);
    if (statusAlterado) {
      workflowData = updateWorkflowForTransition(workflowData, statusAnterior, novoStatus, now);
    }

    const updateDoc: Record<string, unknown> = {
      ...patchData,
      status: novoStatus,
      calculado,
      updatedBy: user._id,
    };
    if (statusAlterado) {
      updateDoc.workflow = workflowData;
    }

    const updateQuery: Record<string, unknown> = {
      $set: updateDoc,
    };

    if (statusAlterado) {
      updateQuery.$push = {
        logs: {
          status: novoStatus,
          createdAt: now,
          userId: user._id,
          userNome: user.nome,
        },
      };
    }

    const atualizado = await Ambiente.findByIdAndUpdate(
      params.id,
      updateQuery,
      {
        new: true,
      }
    );

    console.log("✅ [PATCH] Ambiente atualizado com sucesso");

    if (statusAlterado && atualizado) {
      await dispatchNotificationsForStatus(atualizado, novoStatus);
    }

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
  const ambiente = await Ambiente.findById(params.id);
  if (!ambiente) {
    return NextResponse.json(
      { message: "Ambiente não encontrado" },
      { status: 404 }
    );
  }

  if (!(await usuarioPodeAcessarObra(user, ambiente.obraId))) {
    return NextResponse.json({ message: "Sem permissão." }, { status: 403 });
  }

  await Ambiente.findByIdAndDelete(params.id);

  return NextResponse.json({ ok: true });
}
