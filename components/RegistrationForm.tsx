import React, { useState } from 'react';
import { User, Phone, CheckCircle2, ShieldCheck, Loader2, Lock, CreditCard, Briefcase, MapPin, Building2, FileText, ChevronDown, Mail } from 'lucide-react';
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

const healthCenters = [
  { id: 1, addressid: "302101", hospital_name: "รพ.สต.หนองมะค่า", subdistrict_name: "ต.ปากช่อง" },
  { id: 2, addressid: "302102", hospital_name: "รพ.สต.กลางดง", subdistrict_name: "ต.กลางดง" },
  { id: 3, addressid: "302107", hospital_name: "รพ.สต.ขนงพระเหนือ", subdistrict_name: "ต.ขนงพระ" },
  { id: 4, addressid: "302107", hospital_name: "รพ.สต.ขนงพระใต้", subdistrict_name: "ต.ขนงพระ" },
  { id: 5, addressid: "302109", hospital_name: "รพ.สต.คลองม่วง", subdistrict_name: "ต.คลองม่วง" },
  { id: 6, addressid: "302109", hospital_name: "รพ.สต.ซับพลู", subdistrict_name: "ต.คลองม่วง" },
  { id: 7, addressid: "302103", hospital_name: "รพ.สต.หนองกระทุ่ม", subdistrict_name: "ต.จันทึก" },
  { id: 8, addressid: "302103", hospital_name: "รพ.สต.หนองไข่น้ำ", subdistrict_name: "ต.จันทึก" },
  { id: 9, addressid: "302108", hospital_name: "รพ.สต.หนองคุ้ม", subdistrict_name: "ต.โป่งตาลอง" },
  { id: 10, addressid: "302112", hospital_name: "รพ.สต.โนนกระโดน", subdistrict_name: "ต.พญาเย็น" },
  { id: 11, addressid: "302105", hospital_name: "รพ.สต.ท่าช้าง", subdistrict_name: "ต.หมูสี" },
  { id: 12, addressid: "302105", hospital_name: "รพ.สต.คลองดินดำ", subdistrict_name: "ต.หมูสี" },
  { id: 13, addressid: "302104", hospital_name: "รพ.สต.วังกะทะ", subdistrict_name: "ต.วังกะทะ" },
  { id: 14, addressid: "302104", hospital_name: "รพ.สต.หนองขวาง", subdistrict_name: "ต.วังกะทะ" },
  { id: 15, addressid: "302111", hospital_name: "รพ.สต.วังไทร", subdistrict_name: "ต.วังไทร" },
  { id: 16, addressid: "302111", hospital_name: "รพ.สต.ซับน้อย", subdistrict_name: "ต.วังไทร" },
  { id: 17, addressid: "302110", hospital_name: "รพ.สต.หนองน้ำแดง", subdistrict_name: "ต.หนองน้ำแดง" },
  { id: 18, addressid: "302106", hospital_name: "รพ.สต.บ่อทอง", subdistrict_name: "ต.หนองสาหร่าย" },
  { id: 19, addressid: "302106", hospital_name: "รพ.สต.เฉลิมพระเกียรติฯ", subdistrict_name: "ต.หนองสาหร่าย" }
];

const policeStations = [
  { id: 1, station_name: "สภ.ปากช่อง", remark: "ต.ปากช่อง" },
  { id: 2, station_name: "สภ.ปากช่อง", remark: "ต.จันทึก" },
  { id: 3, station_name: "สภ.ปากช่อง", remark: "ต.ขนงพระ" },
  { id: 4, station_name: "สภ.ปากช่อง", remark: "ต.หนองน้ำแดง" },
  { id: 5, station_name: "สภ.หนองสาหร่าย", remark: "ต.หนองสาหร่าย" },
  { id: 6, station_name: "สภ.หนองสาหร่าย", remark: "ต.วังไทร" },
  { id: 7, station_name: "สภ.หนองสาหร่าย", remark: "ต.คลองม่วง" },
  { id: 8, station_name: "สภ.หนองสาหร่าย", remark: "ต.วังกะทะ" },
  { id: 9, station_name: "สภ.หมูสี", remark: "ต.หมูสี" },
  { id: 10, station_name: "สภ.หมูสี", remark: "ต.โป่งตาลอง" },
  { id: 11, station_name: "สภ.กลางดง", remark: "ต.กลางดง" },
  { id: 12, station_name: "สภ.กลางดง", remark: "ต.พญาเย็น" }
];
// ------------------------------------

const RegistrationForm: React.FC<Props> = ({ lineUserId }) => {
  const [formData, setFormData] = useState({ 
    username: '',
    password: '',
    email: '',
    fullName: '', 

    role: '', 
    phone: '',
    idCard: '',
    note: '',
    subdistrict: '',
    village: '',
    healthCenterId: 0,
    policeStationId: 0
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // URL ของ FastAPI Backend
  const API_URL = "http://210.246.215.95:8000/register";

  const getRoleId = (roleName: string) => {
    switch (roleName) {
      case 'รพ.สต.': return 6;
      case 'อสม.': return 5;
      case 'ตำรวจ': return 4;
      case 'ปกครอง': return 3;
      case 'ผู้ใช้งานทั่วไป': return 2;
      default: return 2;
    }
  };

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
      const isSubdistrictRole = formData.role === 'ปกครอง' || formData.role === 'อสม.';

      const payload = {
        username: formData.username,
        password: formData.password,
        full_name: formData.fullName,
        thai_id: formData.idCard || null,
        phone_number: formData.phone,
        is_kyc_verified: "0",
        role_id: getRoleId(formData.role),
        email: formData.email || email || null,
        line_id: null,
        line_user_id: lineUserId || null,
        remark: formData.note || null,
        register_type: 0,
        addressid: null,
        chwpart: isSubdistrictRole ? "นครราชสีมา" : null,
        amppart: isSubdistrictRole ? "ปากช่อง" : null,
        tmbpart: isSubdistrictRole ? formData.subdistrict : null,
        moopart: isSubdistrictRole ? formData.village : null,
        police_station_id: formData.role === 'ตำรวจ' && formData.policeStationId ? formData.policeStationId : null,
        health_center_id: formData.role === 'รพ.สต.' && formData.healthCenterId ? formData.healthCenterId : null
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setDone(true);
      } else {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(errorData.detail?.[0]?.msg || "API Connection Failed");
      }
    } catch (err: any) {
      console.error(err);
      alert(`เกิดข้อผิดพลาดในการส่งข้อมูล: ${err.message || 'กรุณาลองใหม่ครับ'}`);
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
            <input type="text" placeholder="Username *" required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition"
              onChange={e => setFormData({ ...formData, username: e.target.value })} />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input type="password" placeholder="Password *" required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition"
              onChange={e => setFormData({ ...formData, password: e.target.value })} />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input type="email" placeholder="อีเมล *" required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition"
              onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>
          
          <div className="relative">
            <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="ชื่อ-นามสกุล *" required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition"
              onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
          </div>

          <div className="relative">
            <Briefcase className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <select required className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition appearance-none text-slate-700"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value, subdistrict: '', village: '', healthCenterId: 0, policeStationId: 0 })}>
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
                value={formData.healthCenterId || ''} 
                onChange={e => setFormData({ ...formData, healthCenterId: Number(e.target.value) })}>
                <option value="" disabled>-- เลือกโรงพยาบาล/รพ.สต. * --</option>
                {healthCenters.map(hc => (
                  <option key={hc.id} value={hc.id}>{hc.hospital_name} ({hc.subdistrict_name})</option>
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
                value={formData.policeStationId || ''}
                onChange={e => setFormData({ ...formData, policeStationId: Number(e.target.value) })}>
                <option value="" disabled>-- เลือกสถานีตำรวจ * --</option>
                {policeStations.map(ps => (
                  <option key={ps.id} value={ps.id}>{ps.station_name} ({ps.remark})</option>
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
            <input type="text" placeholder="เลขบัตรประชาชน *" required pattern="[0-9]{13}" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition"
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