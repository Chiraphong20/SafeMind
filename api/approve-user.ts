import axios from 'axios';

const FASTAPI = "http://210.246.215.95:8000";
const RICHMENU_ACTIVE_ID = 'richmenu-4346f6ab2b688b71be97175b7121297d'; // Richmenu 2

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { user_id, is_active, updated_user } = req.body;
  if (!user_id) return res.status(400).json({ message: 'Missing user_id' });

  try {
    // 1. Get machine token (admin99 — bypasses user JWT role check)
    const tokenRes = await axios.post(
      `${FASTAPI}/token`,
      new URLSearchParams({ username: 'admin99', password: 'admin99' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const token = tokenRes.data.access_token;
    const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 2. PATCH active-status ด้วย machine token (ไม่ติด 403)
    const isActive = is_active === 1 || is_active === true ? 1 : 0;
    await axios.patch(
      `${FASTAPI}/users/${user_id}/active-status`,
      {
        is_active: isActive,
        updated_user: updated_user ?? 0,
        updated_date: new Date().toISOString(),
      },
      { headers: authHeader }
    );

    // 3. ดึงข้อมูล user เพื่อหา line_user_id + full_name
    const userRes = await axios.get(`${FASTAPI}/users/${user_id}`, { headers: authHeader });
    const lineUserId: string | undefined = userRes.data.line_user_id;
    const fullName: string = userRes.data.full_name || 'คุณ';

    if (!lineUserId) {
      return res.status(200).json({
        success: true,
        message: 'Status updated, no LINE user ID — Richmenu ไม่เปลี่ยน',
        debug: { user_id, full_name: fullName, line_user_id: null },
      });
    }

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) {
      return res.status(200).json({ success: true, message: 'Status updated, LINE token not configured' });
    }

    const lineHeaders = { Authorization: `Bearer ${lineToken}`, 'Content-Type': 'application/json' };
    let rmResult: string = 'skipped';

    if (isActive === 1) {
      // 4a. อนุมัติ → กำหนด Richmenu 2
      rmResult = await axios.post(
        `https://api.line.me/v2/bot/user/${lineUserId}/richmenu/${RICHMENU_ACTIVE_ID}`,
        {},
        { headers: lineHeaders }
      ).then(() => 'ok').catch((e: any) => {
        console.warn('Rich Menu assign failed:', e.response?.data || e.message);
        return `failed: ${JSON.stringify(e.response?.data || e.message)}`;
      });

      // สังกัดของ user
      const userData = userRes.data;
      const affiliation: string = userData.station_name || userData.hospital_name || 'หน่วยงาน SafeMind';

      // Push Flex Message แจ้งอนุมัติ
      const flexMessage = {
        type: 'flex',
        altText: `✅ บัญชีของ${fullName} ได้รับการอนุมัติแล้วครับ`,
        contents: {
          type: 'bubble',
          size: 'kilo',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#1a3d6b',
            paddingAll: '16px',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '✅',
                    size: 'lg',
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: 'ยินดีต้อนรับเข้าใช้งานระบบ',
                    color: '#ffffff',
                    weight: 'bold',
                    size: 'md',
                    wrap: true,
                  },
                ],
              },
            ],
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            paddingAll: '16px',
            contents: [
              {
                type: 'text',
                text: `สวัสดีครับ ${fullName}`,
                weight: 'bold',
                size: 'md',
                color: '#1a3d6b',
                wrap: true,
              },
              {
                type: 'text',
                text: `สังกัด: ${affiliation}`,
                size: 'sm',
                color: '#555555',
                wrap: true,
              },
              {
                type: 'separator',
                margin: 'sm',
              },
              {
                type: 'text',
                text: 'น้อง SafeMind ยินดีต้อนรับครับ! ระบบได้ยืนยันสิทธิ์ของท่านและเชื่อมข้อมูลเข้ากับหน่วยงานเรียบร้อยแล้ว',
                size: 'sm',
                color: '#444444',
                wrap: true,
              },
              {
                type: 'text',
                text: '✅ บัญชีของท่านปลอดภัยและพร้อมใช้งาน ท่านสามารถกดปุ่มด้านล่างเพื่อเลือกเมนูด้านล่างได้ทันทีครับ',
                size: 'sm',
                color: '#2e7d32',
                wrap: true,
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
                color: '#1a3d6b',
                height: 'sm',
                action: {
                  type: 'message',
                  label: '🚀 เริ่มต้นใช้งานระบบ SafeMind',
                  text: 'เริ่มต้นใช้งานระบบ SafeMind',
                },
              },
            ],
          },
        },
      };

      await axios.post(
        'https://api.line.me/v2/bot/message/push',
        { to: lineUserId, messages: [flexMessage] },
        { headers: lineHeaders }
      ).catch((e: any) => console.warn('Push failed:', e.response?.data || e.message));

    } else {
      // 4b. ปิดใช้งาน → เอา Richmenu ออก (กลับไปใช้ Richmenu 1 default)
      await axios.delete(
        `https://api.line.me/v2/bot/user/${lineUserId}/richmenu`,
        { headers: lineHeaders }
      ).catch((e: any) => console.warn('Rich Menu unlink failed:', e.response?.data || e.message));
    }

    return res.status(200).json({
      success: true,
      is_active: isActive,
      line_user_id: lineUserId,
      richmenu: isActive === 1 ? rmResult : 'unlinked',
    });

  } catch (err: any) {
    console.error('approve-user error:', err.response?.data || err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: err.response?.data || err.message,
    });
  }
}
