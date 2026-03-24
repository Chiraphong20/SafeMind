const FASTAPI = 'http://210.246.215.95:8000';
const TARGET_LINE_ID = 'U0d2bdbd002e3e481dcc09363fd1f97b4';

(async () => {
  const t = await fetch(`${FASTAPI}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'admin99', password: 'admin99' })
  });
  const { access_token } = await t.json();
  const headers = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };

  // Find all users with this line_user_id
  const r = await fetch(`${FASTAPI}/users?limit=500`, { headers });
  const data = await r.json();
  const all = Array.isArray(data) ? data : (data.items || []);
  const targets = all.filter(u => u.line_user_id === TARGET_LINE_ID && u.role_id !== 1); // skip admins

  console.log(`พบ ${targets.length} user ที่มี line_user_id = ${TARGET_LINE_ID}:`);
  targets.forEach(u => console.log(`  [${u.user_id}] ${u.full_name} | role=${u.role_name} | is_active=${u.is_active}`));

  if (targets.length === 0) { console.log('ไม่มี user ที่ต้องลบ'); return; }

  // Deactivate all (since DELETE is soft-delete)
  console.log('\nกำลังปิดใช้งาน (is_active=false)...');
  for (const u of targets) {
    const getRes = await fetch(`${FASTAPI}/users/${u.user_id}`, { headers });
    const full = await getRes.json();
    const putRes = await fetch(`${FASTAPI}/users/${u.user_id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ ...full, is_active: false })
    });
    console.log(`  ${putRes.ok ? '✅' : '❌'} [${u.user_id}] ${u.full_name}`);
  }
  console.log('\n✅ เสร็จแล้ว! ตอนนี้สมัครใหม่ได้เลยครับ');
})().catch(console.error);
