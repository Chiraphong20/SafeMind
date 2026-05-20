import axios from 'axios';

const RICHMENU_ID = 'richmenu-794d774ad8ceb72a578744bc6174616c';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { line_user_id } = req.body;
  if (!line_user_id) return res.status(400).json({ message: 'Missing line_user_id' });

  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineToken) return res.status(500).json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' });

  try {
    await axios.post(
      `https://api.line.me/v2/bot/user/${line_user_id}/richmenu/${RICHMENU_ID}`,
      {},
      { headers: { Authorization: `Bearer ${lineToken}` } }
    );
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('change-richmenu-by-line error:', err.response?.data || err.message);
    return res.status(500).json({ error: err.response?.data || err.message });
  }
}
