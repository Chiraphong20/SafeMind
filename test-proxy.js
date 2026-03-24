import axios from 'axios';

async function test() {
    const rawPayload = {
        username: "testuserRole2Codes",
        password: "pwd",
        full_name: "Test User Role 2 Codes",
        thai_id: "1234567890123",
        phone_number: "0812345678",
        is_kyc_verified: "0",
        role_id: 2,
        email: "role2codes@test.com",
        line_id: null,
        line_user_id: "UtestRole2Codes",
        remark: null,
        register_type: 1,
        addressid: "302101",
        chwpart: "30",
        amppart: "21",
        tmbpart: "01",
        moopart: "1",
        police_station_id: null,
        health_center_id: null
    };

    const payload = Object.fromEntries(
        Object.entries(rawPayload).filter(([, val]) => val !== null && val !== "")
    );

    try {
        const response = await axios.post("http://210.246.215.95:8000/register", payload, {
            headers: {
                "Content-Type": "application/json",
            }
        });
        console.log("SUCCESS:", response.status, response.data);
    } catch (error) {
        console.error("ERROR STATUS:", error.response?.status);
        console.error("DATA:", error.response?.data);
    }
}

test();
