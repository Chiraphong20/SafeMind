import axios from 'axios';

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbjk5IiwiaWF0IjoxNzc0MzIzMTI5LCJleHAiOjE3NzQzMjQ5Mjl9.qQG2z_EwuZ8d4C_slqCirbsz3Iq-DWoWiv-LIzZ_r74";
const BASE_URL = "http://210.246.215.95:8000/smi-v";

const mockups = [
  // สีเขียว
  { hn: "4600861", result: "สีเขียว", vn: "VN_MOCK_01" },
  { hn: "4602430", result: "สีเขียว", vn: "VN_MOCK_02" },
  { hn: "4602443", result: "สีเขียว", vn: "VN_MOCK_03" },
  // สีเหลือง
  { hn: "4602782", result: "สีเหลือง", vn: "VN_MOCK_04" },
  { hn: "4603383", result: "สีเหลือง", vn: "VN_MOCK_05" },
  { hn: "4603503", result: "สีเหลือง", vn: "VN_MOCK_06" },
  // สีแดง
  { hn: "4603534", result: "สีแดง", vn: "VN_MOCK_07" },
  { hn: "4603640", result: "สีแดง", vn: "VN_MOCK_08" },
  { hn: "4603816", result: "สีแดง", vn: "VN_MOCK_09" }
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
      const res = await axios.post(BASE_URL, payload, {
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
