import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const users = await prisma.user.findMany({
        orderBy: { username: 'asc' }
      });
      return res.status(200).json(users);
    } 
    
    if (req.method === 'POST') {
      const user = req.body;
      await prisma.user.upsert({
        where: { username: user.username },
        update: {
          password: user.password,
          name: user.name,
          role: user.role
        },
        create: {
          username: user.username,
          password: user.password,
          name: user.name,
          role: user.role
        }
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
       const { username } = req.query;
       await prisma.user.delete({
         where: { username: String(username) }
       });
       return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}