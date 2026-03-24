import axios from 'axios';

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbjk5IiwiaWF0IjoxNzc0MzIzMTI5LCJleHAiOjE3NzQzMjQ5Mjl9.qQG2z_EwuZ8d4C_slqCirbsz3Iq-DWoWiv-LIzZ_r74";
const BASE_URL = "http://210.246.215.95:8000/patients";

async function getPatients() {
    try {
        const res = await axios.get(`${BASE_URL}?limit=50`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const items = res.data.items || res.data;
        console.log(`Found ${items.length} patients.`);
        for (let i = 0; i < Math.min(10, items.length); i++) {
            console.log(`- HN: ${items[i].hn}, Name: ${items[i].pt_name}`);
        }
    } catch (e) {
        console.error(e.response?.status, e.response?.data || e.message);
    }
}
getPatients();
