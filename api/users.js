
const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT data FROM users`;
      const users = rows.map(r => r.data);
      return res.status(200).json(users);
    } 
    
    if (req.method === 'POST') {
      const user = req.body;
      await sql`
        INSERT INTO users (username, data) 
        VALUES (${user.username}, ${JSON.stringify(user)}) 
        ON CONFLICT (username) 
        DO UPDATE SET data = ${JSON.stringify(user)}
      `;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
       const { username } = req.query;
       await sql`DELETE FROM users WHERE username = ${username}`;
       return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
