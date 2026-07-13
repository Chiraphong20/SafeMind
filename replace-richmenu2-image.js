/**
 * เปลี่ยนรูป Rich Menu 2 (recreate เนื่องจาก LINE ไม่ให้ overwrite รูปเดิม)
 * node replace-richmenu2-image.js "C:\path\to\new-image.png"
 */
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const OLD_ID = 'richmenu-9301eee1e28d459a6e99e5ec5f45af9e';
const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function main() {
  const imagePath = process.argv[2];
  if (!imagePath || !fs.existsSync(imagePath)) {
    console.error('❌ ไม่พบไฟล์:', imagePath);
    console.log('   usage: node replace-richmenu2-image.js "path/to/image.png"');
    process.exit(1);
  }

  const ext = imagePath.toLowerCase().split('.').pop();
  const contentType = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/png';
  const imageBuffer = fs.readFileSync(imagePath);
  console.log(`📁 รูปใหม่: ${imagePath} (${Math.round(imageBuffer.length / 1024)} KB)\n`);

  // 1. ดึง config เดิมของ Rich Menu 2
  console.log('⏳ 1. ดึง config Rich Menu 2 เดิม...');
  const { data: oldMenu } = await axios.get(
    `https://api.line.me/v2/bot/richmenu/${OLD_ID}`,
    { headers }
  );
  console.log(`✅ ดึง config สำเร็จ (${oldMenu.areas.length} ปุ่ม)`);

  // 2. สร้าง Rich Menu ใหม่ด้วย config เดิม
  console.log('\n⏳ 2. สร้าง Rich Menu 2 ใหม่...');
  const { data: newMenu } = await axios.post(
    'https://api.line.me/v2/bot/richmenu',
    {
      size: oldMenu.size,
      selected: oldMenu.selected,
      name: oldMenu.name,
      chatBarText: oldMenu.chatBarText,
      areas: oldMenu.areas,
    },
    { headers }
  );
  const NEW_ID = newMenu.richMenuId;
  console.log(`✅ สร้างสำเร็จ ID ใหม่: ${NEW_ID}`);

  // 3. อัปโหลดรูปใหม่
  console.log('\n⏳ 3. อัปโหลดรูปใหม่...');
  await axios.post(
    `https://api-data.line.me/v2/bot/richmenu/${NEW_ID}/content`,
    imageBuffer,
    { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': contentType } }
  );
  console.log('✅ อัปโหลดรูปสำเร็จ');

  // 4. ลบ Rich Menu เดิม
  console.log('\n⏳ 4. ลบ Rich Menu 2 เดิม...');
  await axios.delete(`https://api.line.me/v2/bot/richmenu/${OLD_ID}`, { headers });
  console.log('✅ ลบเดิมสำเร็จ');

  // 5. อัปเดตไฟล์ที่ใช้ Rich Menu ID
  console.log('\n⏳ 5. อัปเดต ID ในไฟล์โปรเจกต์...');
  const filesToUpdate = [
    'api/approve-user.ts',
    'api/change-richmenu-by-line.ts',
    'api/webhook.ts',
  ];
  for (const f of filesToUpdate) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      if (content.includes(OLD_ID)) {
        fs.writeFileSync(f, content.replaceAll(OLD_ID, NEW_ID));
        console.log(`   ✅ อัปเดต ${f}`);
      }
    }
  }

  console.log('\n🎉 เสร็จสิ้น!');
  console.log(`   Rich Menu 2 ID ใหม่: ${NEW_ID}`);
  console.log('\n📌 ต้อง git push เพื่ออัปเดต Vercel:');
  console.log('   git add -A && git commit -m "update: Rich Menu 2 ID" && git push\n');
}

main().catch(e => {
  console.error('❌', e.response?.data || e.message);
  process.exit(1);
});
