import axios from 'axios';

async function inject() {
  try {
    const resAuth = await axios.post("http://210.246.215.95:8000/token", new URLSearchParams({
      username: "admin99",
      password: "admin99"
    }));
    const token = resAuth.data.access_token;

    // Generate random 13 digit string for cid
    const randCid = Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0');

    const payload = {
      hn: "HN001_new",
      cid: randCid, 
      pt_name: "นาย สมชาย ใหม่",
      sex: "1",
      occupation: "test",
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
    console.log("Success HN001_new:", res.status);

  } catch (error) {
    if (error.response) {
      console.error("FAIL:", error.response.status, error.response.data);
    } else {
      console.log("FAIL:", error.message);
    }
  }
}
inject();
