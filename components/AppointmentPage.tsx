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

  // ─── Fetch all oapp data ─────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenRes = await fetch('/api/get-machine-token');
      const { access_token } = await tokenRes.json();
      const headers = { Authorization: `Bearer ${access_token}` };

      // Paginate through all records
      let all: OappRaw[] = [];
      let skip = 0;
      const limit = 500;
      while (true) {
        const res = await fetch(`${API_BASE}/oapp?skip=${skip}&limit=${limit}`, { headers });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        const items: OappRaw[] = Array.isArray(data) ? data : (data.items || []);
        if (items.length === 0) break;
        all = all.concat(items);
        skip += limit;
        if (items.length < limit) break; // last page
      }

      setRawData(all);
      setTotalFetched(all.length);

      // ── Data Cleansing Logic ──────────────────────────────────────────────
      // เนื่องจาก oapp เป็น append-only, แต่ละ HN จะมีหลาย row
      // เราต้องการ "แถวที่ vstdate ล่าสุด" ของแต่ละ HN
      // เพราะ nextdate ในแถวนั้นคือวันนัดหมายจริงที่ valid ล่าสุด
      const byHn: Record<string, OappRaw[]> = {};
      for (const row of all) {
        if (!row.hn || !row.nextdate) continue;
        if (!byHn[row.hn]) byHn[row.hn] = [];
        byHn[row.hn].push(row);
      }

      const result: CleanAppointment[] = [];
      for (const [hn, rows] of Object.entries(byHn)) {
        // Sort rows by vstdate desc → แถวล่าสุดอยู่บนสุด
        rows.sort((a, b) => b.vstdate.localeCompare(a.vstdate));
        const latest = rows[0];

        // ถ้า visit_vn ของแถวล่าสุดมีค่า = มาตามนัดแล้ว และไม่มีนัดถัดไปอีก
        const attended = !!latest.visit_vn;
        const status = getStatus(latest.nextdate, attended);

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
          status,
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
