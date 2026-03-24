import axios from 'axios';

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbjk5IiwiaWF0IjoxNzc0MzIzMTI5LCJleHAiOjE3NzQzMjQ5Mjl9.qQG2z_EwuZ8d4C_slqCirbsz3Iq-DWoWiv-LIzZ_r74";
const BASE_URL = "http://210.246.215.95:8000/smi-v";

async function test() {
    try {
        const res = await axios.get(`${BASE_URL}?limit=5000`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const items = res.data.items || res.data;
        console.log("Total items:", items.length);
        if (items.length > 0) {
            console.log("First item:", items[0].hn);
            console.log("Last item:", items[items.length - 1].hn);
        }
    } catch (e) {
        console.error(e.response?.status, e.response?.data);
    }
}
test();
