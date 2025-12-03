import { prisma } from "../lib/prisma.ts";

export default async function handler(req, res) {
if (req.method === "POST") {
    const { fullName, familyId } = req.body;

    if (!fullName || !familyId) {
        return res.status(400).json({ error: "fullName and familyId are required" });
    }

    const member = await prisma.member.create({
        data: {
            fullName,
            familyId: Number(familyId)
        }
    });

    return res.status(201).json(member);
    }

    return res.status(405).json({ error: "Method not allowed" });
}
