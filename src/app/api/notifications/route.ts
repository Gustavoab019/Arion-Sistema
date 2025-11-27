import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { getCurrentUser } from "@/src/lib/getCurrentUser";
import Notification from "@/src/lib/models/Notification";
import mongoose from "mongoose";

export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const filtro: Record<string, unknown> = {
    recipientId: new mongoose.Types.ObjectId(user._id),
  };
  if (unreadOnly) {
    filtro.readAt = { $exists: false };
  }

  const notificacoes = await Notification.find(filtro)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json(notificacoes);
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  await connectDB();
  const payload = (await req.json()) as { ids?: string[] };
  const query: Record<string, unknown> = {
    recipientId: new mongoose.Types.ObjectId(user._id),
    readAt: { $exists: false },
  };

  if (payload.ids?.length) {
    query._id = {
      $in: payload.ids
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  await Notification.updateMany(query, {
    $set: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
