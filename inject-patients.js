import axios from 'axios';

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbjk5IiwiaWF0IjoxNzc0MzIzMTI5LCJleHAiOjE3NzQzMjQ5Mjl9.qQG2z_EwuZ8d4C_slqCirbsz3Iq-DWoWiv-LIzZ_r74";
const BASE_URL = "http://210.246.215.95:8000/patients";

const mockPatients = [
  { hn: "5237858", pt_name: "ด.ช. ปราโมทย์ หอมขจร" }, 
  { hn: "5243815", pt_name: "นาย สมชาย ใจดี" },
  { hn: "6813077", pt_name: "นาย กิตติศักดิ์ ทองดี" },
  { hn: "6124527", pt_name: "นางสาว สุภัสสร แสงใส" },
  { hn: "5350838", pt_name: "นาง สมพร สุขเกษม" },
  { hn: "6127247", pt_name: "นาย ประสิทธิ์ ภูมิภักดี" },
  { hn: "6115277", pt_name: "นางสาว จิราพร สว่างวงศ์" },
  { hn: "6007478", pt_name: "นาง อบเชย แจ่มกระจ่าง" },
  { hn: "6212961", pt_name: "นาย มานพ พึ่งบุญ" },
  { hn: "5236380", pt_name: "นางสาว อรทัย ใบไม้" }
];

async function injectPatients() {
  for (const p of mockPatients) {
    const payload = {
      hn: p.hn,
      pt_name: p.pt_name,
      sex: "1", // General fallback
      religion: "พุทธ", // adding a few optional strings that are harmless
      nationality: "Thai",
      citizenship: "Thai"
    };

    try {
      const res = await axios.post(BASE_URL, payload, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`Success inserting patient: ${p.hn} - ${p.pt_name}`);
    } catch (error) {
       console.error(`Error inserting patient ${p.hn}:`, error.response?.status || error.message, error.response?.data || "");
    }
  }
}

injectPatients();
