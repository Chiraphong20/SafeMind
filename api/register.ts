import { sql } from '@vercel/postgres';
import axios from 'axios';

export default async function handler(req: any, res: any) {
    // Add CORS headers for local development testing, although Vercel handles it in production based on vercel.json
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

    const { line_user_id, name, department, phone } = req.body;

    if (!line_user_id || !name || !phone) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // 1. Insert into DB
        // Use upsert to handle cases where user might re-register before approval
        await sql`
      INSERT INTO users (line_user_id, name, department, phone, status, created_at, updated_at)
      VALUES (${line_user_id}, ${name}, ${department}, ${phone}, 'pending', NOW(), NOW())
      ON CONFLICT (line_user_id) DO UPDATE SET
        name = EXCLUDED.name,
        department = EXCLUDED.department,
        phone = EXCLUDED.phone,
        status = 'pending',
        updated_at = NOW();
    `;

        // 2. Send LINE message
        const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (lineToken) {
            await axios.post(
                'https://api.line.me/v2/bot/message/push',
                {
                    to: line_user_id,
                    messages: [
                        {
                            type: 'text',
                            text: '✅ ระบบได้รับข้อมูลของท่านแล้ว\nขณะนี้กำลังอยู่ระหว่างการตรวจสอบครับ'
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
        } else {
            console.warn('LINE_CHANNEL_ACCESS_TOKEN is not set. Skipping LINE notification.');
        }

        return res.status(200).json({ success: true, message: 'Registered successfully' });
    } catch (error: any) {
        console.error('Registration Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
