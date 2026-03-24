import axios from 'axios';

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbjk5IiwiaWF0IjoxNzc0MzIzMTI5LCJleHAiOjE3NzQzMjQ5Mjl9.qQG2z_EwuZ8d4C_slqCirbsz3Iq-DWoWiv-LIzZ_r74";
const BASE_URL = "http://210.246.215.95:8000/smi-v";

const mockups = [
  // สีเขียว
  { hn: "HN-GRN-01", result: "สีเขียว", vn: "VN_G1" },
  { hn: "HN-GRN-02", result: "สีเขียว", vn: "VN_G2" },
  { hn: "HN-G-10", result: "สีเขียว", vn: "VN_G3" },
  // สีเหลือง
  { hn: "HN-Y-12", result: "สีเหลือง", vn: "VN_Y1" },
  { hn: "HN-YEL-01", result: "สีเหลือง", vn: "VN_Y2" },
  // สีแดง
  { hn: "HN-RED-01", result: "สีแดง", vn: "VN_R1" },
  { hn: "HN-RED-02", result: "สีแดง", vn: "VN_R2" },
  { hn: "HN-R-10", result: "สีแดง", vn: "VN_R3" },
  { hn: "HN-R-11", result: "สีแดง", vn: "VN_R4" }
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
      smi_v_id: Math.floor(Math.random() * 1000000)
    };

    try {
      await axios.post(BASE_URL, payload, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`Success inserting SMI-V for HN ${item.hn} - ${item.result}`);
    } catch (error) {
       console.error(`Error inserting SMI-V ${item.hn}:`, error.response?.status, error.response?.data);
    }
  }
}

injectData();
