const FASTAPI = 'http://210.246.215.95:8000';
(async () => {
  const t = await fetch(`${FASTAPI}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'admin99', password: 'admin99' })
  });
  const { access_token } = await t.json();
  const headers = { Authorization: `Bearer ${access_token}` };

  // Test 1: role_id=5 + is_active=true
  const r1 = await fetch(`${FASTAPI}/users?role_id=5&is_active=true&limit=50`, { headers });
  const d1 = await r1.json();
  const items1 = d1.items || d1;
  console.log(`\n--- role_id=5 + is_active=true (${items1.length} users) ---`);
  items1.forEach(u => console.log(` ${u.user_id} | ${u.full_name} | is_active=${u.is_active} | role=${u.role_name}`));

  // Test 2: role_id=5 (no is_active filter)
  const r2 = await fetch(`${FASTAPI}/users?role_id=5&limit=50`, { headers });
  const d2 = await r2.json();
  const items2 = d2.items || d2;
  console.log(`\n--- role_id=5 only (${items2.length} users) ---`);
  items2.forEach(u => console.log(` ${u.user_id} | ${u.full_name} | is_active=${u.is_active}`));
})().catch(console.error);
