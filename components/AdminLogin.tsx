import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Loader2, Lock } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://210.246.215.95:8000/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
      });

      if (!res.ok) {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        return;
      }

      const data = await res.json();

      // Check role - fetch user profile to verify admin role
      const profileRes = await fetch('http://210.246.215.95:8000/users/me', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      const profile = profileRes.ok ? await profileRes.json() : null;
      const roleId = profile?.role_id;

      // Allow role_id 1 (Admin) only
      if (roleId !== 1 && roleId !== undefined) {
        setError('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (จำเป็นต้องเป็น Admin)');
        return;
      }

      // Store token in session
      sessionStorage.setItem('admin_token', data.access_token);
      sessionStorage.setItem('admin_user', profile?.full_name || username);
      onSuccess();
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4">
      
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        
        {/* Card */}
        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-teal-500/20 border border-teal-400/30 p-4 rounded-2xl mb-4">
              <ShieldCheck className="text-teal-400" size={36} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              SafeMind<span className="text-teal-400">.</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium tracking-wide uppercase">Admin Dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                ชื่อผู้ใช้งาน
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="username"
                className="w-full bg-white/10 border border-white/15 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/15 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/15 border border-red-400/30 text-red-300 text-sm font-medium rounded-xl px-4 py-3">
                <Lock size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-white font-black rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/30 text-sm mt-2"
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> กำลังตรวจสอบ...</>
                : <><ShieldCheck size={18} /> เข้าสู่ระบบ Admin</>
              }
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            SafeMind Admin Panel · เฉพาะผู้ดูแลระบบเท่านั้น
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
