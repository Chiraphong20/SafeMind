/**
 * Cron: ตรวจสอบผู้ป่วยขาดนัด (>7 วัน) และ สีแดง+ไม่มีบันทึกเยี่ยมบ้าน อัตโนมัติ แล้วส่ง LINE
 * ผ่าน endpoint /api/notify-smiv เดิม (เกณฑ์เดียวกับที่ /line-notify ใน sm_FontEnd ใช้ทุกประการ)
 *
 * Trigger: Vercel Cron (ดู vercel.json "crons") — ป้องกันด้วย CRON_SECRET
 * (Vercel จะแนบ Authorization: Bearer <CRON_SECRET> มาเองถ้าตั้งค่า env var นี้ไว้)
 *
 * ปุ่ม "ส่ง"/"ส่งทั้งหมด" ใน /line-notify ยังใช้งานได้ตามปกติ — endpoint นี้เป็นแค่ตัวเรียกอัตโนมัติเพิ่มเติม
 */
import axios from 'axios';

const FASTAPI_BASE = 'https://safemind-ai.net/api';
const NOTIFY_URL = 'https://safe-mind-eight.vercel.app/api/notify-smiv';
const MISSED_BASE = process.env.MISSED_APPT_BASE_URL ?? 'http://58.64.14.151/api/v2/public/index.php/api/v1';
const MISSED_KEY = process.env.MISSED_APPT_API_KEY ?? '';
const missedHeaders = MISSED_KEY ? { Authorization: `Bearer ${MISSED_KEY}` } : {};
const ROLE_HOSPITAL = 6;

interface HealthCenter {
  id: number;
  addressid?: string | null;
  hospital_name?: string | null;
  village_list?: number[] | null;
}

/** เหมือน src/lib/findHospitalForPatient.ts ใน sm_FontEnd เป๊ะ — จับคู่ รพ.สต. จากตำบล+หมู่บ้าน */
function findHospitalForPatient(
  p: { tmbpart?: string | null; moopart?: string | null },
  centers: HealthCenter[]
): HealthCenter | null {
  const ptTmb = (p.tmbpart ?? '').trim().padStart(2, '0');
  const ptMoo = parseInt(p.moopart ?? '0', 10);
  const inTambon = centers.filter((hc) => hc.addressid && String(hc.addressid).slice(4, 6) === ptTmb);
  if (inTambon.length === 0) return null;
  const exact = inTambon.find((hc) => {
    const villages = Array.isArray(hc.village_list) ? hc.village_list : [];
    return villages.length > 0 && villages.includes(ptMoo);
  });
  return (
    exact
    ?? (inTambon.length === 1 ? inTambon[0] : undefined)
    ?? inTambon.find((hc) => !Array.isArray(hc.village_list) || hc.village_list.length === 0)
    ?? inTambon[0]
    ?? null
  );
}

function isRedRisk(smiv: string | null | undefined): boolean {
  return (smiv ?? '').includes('สีแดง');
}

function normalizeHn(hn: string): string {
  return String(parseInt(hn, 10) || hn).trim();
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** ดึงทุกหน้าจาก endpoint ที่คืน { total, items } */
async function fetchAllPages<T>(
  fetchPage: (skip: number, limit: number) => Promise<{ total: number; items: T[] }>
): Promise<T[]> {
  const PAGE = 500;
  const first = await fetchPage(0, PAGE);
  const total = first.total ?? first.items.length;
  let all = first.items ?? [];
  if (total > PAGE) {
    const rest = await Promise.all(
      Array.from({ length: Math.ceil((total - PAGE) / PAGE) }, (_, i) =>
        fetchPage((i + 1) * PAGE, PAGE).then((r) => r.items ?? [])
      )
    );
    all = [...all, ...rest.flat()];
  }
  return all;
}

function extractMissedRows(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.items)) return r.items;
  }
  return [];
}

/**
 * เซิร์ฟเวอร์ PNNH ค่อนข้างช้า/ไม่เสถียร — ยิงซ้ำหน้าเดิมสองครั้งอาจได้คนละผลลัพธ์กัน
 * (บางคนหาย บางคนซ้ำข้ามหน้า) retry ก่อนค่อยยอมแพ้ต่อหน้า ลดโอกาสตกหล่น
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 800): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  throw lastErr;
}

/**
 * ดึง smi-v-missed-appointment ทุกหน้า — endpoint นี้ cap per_page ไว้ที่ 100 เสมอ
 * ไม่ว่าจะขอ per_page เท่าไหร่ก็ตาม (ต่างจาก endpoint ของเราเองที่ /v-patients ฯลฯ)
 * ถ้าไม่วน page ให้ครบจะได้ข้อมูลแค่หน้าแรก ตกหล่นคนที่เหลือ (สาเหตุที่นับจำนวนไม่ตรงกับแอป)
 */
async function fetchAllMissedAppointments(params: Record<string, string | number>): Promise<any[]> {
  const base = { ...params, per_page: 100 };
  const fetchPage = (page: number) =>
    axios
      .get(`${MISSED_BASE}/smi-v-missed-appointment`, { headers: missedHeaders, params: { ...base, page } })
      .then((r) => r.data);

  const first = await withRetry(() => fetchPage(1));
  const all = extractMissedRows(first);
  const totalPages = (first as any)?.meta?.total_pages ?? 1;
  if (totalPages <= 1) return all;

  const PAGE_BATCH = 20;
  for (let start = 2; start <= totalPages; start += PAGE_BATCH) {
    const pages = Array.from({ length: Math.min(PAGE_BATCH, totalPages - start + 1) }, (_, i) => start + i);
    const results = await Promise.all(
      pages.map((p) =>
        withRetry(() => fetchPage(p)).then(extractMissedRows).catch((err) => {
          console.warn(`smi-v-missed-appointment: page ${p} failed after retries`, err.message);
          return [] as any[];
        })
      )
    );
    results.forEach((rows) => all.push(...rows));
  }
  return all;
}

export default async function handler(req: any, res: any) {
  // ป้องกันไม่ให้ใครเรียก endpoint นี้ได้นอกจาก Vercel Cron
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // machine token
    const tokenRes = await axios.post(
      `${FASTAPI_BASE}/token`,
      new URLSearchParams({ username: 'admin99', password: 'admin99' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const apiHeaders = { Authorization: `Bearer ${tokenRes.data.access_token}` };

    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [allVPatients, allSummary, centersRes, missedRows, visitedItems, pendingRes] = await Promise.all([
      fetchAllPages<any>((skip, limit) =>
        axios.get(`${FASTAPI_BASE}/v-patients`, { headers: apiHeaders, params: { skip, limit } }).then((r) => r.data)
      ),
      fetchAllPages<any>((skip, limit) =>
        axios.get(`${FASTAPI_BASE}/v-patient-summary`, { headers: apiHeaders, params: { skip, limit } }).then((r) => r.data)
      ),
      axios.get(`${FASTAPI_BASE}/health-centers`, { headers: apiHeaders, params: { limit: 500 } }),
      fetchAllMissedAppointments({
        nextdate_from: toIsoDate(oneMonthAgo),
        nextdate_to: toIsoDate(today),
        missed_days_min: 8,
      }),
      fetchAllPages<any>((skip, limit) =>
        axios.get(`${FASTAPI_BASE}/visit-followup-views`, { headers: apiHeaders, params: { skip, limit } })
          .then((r) => {
            const raw = r.data;
            const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
            const total = Array.isArray(raw) ? items.length : (raw?.total ?? items.length);
            return { items, total };
          })
      ),
      axios.get(`${FASTAPI_BASE}/patient-follow`, { headers: apiHeaders, params: { follow_status: 'pending', limit: 500 } }),
    ]);

    const centers: HealthCenter[] = centersRes.data?.items ?? [];
    const visitedHns = new Set<string>(visitedItems.map((v: any) => v.patient_hn).filter(Boolean));
    const pendingHns = new Set<string>((pendingRes.data?.items ?? []).map((f: any) => f.hn).filter(Boolean));
    const ourHns = new Set<string>(
      allSummary.filter((s: any) => s.result).map((s: any) => normalizeHn(s.hn))
    );

    const vPatientMap = new Map<string, any>();
    allVPatients.forEach((p: any) => vPatientMap.set(p.hn, p));

    const resolveHcId = (hn: string): number | undefined => {
      const pt = vPatientMap.get(hn);
      if (!pt) return undefined;
      return findHospitalForPatient(pt, centers)?.id;
    };

    // ── สีแดง + ยังไม่มีบันทึกเยี่ยมบ้าน + ยังไม่มีใครรับเคสไปแล้ว (เหมือน PatientCheckHighRiskPage/Spotmap) ──
    const highRiskPatients = allVPatients
      .filter((p: any) => isRedRisk(p.smiv_result) && !visitedHns.has(p.hn) && !pendingHns.has(p.hn))
      .map((p: any) => ({
        hn: p.hn,
        pt_name: p.pt_name ?? '(ไม่ระบุ)',
        result: p.smiv_result,
        tmbpart: p.tmbpart ?? undefined,
        amppart: p.amppart ?? undefined,
        chwpart: p.chwpart ?? undefined,
        moopart: p.moopart ?? undefined,
        phone: p.informtel ?? undefined,
        health_center_id: resolveHcId(p.hn),
      }));

    // ── ขาดนัด >7 วัน + อยู่ในทะเบียน SMI-V (เหมือน PatientCheckMissedPage/line-notify) ──
    const missedByHn = new Map<string, any>();
    missedRows.forEach((row: any) => {
      const key = normalizeHn(row.hn);
      if (!ourHns.has(key)) return;
      if ((row.missed_days ?? 0) <= 7) return;
      const existing = missedByHn.get(key);
      if (!existing || (row.missed_days ?? 0) > (existing.missed_days ?? 0)) {
        missedByHn.set(key, row);
      }
    });
    const missedPatients = Array.from(missedByHn.values()).map((row) => {
      const pt = vPatientMap.get(row.hn);
      return {
        hn: row.hn,
        pt_name: row.patient_name ?? pt?.pt_name ?? '(ไม่ระบุ)',
        tmbpart: pt?.tmbpart ?? undefined,
        amppart: pt?.amppart ?? undefined,
        chwpart: pt?.chwpart ?? undefined,
        moopart: pt?.moopart ?? undefined,
        phone: pt?.informtel ?? undefined,
        missed_days: row.missed_days ?? undefined,
        health_center_id: resolveHcId(row.hn),
      };
    });

    const results: { type: string; push_count?: number; error?: string }[] = [];

    if (highRiskPatients.length > 0) {
      try {
        const r = await axios.post(NOTIFY_URL, { type: 'high-risk', target_role: ROLE_HOSPITAL, patients: highRiskPatients });
        results.push({ type: 'high-risk', push_count: r.data?.push_count });
      } catch (err: any) {
        results.push({ type: 'high-risk', error: err.response?.data?.error ?? err.message });
      }
    }

    if (missedPatients.length > 0) {
      try {
        const r = await axios.post(NOTIFY_URL, { type: 'missed-appointment', target_role: ROLE_HOSPITAL, patients: missedPatients });
        results.push({ type: 'missed-appointment', push_count: r.data?.push_count });
      } catch (err: any) {
        results.push({ type: 'missed-appointment', error: err.response?.data?.error ?? err.message });
      }
    }

    return res.status(200).json({
      success: true,
      high_risk_count: highRiskPatients.length,
      missed_count: missedPatients.length,
      results,
    });
  } catch (error: any) {
    console.error('cron/notify-smiv error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
