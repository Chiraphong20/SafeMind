const FASTAPI = "https://safemind-ai.net/api";

async function getAdminToken(): Promise<string> {
  const res = await fetch(`${FASTAPI}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'admin66', password: 'admin99' }),
  });
  if (!res.ok) throw new Error(`token fetch failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET → คืน admin token (เดิม)
  if (req.method === 'GET') {
    try {
      const access_token = await getAdminToken();
      return res.status(200).json({ access_token });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST → proxy สร้าง patient-follow ด้วย admin token (bypass Admin-only restriction)
  if (req.method === 'POST') {
    const { hn, follow_status, follow_date, remark, create_user } = req.body ?? {};
    if (!hn || !follow_status) {
      return res.status(400).json({ error: 'hn และ follow_status จำเป็นต้องมี' });
    }
    try {
      const token = await getAdminToken();
      const followRes = await fetch(`${FASTAPI}/patient-follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hn,
          follow_status,
          follow_date: follow_date ?? null,
          remark: remark ?? null,
          create_user: create_user ?? null,
        }),
      });
      const data = await followRes.json();
      return res.status(followRes.ok ? 201 : followRes.status).json(data);
    } catch (err: any) {
      console.error('[patient-follow proxy]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).end();
}
