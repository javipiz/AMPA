// src/app/api/families/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";

// GET /api/families → listar todas las familias
export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const families = await prisma.family.findMany({
    orderBy: { id: "asc" }, // orden estable por id
    include: { members: true },
  });

  return NextResponse.json(families);
}

// POST /api/families → crear familia nueva
// Número de socio se AUTOGENERA = id de la familia
export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    // 1) Crear familia SIN membershipNumber (se asigna después)
    const created = await prisma.family.create({
      data: {
        familyName: data.familyName,
        membershipNumber: null, // se pondrá luego como id.toString()
        address: data.address ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        joinDate: data.joinDate ?? "",
        status: data.status ?? "Activo",
        aiSummary: data.aiSummary ?? null,
        createdBy: user.username ?? null,
        members: {
          create: (data.members ?? []).map((m: any) => ({
            firstName: m.firstName,
            lastName: m.lastName,
            birthDate: m.birthDate ?? "",
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

    // 2) Actualizar membershipNumber = id de la familia
    const updated = await prisma.family.update({
      where: { id: created.id },
      data: {
        membershipNumber: String(created.id),
      },
      include: { members: true },
    });

    return NextResponse.json(updated, { status: 201 });
  } catch (err) {
    console.error("POST /api/families error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
