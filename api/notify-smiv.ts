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
}

const TAMBON_NAMES: Record<string, string> = {
  '01': 'ปากช่อง', '02': 'กลางดง',   '03': 'จันทึก',
  '04': 'วังกะทะ', '05': 'หมูสี',    '06': 'หนองสาหร่าย',
  '07': 'ขนงพระ',  '08': 'โป่งตาลอง','09': 'คลองม่วง',
  '10': 'หนองน้ำแดง','11': 'วังไทร', '12': 'พญาเย็น',
};

function formatThaiDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime()) || d.getFullYear() < 1900) return '-';
  const thYear = d.getFullYear() + 543;
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${d.getDate()} ${months[d.getMonth()]} ${thYear}`;
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

  const displayDate = formatThaiDate(p.entry_date);
  const dateLabel = 'วันประเมิน';

  const resultColor = (p.result ?? '').includes('แดง') ? '#C62828'
    : (p.result ?? '').includes('เหลือง') ? '#B45309'
    : (p.result ?? '').includes('เขียว') ? '#15803d'
    : '#1a202c';

  // ขาดนัด: โชว์จำนวนวันขาดนัดแทนสี, ไม่ต้องมีประวัติ/วันประเมิน
  const statusValue = isHighRisk
    ? (p.result ?? '-')
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
        ...(isHighRisk ? [
          infoRow('ประวัติ', p.result_code ?? p.result ?? '-', resultColor),
          separator(),
          infoRow(dateLabel, displayDate),
          separator(),
        ] : []),
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
      new URLSearchParams({ username: 'admin99', password: 'admin99' }),
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

    // Group patients by tmbpart
    const buckets: Record<string, SmivPatient[]> = {};
    for (const p of patients) {
      const key = (p.tmbpart ?? '').trim() || '__no_area__';
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(p);
    }

    const altText = type === 'high-risk'
      ? `⚠️ แจ้งเตือน กลุ่มเสี่ยงสูง ${patients.length} ราย`
      : `🔔 แจ้งเตือน ผู้ป่วยขาดนัด ${patients.length} ราย`;

    let totalSent = 0;

    // Build carousel per tmbpart
    const allMessages: { tmbpart: string; carousel: object }[] = [];
    for (const [tmbpart, group] of Object.entries(buckets)) {
      if (tmbpart === '__no_area__') continue;
      allMessages.push({ tmbpart, carousel: buildCarousel(tmbpart, group, type) });
    }

    for (const user of activeUsers) {
      const uTmb = (user.tmbpart ?? '').trim();
      const msgToSend = uTmb
        ? allMessages.filter(m => m.tmbpart === uTmb)
        : allMessages;

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
