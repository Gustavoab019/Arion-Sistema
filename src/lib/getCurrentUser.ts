// src/lib/getCurrentUser.ts
import { connectDB } from "@/src/lib/db";
import User, { IUser } from "@/src/lib/models/User";
import {
  getAuthTokenFromRequest,
  verifyAuthToken,
} from "@/src/lib/auth";

export interface CurrentUser {
  _id: string;
  nome: string;
  email: string;
  role: "gerente" | "instalador" | "producao";
}

// chama assim dentro da rota: const user = await getCurrentUser(req);
export async function getCurrentUser(req: Request): Promise<CurrentUser | null> {
  const token = getAuthTokenFromRequest(req);
  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload) return null;

  await connectDB();

  const user = await User.findById(payload.userId).lean<IUser | null>();
  if (!user) return null;

  return {
    _id: String(user._id),
    nome: user.nome,
    email: user.email,
    role: user.role,
  };
}