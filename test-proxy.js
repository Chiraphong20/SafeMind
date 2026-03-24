import axios from 'axios';

async function test() {
    const payload = {
        username: "testuserOsm4",
        password: "pwd",
        full_name: "Test User OSM",
        phone_number: "0812345678",
        thai_id: "1234567890123",
        is_kyc_verified: "0",
        role_id: 5,
        email: "osm4@test.com",
        line_id: null,
        line_user_id: "UtestOSM4",
        remark: null,
        register_type: 0,
        addressid: null,
        chwpart: null,
        amppart: null,
        tmbpart: "กลางดง",
        moopart: "หมู่ 1",
        police_station_id: null,
        health_center_id: null
    };

    try {
        const response = await axios.post("http://210.246.215.95:8000/register", payload, {
            headers: {
                "Content-Type": "application/json",
            }
        });
        console.log("SUCCESS:", response.status, response.data);
    } catch (error) {
        console.error("ERROR STATUS:", error.response?.status);
    }
}

test();
