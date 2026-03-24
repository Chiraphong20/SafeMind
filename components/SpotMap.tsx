import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Layers, AlertTriangle, BarChart3, Navigation, X, Filter, Activity, Loader2, Menu, User, Bot, Search, ChevronLeft } from 'lucide-react';

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
  chwpart?: string;
  amppart?: string;
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
    if ((window as any).L && (window as any).L.markerClusterGroup) return resolve((window as any).L);
    
    const links = [
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
      'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css'
    ];
    links.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });

    const loadScript = (src: string) => {
      return new Promise((res) => {
        if (document.querySelector(`script[src="${src}"]`)) return res(true);
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => res(true);
        document.head.appendChild(script);
      });
    };

    loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js').then(() => {
      loadScript('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js').then(() => {
        resolve((window as any).L);
      });
    });
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

  // UI States
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const markerClusterGroupRef = useRef<any>(null);
  
  // Filter checkboxes
  const [behaviorFilters, setBehaviorFilters] = useState({ harmOthers: false, threaten: false, destroy: false });
  const [drugFilters, setDrugFilters] = useState({ use1Month: false, quitWatch: false });
  const [medFilters, setMedFilters] = useState({ missMeds: false });

  // Area filters
  const [selectedTmb, setSelectedTmb] = useState<string>('');
  const [selectedMoo, setSelectedMoo] = useState<string>('');
  const [tmbNames, setTmbNames] = useState<Record<string, string>>({}); // tmbpart code → Thai name
  const [allTambons, setAllTambons] = useState<string[]>([]); // all Pak Chong tambons

  const API_BASE_URL = '/api/fastapi';

  // ─── Load ALL Pak Chong tambons on mount ──────────────────────────────
  useEffect(() => {
    const loadAllTambons = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/thaiaddress?chwpart=30&amppart=21&limit=100`);
        if (!res.ok) return;
        const data = await res.json();
        const items = data.items || [];
        // Filter only tambon level (codetype=3) and sort
        const tambons = items
          .filter((i: any) => i.codetype === '3' && i.tmbpart && i.tmbpart !== '00')
          .sort((a: any, b: any) => a.tmbpart.localeCompare(b.tmbpart));
        
        setAllTambons(tambons.map((t: any) => t.tmbpart));
        // Build name map
        const names: Record<string, string> = {};
        tambons.forEach((t: any) => { if (t.name) names[t.tmbpart] = `ต.${t.name}`; });
        setTmbNames(prev => ({ ...prev, ...names }));
      } catch (e) {
        console.error('Failed to load tambons:', e);
      }
    };
    loadAllTambons();
  }, []);

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
            chwpart: ptMap[item.hn].chwpart,
            amppart: ptMap[item.hn].amppart,
            entry_date: item.entry_date,
          }));

        const withCoords = assignCoords(mapped);
        setPatients(withCoords);
        setStats({
          red: withCoords.filter(p => p.result === 'สีแดง').length,
          yellow: withCoords.filter(p => p.result === 'สีเหลือง').length,
          green: withCoords.filter(p => p.result === 'สีเขียว').length,
        });

        // Resolve tmbpart codes to Thai names via thaiaddress API
        const uniqueTmbs = Array.from(new Set(withCoords.map(p => p.tmbpart).filter(Boolean))) as string[];
        const names: Record<string, string> = {};
        await Promise.all(uniqueTmbs.map(async (tmb) => {
          // Use first patient's chwpart+amppart to build addressId
          const sample = withCoords.find(p => p.tmbpart === tmb);
          if (!sample) return;
          const chw = sample.chwpart || '30';
          const amp = sample.amppart || '21';
          const addressId = `${chw}${amp}${tmb}`;
          try {
            const r = await fetch(`${API_BASE_URL}/thaiaddress/${addressId}`, { headers });
            if (r.ok) {
              const d = await r.json();
              // API returns object or array with items
              const item = d.items ? d.items[0] : d;
              if (item?.name) names[tmb] = `ต.${item.name}`;
            }
          } catch {}
        }));
        setTmbNames(names);
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
      if (markerClusterGroupRef.current) {
        markerClusterGroupRef.current.clearLayers();
        if (leafletMap.current.hasLayer(markerClusterGroupRef.current)) {
           leafletMap.current.removeLayer(markerClusterGroupRef.current);
        }
      }
      patientMarkersRef.current = [];
      
      markerClusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius: 50,
        iconCreateFunction: function(cluster: any) {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${count}</div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(36, 36)
          });
        }
      });

      const visible = patients.filter(p =>
        activeFilters.has(p.result) &&
        (!selectedTmb || p.tmbpart === selectedTmb) &&
        (!selectedMoo || p.moopart === selectedMoo)
      );
      visible.forEach((pt) => {
        const iconUrl = getPatientIcon(pt.sex, pt.result);
        const icon = L.icon({ iconUrl, iconSize: [48, 48], iconAnchor: [24, 48], popupAnchor: [0, -48] });
        const marker = L.marker([pt.lat!, pt.lng!], { icon })
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:160px">
              <b style="color:#1a202c">${pt.pt_name}</b><br>
              <span style="font-size:11px;color:#718096">${pt.hn}</span><br>
              <span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700;
                background:${RESULT_COLORS[pt.result] || '#718096'}20;color:${RESULT_COLORS[pt.result] || '#718096'}">${pt.result}</span>
            </div>`)
          .on('click', () => setSelectedItem({ name: pt.pt_name, sub: pt.hn, type: 'patient' }));
        patientMarkersRef.current.push(marker);
        markerClusterGroupRef.current.addLayer(marker);
      });
      leafletMap.current.addLayer(markerClusterGroupRef.current);
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

  // All tambons and static moo range
  const tmbOptions = allTambons.length > 0 ? allTambons : Array.from(new Set(patients.map(p => p.tmbpart).filter(Boolean))).sort() as string[];
  const mooOptions = Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, '0')); // '01' to '20'

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 font-sans">
      {/* ── Top Navbar ───────────────────────────────────────────── */}
      <div className="h-14 bg-gradient-to-r from-blue-700 to-blue-600 flex items-center justify-between px-4 text-white shrink-0 shadow-md z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowLeftPanel(!showLeftPanel)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg"><MapPin size={18} /></div>
            <h1 className="font-bold text-sm tracking-wide">SafeMind GIS <span className="text-blue-200 font-normal">| แผนที่จุดเสี่ยง (Spot Map)</span></h1>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> {stats.red} เคสแดง</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> {stats.yellow} เหลือง</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> {stats.green} เขียว</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700 cursor-pointer hover:border-blue-400 transition-colors">
            <User size={16} className="text-slate-300" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* ── Left Filter Panel ───────────────────────────────────────────── */}
        <div className={`w-[320px] bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-40 ${showLeftPanel ? 'translate-x-0' : '-translate-x-full absolute h-full'}`}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-700 tracking-wider">FILTER PANEL</h2>
            <button onClick={() => setShowLeftPanel(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-md">
              <ChevronLeft size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Risk Level */}
            <div>
              <p className="text-xs font-black text-slate-400 mb-3 tracking-widest uppercase">ระดับความเสี่ยง (RISK LEVEL)</p>
              <div className="space-y-3">
                {(['สีแดง', 'สีเหลือง', 'สีเขียว'] as const).map((r) => (
                  <label key={r} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${activeFilters.has(r) ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                      {activeFilters.has(r) && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{r === 'สีแดง' ? 'Red (วิกฤต/เสี่ยงสูง)' : r === 'สีเหลือง' ? 'Yellow (เฝ้าระวัง)' : 'Green (ปกติ)'}</span>
                    <input type="checkbox" className="hidden" checked={activeFilters.has(r)} onChange={() => toggleFilter(r)} />
                  </label>
                ))}
              </div>
            </div>

            {/* Behavior */}
            <div>
              <p className="text-xs font-black text-slate-400 mb-3 tracking-widest uppercase">พฤติกรรมความเสี่ยง (BEHAVIOR)</p>
              <div className="space-y-3">
                {[
                  { id: 'harmOthers', label: 'เคยทำร้ายผู้อื่น' },
                  { id: 'threaten', label: 'เคยขู่ทำร้าย' },
                  { id: 'destroy', label: 'เคยทำลายทรัพย์สิน' }
                ].map(b => (
                  <label key={b.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${behaviorFilters[b.id as keyof typeof behaviorFilters] ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                      {behaviorFilters[b.id as keyof typeof behaviorFilters] && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-medium text-slate-600">{b.label}</span>
                    <input type="checkbox" className="hidden" checked={behaviorFilters[b.id as keyof typeof behaviorFilters]} 
                      onChange={() => setBehaviorFilters(prev => ({...prev, [b.id]: !prev[b.id as keyof typeof behaviorFilters]}))} />
                  </label>
                ))}
              </div>
            </div>

            {/* Drugs */}
            <div>
              <p className="text-xs font-black text-slate-400 mb-3 tracking-widest uppercase">การใช้สารเสพติด</p>
              <div className="space-y-3">
                {[
                  { id: 'use1Month', label: 'ใช้สารใน 1 เดือน' },
                  { id: 'quitWatch', label: 'เลิกแล้ว (เฝ้าระวัง)' }
                ].map(b => (
                  <label key={b.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${drugFilters[b.id as keyof typeof drugFilters] ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                      {drugFilters[b.id as keyof typeof drugFilters] && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-medium text-slate-600">{b.label}</span>
                    <input type="checkbox" className="hidden" checked={drugFilters[b.id as keyof typeof drugFilters]} 
                      onChange={() => setDrugFilters(prev => ({...prev, [b.id]: !prev[b.id as keyof typeof drugFilters]}))} />
                  </label>
                ))}
              </div>
            </div>

            {/* Medication */}
            <div>
              <p className="text-xs font-black text-slate-400 mb-3 tracking-widest uppercase">การรับประทานยา</p>
              <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${medFilters.missMeds ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                      {medFilters.missMeds && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-medium text-slate-600">ขาดยา / หดยาเอง</span>
                    <input type="checkbox" className="hidden" checked={medFilters.missMeds} 
                      onChange={() => setMedFilters(prev => ({...prev, missMeds: !prev.missMeds}))} />
                  </label>
              </div>
            </div>
            
            {/* Area Filter */}
            <div className="pt-2">
              <p className="text-xs font-black text-slate-400 mb-3 tracking-widest uppercase">พื้นที่</p>
              <div className="space-y-2">
                <select value={selectedTmb} onChange={e => { setSelectedTmb(e.target.value); setSelectedMoo(''); }}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">ทุกตำบล</option>
                  {tmbOptions.map(t => <option key={t} value={t}>{tmbNames[t] || `ตำบล ${t}`}</option>)}
                </select>
                <select value={selectedMoo} onChange={e => setSelectedMoo(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">ทุกหมู่บ้าน</option>
                  {mooOptions.map(m => <option key={m} value={m}>หมู่ {m}</option>)}
                </select>
              </div>
            </div>

            {/* Place layers */}
            <div className="pt-2">
              <p className="text-xs font-black text-slate-400 mb-3 tracking-widest uppercase flex items-center gap-1"><Layers size={11} /> Layer สถานที่สำคัญ</p>
              <div className="space-y-1">
                {Object.entries(TYPE_LABELS).map(([t, l]) => (
                  <label key={t} className="flex items-center gap-3 py-1 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                    <div onClick={(e) => { e.preventDefault(); toggleLayer(t); }} className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 relative ${activeLayers.has(t) ? 'bg-blue-500' : 'bg-slate-200 group-hover:bg-slate-300'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full shadow absolute top-0.5 transition-all ${activeLayers.has(t) ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <img src={TYPE_ICONS[t]} alt="" className="w-5 h-5 object-contain opacity-90 group-hover:opacity-100" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">{l}</span>
                  </label>
                ))}
              </div>

              {/* Heatmap toggle */}
              <label className="flex items-center gap-3 py-1.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer mt-2 transition-colors group">
                <div onClick={(e) => { e.preventDefault(); setShowHeatmap(!showHeatmap); }} className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 relative ${showHeatmap ? 'bg-red-500' : 'bg-slate-200 group-hover:bg-slate-300'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full shadow absolute top-0.5 transition-all ${showHeatmap ? 'left-4' : 'left-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">🌡️ Hotspot Heatmap</span>
              </label>
            </div>

            {/* Placeholder to make bottom pad */}
            <div className="h-6"></div>
          </div>
          
          <div className="p-4 bg-white border-t border-slate-100 mt-auto">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]">
              <Search size={18} /> ค้นหาพิกัด
            </button>
          </div>
        </div>

        {/* ── Map Area ───────────────────────────────────────────── */}
        <div className="flex-1 relative bg-slate-100 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 z-[1000] bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-blue-900 font-bold tracking-wider">กำลังโหลดข้อมูลแผนที่...</p>
            </div>
          )}
          
          <div ref={mapRef} className="absolute inset-0 z-0" />

          {/* Legend */}
          <div className="absolute bottom-6 left-6 z-[400] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-3 shadow-lg w-44">
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">สัญลักษณ์ผู้ป่วย</p>
            {([
              ['/y_r.png', '/x_r.png', 'สีแดง (วิกฤต)'],
              ['/y_o.png', '/x_o.png', 'สีส้ม (เฝ้าระวังสูง)'],
              ['/y_y.png', '/x_y.png', 'สีเหลือง (เฝ้าระวัง)'],
              ['/y_g.png', '/x_g.png', 'สีเขียว (ปกติ)'],
            ] as const).map(([m, f, label]) => (
              <div key={label} className="flex items-center gap-2 mb-2 last:mb-0">
                <img src={m} alt="" className="w-5 h-5 object-contain" title="ชาย" />
                <img src={f} alt="" className="w-5 h-5 object-contain" title="หญิง" />
                <span className="text-xs font-medium text-slate-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Floating Search Bar */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] w-full max-w-lg px-4 pointer-events-auto">
            <div className="bg-white rounded-full shadow-lg border border-slate-200 flex items-center px-4 py-3 gap-3 transition-shadow hover:shadow-xl focus-within:ring-2 focus-within:ring-blue-400">
              <Search className="text-slate-400 shrink-0" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหา HN, ชื่อผู้ป่วย, หรือหมู่บ้าน..." 
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 min-w-0"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* SafeBird Warning */}
          {stats.red >= 3 && !dismissedWarnings.has('red_cluster_1') && (
            <div className="absolute bottom-24 right-8 z-[500] w-[340px] animate-in slide-in-from-bottom-5 fade-in duration-500">
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-red-100 p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center shrink-0 border border-red-200 relative">
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    <Bot size={28} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-red-600 font-black text-xs tracking-wider mb-1">SAFEBIRD WARNING!</h3>
                    <p className="text-slate-600 text-sm font-medium leading-snug">
                      พบ Cluster <b>เคสสีแดง {stats.red} ราย</b> ในรัศมี 300 เมตร บริเวณชุมชน รพ.สต.หนองสาหร่าย แนะนำประสานฝ่ายปกครองทันที
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm active:scale-95 text-center">
                    แจ้งฝ่ายปกครอง
                  </button>
                  <button onClick={() => setDismissedWarnings(prev => new Set([...prev, 'red_cluster_1']))} className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors">
                    ปิด
                  </button>
                </div>
              </div>
              
              {/* Tooltip arrow */}
              <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-b border-r border-red-100 rotate-45 transform origin-center translate-y-px z-[-1]"></div>
            </div>
          )}

          {/* Chatbot Icon */}
          <button className="absolute bottom-6 right-6 z-[500] w-14 h-14 bg-gradient-to-tr from-blue-700 to-indigo-500 rounded-2xl shadow-lg flex items-center justify-center hover:scale-110 hover:shadow-xl transition-all active:scale-95 group border border-blue-400/50">
            <Bot size={28} className="text-white group-hover:animate-bounce" />
            {stats.red >= 3 && !dismissedWarnings.has('red_cluster_1') && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default SpotMap;
