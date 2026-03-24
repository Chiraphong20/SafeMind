const FASTAPI = 'http://210.246.215.95:8000';
(async () => {
  const t = await fetch(`${FASTAPI}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'admin99', password: 'admin99' })
  });
  const { access_token } = await t.json();
  const headers = { Authorization: `Bearer ${access_token}` };

  const r = await fetch(`${FASTAPI}/users?skip=0&limit=100`, { headers });
  const data = await r.json();
  const users = Array.isArray(data) ? data : (data.items || []);
  console.log(`พบ ${users.length} user ทั้งหมด:`);
  users.forEach(u => console.log(`  [${u.user_id}] ${u.full_name} | role=${u.role_name} | is_active=${u.is_active}`));
})().catch(console.error);
