import axios from 'axios';

const FASTAPI_BASE = "http://210.246.215.95:8000";

export interface SmivPatient {
  hn: string;
  pt_name: string;
  result?: string;        // สีแดง / สีเหลือง / สีเขียว
  tmbpart?: string;
  amppart?: string;
  chwpart?: string;
  phone?: string;
  entry_date?: string;    // SMIV assessment date
  nextdate?: string;      // missed appointment date
  app_cause?: string;     // appointment reason
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return d; }
}

function row(label: string, value: string) {
  return {
    type: "box",
    layout: "horizontal",
    margin: "xs",
    contents: [
      { type: "text", text: label, size: "xs", color: "#888888", flex: 3 },
      { type: "text", text: value || "-", size: "xs", color: "#111111", flex: 5, wrap: true }
    ]
  };
}

function buildBubble(p: SmivPatient, type: 'high-risk' | 'missed-appointment'): object {
  const isHighRisk = type === 'high-risk';
  const headerColor = isHighRisk ? "#C62828" : "#E65100";
  const headerText = isHighRisk
    ? "⚠️ แจ้งเตือน กลุ่มเสี่ยงสูง"
    : "🔔 แจ้งเตือน ผู้ป่วยขาดนัด";

  const location = [p.tmbpart, p.amppart, p.chwpart].filter(Boolean).join(' ') || 'ไม่ระบุ';
  const phone = p.phone || '-';
  const dateVal = isHighRisk
    ? (p.entry_date ? formatDate(p.entry_date) : '-')
    : (p.nextdate ? formatDate(p.nextdate) : '-');
  const statusVal = isHighRisk ? (p.result || 'สีแดง') : 'ขาดนัดคลินิก';
  const historyVal = isHighRisk ? (p.result || '-') : (p.app_cause || '-');

  const callUri = phone !== '-'
    ? `tel:${phone.replace(/[-\s]/g, '')}`
    : 'https://safemind-ai.net';

  return {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      paddingAll: "12px",
      backgroundColor: headerColor,
      contents: [
        { type: "text", text: headerText, weight: "bold", color: "#FFFFFF", size: "sm" }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "none",
      paddingAll: "12px",
      contents: [
        row("ชื่อ-สกุล", p.pt_name || '-'),
        row("เลข HN", p.hn),
        row("พิกัด", location),
        row("สถานะ", statusVal),
        row(isHighRisk ? "ประวัติ" : "สาเหตุนัด", historyVal),
        row(isHighRisk ? "วันประเมิน" : "วันนัดที่ขาด", dateVal),
        row("เบอร์โทรศัพท์", phone),
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "12px",
      contents: [
        {
          type: "button",
          style: "primary",
          height: "sm",
          color: headerColor,
          action: { type: "uri", label: "📞 โทรหาผู้ป่วย/ญาติ", uri: callUri }
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "🗺️ นำทางลงพื้นที่เยี่ยมบ้าน",
            uri: `https://www.google.com/maps/search/${encodeURIComponent(location)}`
          }
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "📝 บันทึกข้อมูลติดตาม",
            uri: `https://safemind-ai.net:8080/visit/new?hn=${encodeURIComponent(p.hn)}`
          }
        }
      ]
    }
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { patients, type, target_role } = req.body as {
      patients: SmivPatient[];
      type: 'high-risk' | 'missed-appointment';
      target_role?: number;
    };

    if (!patients || !Array.isArray(patients) || patients.length === 0) {
      return res.status(400).json({ message: 'No patient data provided.' });
    }
    if (type !== 'high-risk' && type !== 'missed-appointment') {
      return res.status(400).json({ message: 'type must be high-risk or missed-appointment' });
    }
    const roleFilter = target_role ?? 5;

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) return res.status(500).json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' });
    const lineHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` };

    // Get machine token once
    const tokenRes = await axios.post(
      `${FASTAPI_BASE}/token`,
      new URLSearchParams({ username: "admin99", password: "admin99" }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const apiHeaders = { 'Authorization': `Bearer ${tokenRes.data.access_token}` };

    // Fetch ALL users, filter client-side (API doesn't support role_id/tmbpart query params)
    const usersRes = await axios.get(`${FASTAPI_BASE}/users`, {
      headers: apiHeaders,
      params: { limit: 500 }
    });
    const rawUsers: any[] = Array.isArray(usersRes.data)
      ? usersRes.data
      : (usersRes.data?.items ?? []);

    const isRealLineId = (id: string) =>
      typeof id === 'string' && id.length >= 10 && !id.startsWith('UNLINKED');

    const vhvAll = rawUsers.filter((u: any) =>
      u.role_id === roleFilter && u.is_active && u.line_user_id && isRealLineId(u.line_user_id)
    );

    // Group patients by tmbpart
    const buckets: Record<string, SmivPatient[]> = {};
    for (const p of patients) {
      const key = (p.tmbpart ?? '').trim() || '__no_area__';
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(p);
    }

    let totalSent = 0;
    const altText = type === 'high-risk' ? 'แจ้งเตือน กลุ่มเสี่ยงสูง' : 'แจ้งเตือน ผู้ป่วยขาดนัด';

    for (const [tmbpart, group] of Object.entries(buckets)) {
      if (tmbpart === '__no_area__') continue;

      // Match recipients: if user has no tmbpart (e.g. รพ.สต. role) → send to all
      // if user has tmbpart → must match patient's tmbpart
      const vhvs = vhvAll.filter((u: any) => {
        const uTmb = (u.tmbpart ?? '').trim();
        return uTmb === '' || uTmb === tmbpart;
      });
      if (vhvs.length === 0) continue;

      // LINE carousel = max 12 bubbles; split if needed
      const CHUNK = 12;
      for (let i = 0; i < group.length; i += CHUNK) {
        const chunk = group.slice(i, i + CHUNK);
        const bubbles = chunk.map(p => buildBubble(p, type));

        const flexContents = bubbles.length === 1
          ? bubbles[0]
          : { type: "carousel", contents: bubbles };

        const flexMessage = { type: "flex", altText, contents: flexContents };

        for (const vhv of vhvs) {
          try {
            await axios.post(
              'https://api.line.me/v2/bot/message/push',
              { to: vhv.line_user_id, messages: [flexMessage] },
              { headers: lineHeaders }
            );
            totalSent++;
          } catch (err: any) {
            console.error(`Push failed → ${vhv.full_name}:`, err.response?.data || err.message);
          }
        }
      }
    }

    // Build debug: which tmbparts had VHVs vs patients
    const vhvTmbs = [...new Set(vhvAll.map((u: any) => (u.tmbpart ?? '').trim()))].sort();
    const patTmbs = [...new Set(patients.map((p: any) => (p.tmbpart ?? '').trim()))].sort();
    const matched = patTmbs.filter(t => t && vhvTmbs.includes(t));

    return res.status(200).json({
      success: true,
      push_count: totalSent,
      debug: {
        vhv_with_line: vhvAll.length,
        patient_count: patients.length,
        vhv_tmbparts: vhvTmbs,
        patient_tmbparts: patTmbs,
        matched_tmbparts: matched,
      },
    });
  } catch (error: any) {
    console.error('notify-smiv error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
