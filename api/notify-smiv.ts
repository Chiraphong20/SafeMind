import axios from 'axios';

const FASTAPI_BASE = "https://safemind-ai.net/api";
const LIFF_BASE = "https://liff.line.me/2009105092-WldkRhqH";

export interface SmivPatient {
  hn: string;
  pt_name: string;
  result?: string;
  result_code?: string;
  tmbpart?: string;
  moopart?: string;
  amppart?: string;
  chwpart?: string;
  phone?: string;
  latitude?: string | number;
  longitude?: string | number;
  entry_date?: string;
  nextdate?: string;
  app_cause?: string;
  missed_days?: number;
  /** รพ.สต. ที่แท้จริงของผู้ป่วย (resolved จาก frontend ด้วย village_list) — ใช้กำหนดผู้รับแทนตำบล */
  health_center_id?: number;
}

const TAMBON_NAMES: Record<string, string> = {
  '01': 'ปากช่อง', '02': 'กลางดง',   '03': 'จันทึก',
  '04': 'วังกะทะ', '05': 'หมูสี',    '06': 'หนองสาหร่าย',
  '07': 'ขนงพระ',  '08': 'โป่งตาลอง','09': 'คลองม่วง',
  '10': 'หนองน้ำแดง','11': 'วังไทร', '12': 'พญาเย็น',
};

function formatResultCode(code?: string | null): string {
  const c = (code ?? '').trim().toUpperCase();
  if (c === 'RED') return '(สีแดง) ยังไม่ได้ติดตาม';
  if (c === 'YELLOW') return '(สีเหลือง) ยังไม่ได้ติดตาม';
  if (c === 'GREEN') return '(สีเขียว) ยังไม่ได้ติดตาม';
  if (c === 'ORANGE') return '(สีส้ม) ยังไม่ได้ติดตาม';
  return code ?? '-';
}

function infoRow(label: string, value: string, valueColor = '#1a202c'): object {
  return {
    type: 'box',
    layout: 'horizontal',
    paddingTop: '5px',
    paddingBottom: '5px',
    contents: [
      { type: 'text', text: label, size: 'xs', color: '#888888', flex: 3 },
      { type: 'text', text: value || '-', size: 'xs', color: valueColor, weight: 'bold', flex: 5, wrap: true },
    ],
  };
}

function separator(): object {
  return { type: 'separator', color: '#f1f5f9' };
}

function buildPatientBubble(
  p: SmivPatient,
  type: 'high-risk' | 'missed-appointment',
): object {
  const isHighRisk = type === 'high-risk';
  const headerColor = isHighRisk ? '#C62828' : '#B45309';
  const headerEmoji = isHighRisk ? '⚠️' : '🔔';
  const headerTitle = isHighRisk ? 'แจ้งเตือน กลุ่มเสี่ยงสูง' : 'แจ้งเตือน ผู้ป่วยขาดนัด';

  const tmbName = TAMBON_NAMES[p.tmbpart ?? ''] ?? p.tmbpart ?? '-';
  const location = tmbName !== '-'
    ? `ต.${tmbName} หมู่ ${p.moopart ?? '-'}`
    : p.moopart ? `หมู่ ${p.moopart}` : '-';

  const resultColor = (p.result ?? '').includes('แดง') ? '#C62828'
    : (p.result ?? '').includes('เหลือง') ? '#B45309'
    : (p.result ?? '').includes('เขียว') ? '#15803d'
    : '#1a202c';

  // ขาดนัด: โชว์จำนวนวันขาดนัดแทนสี
  const statusValue = isHighRisk
    ? formatResultCode(p.result_code ?? p.result)
    : `ขาดนัด ${p.missed_days ?? '-'} วัน`;
  const statusColor = isHighRisk ? resultColor : headerColor;

  // phone button
  const phone = (p.phone ?? '').replace(/\s/g, '');
  const callUri = phone
    ? `tel:${phone}`
    : `${LIFF_BASE}/patient-detail?hn=${encodeURIComponent(p.hn)}`;

  // navigation button
  const lat = p.latitude ? String(p.latitude) : '';
  const lon = p.longitude ? String(p.longitude) : '';
  const mapsUri = (lat && lon && lat !== '0' && lon !== '0')
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((p.pt_name ?? '') + ' ต.' + tmbName + ' อ.ปากช่อง')}`;

  const saveUri = `${LIFF_BASE}/save?hn=${encodeURIComponent(p.hn)}`;
  // หน้าประวัติ Admit IPD/Visit OPD เฉพาะของผู้ป่วยรายนี้ (โหลดตอนกดปุ่มเท่านั้น ไม่ต้องยิง API ตอนส่งข้อความ)
  const historyUri = `${LIFF_BASE}/patients/history?hn=${encodeURIComponent(p.hn)}`;

  return {
    type: 'bubble',
    size: 'kilo',
    header: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '12px',
      backgroundColor: headerColor,
      contents: [
        {
          type: 'text',
          text: `${headerEmoji} ${headerTitle}`,
          weight: 'bold',
          color: '#FFFFFF',
          size: 'sm',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '12px',
      spacing: 'none',
      contents: [
        infoRow('ชื่อ-สกุล', p.pt_name ?? '-'),
        separator(),
        infoRow('เลข HN', p.hn),
        separator(),
        infoRow('พิกัด', location),
        separator(),
        infoRow('สถานะ', statusValue, statusColor),
        separator(),
        infoRow('เบอร์โทรศัพท์', p.phone ?? '-'),
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '10px',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          color: headerColor,
          action: { type: 'uri', label: '📞 โทรหาผู้ป่วย/ญาติ', uri: callUri },
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: { type: 'uri', label: '🗺️ นำทางลงพื้นที่เยี่ยมบ้าน', uri: mapsUri },
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: { type: 'uri', label: '📝 บันทึกข้อมูลติดตาม', uri: saveUri },
        },
        ...(isHighRisk ? [{
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: { type: 'uri', label: '📋 ดูประวัติ', uri: historyUri },
        }] : []),
      ],
    },
  };
}

function buildSummaryBubble(
  tmbpart: string,
  total: number,
  shown: number,
  type: 'high-risk' | 'missed-appointment',
): object {
  const isHighRisk = type === 'high-risk';
  const headerColor = isHighRisk ? '#C62828' : '#B45309';
  const tmbName = TAMBON_NAMES[tmbpart] ?? `ตำบล ${tmbpart}`;
  const remaining = total - shown;

  return {
    type: 'bubble',
    size: 'kilo',
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      justifyContent: 'center',
      contents: [
        {
          type: 'text',
          text: `ต.${tmbName}`,
          weight: 'bold',
          size: 'sm',
          color: headerColor,
          align: 'center',
        },
        {
          type: 'text',
          text: `ทั้งหมด ${total} ราย`,
          size: 'xl',
          weight: 'bold',
          color: '#1a202c',
          align: 'center',
          margin: 'sm',
        },
        ...(remaining > 0 ? [{
          type: 'text',
          text: `แสดง ${shown} ราย\nกดดูทั้งหมดในระบบ`,
          size: 'xs',
          color: '#888888',
          align: 'center',
          margin: 'sm',
          wrap: true,
        }] : []),
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '10px',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          color: headerColor,
          action: {
            type: 'uri',
            label: '📋 ดูรายชื่อทั้งหมดในระบบ',
            uri: `${LIFF_BASE}/patient-check?tmbpart=${encodeURIComponent(tmbpart)}`,
          },
        },
      ],
    },
  };
}

const MAX_PER_CAROUSEL = 10;

function buildCarousel(
  tmbpart: string,
  patients: SmivPatient[],
  type: 'high-risk' | 'missed-appointment',
): object {
  const shown = patients.slice(0, MAX_PER_CAROUSEL);
  const patientBubbles = shown.map((p) => buildPatientBubble(p, type));

  // Always append a summary bubble
  const summaryBubble = buildSummaryBubble(tmbpart, patients.length, shown.length, type);
  const bubbles = [...patientBubbles, summaryBubble];

  return { type: 'carousel', contents: bubbles };
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

    if (!patients || !Array.isArray(patients) || patients.length === 0)
      return res.status(400).json({ message: 'No patient data provided.' });
    if (type !== 'high-risk' && type !== 'missed-appointment')
      return res.status(400).json({ message: 'type must be high-risk or missed-appointment' });

    const roleFilter = target_role ?? 5;
    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) return res.status(500).json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' });
    const lineHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` };

    // machine token
    const tokenRes = await axios.post(
      `${FASTAPI_BASE}/token`,
      new URLSearchParams({ username: 'admin66', password: '007123admin' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const apiHeaders = { Authorization: `Bearer ${tokenRes.data.access_token}` };

    // fetch users
    const usersRes = await axios.get(`${FASTAPI_BASE}/users`, {
      headers: apiHeaders,
      params: { limit: 500 },
    });
    const rawUsers: any[] = Array.isArray(usersRes.data)
      ? usersRes.data
      : (usersRes.data?.items ?? []);

    const isRealLineId = (id: string) =>
      typeof id === 'string' && id.length >= 10 && !id.startsWith('UNLINKED');

    const activeUsers = rawUsers.filter((u: any) =>
      u.role_id === roleFilter && u.is_active && u.line_user_id && isRealLineId(u.line_user_id)
    );

    // จัดกลุ่มผู้ป่วยตาม รพ.สต. จริง (health_center_id) เป็นหลัก — ไม่ใช่ตำบล
    // เพราะ 1 ตำบลอาจมีหลาย รพ.สต. ถ้า route ตามตำบลอย่างเดียวจะส่งข้ามไปให้ รพ.สต. อื่นในตำบลเดียวกันด้วย
    // เก็บ fallback เป็นตำบลไว้เฉพาะเคสที่ frontend resolve รพ.สต. ไม่ได้ (ข้อมูลเก่า/ไม่มี health_center_id)
    const buckets: Record<string, SmivPatient[]> = {};
    for (const p of patients) {
      const key = p.health_center_id != null
        ? `hc:${p.health_center_id}`
        : `tmb:${(p.tmbpart ?? '').trim() || '__no_area__'}`;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(p);
    }

    const altText = type === 'high-risk'
      ? `⚠️ แจ้งเตือน กลุ่มเสี่ยงสูง ${patients.length} ราย`
      : `🔔 แจ้งเตือน ผู้ป่วยขาดนัด ${patients.length} ราย`;

    let totalSent = 0;

    // Build carousel ต่อ bucket (แสดงตำบลของผู้ป่วยคนแรกในกลุ่มไว้เป็น header เท่านั้น ไม่เกี่ยวกับการ route)
    const allMessages: { key: string; carousel: object }[] = [];
    for (const [key, group] of Object.entries(buckets)) {
      if (key === 'tmb:__no_area__') continue;
      const displayTmb = (group[0]?.tmbpart ?? '').trim();
      allMessages.push({ key, carousel: buildCarousel(displayTmb, group, type) });
    }

    for (const user of activeUsers) {
      const uHcId = user.health_center_id != null ? Number(user.health_center_id) : null;
      const uTmb = (user.tmbpart ?? '').trim();
      const msgToSend = allMessages.filter((m) => {
        if (m.key.startsWith('hc:')) {
          // เคส resolve รพ.สต. ได้แล้ว — ต้องตรงกับ รพ.สต. ของ user เป๊ะๆ เท่านั้น ห้ามใช้ตำบลช่วยจับคู่
          return uHcId != null && m.key === `hc:${uHcId}`;
        }
        // fallback ตำบล (ผู้ป่วย resolve รพ.สต. ไม่ได้ เช่นอยู่นอกเขต) — ต้องมีตำบลตรงกันเป๊ะเท่านั้น
        // ถ้า user ไม่มี tmbpart (unset) ต้องไม่ได้อะไรเลย ห้ามถือเป็น "รับทุกอย่าง" เด็ดขาด
        // (เดิมเป็น true — ทำให้ user ที่ยังไม่ตั้ง tmbpart ได้รับข้อความของทุกคนที่ resolve รพ.สต. ไม่ได้ทั้งหมด)
        return !!uTmb && m.key === `tmb:${uTmb}`;
      });

      for (const msg of msgToSend) {
        try {
          await axios.post(
            'https://api.line.me/v2/bot/message/push',
            {
              to: user.line_user_id,
              messages: [{ type: 'flex', altText, contents: msg.carousel }],
            },
            { headers: lineHeaders }
          );
          totalSent++;
        } catch (err: any) {
          console.error(`Push failed → ${user.full_name}:`, err.response?.data || err.message);
        }
      }
    }

    const patTmbs = [...new Set(patients.map((p) => (p.tmbpart ?? '').trim()))].sort();
    const userTmbSample = activeUsers.map((u: any) => ({
      name: u.full_name,
      tmbpart: u.tmbpart ?? null,
      role_id: u.role_id,
    }));
    return res.status(200).json({
      success: true,
      push_count: totalSent,
      debug: {
        active_users: activeUsers.length,
        patient_count: patients.length,
        patient_tmbparts: patTmbs,
        user_tmbparts: userTmbSample,
      },
    });
  } catch (error: any) {
    console.error('notify-smiv error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
