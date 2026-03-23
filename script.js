async function run() {
  try {
    const tokenRes = await fetch("http://210.246.215.95:8000/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "password", username: "admin99", password: "admin99" })
    });
    
    if (!tokenRes.ok) throw new Error("Token error: " + await tokenRes.text());

    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    const smiRes = await fetch("http://210.246.215.95:8000/smi-v?limit=500", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!smiRes.ok) throw new Error("SMI error: " + await smiRes.text());
    const smiData = await smiRes.json();
    const items = smiData.items || [];

    // Group by color first without names
    const colorGroups = {};
    for (const item of items) {
      const color = item.result || "ไม่ระบุสี";
      if (!colorGroups[color]) colorGroups[color] = new Set();
      colorGroups[color].add(item.hn);
    }

    // Helper function to fetch individual patient name
    async function getPatientName(hn) {
      try {
        const res = await fetch(`http://210.246.215.95:8000/patients/${hn}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          return data.pt_name ? `${data.pt_name} (HN: ${hn})` : `HN: ${hn}`;
        }
      } catch(e) {}
      return `HN: ${hn}`;
    }

    const messageLines = ["📊 สรุปประเมินความเสี่ยงผู้ป่วย (SMI-V)\n"];
    for (const color of ["สีแดง", "สีเหลือง", "สีเขียว", "สีอื่นๆ", "ไม่ระบุสี"]) {
      // Find matching categories in the data
      const matchingKeys = Object.keys(colorGroups).filter(c => {
         if (color === "สีอื่นๆ") return c && !c.includes("แดง") && !c.includes("เหลือง") && !c.includes("เขียว");
         if (color === "ไม่ระบุสี") return !c;
         return c.includes(color.replace("สี", ""));
      });
      
      const hns = new Set();
      for (const k of matchingKeys) {
        for (const hn of colorGroups[k]) hns.add(hn);
      }
      
      const hnList = Array.from(hns);
      if (hnList.length === 0) continue;

      const icon = color.includes("แดง") ? "🔴" : color.includes("เหลือง") ? "🟡" : color.includes("เขียว") ? "🟢" : "⚪";
      messageLines.push(`${icon} กลุ่ม ${color} - รวม ${hnList.length} คน`);
      
      if (color.includes("แดง") || color.includes("เหลือง")) {
        // Fetch names parallelized for fast response
        const promises = hnList.map(hn => getPatientName(hn));
        const names = await Promise.all(promises);
        for (const name of names) {
          messageLines.push(` - ${name}`);
        }
      } else {
        messageLines.push(` (ดูรายชื่อทั้งหมดได้ในระบบ)`);
      }
      messageLines.push("");
    }

    const finalMsg = messageLines.join("\n").trim();
    console.log("--- MESSAGE GENERATED START ---\n" + finalMsg + "\n--- MESSAGE GENERATED END ---");

    const lineToken = process.argv[2];
    if (lineToken) {
      const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lineToken}`
        },
        body: JSON.stringify({
          to: "U0d2bdbd002e3e481dcc09363fd1f97b4",
          messages: [{ type: "text", text: finalMsg }]
        })
      });
      console.log("LINE status:", lineRes.status, await lineRes.text());
    } else {
      console.log("\n[INFO] No LINE token provided. Skipping push message.");
    }
  } catch (e) {
    console.error(e);
  }
}
run();
