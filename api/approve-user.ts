import { sql } from '@vercel/postgres';
import axios from 'axios';

export default async function handler(req: any, res: any) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, ngrok-skip-browser-warning'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { line_user_id } = req.body;

    if (!line_user_id) {
        return res.status(400).json({ message: 'Missing line_user_id' });
    }

    try {
        // 1. Update DB Status
        await sql`
      UPDATE users
      SET status = 'approved', updated_at = NOW()
      WHERE line_user_id = ${line_user_id};
    `;

        // 2. Change LINE Rich Menu
        const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (lineToken) {
            // The Rich Menu ID for Richsafemind (6-grid)
            const richMenuId = 'richmenu-794d774ad8ceb72a578744bc6174616c';
            await axios.post(
                `https://api.line.me/v2/bot/user/${line_user_id}/richmenu/${richMenuId}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${lineToken}`
                    }
                }
            );
        } else {
            console.warn('LINE_CHANNEL_ACCESS_TOKEN is not set. Skipping Rich Menu update.');
        }

        return res.status(200).json({ success: true, message: 'Approved!' });
    } catch (error: any) {
        console.error('Approve Error:', error?.response?.data || error.message);
        return res.status(500).json({ error: 'Internal Server Error', details: error?.response?.data || error.message });
    }
}
