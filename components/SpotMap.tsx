import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Layers, AlertTriangle, BarChart3, Navigation, X, Filter, Activity, Loader2 } from 'lucide-react';

// ─── Important Places (Embedded from SQL data) ────────────────────────────────
const IMPORTANT_PLACES = [
  // Hospitals
  { name: 'โรงพยาบาลปากช่องนานา', type: 'hospital', lat: 14.680674, lng: 101.400078, details: 'โรงพยาบาลรัฐ' },
  { name: 'โรงพยาบาลกรุงเทพปากช่อง', type: 'hospital', lat: 14.718258, lng: 101.431655, details: 'โรงพยาบาลเอกชน' },
  { name: 'โรงพยาบาลกรุงเทพเขาใหญ่', type: 'hospital', lat: 14.659157, lng: 101.389189, details: 'โรงพยาบาลเอกชน เขาใหญ่' },
  { name: 'รพ.สต. บ่อทอง', type: 'hospital', lat: 14.725612, lng: 101.509489, details: 'โรงพยาบาลส่งเสริมสุขภาพตำบล' },
  { name: 'รพ.สต. หนองมะค่า', type: 'hospital', lat: 14.701417, lng: 101.364242, details: 'โรงพยาบาลส่งเสริมสุขภาพตำบล' },
  { name: 'รพ.สต. ขนงพระใต้', type: 'hospital', lat: 14.632299, lng: 101.433272, details: 'โรงพยาบาลส่งเสริมสุขภาพตำบล' },
  { name: 'สถานีอนามัยนิคมลำตะคอง', type: 'hospital', lat: 14.643619, lng: 101.494583, details: 'สถานีอนามัย นิคมอุตสาหกรรม' },
  // Government
  { name: 'ที่ว่าการอำเภอปากช่อง', type: 'government', lat: 14.712420, lng: 101.421854, details: 'หน่วยงานราชการ' },
  { name: 'ด่านอุทยานเขาใหญ่', type: 'government', lat: 14.536102, lng: 101.408712, details: 'ทางเข้าอุทยานแห่งชาติเขาใหญ่' },
  // Police
  { name: 'สถานีตำรวจภูธรปากช่อง', type: 'police', lat: 14.711512, lng: 101.421794, details: 'แจ้งเหตุฉุกเฉิน 191' },
  { name: 'สถานีตำรวจภูธรหนองสาหร่าย', type: 'police', lat: 14.733777, lng: 101.536585, details: 'สถานีตำรวจภูธร' },
  { name: 'สถานีตำรวจภูธรหมูสี', type: 'police', lat: 14.545814, lng: 101.439763, details: 'สถานีตำรวจภูธร' },
  { name: 'สถานีตำรวจภูธรกลางดง', type: 'police', lat: 14.629337, lng: 101.272111, details: 'สถานีตำรวจภูธร' },
  { name: 'สถานีตำรวจทางหลวง (ปากช่อง)', type: 'police', lat: 14.694665, lng: 101.405789, details: 'ตำรวจทางหลวง' },
  // Tourist
  { name: 'ฟาร์มโชคชัย', type: 'tourist', lat: 14.654812, lng: 101.345388, details: 'สถานที่ท่องเที่ยวเชิงเกษตร' },
  { name: 'ข้าวโพดหวานไร่สุวรรณ', type: 'tourist', lat: 14.650833, lng: 101.298639, details: 'ไร่ข้าวโพดหวาน' },
  { name: 'น้ำผุดธรรมชาติบ้านท่าช้าง', type: 'tourist', lat: 14.534241, lng: 101.417254, details: 'แหล่งท่องเที่ยวธรรมชาติ' },
  { name: 'สวนผักปากช่อง', type: 'tourist', lat: 14.644979, lng: 101.632495, details: '' },
  // Schools (sample)
  { name: 'โรงเรียนปากช่อง', type: 'school', lat: 14.6936, lng: 101.4055, details: 'โรงเรียน' },
  { name: 'โรงเรียนคุรุสามัคคี', type: 'school', lat: 14.7132, lng: 101.4158, details: 'โรงเรียน' },
  { name: 'โรงเรียนพญาเย็นวิทยา', type: 'school', lat: 14.5912, lng: 101.2285, details: 'โรงเรียน' },
  { name: 'โรงเรียนกลางดงปุณณวาทวิทยา', type: 'school', lat: 14.6315, lng: 101.2742, details: 'โรงเรียน' },
  // Temples (sample)
  { name: 'วัดป่าภูหายหลง', type: 'temple', lat: 14.532010, lng: 101.578355, details: 'วัดบนเขา วิว 360 องศา' },
  { name: 'วัดเขาวันชัยนวรัตน์', type: 'temple', lat: 14.696226, lng: 101.409578, details: 'ปราสาทหินทรายพรรณาราย' },
  { name: 'วัดถ้ำซับมืด', type: 'temple', lat: 14.787233, lng: 101.430505, details: 'สายปฏิบัติธรรม มีถ้ำ' },
  { name: 'วัดถ้ำไตรรัตน์', type: 'temple', lat: 14.635346, lng: 101.354906, details: 'วัดเก่าแก่ มีถ้ำ' },
  { name: 'วัดวชิราลงกรณวรารามวรวิหาร', type: 'temple', lat: 14.654167, lng: 101.402778, details: '' },
];

// ─── Icon mapping to /public PNGs ─────────────────────────────────────────────
const TYPE_ICONS: Record<string, string> = {
  hospital:   '/hospital.png',
  government: '/government.png',
  police:     '/police.png',
  school:     '/school.png',
  tourist:    '/tourist.png',
  temple:     '/measure.png',
};

// Patient icons: chosen by sex × result
// sex=2/F → x (female), sex=1/M → y (male)
const RESULT_SUFFIX: Record<string, string> = {
  'สีแดง':    'r',
  'สีส้ม':    'o',
  'สีเหลือง': 'y',
  'สีเขียว':  'g',
};

function getPatientIcon(sex: string, result: string): string {
  const prefix = (sex === '2' || sex === 'F' || sex === 'female') ? 'x' : 'y';
  const suffix = RESULT_SUFFIX[result];
  return suffix ? `/${prefix}_${suffix}.png` : `/${prefix}.png`;
}

const RESULT_COLORS: Record<string, string> = {
  'สีแดง':    '#E53E3E',
  'สีเหลือง': '#D69E2E',
  'สีเขียว':  '#38A169',
};

const TYPE_LABELS: Record<string, string> = {
  hospital:   '🏥 โรงพยาบาล/รพ.สต.',
  government: '🏛️ หน่วยงานราชการ',
  police:     '👮 สถานีตำรวจ',
  school:     '🏫 โรงเรียน',
  tourist:    '🌿 ท่องเที่ยว',
  temple:     '⛩️ วัด',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface PatientMapItem {
  hn: string;
  pt_name: string;
  result: string;
  sex: string;
  tmbpart?: string;
  moopart?: string;
  lat?: number;
  lng?: number;
  entry_date?: string | null;
}

const PAK_CHONG_CENTER: [number, number] = [14.700, 101.408];

const MOO_OFFSETS: Record<string, [number, number]> = {
  '01': [0.000, 0.000], '02': [0.025, -0.020], '03': [-0.030, 0.015],
  '04': [0.010, 0.035], '05': [-0.015, -0.030], '06': [0.040, 0.010],
  '07': [-0.040, 0.025], '08': [0.015, -0.045], '09': [-0.025, 0.040], '10': [0.050, -0.015],
};

function assignCoords(patients: PatientMapItem[]): PatientMapItem[] {
  return patients.map((p) => {
    const off = MOO_OFFSETS[p.moopart || '01'] || [0, 0];
    return {
      ...p,
      lat: PAK_CHONG_CENTER[0] + off[0] + (Math.random() - 0.5) * 0.01,
      lng: PAK_CHONG_CENTER[1] + off[1] + (Math.random() - 0.5) * 0.01,
    };
  });
}

function loadLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    if ((window as any).L) return resolve((window as any).L);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve((window as any).L);
    document.head.appendChild(script);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
const SpotMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const patientMarkersRef = useRef<any[]>([]);
  const placeMarkersRef = useRef<any[]>([]);

  const [patients, setPatients] = useState<PatientMapItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Layer toggles
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['สีแดง', 'สีเหลือง', 'สีเขียว']));
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['hospital', 'police', 'government']));
  const [showHeatmap, setShowHeatmap] = useState(false);

  const [selectedItem, setSelectedItem] = useState<{ name: string; sub?: string; type: 'patient' | 'place' } | null>(null);
  const [stats, setStats] = useState({ red: 0, yellow: 0, green: 0 });

  // Area filters
  const [selectedTmb, setSelectedTmb] = useState<string>('');
  const [selectedMoo, setSelectedMoo] = useState<string>('');

  const API_BASE_URL = '/api/fastapi';

  // ─── Fetch patient SMI-V data ──────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokenRes = await fetch('/api/get-machine-token');
        const { access_token } = await tokenRes.json();
        const headers = { Authorization: `Bearer ${access_token}` };

        let allSmiv: any[] = [];
        let skip = 0;
        while (true) {
          const res = await fetch(`${API_BASE_URL}/smi-v?limit=500&skip=${skip}`, { headers });
          if (!res.ok) break;
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.items || []);
          if (items.length === 0) break;
          allSmiv = allSmiv.concat(items);
          skip += 500;
        }

        allSmiv.sort((a, b) => new Date(b.entry_date || 0).getTime() - new Date(a.entry_date || 0).getTime());
        const recent = allSmiv.slice(0, 100);

        const uniqueHns = Array.from(new Set(recent.map((i: any) => i.hn).filter(Boolean))) as string[];
        const ptMap: Record<string, any> = {};
        for (let i = 0; i < uniqueHns.length; i += 10) {
          const batch = uniqueHns.slice(i, i + 10);
          await Promise.all(batch.map(async (hn) => {
            try {
              const r = await fetch(`${API_BASE_URL}/patients/hn/${hn}`, { headers });
              if (r.ok) ptMap[hn] = await r.json();
            } catch {}
          }));
        }

        const mapped: PatientMapItem[] = recent
          .filter((item: any) => item.hn && ptMap[item.hn])
          .map((item: any) => ({
            hn: item.hn,
            pt_name: ptMap[item.hn].pt_name || '(ไม่ระบุ)',
            result: item.result || 'ไม่ระบุ',
            sex: ptMap[item.hn].sex || '1',
            tmbpart: ptMap[item.hn].tmbpart,
            moopart: ptMap[item.hn].moopart,
            entry_date: item.entry_date,
          }));

        const withCoords = assignCoords(mapped);
        setPatients(withCoords);
        setStats({
          red: withCoords.filter(p => p.result === 'สีแดง').length,
          yellow: withCoords.filter(p => p.result === 'สีเหลือง').length,
          green: withCoords.filter(p => p.result === 'สีเขียว').length,
        });
      } catch (e) { console.error('SpotMap error:', e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // ─── Init map ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !mapRef.current || leafletMap.current) return;
    loadLeaflet().then((L) => {
      leafletMap.current = L.map(mapRef.current!, { center: PAK_CHONG_CENTER, zoom: 13 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(leafletMap.current);
    });
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, [loading]);

  // ─── Patient markers ──────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletMap.current || loading) return;
    loadLeaflet().then((L) => {
      patientMarkersRef.current.forEach(m => m.remove());
      patientMarkersRef.current = [];

      const visible = patients.filter(p =>
        activeFilters.has(p.result) &&
        (!selectedTmb || p.tmbpart === selectedTmb) &&
        (!selectedMoo || p.moopart === selectedMoo)
      );
      visible.forEach((pt) => {
        const iconUrl = getPatientIcon(pt.sex, pt.result);
        const icon = L.icon({ iconUrl, iconSize: [48, 48], iconAnchor: [24, 48], popupAnchor: [0, -48] });
        const marker = L.marker([pt.lat!, pt.lng!], { icon })
          .addTo(leafletMap.current)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:160px">
              <b style="color:#1a202c">${pt.pt_name}</b><br>
              <span style="font-size:11px;color:#718096">${pt.hn}</span><br>
              <span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700;
                background:${RESULT_COLORS[pt.result] || '#718096'}20;color:${RESULT_COLORS[pt.result] || '#718096'}">${pt.result}</span>
            </div>`)
          .on('click', () => setSelectedItem({ name: pt.pt_name, sub: pt.hn, type: 'patient' }));
        patientMarkersRef.current.push(marker);
      });
    });
  }, [patients, activeFilters, loading, selectedTmb, selectedMoo]);

  // ─── Important place markers ───────────────────────────────────────────
  useEffect(() => {
    if (!leafletMap.current || loading) return;
    loadLeaflet().then((L) => {
      placeMarkersRef.current.forEach(m => m.remove());
      placeMarkersRef.current = [];

      IMPORTANT_PLACES.filter(p => activeLayers.has(p.type)).forEach((place) => {
        const iconUrl = TYPE_ICONS[place.type] || '/government.png';
        const icon = L.icon({ iconUrl, iconSize: [42, 42], iconAnchor: [21, 42], popupAnchor: [0, -42] });
        const marker = L.marker([place.lat, place.lng], { icon })
          .addTo(leafletMap.current)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:160px">
              <b style="color:#1a202c">${place.name}</b><br>
              <span style="font-size:11px;color:#718096">${TYPE_LABELS[place.type] || place.type}</span>
              ${place.details ? `<br><span style="font-size:11px;color:#4a5568">${place.details}</span>` : ''}
            </div>`)
          .on('click', () => setSelectedItem({ name: place.name, sub: TYPE_LABELS[place.type], type: 'place' }));
        placeMarkersRef.current.push(marker);
      });
    });
  }, [activeLayers, loading]);

  // ─── Heatmap overlay ──────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletMap.current) return;
    loadLeaflet().then((L) => {
      if ((leafletMap.current as any)._hotspot) {
        (leafletMap.current as any)._hotspot.remove();
        delete (leafletMap.current as any)._hotspot;
      }
      if (showHeatmap) {
        const redPts = patients.filter(p => p.result === 'สีแดง' && p.lat && p.lng);
        redPts.forEach(pt => {
          const c = L.circle([pt.lat!, pt.lng!], {
            radius: 400,
            color: 'transparent',
            fillColor: '#E53E3E',
            fillOpacity: 0.20,
          }).addTo(leafletMap.current);
          (leafletMap.current as any)._hotspot = c;
        });
      }
    });
  }, [showHeatmap, patients]);

  const toggleFilter = (r: string) => setActiveFilters(prev => { const n = new Set(prev); n.has(r) ? n.delete(r) : n.add(r); return n; });
  const toggleLayer = (t: string) => setActiveLayers(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });

  const handleRoute = () => {
    const reds = patients.filter(p => p.result === 'สีแดง' && p.lat && p.lng);
    if (!reds.length) { alert('ไม่มีเคสวิกฤต'); return; }
    const wps = reds.slice(0, 8).map(p => `${p.lat!.toFixed(5)},${p.lng!.toFixed(5)}`);
    window.open(`https://www.google.com/maps/dir/${PAK_CHONG_CENTER.join(',')}/${wps.join('/')}`, '_blank');
  };

  const filteredPts = patients.filter(p =>
    activeFilters.has(p.result) &&
    (!selectedTmb || p.tmbpart === selectedTmb) &&
    (!selectedMoo || p.moopart === selectedMoo)
  );

  // Dynamic area option lists
  const tmbOptions = Array.from(new Set(patients.map(p => p.tmbpart).filter(Boolean))).sort() as string[];
  const mooOptions = Array.from(new Set(
    patients
      .filter(p => !selectedTmb || p.tmbpart === selectedTmb)
      .map(p => p.moopart).filter(Boolean)
  )).sort() as string[];

  return (
    <div className="flex h-full overflow-hidden rounded-xl shadow-sm border border-slate-200 bg-white" style={{ minHeight: '600px' }}>

      {/* ── Left Panel ───────────────────────────────────────────── */}
      <div className="w-72 shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100"><MapPin className="text-blue-600" size={20} /></div>
            <div>
              <h2 className="text-base font-black text-slate-800">Spot Map</h2>
              <p className="text-xs text-slate-400">อ.ปากช่อง จ.นครราชสีมา</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 grid grid-cols-3 gap-2">
          {[['red', stats.red, 'วิกฤต', '#E53E3E'], ['yellow', stats.yellow, 'เฝ้าระวัง', '#D69E2E'], ['green', stats.green, 'ปกติ', '#38A169']].map(([k, v, l, c]) => (
            <div key={String(k)} className="text-center p-2 rounded-xl border" style={{ background: `${c}1A`, borderColor: `${c}40` }}>
              <p className="text-xl font-black" style={{ color: String(c) }}>{v}</p>
              <p className="text-xs font-bold" style={{ color: String(c) }}>{String(l)}</p>
            </div>
          ))}
        </div>

        {/* Patient filters */}
        <div className="px-4 pb-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Filter size={11} /> ผู้ป่วย SMI-V</p>
          {(['สีแดง', 'สีเหลือง', 'สีเขียว'] as const).map((r) => (
            <button key={r} onClick={() => toggleFilter(r)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-sm font-bold transition-all ${activeFilters.has(r) ? 'opacity-100' : 'opacity-35 grayscale'}`}
              style={{ background: RESULT_COLORS[r] + '18', color: RESULT_COLORS[r] }}>
              <span className="w-3 h-3 rounded-full" style={{ background: RESULT_COLORS[r] }} />
              {r === 'สีแดง' ? '🔴 วิกฤต' : r === 'สีเหลือง' ? '🟡 เฝ้าระวัง' : '🟢 ปกติ'}
            </button>
          ))}
          {/* Area filters */}
          <div className="mt-2 space-y-1.5">
            <div>
              <label className="text-xs text-slate-400 font-bold mb-0.5 block">📍 ตำบล</label>
              <select
                value={selectedTmb}
                onChange={e => { setSelectedTmb(e.target.value); setSelectedMoo(''); }}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                <option value="">ทั้งหมด</option>
                {tmbOptions.map(t => <option key={t} value={t}>ตำบล {t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-0.5 block">🏘️ หมู่บ้าน</label>
              <select
                value={selectedMoo}
                onChange={e => setSelectedMoo(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                <option value="">ทั้งหมด</option>
                {mooOptions.map(m => <option key={m} value={m}>หมู่ {m}</option>)}
              </select>
            </div>
            {(selectedTmb || selectedMoo) && (
              <button onClick={() => { setSelectedTmb(''); setSelectedMoo(''); }}
                className="w-full text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 justify-center py-1">
                <X size={11} /> ล้าง Filter พื้นที่
              </button>
            )}
          </div>
        </div>

        {/* Place layers */}
        <div className="px-4 pb-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Layers size={11} /> Layer สถานที่สำคัญ</p>
          {Object.entries(TYPE_LABELS).map(([t, l]) => (
            <label key={t} className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer">
              <div onClick={() => toggleLayer(t)} className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 ${activeLayers.has(t) ? 'bg-teal-400' : 'bg-slate-200'}`}>
                <div className={`w-3 h-3 bg-white rounded-full shadow mt-0.5 transition-transform ${activeLayers.has(t) ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <img src={TYPE_ICONS[t]} alt="" className="w-5 h-5 object-contain" />
              <span className="text-xs font-medium text-slate-600">{l}</span>
            </label>
          ))}

          {/* Heatmap toggle */}
          <label className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer mt-1">
            <div onClick={() => setShowHeatmap(!showHeatmap)} className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 ${showHeatmap ? 'bg-red-400' : 'bg-slate-200'}`}>
              <div className={`w-3 h-3 bg-white rounded-full shadow mt-0.5 transition-transform ${showHeatmap ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs font-medium text-slate-600">🌡️ Hotspot Heatmap</span>
          </label>
        </div>

        {/* Route */}
        <div className="px-4 pb-3">
          <button onClick={handleRoute}
            className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all">
            <Navigation size={15} /> แผนเส้นทางเยี่ยมบ้าน (เคสแดง)
          </button>
        </div>

        {/* Patient mini list */}
        <div className="px-4 pb-4 flex-1 overflow-y-auto">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Activity size={11} /> รายการ ({filteredPts.length})
          </p>
          {filteredPts.map((pt) => (
            <div key={pt.hn + pt.result}
              onClick={() => { setSelectedItem({ name: pt.pt_name, sub: pt.hn, type: 'patient' }); if (leafletMap.current && pt.lat && pt.lng) leafletMap.current.setView([pt.lat, pt.lng], 16); }}
              className="flex items-center gap-2 px-2 py-1.5 bg-white border border-slate-100 rounded-lg cursor-pointer hover:border-blue-200 hover:bg-blue-50/50 transition-all mb-1">
              <img src={getPatientIcon(pt.sex, pt.result)} alt="" className="w-5 h-5 object-contain shrink-0" />
              <span className="text-xs font-medium text-slate-700 truncate">{pt.pt_name}</span>
              <span className="ml-auto text-xs text-slate-400 font-mono shrink-0">{pt.hn}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Map ──────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-30 bg-slate-50 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลแผนที่...</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: '500px' }} />

        {/* Emergency banner */}
        {stats.red >= 3 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-600 text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 font-bold text-sm animate-bounce">
            <AlertTriangle size={16} className="animate-pulse" />
            ⚠ พบเคสวิกฤต {stats.red} ราย — ต้องการดูแลด่วน!
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-3 shadow-md">
          <p className="text-xs font-bold text-slate-500 mb-2">สัญลักษณ์ผู้ป่วย</p>
          {([
            ['/y_r.png', '/x_r.png', 'สีแดง (วิกฤต)'],
            ['/y_o.png', '/x_o.png', 'สีส้ม (เฝ้าระวังสูง)'],
            ['/y_y.png', '/x_y.png', 'สีเหลือง (เฝ้าระวัง)'],
            ['/y_g.png', '/x_g.png', 'สีเขียว (ปกติ)'],
          ] as const).map(([m, f, label]) => (
            <div key={label} className="flex items-center gap-1.5 mb-1.5">
              <img src={m} alt="" className="w-5 h-5 object-contain" title="ชาย" />
              <img src={f} alt="" className="w-5 h-5 object-contain" title="หญิง" />
              <span className="text-xs text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Stats Panel ──────────────────────────────────── */}
      <div className="w-60 shrink-0 bg-white border-l border-slate-100 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-slate-500" size={16} />
            <h3 className="font-bold text-slate-700 text-sm">Area Statistics</h3>
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">ตามหมู่บ้าน</p>
          {(() => {
            const byMoo: Record<string, number[]> = {};
            patients.forEach(p => {
              const moo = p.moopart || '?';
              if (!byMoo[moo]) byMoo[moo] = [0, 0, 0];
              if (p.result === 'สีแดง') byMoo[moo][0]++;
              else if (p.result === 'สีเหลือง') byMoo[moo][1]++;
              else byMoo[moo][2]++;
            });
            return Object.entries(byMoo).sort((a, b) => b[1][0] - a[1][0]).map(([moo, counts]) => {
              const total = counts.reduce((a, b) => a + b, 0);
              return (
                <div key={moo} className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-600">หมู่ {moo}</span>
                    <span className="text-xs text-slate-400">{total} ราย</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden flex gap-px bg-slate-100">
                    {counts[0] > 0 && <div className="bg-red-500 h-full" style={{ width: `${counts[0] / total * 100}%` }} />}
                    {counts[1] > 0 && <div className="bg-yellow-400 h-full" style={{ width: `${counts[1] / total * 100}%` }} />}
                    {counts[2] > 0 && <div className="bg-emerald-400 h-full" style={{ width: `${counts[2] / total * 100}%` }} />}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Selected info */}
        {selectedItem && (
          <div className="mx-3 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">📍 เลือก</p>
              <button onClick={() => setSelectedItem(null)} className="text-slate-300 hover:text-slate-500"><X size={13} /></button>
            </div>
            <p className="font-bold text-slate-800 text-sm leading-snug">{selectedItem.name}</p>
            {selectedItem.sub && <p className="text-xs text-slate-400 mt-0.5">{selectedItem.sub}</p>}
          </div>
        )}

        {/* Emergency alerts */}
        <div className="px-3 pb-4">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
            <AlertTriangle size={11} className="text-red-400" /> Emergency Alerts
          </p>
          {patients.filter(p => p.result === 'สีแดง').length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">ไม่มีเหตุฉุกเฉิน</p>
          ) : (
            patients.filter(p => p.result === 'สีแดง').map(pt => (
              <div key={pt.hn}
                onClick={() => { setSelectedItem({ name: pt.pt_name, sub: pt.hn, type: 'patient' }); if (leafletMap.current && pt.lat && pt.lng) leafletMap.current.setView([pt.lat, pt.lng], 16); }}
                className="mb-2 p-2.5 bg-red-50 border border-red-100 rounded-xl cursor-pointer hover:border-red-300 transition-all">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-xs font-bold text-red-700 truncate">{pt.pt_name}</p>
                </div>
                <p className="text-xs text-red-400 font-mono">{pt.hn} · หมู่ {pt.moopart || '-'}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SpotMap;
