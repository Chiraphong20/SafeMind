import React, { useState } from 'react';
import { User, Phone, CheckCircle2, ShieldCheck, Loader2, Lock, CreditCard, Briefcase, MapPin, Building2, FileText, ChevronDown } from 'lucide-react';
import liff from '@line/liff';

interface Props { lineUserId: string; }

// --- Data for Pak Chong District ---
const pakChongSubdistricts = [
  'กลางดง', 'ขนงพระ', 'คลองม่วง', 'จันทึก', 'ปากช่อง', 'พญาเย็น',
  'วังกะทะ', 'วังไทร', 'หนองน้ำแดง', 'หนองสาหร่าย', 'หมูสี', 'โป่งตาลอง'
];

// Mapping Subdistrict to number of villages for simple dropdown generation
// For a real production app, you might want specific village names instead of numbers
const villageCountBySubdistrict: Record<string, number> = {
  'กลางดง': 15, 'ขนงพระ': 15, 'คลองม่วง': 11, 'จันทึก': 22, 'ปากช่อง': 22, 'พญาเย็น': 14,
  'วังกะทะ': 24, 'วังไทร': 18, 'หนองน้ำแดง': 11, 'หนองสาหร่าย': 25, 'หมูสี': 19, 'โป่งตาลอง': 13
};

const pakChongHospitals = [
  'รพ.ปากช่องนานา',
  'รพ.สต.กลางดง', 'รพ.สต.ขนงพระใต้', 'รพ.สต.ขนงพระเหนือ', 'รพ.สต.คลองม่วง',
  'รพ.สต.จันทึก', 'รพ.สต.ซับตารี', 'รพ.สต.ซับสมอทอด', 'รพ.สต.ท่ามะนาว',
  'รพ.สต.นิคมสร้างตนเองลำตะคอง', 'รพ.สต.บุ่งเตย', 'รพ.สต.ปากช่อง', 'รพ.สต.พญาเย็น',
  'รพ.สต.โป่งตาลอง', 'รพ.สต.มิตรภาพ', 'รพ.สต.วังกะทะ', 'รพ.สต.วังไทร',
  'รพ.สต.ศิริสังข์', 'รพ.สต.หนองตะกู', 'รพ.สต.หนองน้ำแดง', 'รพ.สต.หนองมะค่า',
  'รพ.สต.หนองสาหร่าย', 'รพ.สต.หมูสี'
];

const pakChongPoliceStations = [
  'สภ.ปากช่อง',
  'สภ.กลางดง',
  'สภ.หมูสี',
  'สภ.หนองสาหร่าย'
];
// ------------------------------------

const RegistrationForm: React.FC<Props> = ({ lineUserId }) => {
  const [formData, setFormData] = useState({ 
    fullName: '', 

    role: '', 
    phone: '',
    idCard: '',
    note: '',
    subdistrict: '',
    village: '',
    hospitalName: '',
    policeStation: ''
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // URL ของ Vercel Serverless Function (Backend ภายในโปรเจกต์)
  const API_URL = "/api/register";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineUserId) return alert("กรุณารอโหลดข้อมูล LINE Profile สักครู่ครับ");

    setLoading(true);
    let displayName = "";
    let email = "";
    try {
      if (liff.isLoggedIn()) {
        const profile = await liff.getProfile();
        displayName = profile.displayName;
        const decodedToken = liff.getDecodedIDToken();
        if (decodedToken && decodedToken.email) {
          email = decodedToken.email;
        }
      }
    } catch (err) {
      console.warn("Could not fetch LIFF profile/email during submit", err);
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          line_user_id: lineUserId,
          line_display_name: displayName,
          email: email,
          name: formData.fullName,
          role: formData.role,
          phone: formData.phone,
          id_card: formData.idCard,
          note: formData.note,
          subdistrict: (formData.role === 'ปกครอง' || formData.role === 'อสม.') ? formData.subdistrict : '',
          village: (formData.role === 'ปกครอง' || formData.role === 'อสม.') ? formData.village : '',
          hospital_name: formData.role === 'รพ.สต.' ? formData.hospitalName : '',
          police_station: formData.role === 'ตำรวจ' ? formData.policeStation : '',
          status: "pending"
        })
      });

      if (response.ok) setDone(true);
      else throw new Error("API Connection Failed");
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
      <p className="text-slate-500 text-sm mb-8">ข้อมูลของคุณเข้าสู่ระบบเรียบร้อยแล้ว<br />เจ้าหน้าที่จะทำการอนุมัติในไม่ช้าครับ</p>
      <button onClick={() => window.location.reload()} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition">ปิดหน้าต่างนี้</button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 mb-8">
      <div className="bg-teal-600 p-8 text-white relative">
        <h2 className="text-2xl font-bold flex items-center gap-2">ลงทะเบียนเข้าใช้งาน <ShieldCheck className="w-6 h-6" /></h2>
        <p className="text-teal-100 text-sm mt-1">SafeMind: พื้นที่ปลอดภัยเพื่อสุขภาพใจที่ดีของคุณ</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className={`p-3 rounded-2xl flex items-center gap-3 text-[10px] font-mono border transition-all ${lineUserId ? 'bg-teal-50 border-teal-100 text-teal-700' : 'bg-amber-50 border-amber-100 text-amber-700 animate-pulse'}`}>
          <div className={`w-2 h-2 rounded-full ${lineUserId ? 'bg-teal-500' : 'bg-amber-500'}`}></div>
          {lineUserId ? `Verified ID: ${lineUserId.substring(0, 16)}...` : 'Waiting for LINE Authorization...'}
        </div>

        <div className="space-y-4">
          
          <div className="relative">
            <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="ชื่อ-นามสกุล *" required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition"
              onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
          </div>

          <div className="relative">
            <Briefcase className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <select required className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition appearance-none text-slate-700"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value, subdistrict: '', village: '', hospitalName: '', policeStation: '' })}>
              <option value="" disabled>-- เลือกบทบาท * --</option>
              <option value="รพ.สต.">รพ.สต.</option>
              <option value="อสม.">อสม.</option>
              <option value="ตำรวจ">ตำรวจ</option>
              <option value="ปกครอง">ปกครอง</option>
              <option value="ผู้ใช้งานทั่วไป">ผู้ใช้งานทั่วไป</option>
            </select>
            <div className="absolute right-4 top-4 pointer-events-none">
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          {/* Conditional Fields Based on Role */}
          {(formData.role === 'ปกครอง' || formData.role === 'อสม.') && (
            <div className="flex gap-4 animate-in fade-in zoom-in duration-300">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <select required className="w-full pl-12 pr-8 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition appearance-none text-slate-700"
                  value={formData.subdistrict} 
                  onChange={e => setFormData({ ...formData, subdistrict: e.target.value, village: '' })}>
                  <option value="" disabled>-- ตำบล * --</option>
                  {pakChongSubdistricts.map(sd => (
                    <option key={sd} value={sd}>{sd}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-4 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <select required disabled={!formData.subdistrict} className="w-full pl-12 pr-8 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition appearance-none text-slate-700 disabled:opacity-50"
                  value={formData.village} 
                  onChange={e => setFormData({ ...formData, village: e.target.value })}>
                  <option value="" disabled>-- หมู่ที่ * --</option>
                  {formData.subdistrict && Array.from({ length: villageCountBySubdistrict[formData.subdistrict] || 15 }, (_, i) => i + 1).map(v => (
                    <option key={v} value={`หมู่ ${v}`}>หมู่ {v}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-4 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          )}

          {formData.role === 'รพ.สต.' && (
            <div className="relative animate-in fade-in zoom-in duration-300">
              <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <select required className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition appearance-none text-slate-700"
                value={formData.hospitalName} 
                onChange={e => setFormData({ ...formData, hospitalName: e.target.value })}>
                <option value="" disabled>-- เลือกโรงพยาบาล/รพ.สต. * --</option>
                {pakChongHospitals.map(hosp => (
                  <option key={hosp} value={hosp}>{hosp}</option>
                ))}
              </select>
              <div className="absolute right-4 top-4 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          )}

          {formData.role === 'ตำรวจ' && (
            <div className="relative animate-in fade-in zoom-in duration-300">
              <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <select required className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition appearance-none text-slate-700"
                value={formData.policeStation}
                onChange={e => setFormData({ ...formData, policeStation: e.target.value })}>
                <option value="" disabled>-- เลือกสถานีตำรวจ * --</option>
                {pakChongPoliceStations.map(ps => (
                  <option key={ps} value={ps}>{ps}</option>
                ))}
              </select>
              <div className="absolute right-4 top-4 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          )}

          {/* Regular fields */}
          <div className="relative">
            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input type="tel" placeholder="เบอร์โทรศัพท์ *" required pattern="0[0-9]{9}" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition"
              onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>

          <div className="relative">
            <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="เลขบัตรประชาชน (ไม่บังคับ)" pattern="[0-9]{13}" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition"
              onChange={e => setFormData({ ...formData, idCard: e.target.value })} />
          </div>

          <div className="relative">
            <FileText className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="หมายเหตุ (ไม่บังคับ)" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition"
              onChange={e => setFormData({ ...formData, note: e.target.value })} />
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