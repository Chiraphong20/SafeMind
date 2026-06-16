import axios from 'axios';

const FASTAPI = "http://210.246.215.95:8000";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { line_user_id, user_id } = req.body;
  if (!line_user_id && !user_id) {
    return res.status(400).json({ message: 'Missing line_user_id or user_id' });
  }

  try {
    // 1. Get machine token
    const tokenRes = await axios.post(`${FASTAPI}/token`,
      new URLSearchParams({ username: 'admin99', password: 'admin99' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const token = tokenRes.data.access_token;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Find user_id if not provided
    let targetUserId = user_id;
    let targetLineUserId = line_user_id;

    if (!targetUserId && line_user_id) {
      const usersRes = await axios.get(`${FASTAPI}/users?limit=500`, { headers });
      const allUsers: any[] = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.items || []);
      const found = allUsers.find(u => u.line_user_id === line_user_id);
      if (!found) return res.status(404).json({ error: 'User not found' });
      targetUserId = found.user_id;
      targetLineUserId = found.line_user_id;
    }

    // 3. GET full user data first (PUT requires full body)
    const userRes = await axios.get(`${FASTAPI}/users/${targetUserId}`, { headers });
    const currentUser = userRes.data;

    // 4. PUT with is_active = true (FastAPI requires full object for updates)
    await axios.put(`${FASTAPI}/users/${targetUserId}`,
      { ...currentUser, is_active: true },
      { headers }
    );

    // 5. Update LINE Rich Menu (best-effort)
    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (lineToken && targetLineUserId) {
      const richMenuId = 'richmenu-9301eee1e28d459a6e99e5ec5f45af9e';
      try {
        await axios.post(
          `https://api.line.me/v2/bot/user/${targetLineUserId}/richmenu/${richMenuId}`,
          {},
          { headers: { Authorization: `Bearer ${lineToken}` } }
        );
      } catch (lineErr: any) {
        console.warn('LINE rich menu update failed:', lineErr.response?.data || lineErr.message);
      }
    }

    return res.status(200).json({ success: true, message: 'User approved!' });
  } catch (err: any) {
    console.error('approve-user error:', err.response?.data || err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: err.response?.data || err.message
    });
  }
}
