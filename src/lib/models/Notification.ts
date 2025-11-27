import mongoose, { Schema, Document, Model } from "mongoose";
import type { NotificationType } from "@/src/types/notification";

export interface INotification extends Document {
  titulo: string;
  mensagem: string;
  tipo: NotificationType;
  statusDestino?: string;
  ambienteId?: mongoose.Types.ObjectId;
  ambienteCodigo?: string;
  obraId?: mongoose.Types.ObjectId;
  obraNome?: string;
  actionUrl?: string;
  recipientId: mongoose.Types.ObjectId;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    titulo: { type: String, required: true, trim: true },
    mensagem: { type: String, required: true, trim: true },
    tipo: {
      type: String,
      enum: ["medicao_finalizada", "producao", "instalacao"],
      required: true,
    },
    statusDestino: { type: String },
    ambienteId: { type: mongoose.Schema.Types.ObjectId, ref: "Ambiente" },
    ambienteCodigo: { type: String },
    obraId: { type: mongoose.Schema.Types.ObjectId, ref: "Obra" },
    obraNome: { type: String },
    actionUrl: { type: String },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readAt: { type: Date },
  },
  { timestamps: true }
);

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
