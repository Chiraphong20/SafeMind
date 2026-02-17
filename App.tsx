import React, { useEffect, useState } from 'react';
import liff from '@line/liff';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import { LayoutDashboard, UserPlus, ShieldCheck, MapPin, FileText, Calendar, Video, Loader2 } from 'lucide-react';

// --- Components ย่อย ---

const NavBar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-md">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tighter text-teal-700 hidden sm:block">SafeMind</span>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <Link to="/register" className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${isActive('/register') || isActive('/login') ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <UserPlus size={16} /> สมัคร
          </Link>
          <Link to="/admin" className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${isActive('/admin') ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <LayoutDashboard size={16} /> แอดมิน
          </Link>
        </div>
      </div>
    </nav>
  );
};

const PlaceholderPage = ({ title, icon: Icon, color }: any) => (
  <div className={`min-h-[60vh] flex flex-col items-center justify-center ${color} rounded-2xl border-2 border-dashed m-4 animate-in fade-in duration-500`}>
    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
      <Icon size={40} className="opacity-80" />
    </div>
    <h1 className="text-2xl font-bold">{title}</h1>
    <p className="text-slate-500 mt-2 text-sm">ระบบกำลังพัฒนา...</p>
  </div>
);

// --- Component หลัก ---

function App() {
  const [userId, setUserId] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // ✅ เพิ่ม state: loading (เริ่มต้นเป็น true เสมอ เพื่อบังหน้าจอไว้ก่อน)
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: "2009105092-WldkRhqH" });
        
        if (!liff.isLoggedIn()) {
          liff.login(); // ถ้ายังไม่ล็อกอิน ให้เด้งไปล็อกอินก่อน (หน้านี้จะค้างที่ Loading)
        } else {
          const profile = await liff.getProfile();
          setUserId(profile.userId);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        // ✅ ไม่ว่าจะสำเร็จหรือพัง ให้ปิดหน้า Loading เสมอเมื่อจบกระบวนการ
        setLoading(false);
      }
    };

    initLiff();
  }, []);

  // -------------------------------------------------------
  // 🛑 ส่วนป้องกัน: ถ้ายังโหลดไม่เสร็จ ให้โชว์หน้า Loading แทน
  // -------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-teal-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-400 animate-pulse">กำลังเชื่อมต่อ SafeMind...</p>
      </div>
    );
  }

  // -------------------------------------------------------
  // ✅ ส่วนเนื้อหาจริง: จะแสดงก็ต่อเมื่อ loading = false แล้วเท่านั้น
  // -------------------------------------------------------
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <NavBar />

        <main className="py-8 px-4 max-w-5xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              LIFF Error: {error}
            </div>
          )}

          <Routes>
            {/* หน้าแรก / Register */}
            <Route path="/" element={<RegistrationForm lineUserId={userId} />} />
            <Route path="/register" element={<RegistrationForm lineUserId={userId} />} />
            <Route path="/login" element={<RegistrationForm lineUserId={userId} />} />

            {/* หน้า Admin */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* หน้าอื่นๆ */}
            <Route path="/pin" element={<PlaceholderPage title="ปักหมุดเยี่ยมบ้าน" icon={MapPin} color="bg-green-50 text-green-700 border-green-200" />} />
            <Route path="/save" element={<PlaceholderPage title="บันทึกข้อมูล" icon={FileText} color="bg-blue-50 text-blue-700 border-blue-200" />} />
            <Route path="/check" element={<PlaceholderPage title="ตรวจสอบผู้ป่วย" icon={ShieldCheck} color="bg-green-50 text-green-700 border-green-200" />} />
            <Route path="/calendar" element={<PlaceholderPage title="ตารางคลินิก" icon={Calendar} color="bg-blue-50 text-blue-700 border-blue-200" />} />
            <Route path="/tele" element={<PlaceholderPage title="ส่งคำขอเทเล" icon={Video} color="bg-green-50 text-green-700 border-green-200" />} />
          </Routes>
        </main>

        
      </div>
    </Router>
  );
}

export default App;