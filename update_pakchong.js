const API_BASE = "http://210.246.215.95:8000";

const HNS_TO_UPDATE = [
  'HN-RED-01', 'HN-RED-02', 'HN-GRN-01', 'HN-GRN-02', 
  'HN-R-10', 'HN-R-11', 'HN-Y-12', 'HN-G-10', 'HN-YEL-01', 
  'HN-R-12', 'HN-Y-10', 'HN-G-11', 'HN-G-12', 'HN-YEL-02', 'HN-Y-11'
];

async function updateMockPatients() {
  console.log("1. Authenticating...");
  const loginRes = await fetch(`${API_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: "admin99", password: "admin99" })
  });
  if (!loginRes.ok) return console.error("Login failed");
  const { access_token } = await loginRes.json();
  const headers = {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  };

  console.log("2. Updating patients to Pak Chong (chw: 30, amp: 21, tmb: 01)...");
  for (const hn of HNS_TO_UPDATE) {
    const getRes = await fetch(`${API_BASE}/patients/hn/${hn}`, { headers });
    if (!getRes.ok) continue;
    const ptData = await getRes.json();

    const updatePayload = {
        ...ptData,
        tmbpart: "01",
        moopart: "01",
        chwpart: "30",
        amppart: "21"
    };

    const putRes = await fetch(`${API_BASE}/patients/${hn}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatePayload)
    });
    console.log(putRes.ok ? `[OK] Pak Chong updated ${hn}` : `[FAIL] ${hn}`);
  }
}

updateMockPatients();
