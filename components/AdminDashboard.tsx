import React, { useState, useEffect } from 'react';
import { UserCheck, Search, RefreshCw, ShieldCheck, Phone, Building2, Calendar } from 'lucide-react';

// 1. ประกาศ Interface และ Enum ไว้ด้านบนสุด (นอก Component)
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

const AdminDashboard: React.FC = () => {
  // 2. ใช้ Interface ใหม่ใน State
  const [users, setUsers] = useState<UserRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ⚠️ ตรวจสอบ URL ให้ตรงกับของคุณ (ไม่มี /get-pending-users ต่อท้าย)
  const N8N_BASE_URL = "https://safemind.app.n8n.cloud/webhook";

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1. เรียกข้อมูลจาก n8n
      const response = await fetch(`${N8N_BASE_URL}/get-pending-users`, {
        headers: { 
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const rawData = await response.json();
      console.log("Raw Data from n8n:", rawData); // เช็คดูใน Console ว่าข้อมูลมาไหม

      // 2. ถ้ามีข้อมูล ให้ทำการจับคู่ตัวแปร (Mapping)
      if (Array.isArray(rawData)) {
        const formattedData: UserRegistration[] = rawData.map((user: any) => ({
          // ฝั่งซ้ายคือชื่อใน React : ฝั่งขวาคือชื่อจาก n8n (Database)
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
      const response = await fetch(`${N8N_BASE_URL}/approve-user`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true' 
        },
        body: JSON.stringify({ line_user_id: userId })
      });

      if (response.ok) {
  alert("✅ อนุมัติเรียบร้อย!");
  // 🔥 อัปเดต State ในเครื่องทันที ไม่ต้องรอดึงข้อมูลใหม่
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
    <div className="max-w-5xl mx-auto p-4 pb-24">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            SafeMind Admin <ShieldCheck className="text-teal-600" />
          </h1>
          <p className="text-slate-500 text-sm">จัดการผู้ใช้งาน (Table: users)</p>
        </div>
        <button onClick={fetchUsers} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <RefreshCw className={`${loading ? 'animate-spin' : ''} text-slate-600`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase">ชื่อ / เบอร์โทร</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase">หน่วยงาน</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase">สถานะ</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
                <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                        ไม่พบข้อมูลสมาชิก
                    </td>
                </tr>
            ) : (
                filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                    <div className="font-bold text-slate-800">{user.fullName}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Phone size={12}/> {user.phone}
                    </div>
                    </td>
                    <td className="p-4 text-slate-600">
                        <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-slate-400"/> 
                            {user.organization}
                        </div>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            user.status === UserStatus.APPROVED 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {user.status === UserStatus.APPROVED ? 'อนุมัติแล้ว' : 'รอตรวจสอบ'}
                        </span>
                    </td>
                    <td className="p-4 text-right">
                    {user.status === UserStatus.PENDING && (
                        <button 
                            onClick={() => handleApprove(user.id)}
                            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700 transition shadow-sm flex items-center gap-2 ml-auto"
                        >
                            <UserCheck size={16} /> อนุมัติ
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
  );
};

export default AdminDashboard;