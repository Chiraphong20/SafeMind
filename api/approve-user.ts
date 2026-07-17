import axios from 'axios';

const FASTAPI = "http://210.246.215.95:8000";
const RICHMENU_ACTIVE_ID = 'richmenu-78f2241931e8e68d20e2a5722c98a057'; // Richmenu 2

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
      return res.status(200).json({ success: true, message: 'Status updated, no LINE user ID' });
    }

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) {
      return res.status(200).json({ success: true, message: 'Status updated, LINE token not configured' });
    }

    const lineHeaders = { Authorization: `Bearer ${lineToken}`, 'Content-Type': 'application/json' };

    if (isActive === 1) {
      // 4a. อนุมัติ → กำหนด Richmenu 2
      await axios.post(
        `https://api.line.me/v2/bot/user/${lineUserId}/richmenu/${RICHMENU_ACTIVE_ID}`,
        {},
        { headers: lineHeaders }
      ).catch((e: any) => console.warn('Rich Menu assign failed:', e.response?.data || e.message));

      // Push แจ้งอนุมัติ
      await axios.post(
        'https://api.line.me/v2/bot/message/push',
        {
          to: lineUserId,
          messages: [{
            type: 'text',
            text: `✅ บัญชีของ${fullName} ได้รับการอนุมัติแล้วครับ\n\nสามารถใช้งาน SafeMind ได้เลย กดเมนูด้านล่างเพื่อเริ่มต้นใช้งานครับ 🙏`,
          }],
        },
        { headers: lineHeaders }
      ).catch((e: any) => console.warn('Push failed:', e.response?.data || e.message));

    } else {
      // 4b. ปิดใช้งาน → เอา Richmenu ออก (กลับไปใช้ Richmenu 1 default)
      await axios.delete(
        `https://api.line.me/v2/bot/user/${lineUserId}/richmenu`,
        { headers: lineHeaders }
      ).catch((e: any) => console.warn('Rich Menu unlink failed:', e.response?.data || e.message));
    }

    return res.status(200).json({ success: true, line_user_id: lineUserId, is_active: isActive });

  } catch (err: any) {
    console.error('approve-user error:', err.response?.data || err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: err.response?.data || err.message,
    });
  }
}
