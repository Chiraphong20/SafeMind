import React, { useEffect, useState } from 'react';
import liff from '@line/liff';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import Approve from './components/Approve';
import AdminLogin from './components/AdminLogin';
import SmiVTable from './components/SmiVTable';
import { LayoutDashboard, UserPlus, ShieldCheck, MapPin, FileText, Calendar, Video, Loader2 } from 'lucide-react';

// --- Components ย่อย ---



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
  const [loading, setLoading] = useState<boolean>(true);
  // Admin auth gate — seed from sessionStorage so refresh doesn't log out
  const [isAdminAuthed, setIsAdminAuthed] = useState<boolean>(
    () => !!sessionStorage.getItem('admin_token')
  );

  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) {
      setLoading(false);
      return;
    }

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
        console.warn("LIFF Initialization failed (likely localhost or invalid setup). Using Mock User.");
        setUserId("U_mock_local_user_" + Math.floor(Math.random() * 10000));
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


        <Routes>
          {/* 👑 Admin route — protected by login gate */}
          <Route path="/admin" element={
            isAdminAuthed
              ? <Approve onSignOut={() => { sessionStorage.removeItem('admin_token'); sessionStorage.removeItem('admin_user'); setIsAdminAuthed(false); }} />
              : <AdminLogin onSuccess={() => setIsAdminAuthed(true)} />
          } />

          {/* 📄 หน้าอื่นๆ ทั้งหมด ให้มี margins แบบเดิม (max-w-5xl) */}
          <Route path="/*" element={
            <main className="py-8 px-4 max-w-5xl mx-auto w-full">
              <Routes>
                {/* หน้าแรก / Register */}
                <Route path="/" element={<RegistrationForm lineUserId={userId} />} />
                <Route path="/register" element={<RegistrationForm lineUserId={userId} />} />
                <Route path="/login" element={<RegistrationForm lineUserId={userId} />} />

                {/* หน้าอื่นๆ */}
                <Route path="/smiv" element={<SmiVTable />} />
                <Route path="/pin" element={<PlaceholderPage title="ปักหมุดเยี่ยมบ้าน" icon={MapPin} color="bg-green-50 text-green-700 border-green-200" />} />
                <Route path="/save" element={<PlaceholderPage title="บันทึกข้อมูล" icon={FileText} color="bg-blue-50 text-blue-700 border-blue-200" />} />
                <Route path="/check" element={<PlaceholderPage title="ตรวจสอบผู้ป่วย" icon={ShieldCheck} color="bg-green-50 text-green-700 border-green-200" />} />
                <Route path="/calendar" element={<PlaceholderPage title="ตารางคลินิก" icon={Calendar} color="bg-blue-50 text-blue-700 border-blue-200" />} />
                <Route path="/tele" element={<PlaceholderPage title="ส่งคำขอเทเล" icon={Video} color="bg-green-50 text-green-700 border-green-200" />} />
              </Routes>
            </main>
          } />
        </Routes>


      </div>
    </Router>
  );
}

export default App;