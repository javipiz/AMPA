
const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  const { id } = req.query;
  
  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM families WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
