import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/src/lib/db";
import { getCurrentUser } from "@/src/lib/getCurrentUser";
import MountingOption from "@/src/lib/models/MountingOption";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(req: Request, context: RouteContext) {
  const params = await context.params;
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }
  if (user.role !== "gerente") {
    return NextResponse.json({ message: "Somente gerentes podem remover tipos de montagem." }, { status: 403 });
  }
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: "Tipo inválido." }, { status: 400 });
  }

  await connectDB();
  await MountingOption.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
