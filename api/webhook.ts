import axios from 'axios';

const FASTAPI_BASE = "http://210.246.215.95:8000";
const LIFF_ID = '2009105092-WldkRhqH';
const liffBase = `https://liff.line.me/${LIFF_ID}`;

// ดึงข้อมูล user จาก line_user_id — คืน { full_name, health_center_name } หรือ null ถ้าไม่พบ
async function getUserByLineId(lineUserId: string): Promise<{ full_name: string; health_center_name: string | null } | null> {
  try {
    // 1. แลก line_user_id → JWT
    const tokenRes = await axios.post(
      `${FASTAPI_BASE}/token/line`,
      { line_user_id: lineUserId },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const jwt: string = tokenRes.data.access_token;

    // 2. decode JWT payload ดึง user_id
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
    const userId: number | null = payload.user_id ?? payload.id ?? null;
    if (!userId) return null;

    // 3. ดึงข้อมูล user
    const userRes = await axios.get(`${FASTAPI_BASE}/users/${userId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const u = userRes.data;
    return {
      full_name: u.full_name ?? u.name ?? u.username ?? 'เจ้าหน้าที่',
      health_center_name: u.health_center_name ?? u.health_center?.name ?? null,
    };
  } catch {
    return null;
  }
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
    altText: 'ยินดีต้อนรับสู่ SafeMind 💙 กรุณาสมัครใช้งานก่อนนะครับ',
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
        contents: [
          {
            type: 'text',
            text: 'ขณะนี้บัญชี LINE ของท่านยังไม่ได้ลงทะเบียนในระบบ\nกรุณากดปุ่ม "สมัครใช้งาน" เพื่อเริ่มต้นครับ 👇',
            wrap: true,
            size: 'sm',
            color: '#334155',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#0284C7',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📝 สมัครใช้งาน',
              uri: `${liffBase}/login`,
            },
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
          const RICHMENU_2_ID = 'richmenu-78f2241931e8e68d20e2a5722c98a057';
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
