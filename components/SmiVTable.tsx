import React, { useState, useEffect } from 'react';
import { BellRing, HeartPulse } from 'lucide-react';

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
  // เพิ่ม tmbpart เพื่อเอาไว้ส่งไลน์แยกตามพื้นที่ อสม.
  tmbpart?: string;
}

const SmiVTable: React.FC = () => {
  const [data, setData] = useState<MappedSmiV[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);

  // ใช้ Proxy Route ที่เราเซ็ตไว้ใน vercel.json และ vite.config.ts เพื่อแก้ปัญหา Mixed Content (HTTP -> HTTPS)
  const API_BASE_URL = "/api/fastapi";

  useEffect(() => {
    const fetchAndMapData = async () => {
      setLoading(true);
      try {
        // 0. ดึง Token แบบอัตโนมัติจาก Vercel Serverless Function ที่ล็อกอินด้วยรหัส admin99/admin99 ให้เรียบร้อย
        const tokenRes = await fetch('/api/get-machine-token');
        if (!tokenRes.ok) throw new Error("ดึง Token ฝั่ง API พัง");
        const tokenData = await tokenRes.json();
        const freshToken = tokenData.access_token;

        const headers = {
          'Authorization': `Bearer ${freshToken}`,
          'Content-Type': 'application/json'
        };

        // 1. ดึงข้อมูลรายการจากตาราง SMI-V ทั้งหมด (เนื่องจาก API ไม่รองรับ sort=desc และ limit ได้แค่ 500)
        let allSmivItems: SmiV[] = [];
        let skip = 0;
        
        while (true) {
          const smivRes = await fetch(`${API_BASE_URL}/smi-v?limit=500&skip=${skip}`, { headers });
          if (!smivRes.ok) break;
          const smivData = await smivRes.json();
          const items: SmiV[] = Array.isArray(smivData) ? smivData : (smivData.items || []);
          
          if (items.length === 0) break;
          allSmivItems = allSmivItems.concat(items);
          skip += 500;
        }

        // 2. เรียงลำดับจากวันที่ประเมินล่าสุด (entry_date) ให้อยู่บนสุดก่อน
        allSmivItems.sort((a, b) => {
          const dateA = new Date(a.entry_date || 0).getTime();
          const dateB = new Date(b.entry_date || 0).getTime();
          return dateB - dateA;
        });

        // 3. ตัดเอาเฉพาะ 100 รายการล่าสุดมาแสดงผล เพื่อไม่ให้หน้าเว็บค้างและลดภาระเซิร์ฟเวอร์
        const recentSmivItems = allSmivItems.slice(0, 100);

        // 4. หาระยะ HN ที่อยู่ใน 100 รายการล่าสุดเท่านั้น เพื่อที่จะไปดึงชื่อ
        const uniqueHns = Array.from(new Set(recentSmivItems.map(item => item.hn).filter(Boolean)));

        // 3. เตรียมตัวแปร (Dictionary) สำหรับเก็บ HN -> ชื่อผู้ป่วยและพื้นที่
        const patientMap: Record<string, { pt_name: string; tmbpart: string }> = {};

        // 4. ทยอยดึงทีละ 10 Request พร้อมๆ กัน (Batch Processing) 
        // ป้องกัน Error 500 จากการที่ Vercel หรือ FastAPI รัน 100+ requests พร้อมกัน (DDOS ตัวเอง)
        const batchSize = 10;
        for (let i = 0; i < uniqueHns.length; i += batchSize) {
          const batch = uniqueHns.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (hn) => {
              try {
                const res = await fetch(`${API_BASE_URL}/patients/hn/${hn}`, { headers });
                if (res.ok) {
                  const patient: Patient = await res.json();
                  patientMap[hn] = {
                      pt_name: patient.pt_name || "(ไม่มีชื่อ)",
                      tmbpart: patient.tmbpart || ""
                  };
                }
              } catch (e) {
                // Ignore silent errors for individual missing patients
              }
            })
          );
        }

        // 6. นำข้อมูล SMI-V 100 รายการล่าสุด มาประกอบร่าง (Map) กับชื่อผู้ป่วยและตำบล
        // และคัดเฉพาะคนที่มี "ชื่อ" และ "HN" อยู่ในฐานข้อมูล Patients แล้วจริงๆ เท่านั้น
        const mappedData: MappedSmiV[] = recentSmivItems
          .filter(item => Boolean(item.hn) && Boolean(patientMap[item.hn]))
          .map(item => ({
            ...item,
            pt_name: patientMap[item.hn].pt_name,
            tmbpart: patientMap[item.hn].tmbpart
          }));

        setData(mappedData);

      } catch (error) {
        console.error("Error fetching or mapping data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndMapData();
  }, []);

  // ฟังก์ชันยิงหน้าต่าง Notification ผ่าน Vercel Serverless
  const handleNotifyVHVs = async () => {
      if (data.length === 0) return;
      if (!window.confirm(`ระบบจะส่งแจ้งเตือนข้อมูลผู้ป่วย ${data.length} รายการนี้\nไปยังไลน์ของ อสม. ที่รับผิดชอบตามเขตตำบลอัตโนมัติ คุณแน่ใจหรือไม่?`)) return;

      setNotifying(true);
      try {
          const res = await fetch('/api/notify-vhvs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ patients: data })
          });

          const result = await res.json();
          if (res.ok) {
              alert(`✅ ส่งแจ้งเตือนสำเร็จครับ! (กระจายไปยัง อสม. เรียบร้อย)`);
          } else {
              alert(`❌ เกิดข้อผิดพลาด: ${result.error || result.message}`);
          }
      } catch (err) {
          console.error("Notify VHVs Error:", err);
          alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ส่งไลน์");
      } finally {
          setNotifying(false);
      }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
            <div className="bg-teal-50 p-2 rounded-lg border border-teal-100"><HeartPulse className="text-teal-600" size={24} /></div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">ข้อมูลประเมิน SMI-V <span className="text-xl font-bold text-slate-400">พร้อมรายชื่อ</span></h2>
        </div>
        <button 
            onClick={handleNotifyVHVs}
            disabled={notifying || data.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all shadow-blue-600/20 disabled:opacity-50"
        >
            <BellRing size={18} className={notifying ? "animate-bounce" : ""} />
            {notifying ? "กำลังกระจายข้อมูล..." : "ส่งแจ้งเตือน อสม. ในพื้นที่"}
        </button>
      </div>

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
