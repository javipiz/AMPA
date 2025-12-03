import { prisma } from "../../lib/prisma.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = Number(req.query.id);

  if (req.method === "GET") {
    const family = await prisma.family.findUnique({
      where: { id },
      include: { members: true },
    });
    return res.status(200).json(family);
  }

  if (req.method === "PUT") {
    const updated = await prisma.family.update({
      where: { id },
      data: req.body,
    });
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await prisma.family.delete({ where: { id } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
