import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/src/lib/db";
import { getCurrentUser } from "@/src/lib/getCurrentUser";
import Notification from "@/src/lib/models/Notification";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const params = await context.params;
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: "Notificação inválida." }, { status: 400 });
  }

  await connectDB();
  await Notification.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(params.id),
      recipientId: new mongoose.Types.ObjectId(user._id),
    },
    { $set: { readAt: new Date() } }
  );

  return NextResponse.json({ ok: true });
}
