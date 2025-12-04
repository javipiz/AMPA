import { prisma } from "../lib/prisma.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const families = await prisma.family.findMany({
        include: { members: true },
      });
      return res.status(200).json(families);
    }

    if (req.method === "POST") {
      const data = req.body;

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
          createdBy: data.createdBy ?? null,
          members: {
            create: data.members?.map(m => ({
              firstName: m.firstName,
              lastName: m.lastName,
              birthDate: m.birthDate,
              role: m.role,
              gender: m.gender,
              notes: m.notes,
              email: m.email,
              phone: m.phone,
            })) || [],
          },
        },
      });

      return res.status(201).json(family);
    }

    if (req.method === "PUT") {
      const { families } = req.body;

      const results = [];
      for (const f of families) {
        const updated = await prisma.family.upsert({
          where: { id: f.id ?? 0 },
          update: {
            membershipNumber: f.membershipNumber,
            familyName: f.familyName,
            address: f.address,
            phone: f.phone,
            email: f.email,
            joinDate: f.joinDate,
            status: f.status,
          },
          create: {
            membershipNumber: f.membershipNumber,
            familyName: f.familyName,
            address: f.address,
            phone: f.phone,
            email: f.email,
            joinDate: f.joinDate,
            status: f.status,
          },
        });
        results.push(updated);
      }
      return res.status(200).json(results);
    }

    res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("API /families error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
