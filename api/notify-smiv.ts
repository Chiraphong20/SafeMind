import axios from 'axios';

const FASTAPI_BASE = "http://210.246.215.95:8008";
const LIFF_BASE = "https://liff.line.me/2009105092-WldkRhqH";

export interface SmivPatient {
  hn: string;
  pt_name: string;
  result?: string;
  tmbpart?: string;
  moopart?: string;
  amppart?: string;
  chwpart?: string;
  phone?: string;
  entry_date?: string;
  nextdate?: string;
  app_cause?: string;
}

const TAMBON_NAMES: Record<string, string> = {
  '01': 'ปากช่อง', '02': 'กลางดง',   '03': 'จันทึก',
  '04': 'วังกะทะ', '05': 'หมูสี',    '06': 'หนองสาหร่าย',
  '07': 'ขนงพระ',  '08': 'โป่งตาลอง','09': 'คลองม่วง',
  '10': 'หนองน้ำแดง','11': 'วังไทร', '12': 'พญาเย็น',
};

function buildAreaSummaryFlex(
  tmbpart: string,
  patients: SmivPatient[],
  type: 'high-risk' | 'missed-appointment'
): object {
  const isHighRisk = type === 'high-risk';
  const headerColor = isHighRisk ? '#C62828' : '#B45309';
  const headerEmoji = isHighRisk ? '⚠️' : '🔔';
  const headerTitle = isHighRisk ? 'แจ้งเตือน กลุ่มเสี่ยงสูง (สีแดง)' : 'แจ้งเตือน ผู้ป่วยขาดนัด';
  const tmbName = TAMBON_NAMES[tmbpart] ?? `ตำบล ${tmbpart}`;

  const MAX_SHOW = 15;
  const shown = patients.slice(0, MAX_SHOW);
  const extra = patients.length - shown.length;

  const patientRows = shown.flatMap((p, i): object[] => {
    const moo = p.moopart ? ` หมู่ ${p.moopart}` : '';
    const rowBg = i % 2 === 0 ? '#FEF2F2' : '#FFFFFF';
    return [
      {
        type: 'box',
        layout: 'vertical',
        margin: i === 0 ? 'none' : 'sm',
        paddingAll: '8px',
        backgroundColor: rowBg,
        cornerRadius: '6px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: `${i + 1}.`,
                size: 'xs',
                color: headerColor,
                weight: 'bold',
                flex: 0,
              },
              {
                type: 'text',
                text: p.pt_name || '-',
                size: 'xs',
                weight: 'bold',
                color: '#1a202c',
                flex: 1,
                margin: 'sm',
                wrap: true,
              },
            ],
          },
          {
            type: 'text',
            text: `HN: ${p.hn}${moo}`,
            size: 'xxs',
            color: '#64748b',
            margin: 'xs',
          },
        ],
      },
    ];
  });

  if (extra > 0) {
    patientRows.push({
      type: 'text',
      text: `…และอีก ${extra} ราย ดูเพิ่มเติมในระบบ`,
      size: 'xxs',
      color: '#94a3b8',
      margin: 'sm',
      align: 'center',
    } as object);
  }

  return {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '14px',
      backgroundColor: headerColor,
      contents: [
        {
          type: 'text',
          text: `${headerEmoji} ${headerTitle}`,
          weight: 'bold',
          color: '#FFFFFF',
          size: 'sm',
        },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'xs',
          contents: [
            {
              type: 'text',
              text: `ต.${tmbName} · อ.ปากช่อง`,
              color: '#ffcccc',
              size: 'xs',
              flex: 1,
            },
            {
              type: 'text',
              text: `${patients.length} ราย`,
              color: '#fde68a',
              size: 'xs',
              weight: 'bold',
              align: 'end',
              flex: 0,
            },
          ],
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '12px',
      spacing: 'none',
      contents: patientRows,
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '12px',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          color: headerColor,
          action: {
            type: 'uri',
            label: '📋 ดูรายชื่อผู้ป่วยในระบบ',
            uri: `${LIFF_BASE}/patient-check?tmbpart=${encodeURIComponent(tmbpart)}`,
          },
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'uri',
            label: '📝 บันทึกการเยี่ยมบ้าน',
            uri: `${LIFF_BASE}/save`,
          },
        },
      ],
    },
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

    // สร้าง messages ทุก tmbpart ก่อน
    const allMessages: { tmbpart: string; flex: object }[] = [];
    for (const [tmbpart, group] of Object.entries(buckets)) {
      if (tmbpart === '__no_area__') continue;
      allMessages.push({
        tmbpart,
        flex: buildAreaSummaryFlex(tmbpart, group, type),
      });
    }

    for (const user of activeUsers) {
      const uTmb = (user.tmbpart ?? '').trim();

      // ถ้า user มี tmbpart ตั้งไว้ → ส่งเฉพาะพื้นที่นั้น
      // ถ้า user ไม่มี tmbpart (null/ว่าง) → ส่งทุกพื้นที่ (broadcast)
      const msgToSend = uTmb
        ? allMessages.filter(m => m.tmbpart === uTmb)
        : allMessages;

      for (const msg of msgToSend) {
        try {
          await axios.post(
            'https://api.line.me/v2/bot/message/push',
            { to: user.line_user_id, messages: [{ type: 'flex', altText, contents: msg.flex }] },
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
