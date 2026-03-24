import axios from 'axios';

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbjk5IiwiaWF0IjoxNzc0MzIzMTI5LCJleHAiOjE3NzQzMjQ5Mjl9.qQG2z_EwuZ8d4C_slqCirbsz3Iq-DWoWiv-LIzZ_r74";
const BASE_URL = "http://210.246.215.95:8000/smi-v";

const mockups = [
  // สีเขียว
  { hn: "HN003", result: "สีเขียว", vn: "VN003" },
  // สีเหลือง
  { hn: "HN004", result: "สีเหลือง", vn: "VN004" },
  { hn: "HN005", result: "สีเหลือง", vn: "VN005" },
  { hn: "HN006", result: "สีเหลือง", vn: "VN006" },
  // สีแดง
  { hn: "HN007", result: "สีแดง", vn: "VN007" },
  { hn: "HN008", result: "สีแดง", vn: "VN008" },
  { hn: "HN009", result: "สีแดง", vn: "VN009" }
];

async function injectData() {
  for (let i = 0; i < mockups.length; i++) {
    const item = mockups[i];
    const payload = {
      vn: item.vn,
      hn: item.hn,
      an: "AN",
      entry_date: new Date().toISOString(),
      staff: "teststaff",
      dch_hos: "",
      dch_prison: "",
      medicine: "",
      carer: "",
      drug_abuse: "",
      insomnia: "0",
      pacing: "0",
      talking_oneself: "0",
      agitation: "0",
      paranoid: "0",
      vb0: "0",
      vb1: "0",
      vb2: "0",
      vb3: "0",
      vb4: "0",
      others: "",
      result: item.result,
      vbh: "",
      dep: "",
      smi_v_id: Math.floor(Math.random() * 1000000) // avoid collision
    };

    try {
      const res = await axios.post(BASE_URL, payload, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`Success inserting ${item.hn} - ${item.result}`);
    } catch (error) {
       console.error(`Error inserting ${item.hn}:`, error.response?.status, error.response?.data);
    }
  }
}

injectData();
