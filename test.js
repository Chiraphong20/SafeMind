async function run() {
  const tokenRes = await fetch("http://210.246.215.95:8000/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "password", username: "admin99", password: "admin99" })
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  
  const smiRes = await fetch("http://210.246.215.95:8000/smi-v?limit=500", { headers: { Authorization: `Bearer ${token}` } });
  const smiData = await smiRes.json();
  const hns = Array.from(new Set((smiData.items||[]).map(i => i.hn)));
  
  const ptRes2 = await fetch("http://210.246.215.95:8000/patients?limit=1", { headers: { Authorization: `Bearer ${token}` } });
  const ptData2 = await ptRes2.json();
  
  const smiRes2 = await fetch("http://210.246.215.95:8000/smi-v?limit=1", { headers: { Authorization: `Bearer ${token}` } });
  const smiData2 = await smiRes2.json();
  
  console.log("Total Patients in DB:", ptData2.total);
  console.log("Total SMI-V records in DB:", smiData2.total);
}
run();
