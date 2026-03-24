import axios from 'axios';

async function test() {
    const rawPayload = {
        username: "testuserOsmStripped",
        password: "pwd",
        full_name: "Test User OSM",
        phone_number: "0812345678",
        thai_id: "1234567890123",
        is_kyc_verified: "0",
        role_id: 5,
        email: "osmstripped@test.com",
        line_id: null,
        line_user_id: "UtestOSMStripped",
        remark: null,
        register_type: 0,
        addressid: null,
        chwpart: "นครราชสีมา",
        amppart: "ปากช่อง",
        tmbpart: "กลางดง",
        moopart: "หมู่ 1",
        police_station_id: null,
        health_center_id: null
    };

    const payload = Object.fromEntries(
        Object.entries(rawPayload).filter(([, v]) => v != null && v !== "")
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
