import axios from 'axios';

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

    // Process each event
    for (const event of events) {
      // Handle the "follow" event (User adds the LINE OA as a friend)
      if (event.type === 'follow') {
        const replyToken = event.replyToken;
        const appUrl = process.env.VITE_APP_URL || 'https://safe-mind-eight.vercel.app'; // Default to known URL if not set
        const imageUrl = `${appUrl}/840732_0.png`;

        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          {
            replyToken: replyToken,
            messages: [
              {
                type: 'image',
                originalContentUrl: imageUrl,
                previewImageUrl: imageUrl
              },
              {
                type: 'text',
                text: "สวัสดีครับ! ยินดีต้อนรับสู่ SafeMind 💙\n\nเริ่มต้นใช้งานได้ง่ายๆ เพียงกดปุ่ม 'สมัคร' ด้านล่างได้เลยครับ 👇"
              }
            ]
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${lineToken}`
            }
          }
        );
      }
    }

    return res.status(200).json({ success: true, message: 'Events processed' });
  } catch (error: any) {
    console.error('Webhook Error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
