import axios from 'axios';

const FASTAPI_BASE = "http://210.246.215.95:8008";
const LIFF_ID = '2009105092-WldkRhqH';
const liffBase = `https://liff.line.me/${LIFF_ID}`;

type UserInfo = {
  full_name: string;
  station_name: string | null;
  moopart: string | null;
  tmbpart: string | null;
  addressid: string | null;
  role_id: number | null;
};

// ดึงข้อมูล user จาก line_user_id ด้วย machine token
async function getUserByLineId(lineUserId: string): Promise<(UserInfo & { health_center_name: string | null }) | null> {
  try {
    const tokenRes = await axios.post(
      `${FASTAPI_BASE}/token`,
      new URLSearchParams({ username: 'admin99', password: 'admin99' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const jwt: string = tokenRes.data.access_token;
    const authHeader = { Authorization: `Bearer ${jwt}` };

    // fetch users ทั้งหมดแล้ว filter ด้วย line_user_id
    let u: any = null;
    const r = await axios.get(`${FASTAPI_BASE}/users`, {
      headers: authHeader,
      params: { limit: 500 },
    });
    const list: any[] = Array.isArray(r.data) ? r.data : (r.data?.items ?? r.data?.data ?? []);
    u = list.find((item: any) => item.line_user_id === lineUserId) ?? null;
    if (!u) console.warn(`[getUserByLineId] no user matched line_user_id=${lineUserId} (total fetched: ${list.length})`);

    if (!u) return null;
    return {
      full_name: u.full_name ?? u.name ?? u.username ?? 'เจ้าหน้าที่',
      health_center_name: u.health_center_name ?? u.health_center?.name ?? null,
      station_name: u.station_name ?? u.hospital_name ?? null,
      moopart: u.moopart ?? null,
      tmbpart: u.tmbpart ?? null,
      addressid: u.addressid ?? null,
      role_id: u.role_id ?? null,
    };
  } catch (err: any) {
    console.error('[getUserByLineId] unexpected error:', err.message);
    return null;
  }
}

// ดึงจำนวนเคส High Risk + ขาดนัด ตามพื้นที่ของ user
async function fetchCaseSummary(user: UserInfo): Promise<{ highRisk: number; missed: number }> {
  try {
    const tokenRes = await axios.post(
      `${FASTAPI_BASE}/token`,
      new URLSearchParams({ username: 'admin99', password: 'admin99' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const authHeader = { Authorization: `Bearer ${tokenRes.data.access_token}` };

    // ดึง v-patients (ผู้ป่วยที่มีข้อมูล SMI-V)
    const vRes = await axios.get(`${FASTAPI_BASE}/v-patients?limit=500`, { headers: authHeader })
      .catch(() => null);
    const allVPatients: any[] = vRes?.data?.items ?? (Array.isArray(vRes?.data) ? vRes?.data : []);

    // กรองตามพื้นที่ — VHV (role 5): ใช้ moopart+tmbpart, รพ.สต. (role 6+): ใช้ tmbpart
    const moo = user.moopart?.trim() ?? null;
    const tmb = user.tmbpart?.trim() ?? null;

    const areaPatients = allVPatients.filter((p: any) => {
      const pTmb = p.tmbpart?.trim() ?? null;
      const pMoo = p.moopart?.trim() ?? null;
      if (!tmb) return true; // ถ้าไม่มีพื้นที่ ให้แสดงทั้งหมด
      if (moo && user.role_id === 5) return pMoo === moo && pTmb === tmb;
      return pTmb === tmb;
    });

    const today = Date.now();
    const highRisk = areaPatients.filter((p: any) => {
      const smiv = String(p.smiv_result ?? '').toLowerCase();
      const isHigh = smiv.includes('สีแดง') || smiv.includes('high') || smiv.includes('สูง') || smiv.includes('รุนแรง');
      if (!isHigh) return false;
      if (!p.follow_up_date) return true;
      const d = new Date(p.follow_up_date);
      return isNaN(d.getTime()) || d.getTime() < today;
    }).length;

    // ดึงเคสขาดนัด
    const MISSED_BASE = process.env.MISSED_APPT_BASE_URL ?? 'http://58.64.14.151/api/v2/public/index.php/api/v1';
    const MISSED_KEY  = process.env.MISSED_APPT_API_KEY ?? '';
    const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - 90);
    const toDate = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const missedRes = await axios.get(
      `${MISSED_BASE}/missed_appointment?nextdate_from=${fmt(fromDate)}&nextdate_to=${fmt(toDate)}&per_page=500&page=1`,
      { headers: MISSED_KEY ? { Authorization: `Bearer ${MISSED_KEY}` } : {} }
    ).catch(() => null);
    const missedRaw = missedRes?.data;
    const allMissed: any[] = Array.isArray(missedRaw) ? missedRaw : (missedRaw?.data ?? missedRaw?.items ?? []);

    const missed = allMissed.filter((p: any) => {
      const pTmb = p.tmbpart?.trim() ?? null;
      const pMoo = p.moopart?.trim() ?? null;
      if (!tmb) return true;
      if (moo && user.role_id === 5) return pMoo === moo && pTmb === tmb;
      return pTmb === tmb;
    }).length;

    return { highRisk, missed };
  } catch {
    return { highRisk: 0, missed: 0 };
  }
}

// Flex สรุปภารกิจติดตามประจำวัน
function buildDailySummaryFlex(stationName: string, highRisk: number, missed: number) {
  const hasUrgent = highRisk > 0 || missed > 0;
  return {
    type: 'flex',
    altText: `สรุปภารกิจ: High Risk ${highRisk} ราย, ขาดนัด ${missed} ราย`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1a3d6b',
        paddingAll: '14px',
        contents: [
          {
            type: 'box', layout: 'horizontal',
            contents: [
              { type: 'text', text: '📋', size: 'sm', flex: 0 },
              { type: 'text', text: ' สรุปภารกิจติดตามประจำวัน', color: '#ffffff', weight: 'bold', size: 'sm', flex: 1 },
            ],
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '14px',
        spacing: 'sm',
        contents: [
          {
            type: 'text',
            text: `วันนี้ในเขตความรับผิดชอบของ ${stationName} มีเคสเร่งด่วนที่ค้างต้องติดตามดังนี้ครับ:`,
            wrap: true, size: 'sm', color: '#334155',
          },
          ...(highRisk > 0 ? [{
            type: 'text' as const,
            text: `🔴 1. เคสเสี่ยงสูง (High Risk): ${highRisk} ราย`,
            size: 'sm' as const, color: '#B91C1C', weight: 'bold' as const, wrap: true,
          }] : []),
          ...(missed > 0 ? [{
            type: 'text' as const,
            text: `📅 2. เคสขาดนัดคลินิก: ${missed} ราย`,
            size: 'sm' as const, color: '#92400e', weight: 'bold' as const, wrap: true,
          }] : []),
          ...(!hasUrgent ? [{
            type: 'text' as const,
            text: '✅ ไม่มีเคสเร่งด่วนค้างอยู่ในพื้นที่ครับ',
            size: 'sm' as const, color: '#16a34a',
          }] : []),
          {
            type: 'text',
            text: 'กรุณากดปุ่มด้านล่างเพื่อเลือกดูรายชื่อคนไข้และเริ่มลงบันทึกข้อมูลครับ',
            wrap: true, size: 'xs', color: '#64748b', margin: 'md',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        spacing: 'sm',
        contents: [
          {
            type: 'button', style: 'primary', color: '#1a3d6b', height: 'sm',
            action: { type: 'uri', label: '🔍 ดูรายชื่อเคสทั้งหมด', uri: `${liffBase}/patient-check` },
          },
          {
            type: 'button', style: 'secondary', height: 'sm',
            action: { type: 'uri', label: '📅 เคสขาดนัดคลินิก', uri: `${liffBase}/patient-check` },
          },
          {
            type: 'button', style: 'secondary', height: 'sm',
            action: { type: 'uri', label: '🏠 บันทึกการเยี่ยมบ้าน', uri: `${liffBase}/save` },
          },
        ],
      },
    },
  };
}

// สร้าง Flex Message ทักทายแบบ personalized
function buildWelcomeFlex(name: string, hcName: string | null) {
  const subtitle = hcName ? `สังกัด: ${hcName}` : 'ยินดีต้อนรับสู่ SafeMind';
  return {
    type: 'flex',
    altText: `สวัสดีครับ ${name} ยินดีต้อนรับสู่ SafeMind 💙`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0B3D6B',
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '🧠 SafeMind',
                color: '#7DD3FC',
                size: 'xs',
                weight: 'bold',
                flex: 1,
              },
              {
                type: 'text',
                text: '✅ ยืนยันตัวตนแล้ว',
                color: '#34D399',
                size: 'xs',
                align: 'end',
              },
            ],
          },
          {
            type: 'text',
            text: `สวัสดีครับ ${name}`,
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
            margin: 'sm',
          },
          {
            type: 'text',
            text: subtitle,
            color: '#93C5FD',
            size: 'sm',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '14px',
        contents: [
          {
            type: 'text',
            text: 'น้อง SafeMind ยินดีต้อนรับ! ระบบได้ยืนยันสิทธิ์ของท่านและเชื่อมข้อมูลเรียบร้อยแล้ว',
            wrap: true,
            size: 'sm',
            color: '#334155',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            backgroundColor: '#F0FFF4',
            cornerRadius: '8px',
            paddingAll: '10px',
            contents: [
              {
                type: 'text',
                text: '✅ บัญชีของท่านปลอดภัยและพร้อมใช้งาน ท่านสามารถกดปุ่มทำงานหรือเลือกเมนูด้านล่างได้ทันที',
                wrap: true,
                size: 'xs',
                color: '#047857',
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '12px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#0284C7',
            height: 'sm',
            action: {
              type: 'uri',
              label: '🚀 เริ่มต้นใช้งานระบบ SafeMind',
              uri: `${liffBase}/login`,
            },
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📖 คู่มือการใช้งานเบื้องต้น',
              uri: 'https://safemind-ai.net/help',
            },
            margin: 'sm',
          },
        ],
      },
    },
  };
}

// Flex สำหรับคนที่ยังไม่ได้ลงทะเบียน
function buildRegisterFlex() {
  return {
    type: 'flex',
    altText: 'ยินดีต้อนรับสู่ SafeMind 💙 สมัครได้ที่เมนูข้างล่างครับ',
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0B3D6B',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '🧠 SafeMind',
            color: '#7DD3FC',
            size: 'xs',
            weight: 'bold',
          },
          {
            type: 'text',
            text: 'ยินดีต้อนรับ!',
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
            margin: 'sm',
          },
          {
            type: 'text',
            text: 'ระบบสุขภาพจิต อำเภอปากช่อง',
            color: '#93C5FD',
            size: 'sm',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '14px',
        spacing: 'sm',
        contents: [
          {
            type: 'text',
            text: 'ขณะนี้บัญชี LINE ของท่านยังไม่ได้ลงทะเบียนในระบบครับ',
            wrap: true,
            size: 'sm',
            color: '#334155',
          },
          {
            type: 'text',
            text: '👇 สมัครได้ที่เมนูข้างล่างครับ',
            wrap: true,
            size: 'sm',
            color: '#0B3D6B',
            weight: 'bold',
          },
        ],
      },
    },
  };
}

export default async function handler(req: any, res: any) {
  // Add CORS headers for local development testing
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const events = req.body?.events;
  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ message: 'No events found' });
  }

  try {
    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) {
      console.warn('LINE_CHANNEL_ACCESS_TOKEN is not set.');
      return res.status(500).json({ error: 'Configuration error' });
    }

    // Flex Message — เมนูตารางบริการ
    const scheduleFlexMessage = {
      type: 'flex',
      altText: 'เลือกประเภทตารางบริการ',
      contents: {
        type: 'bubble',
        size: 'kilo',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#1a56db',
          paddingAll: '16px',
          contents: [
            {
              type: 'text',
              text: '📅 ตารางบริการ',
              color: '#ffffff',
              weight: 'bold',
              size: 'lg',
            },
            {
              type: 'text',
              text: 'เลือกประเภทตารางที่ต้องการดู',
              color: '#ffffffcc',
              size: 'sm',
              margin: 'xs',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          paddingAll: '12px',
          contents: [
            {
              type: 'button',
              style: 'primary',
              color: '#1a56db',
              height: 'sm',
              action: {
                type: 'uri',
                label: '🏥 คลินิกจิตเวช (ทั่วไป)',
                uri: `${liffBase}/calendar?type=general`,
              },
              margin: 'none',
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'none',
              paddingStart: '8px',
              contents: [
                {
                  type: 'text',
                  text: 'เช้า 08:00–12:00  |  บ่าย 13:00–16:00',
                  size: 'xs',
                  color: '#64748b',
                  margin: 'xs',
                },
              ],
            },
            { type: 'separator', margin: 'sm' },
            {
              type: 'button',
              style: 'primary',
              color: '#0e7490',
              height: 'sm',
              action: {
                type: 'uri',
                label: '⭐ คลินิกพิเศษ SMC จิตเวช',
                uri: `${liffBase}/calendar?type=smc`,
              },
              margin: 'sm',
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'none',
              paddingStart: '8px',
              contents: [
                {
                  type: 'text',
                  text: 'เย็น 17:00–20:00',
                  size: 'xs',
                  color: '#64748b',
                  margin: 'xs',
                },
              ],
            },
            { type: 'separator', margin: 'sm' },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'uri',
                label: '📋 ตารางเวรจิตแพทย์ประจำเดือน',
                uri: `${liffBase}/calendar?type=duty`,
              },
              margin: 'sm',
            },
          ],
        },
      },
    };

    // Process each event
    for (const event of events) {
      // Handle postback — ตารางบริการ
      if (event.type === 'postback' && event.postback?.data === 'action=schedule_menu') {
        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          { replyToken: event.replyToken, messages: [scheduleFlexMessage] },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
        );
        continue;
      }

      // Handle message — "เริ่มต้นใช้งานระบบ SafeMind" → สรุปภารกิจประจำวันตาม รพ.สต.
      if (event.type === 'message' && event.message?.type === 'text') {
        const text: string = (event.message.text ?? '').trim();
        const lineUserId: string = event.source?.userId;
        const replyToken: string = event.replyToken;

        if (text === 'เริ่มต้นใช้งานระบบ SafeMind' && lineUserId) {
          const user = await getUserByLineId(lineUserId);
          let replyMessages: any[];

          if (user) {
            const stationName = user.station_name ?? user.health_center_name ?? 'หน่วยงานของท่าน';
            const { highRisk, missed } = await fetchCaseSummary(user);
            replyMessages = [buildDailySummaryFlex(stationName, highRisk, missed)];
          } else {
            // fallback — ถ้าหา user ไม่เจอ
            replyMessages = [{
              type: 'text',
              text: '⚠️ ไม่พบข้อมูลบัญชีของท่านในระบบ กรุณาติดต่อเจ้าหน้าที่ครับ',
            }];
          }

          await axios.post(
            'https://api.line.me/v2/bot/message/reply',
            { replyToken, messages: replyMessages },
            { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
          ).catch((e: any) => console.warn('Reply failed:', e.response?.data || e.message));
          continue;
        }
      }

      // Handle the "follow" event — personalized greeting + auto switch Rich Menu
      if (event.type === 'follow') {
        const lineUserId: string = event.source?.userId;
        const replyToken: string = event.replyToken;

        // ค้นหาข้อมูล user จากระบบ
        const user = lineUserId ? await getUserByLineId(lineUserId) : null;

        const flexMessage = user
          ? buildWelcomeFlex(user.full_name, user.health_center_name)
          : buildRegisterFlex();

        // ส่ง Flex ทักทายกลับ
        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          { replyToken, messages: [flexMessage] },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
        );

        // ถ้า user ลงทะเบียนแล้ว → สลับ Rich Menu เป็น Menu 2 ทันที
        // (block/unblock จะรีเซ็ต Rich Menu กลับเป็น default เสมอ)
        if (user && lineUserId) {
          const RICHMENU_2_ID = 'richmenu-4346f6ab2b688b71be97175b7121297d';
          await axios.post(
            `https://api.line.me/v2/bot/user/${lineUserId}/richmenu/${RICHMENU_2_ID}`,
            {},
            { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
          ).catch(() => { /* non-critical */ });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Events processed' });
  } catch (error: any) {
    console.error('Webhook Error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
