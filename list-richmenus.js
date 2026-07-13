import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const headers = { Authorization: `Bearer ${TOKEN}` };

async function main() {
  // 1. ดึงรายการ Rich Menu ทั้งหมด
  const { data } = await axios.get('https://api.line.me/v2/bot/richmenu/list', { headers });

  // 2. ดึง Default Rich Menu (Rich Menu 1 — สำหรับทุกคนที่ยังไม่ได้ assign)
  let defaultId = null;
  try {
    const def = await axios.get('https://api.line.me/v2/bot/user/all/richmenu', { headers });
    defaultId = def.data.richMenuId;
  } catch { /* ยังไม่มี default */ }

  console.log(`\n📋 Rich Menu ทั้งหมด (${data.richmenus.length} อัน)\n`);

  for (const rm of data.richmenus) {
    const isDefault = rm.richMenuId === defaultId;
    console.log(`${isDefault ? '⭐ DEFAULT (Rich Menu 1)' : '📌 Rich Menu 2'}`);
    console.log(`   ID   : ${rm.richMenuId}`);
    console.log(`   Name : ${rm.name}`);
    console.log(`   URLs :`);
    rm.areas.forEach((a, i) => {
      console.log(`     [${i + 1}] ${a.action?.uri || a.action?.type}`);
    });
    console.log('');
  }

  if (defaultId) {
    console.log(`✅ Default Rich Menu ID: ${defaultId}`);
  } else {
    console.log(`⚠️  ยังไม่มี Default Rich Menu ตั้งค่าไว้`);
  }
}

main().catch(e => console.error(e.response?.data || e.message));
