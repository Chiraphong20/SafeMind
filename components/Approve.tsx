import React, { useState, useEffect } from 'react';
import { UserCheck, RefreshCw, ShieldCheck, Phone, Building2, Users, TableProperties, LogOut, Map } from 'lucide-react';
import SmiVTable from './SmiVTable';
import SpotMap from './SpotMap';

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface UserRegistration {
  id: string;
  fullName: string;
  phone: string;
  organization: string;
  status: UserStatus;
  timestamp: number;
}

const Approve: React.FC<{ onSignOut?: () => void }> = ({ onSignOut }) => {
  const adminName = sessionStorage.getItem('admin_user') || 'Admin';
  // Layout State
  const [activeTab, setActiveTab] = useState<'users' | 'smiv' | 'spotmap'>('users');

  // User List State
  const [users, setUsers] = useState<UserRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = "/api";

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/get-pending-users`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const rawData = await response.json();

      if (Array.isArray(rawData)) {
        const formattedData: UserRegistration[] = rawData.map((user: any) => ({
          id: user.line_user_id,
          fullName: user.name,
          phone: user.phone,
          organization: user.department,
          status: user.status === 'approved' ? UserStatus.APPROVED : UserStatus.PENDING,
          timestamp: Date.now()
        }));
        setUsers(formattedData);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    if (!window.confirm("ยืนยันการอนุมัติสมาชิก SafeMind ท่านนี้?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/approve-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ line_user_id: userId })
      });

      if (response.ok) {
        alert("✅ อนุมัติเรียบร้อย!");
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone.includes(searchTerm)
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* Sidebar (แถบเมนูด้านซ้าย) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col py-8 shadow-sm hidden md:flex shrink-0">
        
        {/* Logo / Header */}
        <div className="flex items-center gap-3 mb-10 w-full px-8">
            <div className="bg-teal-600 p-2 rounded-xl text-white shadow-md">
                <ShieldCheck size={28} />
            </div>
            <div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">SafeMind<span className="text-teal-600">.</span></h1>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Admin Panel</p>
            </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 w-full px-4 space-y-2">
            <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                    activeTab === 'users' 
                    ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
            >
                <Users size={20} className={activeTab === 'users' ? 'text-teal-600' : 'opacity-70'} />
                จัดการผู้ใช้งาน
            </button>

            <button 
                onClick={() => setActiveTab('smiv')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                    activeTab === 'smiv' 
                    ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
            >
                <TableProperties size={20} className={activeTab === 'smiv' ? 'text-teal-600' : 'opacity-70'} />
                ตารางประเมิน SMI-V
            </button>
            <button 
                onClick={() => setActiveTab('spotmap')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                    activeTab === 'spotmap' 
                    ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
            >
                <Map size={20} className={activeTab === 'spotmap' ? 'text-teal-600' : 'opacity-70'} />
                Spot Map
            </button>
        </nav>

        {/* Footer actions */}
        <div className="w-full px-4 mt-auto">
            <div className="w-full border-t border-slate-100 mb-3"></div>
            <div className="px-4 py-2 mb-2">
              <p className="text-xs font-bold text-slate-700 truncate">{adminName}</p>
              <p className="text-xs text-slate-400">ผู้ดูแลระบบ</p>
            </div>
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all duration-200">
                <LogOut size={20} />
                ออกจากระบบ
            </button>
        </div>
      </aside>

      {/* Mobile Header (แสดงเฉพาะตอนจอเล็ก) */}
      <div className="md:hidden w-full bg-white border-b border-slate-200 p-4 fixed top-0 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={24} className="text-teal-600" />
            <h1 className="text-lg font-black text-slate-800">SafeMind<span className="text-teal-600">.</span></h1>
          </div>
          <div className="flex gap-2">
               <button onClick={() => setActiveTab('users')} className={`p-2 rounded-lg ${activeTab === 'users' ? 'bg-teal-50 text-teal-600' : 'text-slate-400'}`}><Users size={20}/></button>
               <button onClick={() => setActiveTab('smiv')} className={`p-2 rounded-lg ${activeTab === 'smiv' ? 'bg-teal-50 text-teal-600' : 'text-slate-400'}`}><TableProperties size={20}/></button>
          </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full bg-slate-50 p-4 pt-24 md:p-10 overflow-y-auto">
         <div className="w-full h-full">
            {activeTab === 'users' ? (
              <div className="animate-in fade-in duration-500 pb-24 h-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                  <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                      จัดการผู้ใช้งาน
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">ตรวจสอบและอนุมัติผู้ใช้งานสิทธิหมอ/อสม. ในระบบ</p>
                  </div>
                  <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm font-bold text-slate-600">
                    <RefreshCw size={18} className={`${loading ? 'animate-spin text-teal-600' : ''}`} />
                    รีเฟรชข้อมูล
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">ชื่อ / เบอร์โทร</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">หน่วยงาน</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">สถานะ</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                                <ShieldCheck size={48} className="text-slate-200 mb-4" />
                                <p className="font-semibold text-lg text-slate-500">ไม่พบสมาชิกที่รออนุมัติ</p>
                                <p className="text-sm">ผู้ใช้งานทั้งหมดได้รับการยืนยันเรียบร้อยแล้ว</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-slate-800 text-base">{user.fullName}</div>
                              <div className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
                                <Phone size={12} className="text-slate-400" /> {user.phone}
                              </div>
                            </td>
                            <td className="p-4 text-slate-600 hidden sm:table-cell">
                              <div className="flex items-center gap-2 font-medium">
                                <Building2 size={14} className="text-slate-400" />
                                {user.organization}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${user.status === UserStatus.APPROVED
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm'
                                }`}>
                                {user.status === UserStatus.APPROVED ? 'อนุมัติแล้ว' : 'รอตรวจสอบ'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {user.status === UserStatus.PENDING && (
                                <button
                                  onClick={() => handleApprove(user.id)}
                                  className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-teal-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 ml-auto"
                                >
                                  <UserCheck size={16} /> ยืนยัน
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'spotmap' ? (
              <div className="animate-in fade-in duration-500 h-full" style={{ height: 'calc(100vh - 5rem)' }}>
                <SpotMap />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 h-full">
                <SmiVTable />
              </div>
            )}
         </div>
      </main>

    </div>
  );
};

export default Approve;