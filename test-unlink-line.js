/**
 * ใช้ทดสอบหน้าสมัครสมาชิก
 * node test-unlink-line.js unlink   ← ลบ line_user_id ออก (จำลองคนใหม่)
 * node test-unlink-line.js restore  ← เอา line_user_id กลับคืน
 */
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const FASTAPI = 'http://210.246.215.95:8000';
const YOUR_LINE_USER_ID = 'ใส่ LINE User ID ของคุณตรงนี้'; // ← เปลี่ยนตรงนี้

async function getMachineToken() {
  const res = await axios.post(
    `${FASTAPI}/token`,
    new URLSearchParams({ username: 'admin99', password: 'admin99' }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data.access_token;
}

async function main() {
  const action = process.argv[2]; // 'unlink' หรือ 'restore'
  if (!action) {
    console.log('❓ usage: node test-unlink-line.js [unlink|restore]');
    process.exit(1);
  }

  const token = await getMachineToken();
  const headers = { Authorization: `Bearer ${token}` };

  // หา user จาก line_user_id
  const searchRes = await axios.get(`${FASTAPI}/users/by-line/${YOUR_LINE_USER_ID}`, { headers });
  const user = searchRes.data;
  console.log(`👤 พบ user: ${user.full_name} (ID: ${user.user_id ?? user.id})`);

  const userId = user.user_id ?? user.id;

  if (action === 'unlink') {
    await axios.patch(
      `${FASTAPI}/users/${userId}`,
      { line_user_id: null },
      { headers }
    );
    console.log('✅ Unlink สำเร็จ — ตอนนี้กด Rich Menu 1 จะเห็นหน้าสมัครแล้ว');
    console.log('   (รัน restore เมื่อทดสอบเสร็จ)');
  } else if (action === 'restore') {
    await axios.patch(
      `${FASTAPI}/users/${userId}`,
      { line_user_id: YOUR_LINE_USER_ID },
      { headers }
    );
    console.log('✅ Restore สำเร็จ — กลับมาเป็น user เดิมแล้ว');
  }
}

main().catch(e => console.error('❌', e.response?.data || e.message));
