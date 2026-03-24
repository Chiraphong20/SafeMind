async function find() {
    console.log("Fetching Nakhon Ratchasima (30) addresses...");
    const res = await fetch("http://210.246.215.95:8000/thaiaddress?chwpart=30&limit=500");
    const data = await res.json();
    if (!data.items) {
        console.error("API Error", data);
        return;
    }
    const pakChongAddresses = data.items.filter(i => i.full_name && i.full_name.includes("ปากช่อง"));
    // Print unique amppart and tmbpart combinations for Pak Chong
    const unique = new Set();
    for (const a of pakChongAddresses) {
        unique.add(`Amphoe: ${a.amppart}, Tambon: ${a.tmbpart} - ${a.name} (${a.full_name})`);
    }
    unique.forEach(u => console.log(u));
}

find();
