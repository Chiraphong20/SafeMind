import { GoogleGenerativeAI } from "@google/genai";
import { UserRegistration, UserStatus } from '../types';

// ใส่ API Key ของคุณที่นี่ (เอามาจาก Google AI Studio)
const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");

export const generateEmailDraft = async (user: UserRegistration, type: UserStatus) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const action = type === UserStatus.APPROVED ? "อนุมัติ" : "ปฏิเสธ";
    
    const prompt = `เขียนร่างอีเมลภาษาไทยสั้นๆ เพื่อแจ้งลูกค้าชื่อ ${user.fullName} ว่าใบสมัครสมาชิกของเขาได้รับการ ${action} แล้ว โดยเขามาจากหน่วยงาน ${user.organization} ให้เขียนแยกเป็น 'subject' และ 'body' ในรูปแบบ JSON`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // ค้นหาและดึง JSON จาก Text (ป้องกัน AI ตอบนอกเหนือจาก JSON)
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      subject: `แจ้งผลการสมัครสมาชิก: ${action}`,
      body: `เรียนคุณ ${user.fullName}, ทางเราได้พิจารณาผลการสมัครของคุณแล้ว...`
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};