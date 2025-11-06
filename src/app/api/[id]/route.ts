// src/app/api/obras/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Obra from "@/src/lib/models/Obra";
import { getCurrentUser } from "@/src/lib/getCurrentUser";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(req: Request, { params }: Params) {
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
  return NextResponse.json(obra);
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { message: "Não autenticado." },
      { status: 401 }
    );
  }

  await connectDB();
  const body = await req.json();

  const obra = await Obra.findByIdAndUpdate(
    params.id,
    { $set: body },
    { new: true }
  );

  if (!obra) {
    return NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
  }

  return NextResponse.json(obra);
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { message: "Não autenticado." },
      { status: 401 }
    );
  }

  await connectDB();
  const obra = await Obra.findByIdAndDelete(params.id);
  if (!obra) {
    return NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ message: "Obra removida" });
}
