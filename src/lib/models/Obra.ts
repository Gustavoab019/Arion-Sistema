// src/lib/models/Obra.ts
import mongoose, { Schema, Model, models } from "mongoose";

export interface IObra {
  nome: string;
  cliente?: string;
  endereco?: string;
  andarInicial?: number;
  andarFinal?: number;
  status?: "ativo" | "finalizado" | "pausado";
  observacoes?: string;
  responsaveis?: {
    userId: mongoose.Types.ObjectId;
    nome: string;
    role: "gerente" | "instalador" | "producao";
  }[];
}

const ObraSchema = new Schema<IObra>(
  {
    nome: { type: String, required: true },
    cliente: { type: String },
    endereco: { type: String },
    andarInicial: { type: Number, default: 1 },
    andarFinal: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["ativo", "finalizado", "pausado"],
      default: "ativo",
    },
    observacoes: { type: String },
    responsaveis: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        nome: { type: String },
        role: {
          type: String,
          enum: ["gerente", "instalador", "producao"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// evita recompilar no hot reload
const Obra: Model<IObra> = models.Obra || mongoose.model<IObra>("Obra", ObraSchema);

export default Obra;
