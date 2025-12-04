import { prisma } from "../../lib/prisma.js";

export default async function handler(req, res) {
  const id = Number(req.query.id);

  try {
    if (req.method === "PUT") {
      const data = req.body;

      const updated = await prisma.member.update({
        where: { id },
        data,
      });

      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      await prisma.member.delete({ where: { id } });
      return res.status(204).end();
    }

    res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("API /members/[id] error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
