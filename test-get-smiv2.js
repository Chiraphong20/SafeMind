import axios from 'axios';

async function verify() {
  try {
    const resAuth = await axios.post("http://210.246.215.95:8000/token", new URLSearchParams({
      username: "admin99",
      password: "admin99"
    }));
    const token = resAuth.data.access_token;
    const BASE_URL = "http://210.246.215.95:8000/smi-v";
    
    let allItems = [];
    let skip = 0;
    while(true) {
        const res = await axios.get(`${BASE_URL}?limit=500&skip=${skip}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const items = res.data.items || res.data;
        if (items.length === 0) break;
        allItems = allItems.concat(items);
        skip += 500;
    }

    const targetHNs = [
      "HN-GRN-01", "HN-GRN-02", "HN-G-10", 
      "HN-Y-12", "HN-YEL-01", 
      "HN-RED-01", "HN-RED-02", "HN-R-10", "HN-R-11"
    ];

    const found = allItems.filter(i => targetHNs.includes(i.hn));
    
    console.log(`\n=== ผลการตรวจสอบฐานข้อมูล SMI-V แบบเจาะลึก ===`);
    console.log(`ตรวจสอบจากทั้งหมด: ${allItems.length} records`);
    console.log(`เจอข้อมูลทั้งหมด: ${found.length} รายการ (รวมรายการเก่าถ้ามี)\n`);
    
    found.forEach(item => {
        let icon = "🔴";
        if (item.result === "สีเขียว") icon = "🟢";
        if (item.result === "สีเหลือง") icon = "🟡";
        
        console.log(`${icon} รหัสคนไข้: ${item.hn} | ผลประเมิน: ${item.result} | ID: ${item.smi_v_id}`);
    });
    console.log(`===========================================\n`);

  } catch (e) {
      console.error("API error:", e.message);
  }
}
verify();
