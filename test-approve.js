// Test which FastAPI endpoint activates a user
const FASTAPI = "http://210.246.215.95:8000";

async function run() {
  // 1. Get token
  const tokenRes = await fetch(`${FASTAPI}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'admin99', password: 'admin99' })
  });
  const { access_token } = await tokenRes.json();
  const headers = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };
  console.log("Token OK");

  const userId = 69; // Netza777 / CHIRAPHONG XXX

  // Try PATCH /users/{id}
  console.log("\n--- PATCH /users/69 ---");
  const r1 = await fetch(`${FASTAPI}/users/${userId}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ is_active: true })
  });
  console.log("Status:", r1.status, await r1.text());

  // Try PUT /users/{id}
  console.log("\n--- PUT /users/69 ---");
  const r2 = await fetch(`${FASTAPI}/users/${userId}`, {
    method: 'PUT', headers,
    body: JSON.stringify({ is_active: true })
  });
  console.log("Status:", r2.status, await r2.text());

  // Try POST /users/{id}/activate
  console.log("\n--- POST /users/69/activate ---");
  const r3 = await fetch(`${FASTAPI}/users/${userId}/activate`, {
    method: 'POST', headers
  });
  console.log("Status:", r3.status, await r3.text());

  // Try GET the user first to see full schema
  console.log("\n--- GET /users/69 ---");
  const r4 = await fetch(`${FASTAPI}/users/${userId}`, { headers: { Authorization: `Bearer ${access_token}` } });
  console.log("Status:", r4.status, await r4.text());
}

run().catch(console.error);
