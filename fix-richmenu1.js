import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const OLD_ID = 'richmenu-6285aeeaba4a97e17c8ddc93088c8aa4';

async function main() {
  console.log('🔧 กำลังแก้ไข Default Rich Menu 1...\n');

  // 1. ดึงรูปภาพของ Rich Menu เดิมมาเก็บไว้ก่อน
  console.log('⏳ 1. ดึงรูปภาพจาก Rich Menu เดิม...');
  const imgRes = await axios.get(
    `https://api-data.line.me/v2/bot/richmenu/${OLD_ID}/content`,
    { headers: { Authorization: `Bearer ${TOKEN}` }, responseType: 'arraybuffer' }
  );
  const imageBuffer = Buffer.from(imgRes.data);
  const contentType = imgRes.headers['content-type'] || 'image/png';
  console.log(`✅ ดึงรูปสำเร็จ (${Math.round(imageBuffer.length / 1024)} KB, ${contentType})`);

  // 2. สร้าง Rich Menu ใหม่ด้วย URL ตรงไปที่ safe-mind-eight.vercel.app
  console.log('\n⏳ 2. สร้าง Rich Menu 1 ใหม่...');
  const newMenu = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: 'Rich Menu 1 (Register)',
    chatBarText: 'สมัครสมาชิก',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 2500, height: 1686 },
        action: {
          type: 'uri',
          uri: 'https://safe-mind-eight.vercel.app',
        },
      },
    ],
  };

  const createRes = await axios.post(
    'https://api.line.me/v2/bot/richmenu',
    newMenu,
    { headers }
  );
  const newId = createRes.data.richMenuId;
  console.log(`✅ สร้างสำเร็จ ID: ${newId}`);

  // 3. อัปโหลดรูปภาพเดิมเข้า Rich Menu ใหม่
  console.log('\n⏳ 3. อัปโหลดรูปภาพ...');
  await axios.post(
    `https://api-data.line.me/v2/bot/richmenu/${newId}/content`,
    imageBuffer,
    { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': contentType } }
  );
  console.log('✅ อัปโหลดรูปสำเร็จ');

  // 4. ตั้งเป็น Default Rich Menu (ทุกคนที่ไม่มี menu assigned)
  console.log('\n⏳ 4. ตั้งเป็น Default Rich Menu...');
  await axios.post(
    `https://api.line.me/v2/bot/user/all/richmenu/${newId}`,
    {},
    { headers }
  );
  console.log('✅ ตั้ง Default สำเร็จ');

  // 5. ลบ Rich Menu เดิมออก (clean up)
  console.log('\n⏳ 5. ลบ Rich Menu เดิมออก...');
  await axios.delete(
    `https://api.line.me/v2/bot/richmenu/${OLD_ID}`,
    { headers }
  );
  console.log('✅ ลบเดิมสำเร็จ');

  console.log('\n🎉 เสร็จสิ้น!');
  console.log(`   Default Rich Menu ใหม่ ID: ${newId}`);
  console.log(`   URL: https://safe-mind-eight.vercel.app`);
  console.log('\n   ทดสอบได้โดย: block แล้ว unblock LINE OA\n');
}

main().catch(e => {
  console.error('❌ Error:', e.response?.data || e.message);
  process.exit(1);
});
