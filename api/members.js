import { prisma } from "../lib/prisma.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const members = await prisma.member.findMany();
      return res.status(200).json(members);
    }

    if (req.method === "POST") {
      const data = req.body;

      const member = await prisma.member.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          birthDate: data.birthDate,
          role: data.role,
          gender: data.gender,
          notes: data.notes,
          email: data.email,
          phone: data.phone,
          familyId: Number(data.familyId),
        },
      });

      return res.status(201).json(member);
    }

    res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("API /members error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
