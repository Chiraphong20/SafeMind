import { sql } from '@vercel/postgres';

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

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { rows } = await sql`
      SELECT line_user_id, full_name as name, role_id as department, phone_number as phone, status 
      FROM users 
      WHERE status = 'pending' 
      ORDER BY created_at DESC;
    `;
        return res.status(200).json(rows);
    } catch (error: any) {
        console.error('Fetch Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
