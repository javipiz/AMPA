import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("session");

  if (cookie?.value) {
    await deleteSession(cookie.value);
  }

  const res = NextResponse.json({ success: true });

  res.cookies.set("session", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return res;
}
