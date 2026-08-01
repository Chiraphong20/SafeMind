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

    const { 
        username, password, full_name, thai_id, phone_number, is_kyc_verified, role_id, email, line_id, line_user_id, remark, register_type, addressid, chwpart, amppart, tmbpart, moopart, police_station_id, health_center_id
    } = req.body;

    if (!line_user_id || !full_name || !phone_number || !username || !password || !thai_id) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // 1. Insert into DB
        // Use upsert to handle cases where user might re-register before approval
        // มาถึง endpoint นี้ได้แปลว่าผ่านหน้า PDPA/Terms ในแอปมาแล้ว (ดู SUBPATH_MAP "register" ใน sm_FontEnd)
        // จึงบันทึก is_privacy / is_term เป็น true เสมอ ไม่พึ่งพาว่า frontend ส่งมาหรือเปล่า
        await sql`
      INSERT INTO users (
        username, password, full_name, thai_id, phone_number, is_kyc_verified, role_id, email, line_id, line_user_id, remark, register_type, addressid, chwpart, amppart, tmbpart, moopart, police_station_id, health_center_id, is_privacy, is_term, status, created_at, updated_at
      )
      VALUES (
        ${username}, ${password}, ${full_name}, ${thai_id}, ${phone_number}, ${is_kyc_verified}, ${role_id}, ${email}, ${line_id}, ${line_user_id}, ${remark}, ${register_type}, ${addressid}, ${chwpart}, ${amppart}, ${tmbpart}, ${moopart}, ${police_station_id}, ${health_center_id}, true, true, 'pending',
        NOW(), NOW()
      )
      ON CONFLICT (line_user_id) DO UPDATE SET
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        full_name = EXCLUDED.full_name,
        thai_id = EXCLUDED.thai_id,
        phone_number = EXCLUDED.phone_number,
        is_kyc_verified = EXCLUDED.is_kyc_verified,
        role_id = EXCLUDED.role_id,
        email = EXCLUDED.email,
        line_id = EXCLUDED.line_id,
        remark = EXCLUDED.remark,
        register_type = EXCLUDED.register_type,
        addressid = EXCLUDED.addressid,
        chwpart = EXCLUDED.chwpart,
        amppart = EXCLUDED.amppart,
        tmbpart = EXCLUDED.tmbpart,
        moopart = EXCLUDED.moopart,
        police_station_id = EXCLUDED.police_station_id,
        health_center_id = EXCLUDED.health_center_id,
        is_privacy = true,
        is_term = true,
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
