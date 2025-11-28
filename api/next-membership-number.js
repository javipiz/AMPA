
const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  try {
    const { rows } = await sql`SELECT data FROM families`;
    
    if (rows.length === 0) return res.status(200).json({ number: '001' });

    const max = rows.reduce((acc, curr) => {
      const f = curr.data;
      const val = f.membershipNumber ? parseInt(f.membershipNumber, 10) : 0;
      const safeNum = isNaN(val) ? 0 : val;
      return Math.max(acc, safeNum);
    }, 0);

    const next = (max + 1).toString().padStart(3, '0');
    return res.status(200).json({ number: next });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
