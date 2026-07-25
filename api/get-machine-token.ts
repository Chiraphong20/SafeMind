export default async function handler(req: any, res: any) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
        return res.status(200).end();
    }

    try {
        const response = await fetch("http://210.246.215.95:8008/token", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                username: "admin99",
                // รหัสผ่านใหม่ที่ผู้ใช้เพิ่งให้มา
                password: "admin99"
            })
        });
        
        if (!response.ok) {
            return res.status(500).json({ error: "Failed to fetch machine token" });
        }
        
        const data = await response.json();
        return res.status(200).json({ access_token: data.access_token });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
