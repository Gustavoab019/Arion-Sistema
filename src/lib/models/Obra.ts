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
  },
  {
    timestamps: true,
  }
);

// evita recompilar no hot reload
const Obra: Model<IObra> = models.Obra || mongoose.model<IObra>("Obra", ObraSchema);

export default Obra;