import axios from 'axios';

const FASTAPI_BASE = "http://210.246.215.95:8000";

// tmbpart → health_center_ids ที่ดูแลพื้นที่นั้น
// addressid format: 3021{tmbpart} → tmbpart = last 2 chars
const HEALTH_CENTERS: { id: number; tmbpart: string; name: string }[] = [
  { id: 1,  tmbpart: "01", name: "รพ.สต.หนองมะค่า" },
  { id: 2,  tmbpart: "02", name: "รพ.สต.กลางดง" },
  { id: 3,  tmbpart: "07", name: "รพ.สต.ขนงพระเหนือ" },
  { id: 4,  tmbpart: "07", name: "รพ.สต.ขนงพระใต้" },
  { id: 5,  tmbpart: "09", name: "รพ.สต.คลองม่วง" },
  { id: 6,  tmbpart: "09", name: "รพ.สต.ซับพลู" },
  { id: 7,  tmbpart: "03", name: "รพ.สต.หนองกระทุ่ม" },
  { id: 8,  tmbpart: "03", name: "รพ.สต.หนองไข่น้ำ" },
  { id: 9,  tmbpart: "08", name: "รพ.สต.หนองคุ้ม" },
  { id: 10, tmbpart: "12", name: "รพ.สต.โนนกระโดน" },
  { id: 11, tmbpart: "05", name: "รพ.สต.ท่าช้าง" },
  { id: 12, tmbpart: "05", name: "รพ.สต.คลองดินดำ" },
  { id: 13, tmbpart: "04", name: "รพ.สต.วังกะทะ" },
  { id: 14, tmbpart: "04", name: "รพ.สต.หนองขวาง" },
  { id: 15, tmbpart: "11", name: "รพ.สต.วังไทร" },
  { id: 16, tmbpart: "11", name: "รพ.สต.ซับน้อย" },
  { id: 17, tmbpart: "10", name: "รพ.สต.หนองน้ำแดง" },
  { id: 18, tmbpart: "06", name: "รพ.สต.บ่อทอง" },
  { id: 19, tmbpart: "06", name: "รพ.สต.เฉลิมพระเกียรติฯ" },
];

interface PatientAlert {
  hn: string;
  pt_name: string;
  result: string;
  tmbpart?: string;
  amppart?: string;
  chwpart?: string;
  nextdate?: string | null;
  moopart?: string | null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, ngrok-skip-browser-warning');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { patients } = req.body as { patients: PatientAlert[] };
    if (!patients || !Array.isArray(patients) || patients.length === 0) {
      return res.status(400).json({ message: 'No patient data provided.' });
    }

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) {
      return res.status(500).json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not set.' });
    }
    const lineHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` };

    // Get machine token once
    const tokenRes = await axios.post(
      `${FASTAPI_BASE}/token`,
      new URLSearchParams({ username: "admin99", password: "admin99" }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const machineToken = tokenRes.data.access_token;
    const apiHeaders = { 'Authorization': `Bearer ${machineToken}` };

    // Group patients by tmbpart
    const areaBuckets: Record<string, PatientAlert[]> = {};
    for (const p of patients) {
      const tmb = p.tmbpart ?? "00";
      if (!areaBuckets[tmb]) areaBuckets[tmb] = [];
      areaBuckets[tmb].push(p);
    }

    let totalSent = 0;
    const results: { tmbpart: string; recipients: number; patients: number }[] = [];

    for (const [tmbpart, localPatients] of Object.entries(areaBuckets)) {
      // Find health_center_ids that cover this tmbpart
      const hcIds = HEALTH_CENTERS.filter(hc => hc.tmbpart === tmbpart).map(hc => hc.id);
      if (hcIds.length === 0) {
        console.log(`No health centers configured for tmbpart ${tmbpart}`);
        continue;
      }

      // Fetch รพ.สต. staff with line_user_id and matching health_center_id
      // Try both role_id=6 (HOSPITAL) and role_id=3 (PUKKONG) for รพ.สต. staff
      const staffByHcId = await Promise.all(
        hcIds.map(hcId =>
          axios.get(`${FASTAPI_BASE}/users`, {
            headers: apiHeaders,
            params: { health_center_id: hcId, is_active: true, limit: 100 }
          }).then(r => r.data.items ?? []).catch(() => [])
        )
      );
      const allStaff = staffByHcId.flat().filter((u: any) => u.line_user_id);
      // Deduplicate
      const seenIds = new Set<string>();
      const staff = allStaff.filter((u: any) => {
        if (seenIds.has(u.line_user_id)) return false;
        seenIds.add(u.line_user_id);
        return true;
      });

      if (staff.length === 0) {
        console.log(`No รพ.สต. staff with LINE for tmbpart ${tmbpart}`);
        continue;
      }

      // Compose message
      const hcNames = [...new Set(HEALTH_CENTERS.filter(hc => hc.tmbpart === tmbpart).map(hc => hc.name))].join(", ");
      const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
      const patientLines = localPatients.map((p, i) =>
        `${i + 1}. ${p.pt_name} (HN: ${p.hn})${p.moopart ? ` หมู่ ${p.moopart}` : ''}${p.nextdate ? ` — นัด ${p.nextdate}` : ''}`
      ).join('\n');

      const messageText =
        `⚠️ แจ้งเตือน: ผู้ป่วยขาดนัด + ยังไม่ได้เยี่ยมบ้าน\n` +
        `📍 พื้นที่: ${hcNames}\n` +
        `📅 วันที่: ${today}\n` +
        `👥 จำนวน ${localPatients.length} ราย\n\n` +
        `${patientLines}\n\n` +
        `กรุณาติดตามเยี่ยมบ้านและบันทึกข้อมูลการเยี่ยมในระบบด้วยครับ/ค่ะ`;

      for (const member of staff) {
        try {
          await axios.post(
            'https://api.line.me/v2/bot/message/push',
            {
              to: member.line_user_id,
              messages: [{ type: 'text', text: `สวัสดี ${member.full_name}\n\n${messageText}` }]
            },
            { headers: lineHeaders }
          );
          totalSent++;
        } catch (err: any) {
          console.error(`Failed LINE push to ${member.full_name}:`, err.response?.data || err.message);
        }
      }

      results.push({ tmbpart, recipients: staff.length, patients: localPatients.length });
    }

    return res.status(200).json({
      success: true,
      message: 'Dispatched to รพ.สต.',
      push_count: totalSent,
      areas: results,
    });

  } catch (error: any) {
    console.error('notify-phc error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
