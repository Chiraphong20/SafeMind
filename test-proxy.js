import handler from './api/proxy-register.js'; // Wait, it's .ts... I need to compile or run with tsx.

// Actually I'll just write a script that does exactly what the proxy does, 
// using axios with a mocked req and res
import axios from 'axios';

async function test() {
    const payload = {
        username: "testuser01",
        password: "pwd",
        full_name: "Test User",
        phone_number: "0812345678"
    };

    try {
        const response = await axios.post("http://210.246.215.95:8000/register", payload, {
            headers: {
                "Content-Type": "application/json",
            }
        });
        console.log("SUCCESS:", response.status, response.data);
    } catch (error) {
        console.error("PROXY ERROR:", error.message);
        if (error.response) {
            console.error("DATA:", error.response.data);
        }
    }
}

test();
