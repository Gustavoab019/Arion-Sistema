// src/lib/models/Ambiente.ts
import mongoose, { Schema, Model, Document } from "mongoose";

export interface IAmbiente extends Document {
  // nova relação forte
  obraId?: mongoose.Types.ObjectId;
  // manter o nome da obra em texto para compatibilidade
  obra?: string;

  andar?: number;
  quarto: string;
  prefixo: string;
  sequencia: number;
  codigo: string;
  medidoPor?: string;
  medidoPorId?: mongoose.Types.ObjectId;
  medidas?: {
    largura?: number;
    altura?: number;
    recuo?: number;
    instalacao?: "teto" | "parede" | "embutida";
  };
  variaveis?: {
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
    regras?: {
      calhaDesconto?: number;
      blackoutAlturaDesconto?: number;
      voileAlturaDesconto?: number;
      alturaInstalacaoOffset?: number;
    };
  };
  calculado?: {
    larguraCalha?: number;
    alturaBlackout?: number;
    alturaVoile?: number;
  };
  observacoes?: string;
  status?:
    | "medicao_pendente"
    | "aguardando_validacao"
    | "em_producao"
    | "producao_calha"
    | "producao_cortina"
    | "estoque_deposito"
    | "em_transito"
    | "aguardando_instalacao"
    | "instalado";
  validadoPor?: mongoose.Types.ObjectId;
  validadoEm?: Date;
  producaoCortinaResponsavel?: mongoose.Types.ObjectId;
  producaoCalhaResponsavel?: mongoose.Types.ObjectId;
  producaoConcluidaEm?: Date;
  instaladorResponsavel?: mongoose.Types.ObjectId;
  instaladoPor?: mongoose.Types.ObjectId;
  instaladoEm?: Date;
  depositoPalete?: string;
  depositoLocal?: string;
  depositoRecebidoPor?: mongoose.Types.ObjectId;
  depositoRecebidoEm?: Date;
  expedicaoRomaneio?: string;
  expedicaoRetiradoPor?: mongoose.Types.ObjectId;
  expedicaoRetiradoEm?: Date;
  foto?: {
    url?: string;
    key?: string;
    uploadedAt?: Date;
  };
  workflow?: {
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
  logs?: {
    status:
      | "medicao_pendente"
      | "aguardando_validacao"
      | "em_producao"
      | "producao_calha"
      | "producao_cortina"
      | "estoque_deposito"
      | "em_transito"
      | "aguardando_instalacao"
      | "instalado";
    mensagem?: string;
    createdAt: Date;
    userId?: mongoose.Types.ObjectId;
    userNome?: string;
  }[];

  // novos campos de autoria
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const MedidasSchema = new Schema(
  {
    largura: Number,
    altura: Number,
    recuo: Number,
    instalacao: {
      type: String,
      enum: ["teto", "parede", "embutida"],
      default: "teto",
    },
  },
  { _id: false }
);

const VariaveisSchema = new Schema(
  {
    calha: String,
    tipoMontagem: {
      type: String,
      enum: [
        "simples",
        "dupla_paralela",
        "dupla_cruzada",
        "tripla",
        "painel_fixo_movel",
        "sistema_quadruplo",
        "motorizada_ondas",
        "sistema_misto",
      ],
      default: "simples",
    },
    tecidoPrincipal: String,
    tecidoSecundario: String,
    regras: {
      calhaDesconto: Number,
      blackoutAlturaDesconto: Number,
      voileAlturaDesconto: Number,
      alturaInstalacaoOffset: Number,
    },
  },
  { _id: false }
);

const CalculadoSchema = new Schema(
  {
    larguraCalha: Number,
    alturaBlackout: Number,
    alturaVoile: Number,
  },
  { _id: false }
);

const AmbienteSchema = new Schema<IAmbiente>(
  {
    // referência forte
    obraId: { type: mongoose.Schema.Types.ObjectId, ref: "Obra" },
    // texto livre para compatibilidade e filtros rápidos
    obra: { type: String },

    andar: Number,
    quarto: { type: String, required: true },
    prefixo: { type: String, required: true },
    sequencia: { type: Number, required: true },
    codigo: { type: String, required: true },
    medidoPor: { type: String },
    medidoPorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    medidas: MedidasSchema,
    variaveis: VariaveisSchema,
    calculado: CalculadoSchema,

    observacoes: String,
    status: {
      type: String,
      enum: [
        "medicao_pendente",
        "aguardando_validacao",
        "em_producao",
        "producao_calha",
        "producao_cortina",
        "estoque_deposito",
        "em_transito",
        "aguardando_instalacao",
        "instalado",
      ],
      default: "medicao_pendente",
    },
    validadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    validadoEm: Date,
    producaoCortinaResponsavel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    producaoCalhaResponsavel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    producaoConcluidaEm: Date,
    instaladorResponsavel: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    instaladoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    instaladoEm: Date,
    foto: {
      url: String,
      key: String,
      uploadedAt: Date,
    },
    depositoPalete: String,
    depositoLocal: String,
    depositoRecebidoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    depositoRecebidoEm: Date,
    expedicaoRomaneio: String,
    expedicaoRetiradoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expedicaoRetiradoEm: Date,
    workflow: {
      validadoEm: Date,
      producaoCalhaInicio: Date,
      producaoCalhaFim: Date,
      producaoCortinaInicio: Date,
      producaoCortinaFim: Date,
      depositoEntrada: Date,
      depositoSaida: Date,
      expedicaoSaida: Date,
      instalacaoInicio: Date,
      instalacaoFim: Date,
    },
    logs: {
      type: [
        {
          status: {
            type: String,
            enum: [
              "medicao_pendente",
              "aguardando_validacao",
              "em_producao",
              "producao_calha",
              "producao_cortina",
              "estoque_deposito",
              "em_transito",
              "aguardando_instalacao",
              "instalado",
            ],
          },
          mensagem: String,
          createdAt: { type: Date, default: Date.now },
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          userNome: String,
        },
      ],
      default: [],
    },

    // autoria
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// evita recriar o model no Next em hot-reload
const Ambiente: Model<IAmbiente> =
  mongoose.models.Ambiente ||
  mongoose.model<IAmbiente>("Ambiente", AmbienteSchema);

export default Ambiente;
