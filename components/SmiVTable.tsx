import React, { useState, useEffect, useCallback } from 'react';
import { BellRing, HeartPulse, Users, ChevronLeft, MapPin, UserCheck, Loader2, RefreshCw, X } from 'lucide-react';

// ============================================================
// Interfaces
// ============================================================

interface VHVUser {
  user_id: number;
  full_name: string;
  role_name: string;
  role_id: number;
  tmbpart?: string | null;
  amppart?: string | null;
  chwpart?: string | null;
  address_full_name?: string | null;
  is_active: boolean;
  line_user_id?: string | null;
}

interface Patient {
  hn: string;
  pt_name: string;
  sex: string;
  tmbpart?: string | null;
  amppart?: string | null;
  chwpart?: string | null;
}

interface SmiV {
  smi_v_id: number;
  hn?: string | null;
  entry_date?: string | null;
  result?: string | null;
}

interface MappedSmiV extends SmiV {
  pt_name: string;
  tmbpart?: string;
  amppart?: string;
  chwpart?: string;
}

// Role color mapping
const ROLE_COLORS: Record<number, string> = {
  1: 'bg-purple-100 text-purple-700',
  2: 'bg-slate-100 text-slate-600',
  3: 'bg-orange-100 text-orange-700',
  4: 'bg-blue-100 text-blue-700',
  5: 'bg-emerald-100 text-emerald-700',
  6: 'bg-pink-100 text-pink-700',
};

const ResultBadge = ({ result }: { result?: string | null }) => {
  const cls =
    result === 'สีแดง' ? 'bg-red-100 text-red-700' :
    result === 'สีเหลือง' ? 'bg-yellow-100 text-yellow-700' :
    result === 'สีเขียว' ? 'bg-green-100 text-green-700' :
    'bg-slate-100 text-slate-500';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>
      {result || 'ไม่ระบุ'}
    </span>
  );
};

// ============================================================
// Main Component
// ============================================================

const SmiVTable: React.FC = () => {
  const API_BASE_URL = '/api/fastapi';

  const [users, setUsers] = useState<VHVUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [selectedUser, setSelectedUser] = useState<VHVUser | null>(null);
  const [patients, setPatients] = useState<MappedSmiV[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [notifying, setNotifying] = useState(false);

  // ─── 1. Load ALL active non-admin users ───────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const tokenRes = await fetch('/api/get-machine-token');
      const { access_token } = await tokenRes.json();
      const headers = { Authorization: `Bearer ${access_token}` };

      const targetRoles = [3, 4, 5, 6];
      const fetched: VHVUser[] = [];

      for (const roleId of targetRoles) {
        const res = await fetch(`${API_BASE_URL}/users?role_id=${roleId}&is_active=true&limit=500`, { headers });
        if (!res.ok) continue;
        const data = await res.json();
        fetched.push(...(data.items || []));
      }

      setUsers(fetched);
    } catch (e) {
      console.error('loadUsers error:', e);
    } finally {
      setLoadingUsers(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ─── Deactivate user (set is_active=false via PUT) ───────────────────────────
  const handleDeactivateUser = async (user: VHVUser, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`ยกเลิกการใช้งานของ "${user.full_name}" ?
ผู้ใช้นี้จะไม่สามารถล็อกอินหรือรับแจ้งเตือนได้`)) return;
    try {
      const tokenRes = await fetch('/api/get-machine-token');
      const { access_token } = await tokenRes.json();
      const headers = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };

      // GET full user first (PUT requires full body)
      const userRes = await fetch(`${API_BASE_URL}/users/${user.user_id}`, { headers });
      const currentUser = await userRes.json();

      // PUT with is_active = false
      const putRes = await fetch(`${API_BASE_URL}/users/${user.user_id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...currentUser, is_active: false }),
      });

      if (putRes.ok) {
        setUsers(prev => prev.filter(u => u.user_id !== user.user_id));
      } else {
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } catch {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  // ─── 2. When user is selected → load their area's SMI-V patients ───────
  const loadPatientsForUser = useCallback(async (user: VHVUser) => {
    setSelectedUser(user);
    setPatients([]);
    setLoadingPatients(true);

    try {
      const tokenRes = await fetch('/api/get-machine-token');
      const { access_token } = await tokenRes.json();
      const headers = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };

      // 2a. Fetch all SMI-V records
      let allSmivItems: SmiV[] = [];
      let skip = 0;
      while (true) {
        const res = await fetch(`${API_BASE_URL}/smi-v?limit=500&skip=${skip}`, { headers });
        if (!res.ok) break;
        const data = await res.json();
        const items: SmiV[] = Array.isArray(data) ? data : (data.items || []);
        if (items.length === 0) break;
        allSmivItems = allSmivItems.concat(items);
        skip += 500;
      }

      // Sort newest first, take top 200
      allSmivItems.sort((a, b) => new Date(b.entry_date || 0).getTime() - new Date(a.entry_date || 0).getTime());
      const recentItems = allSmivItems.slice(0, 200);

      // 2b. Batch-fetch patient info for unique HNs
      const uniqueHns = Array.from(new Set(recentItems.map(i => i.hn).filter(Boolean))) as string[];
      const patientMap: Record<string, { pt_name: string; tmbpart: string; amppart: string; chwpart: string }> = {};

      const batchSize = 10;
      for (let i = 0; i < uniqueHns.length; i += batchSize) {
        const batch = uniqueHns.slice(i, i + batchSize);
        await Promise.all(batch.map(async (hn) => {
          try {
            const res = await fetch(`${API_BASE_URL}/patients/hn/${hn}`, { headers });
            if (res.ok) {
              const pt: Patient = await res.json();
              patientMap[hn] = {
                pt_name: pt.pt_name || '(ไม่มีชื่อ)',
                tmbpart: pt.tmbpart || '',
                amppart: pt.amppart || '',
                chwpart: pt.chwpart || '',
              };
            }
          } catch {}
        }));
      }

      // 2c. Filter to only patients in same tmbpart as selected user
      const mapped: MappedSmiV[] = recentItems
        .filter(item =>
          item.hn &&
          patientMap[item.hn] &&
          // If the user has a tmbpart, filter by it. Otherwise show all.
          (!user.tmbpart || patientMap[item.hn].tmbpart === user.tmbpart)
        )
        .map(item => ({
          ...item,
          pt_name: patientMap[item.hn!].pt_name,
          tmbpart: patientMap[item.hn!].tmbpart,
          amppart: patientMap[item.hn!].amppart,
          chwpart: patientMap[item.hn!].chwpart,
        }));

      setPatients(mapped);
    } catch (e) {
      console.error('loadPatientsForUser error:', e);
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  // ─── 3. Notify LINE (same as before, scoped to selected user's area) ──
  const handleNotifyVHVs = async () => {
    if (patients.length === 0 || !selectedUser) return;
    if (!window.confirm(`ส่งแจ้งเตือน ${patients.length} รายการไปยัง อสม. ในพื้นที่ของ "${selectedUser.full_name}"?`)) return;
    setNotifying(true);
    try {
      const res = await fetch('/api/notify-vhvs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients }),
      });
      const result = await res.json();
      alert(res.ok ? '✅ ส่งแจ้งเตือนสำเร็จ!' : `❌ ผิดพลาด: ${result.error || result.message}`);
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setNotifying(false);
    }
  };

  // ─── UI: User List Panel ─────────────────────────────────────────────
  if (!selectedUser) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-teal-50 p-2 rounded-lg border border-teal-100">
                <Users className="text-teal-600" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">เลือกผู้ใช้งาน</h2>
                <p className="text-sm text-slate-400 mt-0.5">เลือก อสม. หรือเจ้าหน้าที่เพื่อดูผู้ป่วยในความดูแล</p>
              </div>
            </div>
            <button
              onClick={loadUsers}
              disabled={loadingUsers}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm font-bold text-slate-600 text-sm"
            >
              <RefreshCw size={15} className={loadingUsers ? 'animate-spin text-teal-500' : ''} />
              รีเฟรช
            </button>
          </div>

        {loadingUsers ? (
          <div className="flex items-center gap-3 text-slate-500 py-10 justify-center">
            <Loader2 className="animate-spin" size={20} />
            <span>กำลังโหลดรายชื่อผู้ใช้งาน...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-400">ไม่พบผู้ใช้งานในระบบ</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((user) => (
              <div
                key={user.user_id}
                className="relative text-left p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all group cursor-pointer"
                onClick={() => loadPatientsForUser(user)}
              >
                {/* Deactivate button */}
                <button
                  onClick={(e) => handleDeactivateUser(user, e)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:border-red-300 hover:text-red-500 text-slate-400 transition-all z-10"
                  title="ยกเลิกการใช้งาน"
                >
                  <X size={12} />
                </button>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white transition-all border border-slate-200">
                      <UserCheck size={18} className="text-slate-500 group-hover:text-teal-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{user.full_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">ID: {user.user_id}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${ROLE_COLORS[user.role_id] || 'bg-slate-100 text-slate-600'}`}>
                    {user.role_name}
                  </span>
                </div>
                {user.address_full_name && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
                    <MapPin size={11} />
                    <span className="truncate">{user.address_full_name}</span>
                  </div>
                )}
                {!user.address_full_name && user.tmbpart && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
                    <MapPin size={11} />
                    <span>ตำบล {user.tmbpart} อำเภอ {user.amppart} จังหวัด {user.chwpart}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── UI: Patient Detail Panel ────────────────────────────────────────
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header with Back button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedUser(null)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
          >
            <ChevronLeft size={18} />
            <span>กลับ</span>
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <div className="bg-teal-50 p-2 rounded-lg border border-teal-100">
            <HeartPulse className="text-teal-600" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {selectedUser.full_name}
              <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[selectedUser.role_id] || 'bg-slate-100 text-slate-600'}`}>
                {selectedUser.role_name}
              </span>
            </h2>
            {selectedUser.address_full_name && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin size={11} /> {selectedUser.address_full_name}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleNotifyVHVs}
          disabled={notifying || patients.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50"
        >
          <BellRing size={16} className={notifying ? 'animate-bounce' : ''} />
          {notifying ? 'กำลังส่ง...' : `ส่งแจ้งเตือน LINE (${patients.length} ราย)`}
        </button>
      </div>

      {/* Patient Table */}
      {loadingPatients ? (
        <div className="flex items-center gap-3 text-slate-500 py-10 justify-center">
          <Loader2 className="animate-spin" size={20} />
          <span>กำลังโหลดข้อมูลผู้ป่วยในพื้นที่...</span>
        </div>
      ) : (
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 text-sm font-bold text-slate-500">HN</th>
              <th className="p-3 text-sm font-bold text-slate-500">ชื่อผู้ป่วย</th>
              <th className="p-3 text-sm font-bold text-slate-500">วันที่ประเมิน</th>
              <th className="p-3 text-sm font-bold text-slate-500">ผลการประเมิน</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((row) => (
              <tr key={row.smi_v_id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 text-sm font-mono text-slate-500">{row.hn}</td>
                <td className="p-3 text-sm font-medium text-slate-800">{row.pt_name}</td>
                <td className="p-3 text-sm text-slate-500">
                  {row.entry_date ? new Date(row.entry_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                </td>
                <td className="p-3">
                  <ResultBadge result={row.result} />
                </td>
              </tr>
            ))}
            {patients.length === 0 && !loadingPatients && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  ไม่พบผู้ป่วย SMI-V ในพื้นที่ของ {selectedUser.full_name}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SmiVTable;
