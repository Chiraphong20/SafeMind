import axios from 'axios';

async function test() {
    try {
        const response = await axios.post("http://210.246.215.95:8000/token", new URLSearchParams({
            username: "admin99",
            password: "securepassword"
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log("SUCCESS:", response.status, response.data);
    } catch (error) {
        console.error("ERROR:");
        if (error.response) {
            console.error(error.response.status, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

test();
