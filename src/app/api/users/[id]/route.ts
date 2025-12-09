import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, { params }: { params: { id: string }}) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const user = await prisma.user.findUnique({ where: { id }});

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string }}) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const data = await req.json();

  let password = undefined;
  if (data.password) {
    password = await bcrypt.hash(data.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      username: data.username,
      name: data.name,
      role: data.role,
      ...(password && { password }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string }}) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
