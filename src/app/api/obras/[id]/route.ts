// src/app/api/obras/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Obra from "@/src/lib/models/Obra";
import User from "@/src/lib/models/User";
import { getCurrentUser } from "@/src/lib/getCurrentUser";
import { notifyObraResponsaveis } from "@/src/lib/notifications";
import mongoose from "mongoose";

async function montarResponsaveis(responsavelIds?: unknown) {
  if (!Array.isArray(responsavelIds)) {
    return undefined;
  }
  if (responsavelIds.length === 0) {
    return [];
  }

  const ids = Array.from(new Set(responsavelIds));
  const validos = ids.filter(
    (id): id is string =>
      typeof id === "string" && mongoose.Types.ObjectId.isValid(id)
  );
  if (validos.length === 0) return [];

  const usuarios = await User.find({
    _id: { $in: validos },
    ativo: true,
  })
    .select("nome role")
    .lean();

  return usuarios.map((usuario) => ({
    userId: usuario._id,
    nome: usuario.nome,
    role: usuario.role,
  }));
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, context: RouteContext) {
  const params = await context.params;
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { message: "Não autenticado." },
      { status: 401 }
    );
  }

  await connectDB();
  const obra = await Obra.findById(params.id);
  if (!obra) {
    return NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
  }
  if (
    user.role !== "gerente" &&
    !obra.responsaveis?.some((resp) => resp.userId?.toString() === user._id)
  ) {
    return NextResponse.json({ message: "Sem permissão." }, { status: 403 });
  }
  return NextResponse.json(obra);
}

export async function PATCH(req: Request, context: RouteContext) {
  const params = await context.params;
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { message: "Não autenticado." },
      { status: 401 }
    );
  }

  if (user.role !== "gerente") {
    return NextResponse.json(
      { message: "Apenas gerentes podem alterar obras." },
      { status: 403 }
    );
  }

  await connectDB();
  const body = await req.json();
  const { responsavelIds, ...resto } = body ?? {};

  // Buscar obra atual para comparar responsáveis
  const obraAtual = await Obra.findById(params.id);
  if (!obraAtual) {
    return NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { ...resto };
  let novosResponsaveis: mongoose.Types.ObjectId[] = [];

  if (responsavelIds !== undefined) {
    const novosResponsaveisData = await montarResponsaveis(responsavelIds);
    updateData.responsaveis = novosResponsaveisData;

    // Identificar novos responsáveis (que não estavam na lista anterior)
    if (novosResponsaveisData && Array.isArray(novosResponsaveisData)) {
      const responsaveisAtuaisIds = new Set(
        (obraAtual.responsaveis || []).map((r) => r.userId?.toString())
      );
      novosResponsaveis = novosResponsaveisData
        .filter((r) => !responsaveisAtuaisIds.has(r.userId.toString()))
        .map((r) => new mongoose.Types.ObjectId(r.userId as string));
    }
  }

  const obra = await Obra.findByIdAndUpdate(
    params.id,
    { $set: updateData },
    { new: true }
  );

  if (!obra) {
    return NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
  }

  // Notificar apenas os novos responsáveis
  if (novosResponsaveis.length > 0) {
    await notifyObraResponsaveis(obra.toObject(), novosResponsaveis);
  }

  return NextResponse.json(obra);
}

export async function DELETE(req: Request, context: RouteContext) {
  const params = await context.params;
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { message: "Não autenticado." },
      { status: 401 }
    );
  }

  if (user.role !== "gerente") {
    return NextResponse.json(
      { message: "Apenas gerentes podem remover obras." },
      { status: 403 }
    );
  }

  await connectDB();
  const obra = await Obra.findByIdAndDelete(params.id);
  if (!obra) {
    return NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ message: "Obra removida" });
}
