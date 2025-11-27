import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { TipoMontagem } from "@/src/lib/calhas-config";

export interface IMountingOption extends Document {
  nome: string;
  descricao?: string;
  tipoBase: TipoMontagem;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const MountingOptionSchema = new Schema<IMountingOption>(
  {
    nome: { type: String, required: true, trim: true },
    descricao: { type: String, trim: true },
    tipoBase: {
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
      required: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const MountingOption: Model<IMountingOption> =
  mongoose.models.MountingOption ||
  mongoose.model<IMountingOption>("MountingOption", MountingOptionSchema);

export default MountingOption;
