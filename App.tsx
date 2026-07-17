import React, { useEffect, useState } from 'react';
import liff from '@line/liff';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import PdpaConsent from './components/PdpaConsent';
import Approve from './components/Approve';
import AdminLogin from './components/AdminLogin';
import SmiVTable from './components/SmiVTable';
import SpotMap from './components/SpotMap';
import AppointmentPage from './components/AppointmentPage';
import { ShieldCheck, Loader2 } from 'lucide-react';
import ExternalRedirect from './components/ExternalRedirect';

// --- Component หลัก ---

type LineUserState = 'loading' | 'not_found' | 'pending' | 'active';

const FASTAPI = "/api/fastapi";
const MAIN_APP_URL = "https://safemind-ai.net";

async function checkLineUser(lineUserId: string): Promise<LineUserState> {
  try {
    const res = await fetch(`${FASTAPI}/users/by-line/${lineUserId}`);
    if (!res.ok) return 'not_found';
    const user = await res.json();
    return (user.is_active === true || user.is_active === 1) ? 'active' : 'pending';
  } catch {
    return 'not_found';
  }
}

function App() {
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [lineUserState, setLineUserState] = useState<LineUserState>('loading');
  // PDPA ใช้แค่ session state — แสดงทุกครั้งที่เปิดหน้าสมัคร
  const [pdpaAccepted, setPdpaAccepted] = useState<boolean>(false);
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
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setUserId(profile.userId);

        const state = await checkLineUser(profile.userId);
        setLineUserState(state);

        if (state === 'active') {
          // ผูก Rich Menu ใหม่เสมอ (รองรับกรณีเปลี่ยนเครื่อง / ติดตั้ง LINE ใหม่)
          try {
            await fetch('/api/change-richmenu-by-line', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ line_user_id: profile.userId }),
            });
          } catch {
            // non-critical — redirect ต่อถึงแม้ล้มเหลว
          }
          // redirect ไป main app เฉพาะหน้าแรก ถ้าเป็นปุ่มเมนู (/pin, /save ฯลฯ) ให้ ExternalRedirect จัดการ
          const menuPaths = ['/pin', '/save', '/check', '/calendar', '/tele', '/login', '/report'];
          if (!menuPaths.includes(window.location.pathname)) {
            window.location.href = MAIN_APP_URL;
            return;
          }
        }
      } catch (err: any) {
        console.warn("LIFF Initialization failed. Using Mock User.");
        setUserId("U_mock_local_user_" + Math.floor(Math.random() * 10000));
        setLineUserState('not_found');
      } finally {
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
        <p className="text-sm font-bold text-slate-400 animate-pulse">กำลังตรวจสอบบัญชี...</p>
      </div>
    );
  }

  if (lineUserState === 'pending' && !window.location.pathname.startsWith('/admin')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-amber-100">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg mb-2">รอการอนุมัติ</h3>
          <p className="text-sm text-slate-500 mb-6">บัญชีของคุณอยู่ระหว่างการตรวจสอบ<br />เจ้าหน้าที่จะอนุมัติในไม่ช้าครับ</p>
          <p className="text-xs text-slate-400 font-mono bg-slate-50 rounded-xl px-3 py-2 break-all">LINE ID: {userId.substring(0, 20)}...</p>
        </div>
      </div>
    );
  }

  // PDPA block — แสดงเฉพาะ not_found (คนที่ยังไม่ได้สมัคร) เท่านั้น
  if (lineUserState === 'not_found' && !pdpaAccepted && !window.location.pathname.startsWith('/admin')) {
    return (
      <PdpaConsent
        onAccept={() => setPdpaAccepted(true)}
        onReject={() => {
          if (typeof liff !== 'undefined' && liff.closeWindow) {
            liff.closeWindow();
          } else {
            window.location.href = 'https://line.me/R/';
          }
        }}
      />
    );
  }

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

          <Route
            path="/gis"
            element={
              <div className="h-screen w-full bg-slate-50 overflow-hidden">
                <SpotMap />
              </div>
            }
          />

          {/* 📄 หน้าอื่นๆ ทั้งหมด ให้มี margins แบบเดิม (max-w-5xl) */}
          <Route path="/*" element={
            <main className="py-8 px-4 max-w-5xl mx-auto w-full flex-1">
              <Routes>
                {/* หน้าแรก / Register — PDPA ผ่านแล้ว (จัดการก่อน Router) */}
                <Route path="/" element={<RegistrationForm lineUserId={userId} />} />
                <Route path="/register" element={<RegistrationForm lineUserId={userId} />} />
                <Route path="/login" element={
                  lineUserState === 'active'
                    ? <ExternalRedirect lineUserId={userId} targetPath="login" />
                    : <RegistrationForm lineUserId={userId} />
                } />

                {/* หน้าอื่นๆ */}
                <Route path="/smiv" element={<SmiVTable />} />
                <Route path="/appointments" element={<AppointmentPage />} />
                <Route path="/pin" element={<ExternalRedirect lineUserId={userId} targetPath="pin" />} />
                <Route path="/save" element={<ExternalRedirect lineUserId={userId} targetPath="save" />} />
                <Route path="/check" element={<ExternalRedirect lineUserId={userId} targetPath="check" />} />
                <Route path="/calendar" element={<ExternalRedirect lineUserId={userId} targetPath="calendar" />} />
                <Route path="/tele" element={<ExternalRedirect lineUserId={userId} targetPath="tele" />} />
                <Route path="/report" element={<ExternalRedirect lineUserId={userId} targetPath="report" />} />
              </Routes>
            </main>
          } />
        </Routes>


      </div>
    </Router>
  );
}

export default App;