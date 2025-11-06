// src/lib/models/User.ts
import mongoose, { Schema, Model, Document } from "mongoose";

export type UserRole = "gerente" | "instalador" | "producao";

export interface IUser extends Document {
  nome: string;
  email: string;
  senhaHash: string;
  role: UserRole;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    senhaHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["gerente", "instalador", "producao"],
      default: "instalador",
    },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;