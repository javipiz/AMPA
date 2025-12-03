import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
       const initialUsers = [
        { username: 'MPM', password: 'R2d2c3po', name: 'Super Administrador', role: 'SUPERADMIN' },
        { username: 'admin', password: 'Pimiento', name: 'Administrador', role: 'ADMIN' },
        { username: 'usuario', password: 'agustinos', name: 'Usuario Lector', role: 'USER' }
       ];
       
       for (const user of initialUsers) {
         await prisma.user.create({ data: user });
       }
       return res.status(200).json({ message: "Default users created successfully." });
    }

    return res.status(200).json({ message: "Database already initialized." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}