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
  validadoPor?: string;
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

  const { prefixo, quarto, ...resto } = data;
  const safePrefixo = prefixo ?? "AMB";
  const safeQuarto = quarto ?? "";

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
    codigo = `${safePrefixo}${safeQuarto}-${sequencia}`;
  }

  const calculado = montarCalculado(data);
  const initialStatus = (resto.status as AmbienteStatus) ?? "medicao_pendente";
  resto.status = initialStatus;

  const duplicateFilter: Record<string, unknown> = { codigo };
  if (resto.obraId) {
    duplicateFilter.obraId = resto.obraId;
  }
  const codigoExistente = await Ambiente.exists(duplicateFilter);
  if (codigoExistente) {
    return NextResponse.json(
      { message: "Já existe um ambiente com essa etiqueta nesta obra." },
      { status: 409 }
    );
  }

  const now = new Date();
  const workflow = updateWorkflowForTransition(undefined, null, initialStatus, now);

  const novo = await Ambiente.create({
    ...resto,
    prefixo: safePrefixo,
    quarto: safeQuarto,
    sequencia,
    codigo,
    calculado,
    medidoPor: user.nome,
    medidoPorId: user._id,
    status: initialStatus,
    createdBy: user._id,
    updatedBy: user._id,
    workflow,
    logs: [
      {
        status: initialStatus,
        createdAt: now,
        userId: user._id,
        userNome: user.nome,
      },
    ],
  });

  return NextResponse.json(novo, { status: 201 });
}
