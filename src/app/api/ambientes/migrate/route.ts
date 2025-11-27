// src/app/api/ambientes/migrate/route.ts
// Script temporário para migrar dados existentes
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Ambiente from "@/src/lib/models/Ambiente";
import { getCurrentUser } from "@/src/lib/getCurrentUser";

export async function POST(req: Request) {
  const user = await getCurrentUser(req);

  // Apenas gerentes podem executar migração
  if (!user || user.role !== "gerente") {
    return NextResponse.json(
      { message: "Acesso negado. Apenas gerentes podem executar migração." },
      { status: 403 }
    );
  }

  await connectDB();

  try {
    // Atualizar todos os ambientes que não têm tipoMontagem definido
    const result = await Ambiente.updateMany(
      { "variaveis.tipoMontagem": { $exists: false } },
      {
        $set: {
          "variaveis.tipoMontagem": "simples"
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Migração concluída com sucesso!`,
      updated: result.modifiedCount,
      matched: result.matchedCount,
    });
  } catch (error) {
    console.error("Erro na migração:", error);
    return NextResponse.json(
      { message: "Erro ao executar migração", error: String(error) },
      { status: 500 }
    );
  }
}
