const payload = {
  "username": "testuser01",
  "password": "pwd",
  "full_name": "Test User",
  "thai_id": "1234567890123",
  "phone_number": "0812345678",
  "is_kyc_verified": "0",
  "role_id": 2,
  "email": "test@test.com",
  "line_id": null,
  "line_user_id": "Utest123",
  "remark": null,
  "register_type": 0,
  "addressid": null,
  "chwpart": null,
  "amppart": null,
  "tmbpart": null,
  "moopart": null,
  "police_station_id": null,
  "health_center_id": null
};

fetch("http://210.246.215.95:8000/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
})
.then(res => res.text().then(text => ({status: res.status, text})))
.then(console.log)
.catch(console.error);
