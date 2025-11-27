import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/src/lib/db";
import Product from "@/src/lib/models/Product";
import { getCurrentUser } from "@/src/lib/getCurrentUser";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(_req);
  if (!user) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  if (user.role !== "gerente") {
    return NextResponse.json({ message: "Somente gerentes podem excluir produtos." }, { status: 403 });
  }

  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Produto inválido." }, { status: 400 });
  }

  await connectDB();
  const removido = await Product.findByIdAndDelete(id);
  if (!removido) {
    return NextResponse.json({ message: "Produto não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
