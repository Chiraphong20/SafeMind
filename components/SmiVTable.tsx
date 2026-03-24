import React, { useState, useEffect } from 'react';

// ============================================================
// Interface ตรงตาม API Schema จริง
// ============================================================

interface Patient {
  hn: string;
  cid?: string | null;
  pt_name: string;
  sex: string;
  occupation?: string | null;
  citizenship?: string | null;
  nationality?: string | null;
  birthday?: string | null;
  birthtime?: string | null;
  addrpart?: string | null;
  moopart?: string | null;
  road?: string | null;
  tmbpart?: string | null;
  amppart?: string | null;
  chwpart?: string | null;
  religion?: string | null;
  marrystatus?: string | null;
  hometel?: string | null;
  image?: string | null;
  capture_date?: string | null;
  last_update?: string | null;
}

interface SmiV {
  smi_v_id: number;
  vn?: string | null;
  hn?: string | null;
  an?: string | null;
  entry_date?: string | null;
  staff?: string | null;
  dch_hos?: string | null;
  dch_prison?: string | null;
  medicine?: string | null;
  carer?: string | null;
  drug_abuse?: string | null;
  insomnia?: string | null;
  pacing?: string | null;
  talking_oneself?: string | null;
  agitation?: string | null;
  paranoid?: string | null;
  vb0?: string | null;
  vb1?: string | null;
  vb2?: string | null;
  vb3?: string | null;
  vb4?: string | null;
  others?: string | null;
  result?: string | null;
  vbh?: string | null;
  dep?: string | null;
}

// ข้อมูลหลังจาก Map ชื่อผู้ป่วยเข้ากับ SMI-V แล้ว
interface MappedSmiV extends SmiV {
  pt_name: string;
}

const SmiVTable: React.FC = () => {
  const [data, setData] = useState<MappedSmiV[]>([]);
  const [loading, setLoading] = useState(true);

  // ใช้ Proxy Route ที่เราเซ็ตไว้ใน vercel.json และ vite.config.ts เพื่อแก้ปัญหา Mixed Content (HTTP -> HTTPS)
  const API_BASE_URL = "/api/fastapi";
  // ข้อควรระวัง: นำ Token ที่ผู้ใช้รับมาใส่ไว้ เป็นแบบชั่วคราว (ถ้า Token หมดอายุต้องมาเปลี่ยนอีก)
  const token = process.env.NEXT_PUBLIC_API_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbjk5IiwiaWF0IjoxNzc0MzIzMTI5LCJleHAiOjE3NzQzMjQ5Mjl9.qQG2z_EwuZ8d4C_slqCirbsz3Iq-DWoWiv-LIzZ_r74";

  useEffect(() => {
    const fetchAndMapData = async () => {
      setLoading(true);
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // 1. ดึงข้อมูลรายการจากตาราง SMI-V
        // (สามารถเพิ่ม limit หรือ filter ตาม hn ได้)
        const smivRes = await fetch(`${API_BASE_URL}/smi-v?limit=100`, { headers });
        const smivData = await smivRes.json();
        const smivItems: SmiV[] = smivData.items || [];

        // 2. หาระยะ HN ที่อยู่ในรายการ SMI-V เพื่อที่จะไปดึงชื่อ
        const uniqueHns = Array.from(new Set(smivItems.map(item => item.hn).filter(Boolean)));

        // 3. เตรียมตัวแปร (Dictionary) สำหรับเก็บ HN -> ชื่อผู้ป่วย
        const patientMap: Record<string, string> = {};

        // 4. ดึงข้อมูลผู้ป่วยทีละ HN เพื่อเอาชื่อมา Map (ถ้า API ปลายทางรองรับค้นหาทีละหลายคน สามารถปรับแต่งได้)
        // หรือใช้วิธีดึง Patient มาทั้งหมดแล้ว Map หากข้อมูลไม่เยอะเกินไป
        await Promise.all(
          uniqueHns.map(async (hn) => {
            try {
              const res = await fetch(`${API_BASE_URL}/patients/hn/${hn}`, { headers });
              if (res.ok) {
                const patient: Patient = await res.json();
                patientMap[hn] = patient.pt_name;
              }
            } catch (e) {
              console.error(`Failed to fetch patient ${hn}`, e);
            }
          })
        );

        // 5. นำข้อมูล SMI-V มาประกอบร่าง (Map) กับชื่อผู้ป่วย
        const mappedData: MappedSmiV[] = smivItems.map(item => ({
          ...item,
          // หากหาชื่อไม่เจอ ให้แสดง fallback text
          pt_name: patientMap[item.hn] || "(ไม่พบรายชื่อผู้ป่วย)"
        }));

        setData(mappedData);

      } catch (error) {
        console.error("Error fetching or mapping data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndMapData();
  }, [token]);

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold mb-4 text-slate-800">ข้อมูลประเมิน SMI-V พร้อมรายชื่อ</h2>

      {loading ? (
        <div className="text-slate-500">กำลังโหลดและจับคู่ข้อมูล...</div>
      ) : (
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 text-sm font-bold text-slate-500">HN</th>
              <th className="p-3 text-sm font-bold text-slate-500">ชื่อผู้ป่วย (Map แล้ว)</th>
              <th className="p-3 text-sm font-bold text-slate-500">สถานะกลุ่มสี</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.smi_v_id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 text-sm">{row.hn}</td>
                <td className="p-3 text-sm font-medium text-slate-800">{row.pt_name}</td>
                <td className="p-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.result === 'สีแดง' ? 'bg-red-100 text-red-700' :
                      row.result === 'สีเหลือง' ? 'bg-yellow-100 text-yellow-700' :
                        row.result === 'สีเขียว' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                    }`}>
                    {row.result || '-'}
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-slate-400">ไม่พบข้อมูล</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SmiVTable;
