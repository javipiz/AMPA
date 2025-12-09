import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const families = await req.json();

    // Limpiar tablas antes de importar
    await prisma.member.deleteMany();
    await prisma.family.deleteMany();

    // Insertar una a una
    for (const f of families) {
      await prisma.family.create({
        data: {
          id: f.id,
          membershipNumber: f.membershipNumber,
          familyName: f.familyName,
          address: f.address,
          phone: f.phone,
          email: f.email,
          joinDate: f.joinDate,
          status: f.status,
          aiSummary: f.aiSummary ?? null,
          createdBy: f.createdBy ?? null,
          members: {
            create: f.members.map((m: any) => ({
              id: m.id,
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
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("CSV IMPORT ERROR:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
