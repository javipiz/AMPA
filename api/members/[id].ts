import { prisma } from "../../lib/prisma.ts";

export default async function handler(req, res) {
    const { id } = req.query;

if (req.method === "GET") {
    const member = await prisma.member.findUnique({
        where: { id: Number(id) }
    });

    if (!member) {
        return res.status(404).json({ error: "Member not found" });
    }

    return res.status(200).json(member);
}

if (req.method === "PUT") {
    const { fullName } = req.body;

    const updated = await prisma.member.update({
        where: { id: Number(id) },
        data: { fullName }
    });

    return res.status(200).json(updated);
}

if (req.method === "DELETE") {
    await prisma.member.delete({
        where: { id: Number(id) }
    });

    return res.status(204).end();
}

    return res.status(405).json({ error: "Method not allowed" });
}
