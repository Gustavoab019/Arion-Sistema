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
  status?: "pendente" | "revisar" | "completo";
  foto?: {
    url?: string;
    key?: string;
    uploadedAt?: Date;
  };

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
      enum: ["pendente", "revisar", "completo"],
      default: "pendente",
    },
    foto: {
      url: String,
      key: String,
      uploadedAt: Date,
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
