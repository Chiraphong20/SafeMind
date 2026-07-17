import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const OLD_ID = 'richmenu-78f2241931e8e68d20e2a5722c98a057';
const LIFF = 'https://liff.line.me/2009105092-WldkRhqH';

async function main() {
  console.log('🔧 อัปเดต Richmenu 2 ปุ่ม 4: /check → /patient-check\n');

  // 1. ดึงรูปเดิม
  console.log('⏳ 1. ดึงรูปภาพ...');
  const imgRes = await axios.get(
    `https://api-data.line.me/v2/bot/richmenu/${OLD_ID}/content`,
    { headers: { Authorization: `Bearer ${TOKEN}` }, responseType: 'arraybuffer' }
  );
  const imageBuffer = Buffer.from(imgRes.data);
  const contentType = imgRes.headers['content-type'] || 'image/png';
  console.log(`✅ ดึงรูปสำเร็จ (${Math.round(imageBuffer.length / 1024)} KB)`);

  // 2. สร้าง Richmenu ใหม่ — เปลี่ยนแค่ปุ่ม 4
  console.log('\n⏳ 2. สร้าง Richmenu 2 ใหม่...');
  const newMenu = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: 'Rich Menu 2',
    chatBarText: 'Menu',
    areas: [
      { bounds: { x: 8,    y: 13,  width: 807, height: 793 }, action: { type: 'uri', uri: `${LIFF}/login` } },
      { bounds: { x: 857,  y: 21,  width: 807, height: 778 }, action: { type: 'uri', uri: `${LIFF}/pin` } },
      { bounds: { x: 1698, y: 34,  width: 777, height: 755 }, action: { type: 'uri', uri: `${LIFF}/save` } },
      { bounds: { x: 22,   y: 870, width: 785, height: 773 }, action: { type: 'uri', uri: `${LIFF}/patient-check` } }, // ✅ เปลี่ยนแล้ว
      { bounds: { x: 891,  y: 883, width: 743, height: 756 }, action: { type: 'uri', uri: `${LIFF}/calendar` } },
      { bounds: { x: 1719, y: 878, width: 756, height: 735 }, action: { type: 'uri', uri: `${LIFF}/report` } },
    ],
  };

  const createRes = await axios.post('https://api.line.me/v2/bot/richmenu', newMenu, { headers });
  const newId = createRes.data.richMenuId;
  console.log(`✅ สร้างสำเร็จ ID: ${newId}`);

  // 3. อัปโหลดรูป
  console.log('\n⏳ 3. อัปโหลดรูปภาพ...');
  await axios.post(
    `https://api-data.line.me/v2/bot/richmenu/${newId}/content`,
    imageBuffer,
    { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': contentType } }
  );
  console.log('✅ อัปโหลดรูปสำเร็จ');

  // 4. ลบ Richmenu เดิม
  console.log('\n⏳ 4. ลบ Richmenu เดิม...');
  await axios.delete(`https://api.line.me/v2/bot/richmenu/${OLD_ID}`, { headers });
  console.log('✅ ลบเดิมสำเร็จ');

  console.log(`\n🎉 เสร็จสิ้น! Richmenu 2 ใหม่ ID: ${newId}`);
  console.log(`   ปุ่ม 4 → ${LIFF}/patient-check`);
  console.log(`\n⚠️  อย่าลืมอัปเดต ID ใหม่ใน:`);
  console.log(`   - api/change-richmenu.ts  (RICHMENU_ID)`);
  console.log(`   - api/approve-user.ts     (RICHMENU_ACTIVE_ID)`);
  console.log(`   - api/webhook.ts          (RICHMENU_2_ID)`);
}

main().catch(e => {
  console.error('❌ Error:', e.response?.data || e.message);
  process.exit(1);
});
