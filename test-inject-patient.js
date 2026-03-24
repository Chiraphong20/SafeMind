import axios from 'axios';

async function inject() {
  try {
    // 1. Get Token
    const resAuth = await axios.post("http://210.246.215.95:8000/token", new URLSearchParams({
      username: "admin99",
      password: "admin99"
    }));
    const token = resAuth.data.access_token;

    // 2. Inject Patient HN001 with all possible string fields to avoid SQL NOT NULL crashes
    const payload = {
      hn: "HN001",
      cid: "1234567890121", 
      pt_name: "นาย สมชาย ใจดี",
      sex: "1",
      occupation: "ทดสอบ",
      citizenship: "Thai",
      nationality: "Thai",
      birthday: "1990-01-01",
      birthtime: "08:00:00",
      addrpart: "111",
      moopart: "1",
      road: "test",
      tmbpart: "01",
      amppart: "01",
      chwpart: "30",
      religion: "พุทธ",
      marrystatus: "1",
      hometel: "0800000000",
      image: "",
      capture_date: new Date().toISOString(),
      last_update: new Date().toISOString()
    };

    const res = await axios.post("http://210.246.215.95:8000/patients", payload, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Success HN001:", res.status);

  } catch (error) {
    if (error.response) {
      console.error("FAIL HN001:", error.response.status, error.response.data);
    } else {
      console.log("FAIL:", error.message);
    }
  }
}
inject();
