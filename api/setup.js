import { prisma } from "../lib/prisma.js";

export default async function handler(req, res) {
  try {
    const existing = await prisma.user.findFirst();
    if (existing) return res.status(200).json({ ok: true });

    await prisma.user.create({
      data: {
        username: "admin",
        password: "admin",
        name: "Administrador",
        role: "SUPERADMIN",
      },
    });

    res.status(201).json({ created: true });

  } catch (err) {
    console.error("API /setup error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
