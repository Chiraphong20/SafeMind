import axios from 'axios';

const FASTAPI = "http://210.246.215.95:8000";
const RICHMENU_ID = 'richmenu-794d774ad8ceb72a578744bc6174616c';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ message: 'Missing user_id' });

  try {
    // 1. Get machine token
    const tokenRes = await axios.post(
      `${FASTAPI}/token`,
      new URLSearchParams({ username: 'admin99', password: 'admin99' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const token = tokenRes.data.access_token;
    const authHeader = { Authorization: `Bearer ${token}` };

    // 2. Fetch user to get line_user_id
    const userRes = await axios.get(`${FASTAPI}/users/${user_id}`, { headers: authHeader });
    const lineUserId: string | undefined = userRes.data.line_user_id;

    if (!lineUserId) {
      return res.status(200).json({ success: true, message: 'No LINE user ID, skipped' });
    }

    // 3. Assign Rich Menu + Push Message
    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) {
      return res.status(500).json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' });
    }

    const lineHeaders = { Authorization: `Bearer ${lineToken}`, 'Content-Type': 'application/json' };
    const fullName = userRes.data.full_name || 'คุณ';

    await Promise.all([
      // เปลี่ยน Rich Menu
      axios.post(
        `https://api.line.me/v2/bot/user/${lineUserId}/richmenu/${RICHMENU_ID}`,
        {},
        { headers: lineHeaders }
      ),
      // Push Message แจ้งอนุมัติ
      axios.post(
        'https://api.line.me/v2/bot/message/push',
        {
          to: lineUserId,
          messages: [
            {
              type: 'text',
              text: `✅ บัญชีของ${fullName} ได้รับการอนุมัติแล้วครับ\n\nสามารถใช้งาน SafeMind ได้เลย กดเมนูด้านล่างเพื่อเริ่มต้นใช้งานครับ 🙏`,
            },
          ],
        },
        { headers: lineHeaders }
      ),
    ]);

    return res.status(200).json({ success: true, line_user_id: lineUserId });
  } catch (err: any) {
    console.error('change-richmenu error:', err.response?.data || err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: err.response?.data || err.message,
    });
  }
}
