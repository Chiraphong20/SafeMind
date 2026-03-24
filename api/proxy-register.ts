import axios from 'axios';

export default async function handler(req: any, res: any) {
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

    try {
        const response = await axios.post("http://210.246.215.95:8000/register", req.body, {
            headers: {
                "Content-Type": "application/json",
            }
        });
        
        return res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('Proxy Error:', error.message);
        const status = error.response ? error.response.status : 500;
        const errObj = error.response ? error.response.data : { detail: [{ msg: "PROXY_FAIL: " + error.message }] };
        return res.status(status).json(errObj);
    }
}
