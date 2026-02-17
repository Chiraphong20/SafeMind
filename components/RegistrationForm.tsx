import React, { useState } from 'react';
import { User, Phone, Building2, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

interface Props { lineUserId: string; }

const RegistrationForm: React.FC<Props> = ({ lineUserId }) => {
  const [formData, setFormData] = useState({ fullName: '', phone: '', organization: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // URL ของ n8n Webhook ที่คุณตั้งไว้
  const N8N_URL = "https://safemind.app.n8n.cloud/webhook/register";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineUserId) return alert("กรุณารอโหลดข้อมูล LINE Profile สักครู่ครับ");
    
    setLoading(true);
    try {
      const response = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          line_user_id: lineUserId,
          name: formData.fullName,
          department: formData.organization,
          phone: formData.phone,
          status: "pending"
        })
      });

      if (response.ok) setDone(true);
      else throw new Error("n8n Connection Failed");
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่ครับ");
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xl text-center border border-teal-50 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-center mb-6"><CheckCircle2 className="w-20 h-20 text-teal-500" /></div>
      <h2 className="text-2xl font-bold mb-2">ลงทะเบียน SafeMind สำเร็จ</h2>
      <p className="text-slate-500 text-sm mb-8">ข้อมูลของคุณเข้าสู่ระบบเรียบร้อยแล้ว<br/>เจ้าหน้าที่จะทำการอนุมัติในไม่ช้าครับ</p>
      <button onClick={() => window.location.reload()} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition">ปิดหน้าต่างนี้</button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
      <div className="bg-teal-600 p-8 text-white relative">
        <h2 className="text-2xl font-bold flex items-center gap-2">ลงทะเบียนเข้าใช้งาน <ShieldCheck className="w-6 h-6" /></h2>
        <p className="text-teal-100 text-sm mt-1">SafeMind: พื้นที่ปลอดภัยเพื่อสุขภาพใจที่ดีของคุณ</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* แถบสถานะ ID: ดักจับ UserId ให้เห็นกันจะๆ */}
        <div className={`p-3 rounded-2xl flex items-center gap-3 text-[10px] font-mono border transition-all ${lineUserId ? 'bg-teal-50 border-teal-100 text-teal-700' : 'bg-amber-50 border-amber-100 text-amber-700 animate-pulse'}`}>
          <div className={`w-2 h-2 rounded-full ${lineUserId ? 'bg-teal-500' : 'bg-amber-500'}`}></div>
          {lineUserId ? `Verified ID: ${lineUserId.substring(0, 16)}...` : 'Waiting for LINE Authorization...'}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="ชื่อ-นามสกุล" required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition" 
              onChange={e => setFormData({...formData, fullName: e.target.value})} />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input type="tel" placeholder="เบอร์โทรศัพท์" required pattern="0[0-9]{9}" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition" 
              onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>

          <div className="relative">
            <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="หน่วยงาน/สังกัด" required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition" 
              onChange={e => setFormData({...formData, organization: e.target.value})} />
          </div>
        </div>

        <button type="submit" disabled={!lineUserId || loading} className={`w-full py-4 rounded-2xl font-extrabold text-white shadow-lg transition-all flex justify-center items-center gap-2 ${lineUserId && !loading ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-200 active:scale-95' : 'bg-slate-300 cursor-not-allowed'}`}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ยืนยันการลงทะเบียน'}
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;