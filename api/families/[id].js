import { prisma } from "../../lib/prisma.js";

export default async function handler(req, res) {
  const id = Number(req.query.id);

  try {
    if (req.method === "GET") {
      const family = await prisma.family.findUnique({
        where: { id },
        include: { members: true },
      });
      return res.status(200).json(family);
    }

    if (req.method === "PUT") {
      const data = req.body;

      const updated = await prisma.family.update({
        where: { id },
        data: {
          familyName: data.familyName,
          address: data.address,
          phone: data.phone,
          email: data.email,
          status: data.status,
          aiSummary: data.aiSummary ?? null,
        },
      });

      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      await prisma.family.delete({ where: { id } });
      return res.status(204).end();
    }

    res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("API /families/[id] error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
