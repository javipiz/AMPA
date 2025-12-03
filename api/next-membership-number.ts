import { prisma } from "../lib/prisma.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const families = await prisma.family.findMany();

  const max = families.reduce((acc, curr) => {
    const val = parseInt(curr?.membershipNumber ?? "0", 10);
    return Math.max(acc, val);
  }, 0);

  return res.status(200).json({
    number: (max + 1).toString().padStart(3, "0"),
  });
}
