import axios from 'axios';

const FASTAPI_BASE = "http://210.246.215.95:8000";

interface PatientAlert {
  hn: string;
  pt_name: string;
  result: string;
  tmbpart?: string;
  amppart?: string;
  chwpart?: string;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, ngrok-skip-browser-warning');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { patients } = req.body;
    if (!patients || !Array.isArray(patients) || patients.length === 0) {
      return res.status(400).json({ message: 'No patient data provided.' });
    }

    // 1. Group patients by their assigned subdistrict (tmbpart)
    const areaBuckets: Record<string, PatientAlert[]> = {};
    const unmappedPatients: PatientAlert[] = []; // Patients without valid tmbpart

    for (const p of patients) {
      if (p.tmbpart) {
        if (!areaBuckets[p.tmbpart]) {
          areaBuckets[p.tmbpart] = [];
        }
        areaBuckets[p.tmbpart].push(p);
      } else {
        unmappedPatients.push(p);
      }
    }

    // Prepare LINE API headers
    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) {
        console.warn('LINE_CHANNEL_ACCESS_TOKEN not set.');
        return res.status(500).json({ error: 'LINE Token Missing from backend variables.' });
    }

    const lineHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineToken}`
    };

    let totalNotificationsSent = 0;
    
    // 2. Process each regional bucket and notify matched VHVs
    for (const [tmbpart, localPatients] of Object.entries(areaBuckets)) {
      
        // Fetch approved VHVs (role_id = 5 = อสม.) in this exact subdistrict via FastAPI
        // Step 1: Get a machine token
        const tokenRes = await axios.post(`${FASTAPI_BASE}/token`,
            new URLSearchParams({ username: "admin99", password: "admin99" }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const machineToken = tokenRes.data.access_token;
        const apiHeaders = { 'Authorization': `Bearer ${machineToken}` };

        // Step 2: Query users who are อสม. (role_id=5), active, and have the same tmbpart
        const usersRes = await axios.get(`${FASTAPI_BASE}/users`, {
            headers: apiHeaders,
            params: { role_id: 5, is_active: true, tmbpart, limit: 100 }
        });
        const vhvs = (usersRes.data.items || []).filter((u: any) => u.line_user_id);

        if (vhvs.length === 0) {
            console.log(`No VHVs found for subdistrict ${tmbpart}. Skipping ${localPatients.length} patients.`);
            continue;
        }

        // Segregate specific area patients by color for neat formatting
        const colors: Record<string, string[]> = {
            "สีแดง": [],
            "สีเหลือง": [], 
            "สีเขียว": [],
            "สีอื่นๆ": []
        };

        for (const pt of localPatients) {
            const colorGroup = pt.result || "สีอื่นๆ";
            if (colors[colorGroup] !== undefined) {
                colors[colorGroup].push(pt.pt_name);
            } else {
                colors["สีอื่นๆ"].push(pt.pt_name);
            }
        }

        const samplePt = localPatients[0] as any;
        const chw = samplePt.chwpart || "30"; 
        const amp = samplePt.amppart || "21";
        const tmb = tmbpart;
        const addressId = `${chw}${amp}${tmb}`;

        let areaName = `รหัสย่อย: ${tmb}`;
        try {
             const addrRes = await axios.get(`http://210.246.215.95:8000/thaiaddress/${addressId}`);
             if (addrRes.data && addrRes.data.full_name) {
                 areaName = addrRes.data.full_name;
             }
        } catch (e: any) {
             console.error("Failed to fetch address name", e?.message);
        }

        // Construct the localized payload string
        let messageLines = [
            `📊 สรุปรายงานผู้ป่วยเฝ้าระวัง SMI-V ประจำพื้นที่\n📍 ${areaName}\n`
        ];

        for (const [color, namesList] of Object.entries(colors)) {
            if (namesList.length === 0) continue;
            
            const icon = color === "สีแดง" ? "🔴" : color === "สีเหลือง" ? "🟡" : color === "สีเขียว" ? "🟢" : "⚪";
            messageLines.push(`${icon} กลุ่ม ${color} (รวม ${namesList.length} ราย)`);
            namesList.forEach(name => {
                messageLines.push(`- ${name}`);
            });
            messageLines.push(""); // spacer
        }

        const finalDeliveryText = messageLines.join("\n").trim();

        // 3. Dispatch individually to each valid VHV in this bucket
        for (const vhv of vhvs) {
            try {
                await axios.post(
                    'https://api.line.me/v2/bot/message/push',
                    {
                        to: vhv.line_user_id,
                        messages: [
                            {
                                type: 'text',
                                text: `สวัสดี อสม. ${vhv.full_name}\n\n${finalDeliveryText}`
                            }
                        ]
                    },
                    { headers: lineHeaders }
                );
                totalNotificationsSent++;
            } catch (err: any) {
                console.error(`Failed pushing LINE to VHV ${vhv.full_name}:`, err.response?.data || err.message);
            }
        }
    }

    return res.status(200).json({ 
        success: true, 
        message: 'Dispatched successfully', 
        push_count: totalNotificationsSent 
    });

  } catch (error: any) {
    console.error('Notification API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
