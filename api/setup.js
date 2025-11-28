
const { sql } = require('@vercel/postgres');

// Visit /api/setup to initialize the database
//______________NUEVO_________________
// Define database connection via the `DATABASE_URL` env var
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Define custom output path for generated Prisma Client
generator client {
  provider = "prisma-client-js"
  output   = "/app/generated/prisma-client"
}

//___NUEVO____________________________
module.exports = async (req, res) => {
  try {
    // Create Families Table (JSONB storage for flexibility)
    await sql`
      CREATE TABLE IF NOT EXISTS families (
        id TEXT PRIMARY KEY,
        data JSONB
      );
    `;

    // Create Users Table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        data JSONB
      );
    `;

    // Seed Initial Users if empty
    const { rowCount } = await sql`SELECT * FROM users LIMIT 1`;
    if (rowCount === 0) {
       const initialUsers = [
        { username: 'MPM', password: 'R2d2c3po', name: 'Super Administrador', role: 'SUPERADMIN' },
        { username: 'admin', password: 'Pimiento', name: 'Administrador', role: 'ADMIN' },
        { username: 'usuario', password: 'agustinos', name: 'Usuario Lector', role: 'USER' }
       ];
       
       for (const user of initialUsers) {
         await sql`INSERT INTO users (username, data) VALUES (${user.username}, ${JSON.stringify(user)})`;
       }
    }

    return res.status(200).json({ message: "Database tables created and seeded successfully." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
