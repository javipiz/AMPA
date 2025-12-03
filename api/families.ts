import { prisma } from "../lib/prisma.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET → obtener familias con miembros
  if (req.method === "GET") {
    try {
      const families = await prisma.family.findMany({
        include: { members: true },
        orderBy: { id: "asc" },
      });
      return res.status(200).json(families);
    } catch (err) {
      console.error("GET /families ERROR:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // POST → crear una familia
  if (req.method === "POST") {
    try {
      const data = req.body;

      // Crear familia con sus miembros
      const family = await prisma.family.create({
        data: {
          membershipNumber: data.membershipNumber ?? null,
          familyName: data.familyName,
          address: data.address,
          phone: data.phone,
          email: data.email,
          joinDate: data.joinDate,
          status: data.status,
          aiSummary: data.aiSummary ?? null,
          createdBy: data.createdBy ?? "system",

          members: {
            create: data.members.map((m: any) => ({
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

      return res.status(201).json(family);
    } catch (err) {
      console.error("POST /families ERROR:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // PUT → importar múltiples familias (para importación masiva)
  if (req.method === "PUT") {
    try {
      const { families } = req.body;

      const results = [];

      for (const f of families) {
        const family = await prisma.family.upsert({
          where: { id: Number(f.id) || 0 },
          update: {
            membershipNumber: f.membershipNumber ?? null,
            familyName: f.familyName,
            address: f.address,
            phone: f.phone,
            email: f.email,
            joinDate: f.joinDate,
            status: f.status,
            aiSummary: f.aiSummary ?? null,
            createdBy: f.createdBy ?? null,
          },
          create: {
            membershipNumber: f.membershipNumber ?? null,
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

        results.push(family);
      }

      return res.status(200).json(results);
    } catch (err) {
      console.error("PUT /families ERROR:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
