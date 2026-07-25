import axios from 'axios';

const FASTAPI = "http://210.246.215.95:8008";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  try {
    // 1. Get token
    const tokenRes = await axios.post(`${FASTAPI}/token`,
      new URLSearchParams({ username, password }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token } = tokenRes.data;

    // 2. Get user profile to verify role
    let profile = null;
    try {
      const profileRes = await axios.get(`${FASTAPI}/users/me`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      profile = profileRes.data;
    } catch {
      // /users/me may not exist — allow any login with the token
    }

    return res.status(200).json({
      access_token,
      role_id: profile?.role_id ?? null,
      full_name: profile?.full_name || username,
    });
  } catch (err: any) {
    const status = err.response?.status;
    if (status === 401 || status === 422) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
