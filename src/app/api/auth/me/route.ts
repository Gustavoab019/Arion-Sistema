// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import User, { IUser } from "@/src/lib/models/User";
import {
  getAuthTokenFromRequest,
  verifyAuthToken,
} from "@/src/lib/auth";

export async function GET(req: Request) {
  const token = getAuthTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  await connectDB();

  const user = await User.findById(payload.userId).lean<IUser | null>();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json(
    {
      user: {
        _id: String(user._id),
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    },
    { status: 200 }
  );
}