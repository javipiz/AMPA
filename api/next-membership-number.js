import { prisma } from "../lib/prisma.js";

export default async function handler(req, res) {
try {
    const last = await prisma.family.findFirst({
        orderBy: { membershipNumber: "desc" },
    });

    const next = last ? Number(last.membershipNumber) + 1 : 1;

    res.status(200).json({ next });

} catch (err) {
    console.error("API /next-membership-number error:", err);
    res.status(500).json({ error: "Internal Server Error" });
}
}
