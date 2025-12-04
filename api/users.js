import { prisma } from "../lib/prisma.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const users = await prisma.user.findMany();
      return res.status(200).json(users);
    }

    if (req.method === "POST") {
      const user = await prisma.user.create({ data: req.body });
      return res.status(201).json(user);
    }

    res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("API /users error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
