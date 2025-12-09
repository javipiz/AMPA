import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

// -----------------------------
// GET /api/users/[id]
// -----------------------------
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;   // 👈 params ahora es Promise
  const userId = Number(id);

  const user = await prisma.user.findUnique({ where: { id: userId } });

  return NextResponse.json(user);
}

// -----------------------------
// PUT /api/users/[id]
// -----------------------------
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;   // 👈 aquí también
  const userId = Number(id);

  const data = await req.json();

  let password: string | undefined = undefined;
  if (data.password) {
    password = await bcrypt.hash(data.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      username: data.username,
      name: data.name,
      role: data.role,
      ...(password && { password }),
    },
  });

  return NextResponse.json(updated);
}

// -----------------------------
// DELETE /api/users/[id]
// -----------------------------
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;   // 👈 y aquí también
  const userId = Number(id);

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
