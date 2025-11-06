// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { createClearAuthCookie } from "@/src/lib/auth";

export async function POST() {
  const res = NextResponse.json({ message: "Logout feito" });
  res.headers.set("Set-Cookie", createClearAuthCookie());
  return res;
}