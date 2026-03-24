import axios from 'axios';

const FASTAPI = "http://210.246.215.95:8000";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).end();

  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

  try {
    // Get machine token
    const tokenRes = await axios.post(`${FASTAPI}/token`,
      new URLSearchParams({ username: 'admin99', password: 'admin99' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const token = tokenRes.data.access_token;

    // DELETE user
    await axios.delete(`${FASTAPI}/users/${user_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return res.status(200).json({ success: true, message: `User ${user_id} deleted.` });
  } catch (err: any) {
    console.error('delete-user error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Internal Server Error', details: err.response?.data || err.message });
  }
}
