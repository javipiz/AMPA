
const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      // Fetch all families
      const { rows } = await sql`SELECT data FROM families`;
      const families = rows.map(r => r.data);
      return res.status(200).json(families);
    } 
    
    if (req.method === 'POST') {
      const family = req.body;
      if (!family.id) return res.status(400).json({ error: "Missing ID" });

      // Upsert (Insert or Update)
      await sql`
        INSERT INTO families (id, data) 
        VALUES (${family.id}, ${JSON.stringify(family)}) 
        ON CONFLICT (id) 
        DO UPDATE SET data = ${JSON.stringify(family)}
      `;
      return res.status(200).json(family);
    }

    // Batch Import (PUT)
    if (req.method === 'PUT') {
        const { families } = req.body;
        if (!Array.isArray(families)) return res.status(400).json({error: "Invalid data"});
        
        for (const f of families) {
            await sql`
                INSERT INTO families (id, data) 
                VALUES (${f.id}, ${JSON.stringify(f)}) 
                ON CONFLICT (id) 
                DO UPDATE SET data = ${JSON.stringify(f)}
            `;
        }
        return res.status(200).json({success: true});
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
