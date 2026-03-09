import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const API_URL = 'https://api.line.me/v2/bot/richmenu';
const DATA_API_URL = 'https://api-data.line.me/v2/bot/richmenu';

if (!LINE_TOKEN) {
    console.error('❌ Error: LINE_CHANNEL_ACCESS_TOKEN is not defined in .env.local');
    process.exit(1);
}

const headers = {
    Authorization: `Bearer ${LINE_TOKEN}`,
    'Content-Type': 'application/json',
};

// 1. กำหนดโครงสร้าง Rich Menu แบบ 6 ช่อง
const richMenuConfig = {
    size: {
        width: 2500,
        height: 1686,
    },
    selected: true,
    name: 'Richsafemid (6 Grid)',
    chatBarText: 'เมนูบริการ',
    areas: [
        // แถวบน 3 ช่อง (y = 0 ถึง 562)
        {
            // 1. เข้าสู่ระบบ (Login)
            bounds: { x: 0, y: 0, width: 833, height: 843 },
            action: { type: 'uri', uri: 'https://safe-mind-eight.vercel.app/login' },
        },
        {
            // 2. ปักหมุดเยี่ยมบ้าน (Pin Location)
            bounds: { x: 833, y: 0, width: 834, height: 843 },
            action: { type: 'uri', uri: 'https://safe-mind-eight.vercel.app/pin' },
        },
        {
            // 3. บันทึกข้อมูล (Record Data)
            bounds: { x: 1667, y: 0, width: 833, height: 843 },
            action: { type: 'uri', uri: 'https://safe-mind-eight.vercel.app/save' },
        },
        // แถวล่าง 3 ช่อง (y = 562 ถึง 1686)
        {
            // 4. ตรวจสอบผู้ป่วย (Check Patient)
            bounds: { x: 0, y: 843, width: 833, height: 843 },
            action: { type: 'uri', uri: 'https://safe-mind-eight.vercel.app/check' },
        },
        {
            // 5. ตารางคลินิก (Clinic Schedule)
            bounds: { x: 833, y: 843, width: 834, height: 843 },
            action: { type: 'uri', uri: 'https://safe-mind-eight.vercel.app/calendar' },
        },
        {
            // 6. ส่งคำขอเทเล (Tele-request)
            bounds: { x: 1667, y: 843, width: 833, height: 843 },
            action: { type: 'uri', uri: 'https://safe-mind-eight.vercel.app/tele' },
        },
    ],
};

async function setupRichMenu() {
    try {
        // 1️⃣ สร้าง Rich Menu เปล่าๆ ขึ้นมาก่อน จะได้ ID กลับมา
        console.log('⏳ 1. Creating Rich Menu structure...');
        const createRes = await axios.post(API_URL, richMenuConfig, { headers });
        const richMenuId = createRes.data.richMenuId;
        console.log(`✅ Rich Menu Created! ID: ${richMenuId}`);

        // 2️⃣ อัปโหลดรูปภาพเข้าไปใน Rich Menu ID ที่เพิ่งสร้าง
        console.log('⏳ 2. Uploading image to Rich Menu...');
        // ใช้ path ชี้ตรงไปที่ไฟล์รูปภาพในโฟลเดอร์ Picline 
        const imagePath = 'c:/Users/User/Desktop/Picline/Richsafemind.png';

        if (!fs.existsSync(imagePath)) {
            console.error(`❌ Error: Image file not found at ${imagePath}`);
            console.log(`💡 Please copy your image file into this folder and rename it to 'richmenu-6grid.png', then run this script again.`);
            return; // ออกจากการทำงานถ้าไม่เจอมรูป
        }

        const imageBuffer = fs.readFileSync(imagePath);
        await axios.post(`${DATA_API_URL}/${richMenuId}/content`, imageBuffer, {
            headers: {
                ...headers,
                'Content-Type': 'image/png', // หรือ 'image/jpeg' ถ้าเป็น jpg
            },
        });
        console.log('✅ Image Uploaded Successfully!');

        // 3️⃣ (ไม่บังคับ) หากต้องการให้เมนูนี้เป็น Default สำหรับทุกคนที่กด Add Bot ให้เปิดคอมเมนต์บรรทัดนี้:
        /*
        console.log('⏳ 3. Setting as Default Rich Menu...');
        await axios.post(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {}, { headers });
        console.log('✅ Default Rich Menu Set!');
        */

        console.log('\n🎉 ALL DONE!');
        console.log('====================================================');
        console.log(`👉 PLEASE UPDATE your 'api/approve-user.ts' to use this ID:`);
        console.log(`const richMenuId = '${richMenuId}';`);
        console.log('====================================================\n');

    } catch (error) {
        console.error('❌ Failed:', error.response?.data || error.message);
    }
}

setupRichMenu();
