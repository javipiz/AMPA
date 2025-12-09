// src/app/api/families/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";

// 👇 En Next 16, params es un Promise
interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/families/:id
export async function GET(req: NextRequest, context: RouteContext) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const familyId = Number(id);

  if (Number.isNaN(familyId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: { members: true },
    });

    if (!family) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json(family);
  } catch (err) {
    console.error("GET /api/families/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/families/:id
export async function PUT(req: NextRequest, context: RouteContext) {
  const user = await requireAdmin(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const familyId = Number(id);

  if (Number.isNaN(familyId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const data = await req.json();

    // Borramos los miembros antiguos de esa familia
    await prisma.member.deleteMany({
      where: { familyId },
    });

    const updated = await prisma.family.update({
      where: { id: familyId },
      data: {
        familyName: data.familyName,
        membershipNumber: data.membershipNumber,
        address: data.address,
        phone: data.phone,
        email: data.email,
        joinDate: data.joinDate,      // string (según tu schema)
        status: data.status,
        aiSummary: data.aiSummary ?? null,

        members: {
          create: (data.members || []).map((m: any) => ({
            firstName: m.firstName,
            lastName: m.lastName,
            birthDate: m.birthDate,
            role: m.role,
            gender: m.gender ?? null,
            notes: m.notes ?? null,
            email: m.email ?? null,
            phone: m.phone ?? null,
          })),
        },
      },
      include: { members: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/families/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/families/:id
export async function DELETE(req: NextRequest, context: RouteContext) {
  const user = await requireAdmin(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const familyId = Number(id);

  if (Number.isNaN(familyId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    // Primero borramos miembros
    await prisma.member.deleteMany({
      where: { familyId },
    });

    // Luego la familia
    await prisma.family.delete({
      where: { id: familyId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/families/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
