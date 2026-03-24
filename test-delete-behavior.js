// ทดสอบว่า DELETE endpoint ทำอะไรจริงๆ
const FASTAPI = 'http://210.246.215.95:8000';
(async () => {
  const t = await fetch(`${FASTAPI}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'admin99', password: 'admin99' })
  });
  const { access_token } = await t.json();
  const headers = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };

  // ดู user 72 ก่อน delete
  const before = await fetch(`${FASTAPI}/users/72`, { headers });
  console.log('Before:', JSON.stringify(await before.json(), null, 2));

  // DELETE
  const del = await fetch(`${FASTAPI}/users/72`, { method: 'DELETE', headers });
  console.log('\nDELETE status:', del.status, await del.text());

  // ดูหลัง delete
  const after = await fetch(`${FASTAPI}/users/72`, { headers });
  console.log('\nAfter GET status:', after.status);
  if (after.ok) console.log('After:', JSON.stringify(await after.json(), null, 2));
  else console.log('User not found (ลบจริง)');
})().catch(console.error);
