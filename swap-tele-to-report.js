/**
 * เปลี่ยนปุ่ม Tele → Report ใน Rich Menu 2
 * (recreate เนื่องจาก LINE ไม่อนุญาตแก้ areas บน Rich Menu ที่มีอยู่แล้ว)
 * node swap-tele-to-report.js
 */
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const OLD_ID = 'richmenu-3136d2491e5d67749d9956b2d20a0454';
const LIFF_BASE = 'https://liff.line.me/2009105092-WldkRhqH';
const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function main() {
  console.log('🔧 เปลี่ยนปุ่ม tele → report ใน Rich Menu 2\n');

  // 1. ดึง config เดิม
  console.log('⏳ 1. ดึง config Rich Menu 2...');
  const { data: old } = await axios.get(`https://api.line.me/v2/bot/richmenu/${OLD_ID}`, { headers });
  console.log(`✅ ดึงได้ (${old.areas.length} ปุ่ม)`);

  // 2. อัปเดต areas — เปลี่ยน /tele → /report
  const newAreas = old.areas.map(area => {
    if (area.action?.uri?.includes('/tele')) {
      console.log(`   🔄 เปลี่ยน: ${area.action.uri} → ${LIFF_BASE}/report`);
      return { ...area, action: { type: 'uri', uri: `${LIFF_BASE}/report` } };
    }
    return area;
  });

  // 3. สร้าง Rich Menu ใหม่
  console.log('\n⏳ 2. สร้าง Rich Menu ใหม่...');
  const { data: newMenu } = await axios.post('https://api.line.me/v2/bot/richmenu', {
    size: old.size,
    selected: old.selected,
    name: old.name,
    chatBarText: old.chatBarText,
    areas: newAreas,
  }, { headers });
  const NEW_ID = newMenu.richMenuId;
  console.log(`✅ ID ใหม่: ${NEW_ID}`);

  // 4. ดาวน์โหลดรูปเดิม แล้วอัปโหลดไปยัง Rich Menu ใหม่
  console.log('\n⏳ 3. คัดลอกรูปภาพ...');
  const imgRes = await axios.get(`https://api-data.line.me/v2/bot/richmenu/${OLD_ID}/content`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    responseType: 'arraybuffer',
  });
  const imgBuf = Buffer.from(imgRes.data);
  const contentType = imgRes.headers['content-type'] || 'image/png';
  await axios.post(`https://api-data.line.me/v2/bot/richmenu/${NEW_ID}/content`, imgBuf, {
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': contentType },
  });
  console.log(`✅ คัดลอกรูปสำเร็จ (${Math.round(imgBuf.length / 1024)} KB)`);

  // 5. ลบ Rich Menu เดิม
  console.log('\n⏳ 4. ลบ Rich Menu เดิม...');
  await axios.delete(`https://api.line.me/v2/bot/richmenu/${OLD_ID}`, { headers });
  console.log('✅ ลบสำเร็จ');

  // 6. อัปเดต ID ในไฟล์โปรเจกต์
  console.log('\n⏳ 5. อัปเดต Rich Menu ID ในไฟล์...');
  const { readFileSync, writeFileSync, existsSync } = await import('fs');
  const filesToUpdate = [
    'api/approve-user.ts',
    'api/change-richmenu-by-line.ts',
    'api/change-richmenu.ts',
    'api/webhook.ts',
  ];
  for (const f of filesToUpdate) {
    if (existsSync(f)) {
      const content = readFileSync(f, 'utf8');
      if (content.includes(OLD_ID)) {
        writeFileSync(f, content.replaceAll(OLD_ID, NEW_ID));
        console.log(`   ✅ ${f}`);
      }
    }
  }

  console.log('\n🎉 เสร็จสิ้น!');
  console.log(`   Rich Menu 2 ID ใหม่: ${NEW_ID}`);
  console.log('\n📌 git push เพื่ออัปเดต Vercel:');
  console.log('   git add -A && git commit -m "update: Rich Menu 2 swap tele→report" && git push\n');
}

main().catch(e => {
  console.error('❌', e.response?.data || e.message);
  process.exit(1);
});
