import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Product from "@/src/lib/models/Product";
import { getCurrentUser } from "@/src/lib/getCurrentUser";
import type { ProductCategory } from "@/src/types/product";

type ProductInput = {
  nome?: string;
  categoria?: ProductCategory;
  descricao?: string;
};

export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria") as ProductCategory | null;

  const filtro: Record<string, unknown> = {};
  if (categoria) {
    filtro.categoria = categoria;
  }

  const produtos = await Product.find(filtro).sort({ createdAt: -1 }).lean();
  return NextResponse.json(produtos);
}

export async function POST(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  if (user.role !== "gerente") {
    return NextResponse.json({ message: "Somente gerentes podem cadastrar produtos." }, { status: 403 });
  }

  await connectDB();
  const payload = (await req.json()) as ProductInput;
  const nome = payload.nome?.trim();
  const categoria = payload.categoria;

  if (!nome) {
    return NextResponse.json({ message: "Nome do produto é obrigatório." }, { status: 400 });
  }

  if (!categoria || !["calha", "cortinado", "acessorio"].includes(categoria)) {
    return NextResponse.json({ message: "Categoria inválida." }, { status: 400 });
  }

  const novo = await Product.create({
    nome,
    categoria,
    descricao: payload.descricao?.trim() || undefined,
    createdBy: user._id,
    updatedBy: user._id,
  });

  return NextResponse.json(novo, { status: 201 });
}
