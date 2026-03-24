const FASTAPI = 'http://210.246.215.95:8000';
(async () => {
  const t = await fetch(`${FASTAPI}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'admin99', password: 'admin99' })
  });
  const { access_token } = await t.json();
  const headers = { Authorization: `Bearer ${access_token}` };

  // Test DELETE /users/69
  const r = await fetch(`${FASTAPI}/users/69`, { method: 'DELETE', headers });
  console.log('DELETE /users/69 ->', r.status, await r.text());
})().catch(console.error);
