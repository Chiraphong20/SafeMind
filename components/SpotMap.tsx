import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Layers, AlertTriangle, BarChart3, Navigation, X, Filter, Activity, Loader2 } from 'lucide-react';

// ─── Type Definitions ─────────────────────────────────────────────────────────

interface PatientMapItem {
  hn: string;
  pt_name: string;
  result: string;
  tmbpart?: string;
  amppart?: string;
  chwpart?: string;
  moopart?: string;
  lat?: number;
  lng?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Center on Pak Chong district
const PAK_CHONG_CENTER: [number, number] = [14.7002, 101.4071];

// Approximate coordinates per moopart (village) near Pak Chong
const MOO_OFFSETS: Record<string, [number, number]> = {
  '01': [0.000, 0.000],  
  '02': [0.025, -0.020],
  '03': [-0.030, 0.015],
  '04': [0.010, 0.035],
  '05': [-0.015, -0.030],
  '06': [0.040, 0.010],
  '07': [-0.040, 0.025],
  '08': [0.015, -0.045],
  '09': [-0.025, 0.040],
  '10': [0.050, -0.015],
};

const RESULT_COLORS: Record<string, string> = {
  'สีแดง': '#E53E3E',
  'สีเหลือง': '#D69E2E',
  'สีเขียว': '#38A169',
};

const RESULT_BG: Record<string, string> = {
  'สีแดง': 'bg-red-500',
  'สีเหลือง': 'bg-yellow-500',
  'สีเขียว': 'bg-emerald-500',
};

// ─── Load Leaflet from CDN ────────────────────────────────────────────────────
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

// ─── Assign approximate lat/lng based on moopart ─────────────────────────────
function assignCoordinates(patients: PatientMapItem[]): PatientMapItem[] {
  return patients.map((p, idx) => {
    const offset = MOO_OFFSETS[p.moopart || '01'] || [0, 0];
    // Add small jitter so pins don't stack
    const jitter = [(Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.012];
    return {
      ...p,
      lat: PAK_CHONG_CENTER[0] + offset[0] + jitter[0],
      lng: PAK_CHONG_CENTER[1] + offset[1] + jitter[1],
    };
  });
}

// ─── SpotMap Component ────────────────────────────────────────────────────────
const SpotMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [patients, setPatients] = useState<PatientMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['สีแดง', 'สีเหลือง', 'สีเขียว']));
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientMapItem | null>(null);
  const [stats, setStats] = useState({ red: 0, yellow: 0, green: 0, total: 0 });

  const API_BASE_URL = '/api/fastapi';

  // ─── Fetch patient data ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokenRes = await fetch('/api/get-machine-token');
        const { access_token } = await tokenRes.json();
        const headers = { Authorization: `Bearer ${access_token}` };

        // Fetch SMI-V records
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

        // Sort newest first, take top 100
        allSmiv.sort((a, b) => new Date(b.entry_date || 0).getTime() - new Date(a.entry_date || 0).getTime());
        const recent = allSmiv.slice(0, 100);

        // Batch-fetch patient info
        const uniqueHns = Array.from(new Set(recent.map((i: any) => i.hn).filter(Boolean))) as string[];
        const patientMap: Record<string, any> = {};

        for (let i = 0; i < uniqueHns.length; i += 10) {
          const batch = uniqueHns.slice(i, i + 10);
          await Promise.all(batch.map(async (hn) => {
            try {
              const r = await fetch(`${API_BASE_URL}/patients/hn/${hn}`, { headers });
              if (r.ok) patientMap[hn] = await r.json();
            } catch {}
          }));
        }

        // Combine
        const mapped: PatientMapItem[] = recent
          .filter((item: any) => item.hn && patientMap[item.hn])
          .map((item: any) => ({
            hn: item.hn,
            pt_name: patientMap[item.hn].pt_name || '(ไม่ระบุ)',
            result: item.result || 'ไม่ระบุ',
            tmbpart: patientMap[item.hn].tmbpart,
            amppart: patientMap[item.hn].amppart,
            chwpart: patientMap[item.hn].chwpart,
            moopart: patientMap[item.hn].moopart,
          }));

        const withCoords = assignCoordinates(mapped);
        setPatients(withCoords);

        setStats({
          red: withCoords.filter(p => p.result === 'สีแดง').length,
          yellow: withCoords.filter(p => p.result === 'สีเหลือง').length,
          green: withCoords.filter(p => p.result === 'สีเขียว').length,
          total: withCoords.length,
        });
      } catch (e) {
        console.error('SpotMap fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Initialize Leaflet map ────────────────────────────────────────────
  useEffect(() => {
    if (loading || !mapRef.current) return;

    loadLeaflet().then((L) => {
      if (leafletMap.current) return;

      leafletMap.current = L.map(mapRef.current!, {
        center: PAK_CHONG_CENTER,
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(leafletMap.current);
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [loading]);

  // ─── Update markers when filters change ──────────────────────────────
  useEffect(() => {
    if (!leafletMap.current || loading) return;

    loadLeaflet().then((L) => {
      // Remove old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const visible = patients.filter(p => activeFilters.has(p.result));

      visible.forEach((pt) => {
        const color = RESULT_COLORS[pt.result] || '#718096';
        const size = pt.result === 'สีแดง' ? 16 : 13;

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              width: ${size}px; height: ${size}px; 
              background: ${color}; 
              border: 2.5px solid white; 
              border-radius: 50%; 
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              cursor: pointer;
              ${pt.result === 'สีแดง' ? 'animation: pulse-red 1.5s infinite;' : ''}
            "></div>
            <style>@keyframes pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(229,62,62,0.5)} 50%{box-shadow:0 0 0 8px rgba(229,62,62,0)} }</style>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([pt.lat!, pt.lng!], { icon })
          .addTo(leafletMap.current)
          .on('click', () => setSelectedPatient(pt));

        markersRef.current.push(marker);
      });
    });
  }, [patients, activeFilters, loading]);

  // ─── Toggle filter ─────────────────────────────────────────────────────
  const toggleFilter = (result: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(result) ? next.delete(result) : next.add(result);
      return next;
    });
  };

  // ─── Route suggestion (opens Google Maps with waypoints) ──────────────
  const handleRoute = () => {
    const redPts = patients.filter(p => p.result === 'สีแดง' && p.lat && p.lng);
    if (redPts.length === 0) { alert('ไม่มีผู้ป่วยกลุ่มสีแดงในระบบ'); return; }
    const waypoints = redPts.slice(0, 8).map(p => `${p.lat!.toFixed(5)},${p.lng!.toFixed(5)}`);
    const origin = `${PAK_CHONG_CENTER[0]},${PAK_CHONG_CENTER[1]}`;
    const url = `https://www.google.com/maps/dir/${origin}/${waypoints.join('/')}`;
    window.open(url, '_blank');
  };

  // ─── Hotspot heatmap overlay using circle ──────────────────────────────
  useEffect(() => {
    if (!leafletMap.current) return;
    loadLeaflet().then((L) => {
      // Simple heatmap using large semi-transparent circles
      if (showHeatmap) {
        const reds = patients.filter(p => p.result === 'สีแดง');
        const hotspotCircle = L.circle(PAK_CHONG_CENTER, {
          radius: reds.length > 3 ? 1200 : 600,
          color: 'transparent',
          fillColor: '#E53E3E',
          fillOpacity: 0.18,
        }).addTo(leafletMap.current);
        (leafletMap.current as any)._hotspot = hotspotCircle;
      } else {
        if ((leafletMap.current as any)._hotspot) {
          (leafletMap.current as any)._hotspot.remove();
        }
      }
    });
  }, [showHeatmap, patients]);

  const filteredVisible = patients.filter(p => activeFilters.has(p.result));

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full gap-0 overflow-hidden rounded-xl shadow-sm border border-slate-200 bg-white">
      
      {/* ── Left Control Panel ────────────────────────────────── */}
      <div className="w-72 shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-y-auto">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
              <MapPin className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">Spot Map</h2>
              <p className="text-xs text-slate-400">Spatial Intelligence</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-red-50 rounded-xl border border-red-100">
            <p className="text-xl font-black text-red-600">{stats.red}</p>
            <p className="text-xs text-red-400 font-bold">วิกฤต</p>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded-xl border border-yellow-100">
            <p className="text-xl font-black text-yellow-600">{stats.yellow}</p>
            <p className="text-xs text-yellow-500 font-bold">เฝ้าระวัง</p>
          </div>
          <div className="text-center p-2 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-xl font-black text-emerald-600">{stats.green}</p>
            <p className="text-xs text-emerald-500 font-bold">ปกติ</p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Filter size={11} /> ตัวกรองกลุ่มสี
          </p>
          {(['สีแดง', 'สีเหลือง', 'สีเขียว'] as const).map((r) => (
            <button
              key={r}
              onClick={() => toggleFilter(r)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1.5 text-sm font-bold transition-all ${
                activeFilters.has(r) ? 'opacity-100' : 'opacity-40 grayscale'
              }`}
              style={{ background: RESULT_COLORS[r] + '18', color: RESULT_COLORS[r] }}
            >
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: RESULT_COLORS[r] }} />
              {r === 'สีแดง' ? '🔴 High Risk (วิกฤต)' : r === 'สีเหลือง' ? '🟡 Medium Risk (เฝ้าระวัง)' : '🟢 Low Risk (ปกติ)'}
            </button>
          ))}
        </div>

        {/* Layer Toggles */}
        <div className="px-4 pb-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Layers size={11} /> ชั้นข้อมูล (Layers)
          </p>
          <label className="flex items-center gap-2.5 cursor-pointer py-2 px-3 hover:bg-slate-50 rounded-lg">
            <div
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 ${showHeatmap ? 'bg-red-400' : 'bg-slate-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${showHeatmap ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-slate-600">Hotspot Heatmap</span>
          </label>
        </div>

        {/* Route Optimization */}
        <div className="px-4 pb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Navigation size={11} /> Route Optimization
          </p>
          <button
            onClick={handleRoute}
            className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
          >
            <Navigation size={16} />
            แผนเส้นทางเยี่ยมบ้าน
          </button>
          <p className="text-xs text-slate-400 mt-1.5 text-center">เรียงตามเคสวิกฤต (สีแดง) ก่อน</p>
        </div>

        {/* Patient list in panel */}
        <div className="px-4 pb-4 flex-1 overflow-y-auto">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Activity size={11} /> รายการที่มองเห็น ({filteredVisible.length})
          </p>
          <div className="space-y-1.5">
            {filteredVisible.map((pt) => (
              <div
                key={pt.hn + pt.result}
                onClick={() => {
                  setSelectedPatient(pt);
                  if (leafletMap.current && pt.lat && pt.lng) {
                    leafletMap.current.setView([pt.lat, pt.lng], 16);
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-lg cursor-pointer hover:border-blue-200 hover:bg-blue-50/50 transition-all"
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: RESULT_COLORS[pt.result] || '#718096' }} />
                <span className="text-xs font-medium text-slate-700 truncate">{pt.pt_name}</span>
                <span className="ml-auto text-xs text-slate-400 font-mono shrink-0">{pt.hn}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Map Area ─────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-30 bg-slate-50 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลและเตรียมแผนที่...</p>
          </div>
        )}

        <div ref={mapRef} className="w-full h-full" style={{ minHeight: '500px' }} />

        {/* Legend overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-3 shadow-md">
          <p className="text-xs font-bold text-slate-500 mb-2">สัญลักษณ์</p>
          {[['#E53E3E', 'High Risk — วิกฤต'], ['#D69E2E', 'Medium Risk — เฝ้าระวัง'], ['#38A169', 'Low Risk — ปกติ']].map(([c, l]) => (
            <div key={c} className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c }} />
              <span className="text-xs text-slate-600">{l}</span>
            </div>
          ))}
        </div>

        {/* Emergency Alert Banner – shows if reds > 3 */}
        {stats.red >= 3 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-600 text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 font-bold text-sm animate-bounce">
            <AlertTriangle size={16} className="animate-pulse" />
            ⚠ พบเคสวิกฤต {stats.red} ราย — ต้องการการดูแลด่วน!
          </div>
        )}
      </div>

      {/* ── Right Stats Panel ─────────────────────────────────────── */}
      <div className="w-64 shrink-0 bg-white border-l border-slate-100 flex flex-col overflow-y-auto">
        
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-slate-500" size={18} />
            <h3 className="font-bold text-slate-700 text-sm">Area Statistics</h3>
          </div>
        </div>

        {/* Stats by moopart */}
        <div className="p-4">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">ความหนาแน่นตามหมู่บ้าน</p>
          {(() => {
            const byMoo: Record<string, number[]> = {};
            patients.forEach(p => {
              const moo = p.moopart || '?';
              if (!byMoo[moo]) byMoo[moo] = [0, 0, 0];
              if (p.result === 'สีแดง') byMoo[moo][0]++;
              else if (p.result === 'สีเหลือง') byMoo[moo][1]++;
              else byMoo[moo][2]++;
            });
            return Object.entries(byMoo).sort((a, b) => b[1][0] - a[1][0]).map(([moo, counts]) => (
              <div key={moo} className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-600">หมู่ {moo}</span>
                  <span className="text-xs text-slate-400">{counts.reduce((a, b) => a + b, 0)} ราย</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden flex gap-px bg-slate-100">
                  {counts[0] > 0 && <div className="bg-red-500 h-full" style={{ width: `${counts[0] / (counts[0] + counts[1] + counts[2]) * 100}%` }} />}
                  {counts[1] > 0 && <div className="bg-yellow-400 h-full" style={{ width: `${counts[1] / (counts[0] + counts[1] + counts[2]) * 100}%` }} />}
                  {counts[2] > 0 && <div className="bg-emerald-400 h-full" style={{ width: `${counts[2] / (counts[0] + counts[1] + counts[2]) * 100}%` }} />}
                </div>
              </div>
            ));
          })()}
        </div>

        {/* Selected patient info */}
        {selectedPatient && (
          <div className="mx-4 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">📍 ผู้ป่วยที่เลือก</p>
              <button onClick={() => setSelectedPatient(null)} className="text-slate-300 hover:text-slate-500">
                <X size={14} />
              </button>
            </div>
            <p className="font-bold text-slate-800 text-sm">{selectedPatient.pt_name}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedPatient.hn}</p>
            <div className="mt-2">
              <span
                className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ background: RESULT_COLORS[selectedPatient.result] || '#718096' }}
              >
                {selectedPatient.result}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">หมู่ {selectedPatient.moopart || '-'} | ตำบล {selectedPatient.tmbpart || '-'}</p>
          </div>
        )}

        {/* Emergency alerts */}
        <div className="px-4 pb-4">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
            <AlertTriangle size={11} className="text-red-400" /> Emergency Alerts
          </p>
          {patients.filter(p => p.result === 'สีแดง').length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">ไม่มีเหตุฉุกเฉิน</p>
          ) : (
            patients.filter(p => p.result === 'สีแดง').map(pt => (
              <div
                key={pt.hn}
                onClick={() => {
                  setSelectedPatient(pt);
                  if (leafletMap.current && pt.lat && pt.lng) leafletMap.current.setView([pt.lat, pt.lng], 16);
                }}
                className="mb-2 p-2.5 bg-red-50 border border-red-100 rounded-xl cursor-pointer hover:border-red-300 transition-all"
              >
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
