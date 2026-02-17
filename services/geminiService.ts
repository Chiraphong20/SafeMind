import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserRegistration, UserStatus } from '../types';

// ใช้ (import.meta.env as any) เพื่อตบหน้า TypeScript ไม่ให้ขึ้นตัวแดงครับ
const API_KEY = (import.meta.env as any).VITE_GEMINI_API_KEY;

// ตรวจสอบเบื้องต้นว่าใส่ Key หรือยัง ถ้าไม่มีให้แจ้งเตือนใน Console
if (!API_KEY) {
  console.error("❌ ไม่พบ VITE_GEMINI_API_KEY ในไฟล์ .env.local หรือ Vercel Settings!");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

export const generateEmailDraft = async (user: UserRegistration, type: UserStatus) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" } 
    });

    const action = type === UserStatus.APPROVED ? "อนุมัติ" : "ปฏิเสธ";
    
    const prompt = `
      คุณคือผู้ช่วยจัดการระบบ SafeMind ของคลินิกความงาม
      จงเขียนร่างอีเมลภาษาไทยสั้นๆ เพื่อแจ้งคุณ ${user.fullName} จากหน่วยงาน ${user.organization} 
      ว่าใบสมัครของเขาได้รับการ "${action}" เรียบร้อยแล้ว
      คืนค่าเป็น JSON ที่มี key: 'subject' และ 'body' เท่านั้น
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // เมื่อใช้ responseMimeType เป็น application/json จะ Parse ได้เลยครับ
    return JSON.parse(text); 
    
  } catch (error) {
    console.error("Gemini Error:", error);
    // ส่งค่าสำรองกลับไป เผื่อ Gemini มีปัญหา ระบบจะได้ไม่ค้าง
    return {
      subject: `แจ้งผลการสมัครสมาชิก SafeMind`,
      body: `เรียนคุณ ${user.fullName}, ทางเราได้พิจารณาผลการสมัครของคุณแล้ว...`
    };
  }
};