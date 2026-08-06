import axios from 'axios';

const FASTAPI = "https://safemind-ai.net/api";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    // Get machine token using admin66 credentials
    const tokenRes = await axios.post(`${FASTAPI}/token`,
      new URLSearchParams({ username: 'admin66', password: '007123admin' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const token = tokenRes.data.access_token;

    // Fetch all users from FastAPI
    const usersRes = await axios.get(`${FASTAPI}/users?limit=200`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const allUsers: any[] = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.items || []);

    // Filter: inactive + non-admin + never modified by admin (updated_user=null = brand-new registration)
    const pending = allUsers
      .filter(u => !u.is_active && u.role_id >= 3 && u.updated_user === null)
      .map(u => ({
        line_user_id: u.line_user_id,
        user_id: u.user_id,
        name: u.full_name || u.username,
        phone: u.phone_number || '-',
        department: u.role_name || `Role ${u.role_id}`,
        role_id: u.role_id,
        address: u.address_full_name || u.address_name || '-',
        status: 'pending',
        created_date: u.created_date,
      }));

    return res.status(200).json(pending);
  } catch (err: any) {
    console.error('get-pending-users error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
