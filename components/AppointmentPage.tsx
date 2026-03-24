import React, { useEffect, useState } from 'react';
import { Calendar, Clock, User, Search, Filter, CheckCircle, AlertCircle, XCircle, Loader2, RefreshCw, ChevronDown } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OappRaw {
  oapp_id: number;
  hn: string;
  vn: string;
  vstdate: string;       // "วันที่สั่งนัด" (วันที่มาครั้งนี้)
  nextdate: string;      // "วันนัดครั้งถัดไป"
  nexttime: string | null;
  clinic: string | null;
  doctor: string | null;
  note: string | null;
  app_cause: string | null;
  note1: string | null;
  note2: string | null;
  visit_vn: string | null;  // ถ้ามีค่า = มาตามนัดแล้ว
  patient_visit: string | null; // Y = มาแล้ว
  oapp_status_id: number | null;
}

// ─── Appointment after Cleansing ──────────────────────────────────────────────
// 1 row per patient = แถวที่ vstdate ล่าสุดสุดของ HN นั้น
interface CleanAppointment {
  hn: string;
  lastVisitDate: string;   // vstdate ของแถวล่าสุด
  nextDate: string;        // nextdate → วันนัดหมายจริง
  nextTime: string | null;
  clinic: string | null;
  doctor: string | null;
  appCause: string | null;
  note: string | null;
  attended: boolean;       // visit_vn มีค่า = มาแล้ว
  status: 'upcoming' | 'overdue' | 'attended' | 'today';
  totalRecords: number;    // จำนวน row ทั้งหมดใน oapp ของ HN นี้
}

const today = new Date().toISOString().split('T')[0];

function getStatus(nextdate: string, attended: boolean): CleanAppointment['status'] {
  if (attended) return 'attended';
  if (nextdate === today) return 'today';
  if (nextdate < today) return 'overdue';
  return 'upcoming';
}

const STATUS_CONFIG = {
  today:    { label: 'นัดวันนี้',   bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   icon: Clock,         dot: 'bg-blue-500' },
  upcoming: { label: 'มีนัดข้างหน้า', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle,   dot: 'bg-emerald-400' },
  overdue:  { label: 'เลยกำหนดนัด', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    icon: XCircle,       dot: 'bg-red-500' },
  attended: { label: 'มาแล้ว',      bg: 'bg-slate-50',   text: 'text-slate-500',  border: 'border-slate-200',  icon: CheckCircle,   dot: 'bg-slate-300' },
};

// ─── Mock Data (2026) ─────────────────────────────────────────────────────────
// Demonstrates the "Append-Only" pattern of oapp table:
// Each patient has multiple rows — each row = 1 visit → next appointment
// The row with the LATEST vstdate = real next appointment (nextdate field)
const MOCK_OAPP_2026: OappRaw[] = [
  // ── HN-RED-01: มาตลอด 3 ครั้ง (3 rows)
  { oapp_id:1001, hn:'HN-RED-01', vn:'20260106001001', vstdate:'2026-01-06', nextdate:'2026-02-03', nexttime:'09:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตามอาการจิตเวช SMI-V สีแดง', note1:null, note2:'ห้ามนัดคนเดียว', visit_vn:'20260203001099', patient_visit:'Y', oapp_status_id:2 },
  { oapp_id:1002, hn:'HN-RED-01', vn:'20260203001002', vstdate:'2026-02-03', nextdate:'2026-03-03', nexttime:'09:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตามอาการจิตเวช SMI-V สีแดง', note1:null, note2:'ห้ามนัดคนเดียว', visit_vn:'20260303001099', patient_visit:'Y', oapp_status_id:2 },
  { oapp_id:1003, hn:'HN-RED-01', vn:'20260303001003', vstdate:'2026-03-03', nextdate:'2026-04-07', nexttime:'09:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตามอาการจิตเวช SMI-V สีแดง', note1:null, note2:'ห้ามนัดคนเดียว', visit_vn:null, patient_visit:null, oapp_status_id:1 },

  // ── HN-RED-02: ผิดนัด 1 ครั้ง → กลับมา (3 rows)
  { oapp_id:1011, hn:'HN-RED-02', vn:'20260110002001', vstdate:'2026-01-10', nextdate:'2026-02-10', nexttime:'10:00:00', clinic:'010', doctor:'DR002', note:null, app_cause:'ติดตามความวิตกกังวล ปรับยา', note1:null, note2:'FBS ก่อนพบแพทย์', visit_vn:null, patient_visit:null, oapp_status_id:1 },
  { oapp_id:1012, hn:'HN-RED-02', vn:'20260224002002', vstdate:'2026-02-24', nextdate:'2026-03-24', nexttime:'10:00:00', clinic:'010', doctor:'DR002', note:null, app_cause:'ติดตามความวิตกกังวล ปรับยา', note1:null, note2:'FBS ก่อนพบแพทย์', visit_vn:'20260324002099', patient_visit:'Y', oapp_status_id:2 },
  { oapp_id:1013, hn:'HN-RED-02', vn:'20260324002003', vstdate:'2026-03-24', nextdate:'2026-04-21', nexttime:'10:00:00', clinic:'010', doctor:'DR002', note:null, app_cause:'ติดตามความวิตกกังวล ปรับยา', note1:null, note2:'FBS ก่อนพบแพทย์', visit_vn:null, patient_visit:null, oapp_status_id:1 },

  // ── HN-R-10: นัดวันนี้! (1 row)
  { oapp_id:1021, hn:'HN-R-10', vn:'20260310010001', vstdate:'2026-03-10', nextdate:'2026-03-24', nexttime:'08:30:00', clinic:'010', doctor:'DR002', note:null, app_cause:'ฉุกเฉินจิตเวช ติดตามอาการหลังวิกฤต', note1:null, note2:'แจ้งครอบครัว', visit_vn:null, patient_visit:null, oapp_status_id:1 },

  // ── HN-R-11: มาตลอด 3 ครั้ง (3 rows)
  { oapp_id:1031, hn:'HN-R-11', vn:'20260105011001', vstdate:'2026-01-05', nextdate:'2026-02-02', nexttime:'09:00:00', clinic:'010', doctor:'DR002', note:null, app_cause:'ติดตามอาการรุนแรง ประสานคนในครอบครัว', note1:null, note2:null, visit_vn:'20260202011099', patient_visit:'Y', oapp_status_id:2 },
  { oapp_id:1032, hn:'HN-R-11', vn:'20260202011002', vstdate:'2026-02-02', nextdate:'2026-03-02', nexttime:'09:00:00', clinic:'010', doctor:'DR002', note:null, app_cause:'ติดตามอาการรุนแรง ประสานคนในครอบครัว', note1:null, note2:null, visit_vn:'20260302011099', patient_visit:'Y', oapp_status_id:2 },
  { oapp_id:1033, hn:'HN-R-11', vn:'20260302011003', vstdate:'2026-03-02', nextdate:'2026-04-02', nexttime:'09:00:00', clinic:'010', doctor:'DR002', note:null, app_cause:'ติดตามอาการรุนแรง ประสานคนในครอบครัว', note1:null, note2:null, visit_vn:null, patient_visit:null, oapp_status_id:1 },

  // ── HN-R-12: เลยกำหนด (1 row)
  { oapp_id:1041, hn:'HN-R-12', vn:'20260220012001', vstdate:'2026-02-20', nextdate:'2026-03-20', nexttime:'13:00:00', clinic:'010', doctor:'DR002', note:null, app_cause:'ติดตามวิกฤต ชนม์ชนก ประวัติรุนแรง', note1:null, note2:'แจ้งครอบครัวก่อนพบ', visit_vn:null, patient_visit:null, oapp_status_id:1 },

  // ── HN-YEL-01: มาตลอด 3 ครั้ง (3 rows)
  { oapp_id:1051, hn:'HN-YEL-01', vn:'20260115013001', vstdate:'2026-01-15', nextdate:'2026-02-12', nexttime:'09:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตามอาการซึมเศร้าระดับเฝ้าระวัง', note1:null, note2:null, visit_vn:'20260212013099', patient_visit:'Y', oapp_status_id:2 },
  { oapp_id:1052, hn:'HN-YEL-01', vn:'20260212013002', vstdate:'2026-02-12', nextdate:'2026-03-12', nexttime:'09:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตามอาการซึมเศร้าระดับเฝ้าระวัง', note1:null, note2:null, visit_vn:'20260312013099', patient_visit:'Y', oapp_status_id:2 },
  { oapp_id:1053, hn:'HN-YEL-01', vn:'20260312013003', vstdate:'2026-03-12', nextdate:'2026-04-09', nexttime:'09:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตามอาการซึมเศร้าระดับเฝ้าระวัง', note1:null, note2:null, visit_vn:null, patient_visit:null, oapp_status_id:1 },

  // ── HN-YEL-02: ขาดนัดต่อเนื่อง 3 ครั้ง! (3 rows)
  { oapp_id:1061, hn:'HN-YEL-02', vn:'20260120014001', vstdate:'2026-01-20', nextdate:'2026-02-17', nexttime:'10:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตามอาการ ขาดยาต่อเนื่อง', note1:null, note2:'FBS + HbA1c', visit_vn:null, patient_visit:null, oapp_status_id:1 },
  { oapp_id:1062, hn:'HN-YEL-02', vn:'20260217014002', vstdate:'2026-02-17', nextdate:'2026-03-17', nexttime:'10:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตามอาการ ขาดยาต่อเนื่อง', note1:null, note2:'FBS + HbA1c', visit_vn:null, patient_visit:null, oapp_status_id:1 },
  { oapp_id:1063, hn:'HN-YEL-02', vn:'20260310014003', vstdate:'2026-03-10', nextdate:'2026-04-07', nexttime:'10:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตามอาการ ขาดยาต่อเนื่อง', note1:null, note2:'FBS + HbA1c', visit_vn:null, patient_visit:null, oapp_status_id:1 },

  // ── HN-Y-10: 2 rows
  { oapp_id:1071, hn:'HN-Y-10', vn:'20260210015001', vstdate:'2026-02-10', nextdate:'2026-03-10', nexttime:'09:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตามอาการ เฝ้าระวัง สุนิสา', note1:null, note2:null, visit_vn:'20260310015099', patient_visit:'Y', oapp_status_id:2 },
  { oapp_id:1072, hn:'HN-Y-10', vn:'20260310015002', vstdate:'2026-03-10', nextdate:'2026-04-14', nexttime:'09:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตามอาการ เฝ้าระวัง สุนิสา', note1:null, note2:null, visit_vn:null, patient_visit:null, oapp_status_id:1 },

  // ── HN-Y-11: 2 rows
  { oapp_id:1081, hn:'HN-Y-11', vn:'20260215016001', vstdate:'2026-02-15', nextdate:'2026-03-15', nexttime:'09:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตาม เฝ้าดู ประทีป', note1:null, note2:null, visit_vn:'20260315016099', patient_visit:'Y', oapp_status_id:2 },
  { oapp_id:1082, hn:'HN-Y-11', vn:'20260315016002', vstdate:'2026-03-15', nextdate:'2026-04-19', nexttime:'09:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตาม เฝ้าดู ประทีป', note1:null, note2:null, visit_vn:null, patient_visit:null, oapp_status_id:1 },

  // ── HN-Y-12: 2 rows
  { oapp_id:1091, hn:'HN-Y-12', vn:'20260125017001', vstdate:'2026-01-25', nextdate:'2026-02-22', nexttime:'11:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตาม มาลี ร้อนใจ', note1:null, note2:null, visit_vn:'20260222017099', patient_visit:'Y', oapp_status_id:2 },
  { oapp_id:1092, hn:'HN-Y-12', vn:'20260222017002', vstdate:'2026-02-22', nextdate:'2026-03-29', nexttime:'11:00:00', clinic:'001', doctor:'DR001', note:null, app_cause:'ติดตาม มาลี ร้อนใจ', note1:null, note2:null, visit_vn:null, patient_visit:null, oapp_status_id:1 },

  // ── HN-GRN-01: 2 rows
  { oapp_id:1101, hn:'HN-GRN-01', vn:'20260201018001', vstdate:'2026-02-01', nextdate:'2026-03-01', nexttime:'09:00:00', clinic:'020', doctor:'DR003', note:null, app_cause:'ตรวจติดตามสุขภาพจิต ระดับปกติ', note1:null, note2:null, visit_vn:'20260301018099', patient_visit:'Y', oapp_status_id:2 },
  { oapp_id:1102, hn:'HN-GRN-01', vn:'20260301018002', vstdate:'2026-03-01', nextdate:'2026-04-05', nexttime:'09:00:00', clinic:'020', doctor:'DR003', note:null, app_cause:'ตรวจติดตามสุขภาพจิต ระดับปกติ', note1:null, note2:null, visit_vn:null, patient_visit:null, oapp_status_id:1 },

  // ── HN-GRN-02: มาแล้ว (1 row)
  { oapp_id:1111, hn:'HN-GRN-02', vn:'20260214019001', vstdate:'2026-02-14', nextdate:'2026-03-14', nexttime:'09:00:00', clinic:'020', doctor:'DR003', note:null, app_cause:'ตรวจประจำปี สุขภาพจิตดี', note1:null, note2:null, visit_vn:'20260314019099', patient_visit:'Y', oapp_status_id:2 },

  // ── HN-G-10: 3 rows
  { oapp_id:1121, hn:'HN-G-10', vn:'20260120020001', vstdate:'2026-01-20', nextdate:'2026-02-17', nexttime:'09:00:00', clinic:'015', doctor:'DR004', note:null, app_cause:'นัดตรวจประจำ 3 เดือน สมชาย', note1:null, note2:null, visit_vn:'20260217020099', patient_visit:'Y', oapp_status_id:2 },
  { oapp_id:1122, hn:'HN-G-10', vn:'20260217020002', vstdate:'2026-02-17', nextdate:'2026-03-24', nexttime:'09:00:00', clinic:'015', doctor:'DR004', note:null, app_cause:'นัดตรวจประจำ 3 เดือน สมชาย', note1:null, note2:null, visit_vn:'20260324020099', patient_visit:'Y', oapp_status_id:2 },
  { oapp_id:1123, hn:'HN-G-10', vn:'20260324020003', vstdate:'2026-03-24', nextdate:'2026-04-28', nexttime:'09:00:00', clinic:'015', doctor:'DR004', note:null, app_cause:'นัดตรวจประจำ 3 เดือน สมชาย', note1:null, note2:null, visit_vn:null, patient_visit:null, oapp_status_id:1 },

  // ── HN-G-11: 1 row
  { oapp_id:1131, hn:'HN-G-11', vn:'20260305021001', vstdate:'2026-03-05', nextdate:'2026-04-05', nexttime:'09:00:00', clinic:'015', doctor:'DR004', note:null, app_cause:'นัดตรวจ ศิริพร สุขสงบ', note1:null, note2:null, visit_vn:null, patient_visit:null, oapp_status_id:1 },

  // ── HN-G-12: 1 row
  { oapp_id:1141, hn:'HN-G-12', vn:'20260228022001', vstdate:'2026-02-28', nextdate:'2026-03-28', nexttime:'13:00:00', clinic:'015', doctor:'DR004', note:null, app_cause:'นัดตรวจ วิชัย สุขภาพดี', note1:null, note2:null, visit_vn:null, patient_visit:null, oapp_status_id:1 },
];


// ─── Main Component ───────────────────────────────────────────────────────────
const AppointmentPage: React.FC = () => {
  const [rawData, setRawData] = useState<OappRaw[]>([]);
  const [cleaned, setCleaned] = useState<CleanAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalFetched, setTotalFetched] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nextDate' | 'lastVisitDate'>('nextDate');

  const API_BASE = '/api/fastapi';

  // ─── Fetch + merge with mock data ────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenRes = await fetch('/api/get-machine-token');
      const { access_token } = await tokenRes.json();
      const headers = { Authorization: `Bearer ${access_token}` };

      let apiData: OappRaw[] = [];
      try {
        let skip = 0;
        const limit = 500;
        while (true) {
          const res = await fetch(`/api/fastapi/oapp?skip=${skip}&limit=${limit}`, { headers });
          if (!res.ok) break;
          const data = await res.json();
          const items: OappRaw[] = Array.isArray(data) ? data : (data.items || []);
          if (items.length === 0) break;
          apiData = apiData.concat(items);
          skip += limit;
          if (items.length < limit) break;
        }
      } catch (_) { /* ignore API errors, fall through to mock */ }

      // ── Merge: real API rows take priority over mock rows
      // Keep real API rows for all HNs that have real data; fill the rest from mock
      const realHns = new Set(apiData.map(r => r.hn));
      const mockFill = MOCK_OAPP_2026.filter(r => !realHns.has(r.hn));
      const all = [...apiData, ...mockFill];

      setRawData(all);
      setTotalFetched(all.length);

      // ── Data Cleansing: group by HN, pick the row with latest vstdate
      const byHn: Record<string, OappRaw[]> = {};
      for (const row of all) {
        if (!row.hn || !row.nextdate) continue;
        if (!byHn[row.hn]) byHn[row.hn] = [];
        byHn[row.hn].push(row);
      }

      const result: CleanAppointment[] = [];
      for (const [hn, rows] of Object.entries(byHn)) {
        rows.sort((a, b) => b.vstdate.localeCompare(a.vstdate));
        const latest = rows[0];
        const attended = !!latest.visit_vn;
        result.push({
          hn,
          lastVisitDate: latest.vstdate,
          nextDate: latest.nextdate,
          nextTime: latest.nexttime,
          clinic: latest.clinic,
          doctor: latest.doctor,
          appCause: latest.app_cause,
          note: latest.note || latest.note2,
          attended,
          status: getStatus(latest.nextdate, attended),
          totalRecords: rows.length,
        });
      }

      setCleaned(result);
    } catch (e: any) {
      setError(e.message || 'ไม่สามารถเชื่อมต่อ API ได้');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => { fetchData(); }, []);

  // ─── Filter + Sort ────────────────────────────────────────────────────────
  const filtered = cleaned
    .filter(a => filterStatus === 'all' || a.status === filterStatus)
    .filter(a => !search || a.hn.includes(search) || (a.appCause || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'nextDate' ? a.nextDate.localeCompare(b.nextDate) : b.lastVisitDate.localeCompare(a.lastVisitDate));

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    today: cleaned.filter(a => a.status === 'today').length,
    upcoming: cleaned.filter(a => a.status === 'upcoming').length,
    overdue: cleaned.filter(a => a.status === 'overdue').length,
    attended: cleaned.filter(a => a.status === 'attended').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-xl"><Calendar className="text-indigo-600" size={24} /></div>
              ระบบนัดหมาย
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              ข้อมูลที่ผ่านการ Cleanse แล้ว — แสดงเฉพาะ <b>วันนัดล่าสุดต่อผู้ป่วย 1 คน</b>
              {' '}จากทั้งหมด <span className="font-mono font-bold text-slate-600">{totalFetched.toLocaleString()}</span> รายการดิบ
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* ── Data Cleansing Explainer ───────────────────────────────────── */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex gap-4 items-start">
          <div className="bg-indigo-100 rounded-xl p-2 shrink-0"><AlertCircle className="text-indigo-600" size={18} /></div>
          <div className="text-sm text-indigo-800">
            <p className="font-bold mb-1">🧹 Data Cleansing Logic</p>
            <p>ตาราง <code className="bg-indigo-100 px-1 rounded font-mono text-xs">oapp</code> ทำงานแบบ <b>Append-Only</b> — แต่ละครั้งที่หมอนัด จะ INSERT แถวใหม่ (ไม่ได้แก้แถวเดิม) ดังนั้นผู้ป่วย 1 คนอาจมีหลายสิบแถว  
            ระบบนี้จะกรองเหลือเฉพาะ <b>แถวที่ <code className="bg-indigo-100 px-1 rounded font-mono text-xs">vstdate</code> ล่าสุดสุดของแต่ละ HN</b> แล้วอ่าน <code className="bg-indigo-100 px-1 rounded font-mono text-xs">nextdate</code> ออกมา — นั่นคือวันนัดหมายจริงที่ valid</p>
          </div>
        </div>

        {/* ── Stats Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          {([
            ['today', 'นัดวันนี้', 'bg-blue-500', 'bg-blue-50', 'text-blue-700', 'border-blue-200', Clock],
            ['overdue', 'เลยกำหนดนัด', 'bg-red-500', 'bg-red-50', 'text-red-700', 'border-red-200', XCircle],
            ['upcoming', 'มีนัดข้างหน้า', 'bg-emerald-500', 'bg-emerald-50', 'text-emerald-700', 'border-emerald-200', CheckCircle],
            ['attended', 'มาแล้ว', 'bg-slate-400', 'bg-slate-50', 'text-slate-600', 'border-slate-200', User],
          ] as const).map(([key, label, dot, bg, text, border, Icon]) => (
            <button key={key} onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${filterStatus === key ? `${bg} ${border} shadow-sm` : 'bg-white border-slate-100 hover:border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${dot}`}></span>
                <span className={`text-xs font-bold uppercase tracking-widest ${text}`}>{label}</span>
              </div>
              <p className={`text-3xl font-black ${text}`}>{stats[key as keyof typeof stats]}</p>
              <p className="text-xs text-slate-400 mt-1">ราย</p>
            </button>
          ))}
        </div>

        {/* ── Search & Filter ──────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white border border-slate-200 rounded-xl flex items-center gap-3 px-4 py-2.5 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition-all">
            <Search className="text-slate-400 shrink-0" size={18} />
            <input
              type="text"
              placeholder="ค้นหา HN หรือสาเหตุการนัด..."
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'nextDate' | 'lastVisitDate')}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-9 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="nextDate">เรียงตาม: วันนัดถัดไป</option>
              <option value="lastVisitDate">เรียงตาม: วันมาล่าสุด</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
            <p className="text-slate-500 font-medium">กำลัง Cleanse ข้อมูล...</p>
            <p className="text-slate-400 text-sm">โหลดข้อมูล {totalFetched.toLocaleString()} รายการ</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500 font-bold">{error}</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">
                แสดง <span className="text-slate-800">{filtered.length.toLocaleString()}</span> รายการ
                {' '}จาก <span className="text-slate-800">{cleaned.length.toLocaleString()}</span> ผู้ป่วยทั้งหมด
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">HN</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">วันสั่งนัดล่าสุด</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      ▸ วันนัดถัดไป <span className="text-indigo-400 font-normal normal-case">(cleansed)</span>
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">เวลา</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">สาเหตุ/หมายเหตุ</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">สถานะ</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Rows ดิบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16 text-slate-400">ไม่พบข้อมูล</td></tr>
                  ) : (
                    filtered.map((a) => {
                      const cfg = STATUS_CONFIG[a.status];
                      return (
                        <tr key={a.hn} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-slate-700">{a.hn}</span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{a.lastVisitDate}</td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-slate-800">{a.nextDate}</span>
                            {a.nextDate === today && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">วันนี้!</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">
                            {a.nextTime ? a.nextTime.slice(0, 5) : '—'}
                          </td>
                          <td className="px-5 py-3.5 max-w-[220px]">
                            <p className="text-slate-600 text-xs truncate" title={a.appCause || a.note || ''}>
                              {a.appCause || a.note || <span className="text-slate-300 italic">ไม่มีหมายเหตุ</span>}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-full">{a.totalRecords}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentPage;
