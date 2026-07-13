/**
 * เปลี่ยนรูป Rich Menu 2
 * node update-richmenu2-image.js "C:\path\to\new-image.png"
 */
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const RICHMENU_2_ID = 'richmenu-9301eee1e28d459a6e99e5ec5f45af9e';

async function main() {
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.log('❓ usage: node update-richmenu2-image.js "path/to/image.png"');
    process.exit(1);
  }

  if (!fs.existsSync(imagePath)) {
    console.error(`❌ ไม่พบไฟล์: ${imagePath}`);
    process.exit(1);
  }

  const ext = imagePath.toLowerCase().split('.').pop();
  const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';

  console.log(`⏳ อัปโหลดรูปใหม่ → Rich Menu 2...`);
  const imageBuffer = fs.readFileSync(imagePath);

  await axios.post(
    `https://api-data.line.me/v2/bot/richmenu/${RICHMENU_2_ID}/content`,
    imageBuffer,
    { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': contentType } }
  );

  console.log('✅ เปลี่ยนรูปสำเร็จ!');
  console.log('   รูปใหม่จะแสดงใน LINE ทันที (อาจต้องรอ cache ~1 นาที)');
}

main().catch(e => console.error('❌', e.response?.data || e.message));
