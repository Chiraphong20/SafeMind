// ลบ user ที่ is_active=false และ role_id >= 3 (ไม่ลบ admin)
const FASTAPI = 'http://210.246.215.95:8000';

(async () => {
  const t = await fetch(`${FASTAPI}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'admin99', password: 'admin99' })
  });
  const { access_token } = await t.json();
  const headers = { Authorization: `Bearer ${access_token}` };

  // Fetch all users
  const r = await fetch(`${FASTAPI}/users?limit=500`, { headers });
  const data = await r.json();
  const allUsers = Array.isArray(data) ? data : (data.items || []);

  // Filter: inactive + non-admin role
  const toDelete = allUsers.filter(u => !u.is_active && u.role_id >= 3);

  console.log(`พบ ${toDelete.length} user ที่จะลบ:`);
  toDelete.forEach(u => console.log(`  - [${u.user_id}] ${u.full_name} (${u.role_name}) is_active=${u.is_active}`));

  if (toDelete.length === 0) {
    console.log('ไม่มี user ที่ต้องลบ');
    return;
  }

  console.log('\nกำลังลบ...');
  let success = 0, failed = 0;
  for (const u of toDelete) {
    const dr = await fetch(`${FASTAPI}/users/${u.user_id}`, { method: 'DELETE', headers });
    if (dr.status === 204 || dr.ok) {
      console.log(`  ✅ ลบ [${u.user_id}] ${u.full_name}`);
      success++;
    } else {
      console.log(`  ❌ ลบไม่ได้ [${u.user_id}] ${u.full_name} → ${dr.status}`);
      failed++;
    }
  }

  console.log(`\n✅ ลบสำเร็จ ${success} ราย | ❌ ล้มเหลว ${failed} ราย`);
})().catch(console.error);
