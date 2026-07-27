/**
 * Smart Notification — Push LINE Flex ให้ VHV ตามผู้ป่วยในพื้นที่
 * POST /api/send-notifications
 * Body: { secret: string }  ← ป้องกันไม่ให้ใครเรียกโดยพลการ
 */
import axios from 'axios';

const FASTAPI = 'https://safemind-ai.net/api';
const LIFF_ID = '2009105092-WldkRhqH';
const LIFF_BASE = `https://liff.line.me/${LIFF_ID}`;
const ROLE_VHV = 5;

// ──────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────
async function getMachineToken(): Promise<string> {
  const res = await axios.post(
    `${FASTAPI}/token`,
    new URLSearchParams({ username: 'admin99', password: 'admin99' }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data.access_token;
}

function isHighOrSevere(smiv: string | null | undefined): boolean {
  const t = String(smiv ?? '').toLowerCase();
  return t.includes('สีแดง') || t.includes('high') || t.includes('severe') || t.includes('สูง') || t.includes('รุนแรง');
}

function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function toIsoDate(d: Date) { return d.toISOString().slice(0, 10); }

function mapsUrl(lat: string | null, lng: string | null, label: string): string {
  if (lat && lng) return `https://maps.google.com/?q=${lat},${lng}`;
  return `https://maps.google.com/?q=${encodeURIComponent(label)}`;
}

// ──────────────────────────────────────────────
// Flex builders
// ──────────────────────────────────────────────
function buildHighRiskFlex(p: {
  name: string; hn: string; moopart: string | null; tmbpart: string | null;
  smiv: string | null; days: number | null; phone: string | null;
  lat: string | null; lng: string | null;
}) {
  const address = [p.moopart ? `หมู่ ${p.moopart}` : null, p.tmbpart ? `ต.${p.tmbpart}` : null]
    .filter(Boolean).join(' ') || 'ไม่ระบุ';
  const statusText = p.days != null && p.days > 0
    ? `ไม่ได้ติดตามมาแล้ว ${p.days} วัน`
    : 'ยังไม่เคยมีการติดตาม';
  const navUrl = mapsUrl(p.lat, p.lng, address);
  const recordUrl = `${LIFF_BASE}/save`;

  return {
    type: 'flex',
    altText: `⚠️ [High Risk] ${p.name} — ${statusText}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#B91C1C', paddingAll: '14px',
        contents: [
          {
            type: 'box', layout: 'horizontal',
            contents: [
              { type: 'text', text: '🔴 SafeMind', color: '#FCA5A5', size: 'xs', weight: 'bold', flex: 1 },
              { type: 'text', text: 'High Risk', color: '#FEE2E2', size: 'xs', align: 'end' },
            ],
          },
          { type: 'text', text: '🚨 แจ้งเตือน: เคสกลุ่มเสี่ยงสูง (High Risk)', color: '#FFFFFF', weight: 'bold', size: 'sm', margin: 'sm', wrap: true },
          { type: 'text', text: 'คนไข้กลุ่มเสี่ยงสูงในความดูแลของท่าน เกินกำหนดการเร่งด่วน', color: '#FECACA', size: 'xs', margin: 'xs', wrap: true },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '14px',
        contents: [
          { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
            { type: 'text', text: '👤 ชื่อ-สกุล:', size: 'xs', color: '#64748B', flex: 2 },
            { type: 'text', text: p.name, size: 'xs', weight: 'bold', color: '#1E293B', flex: 3, wrap: true },
          ]},
          { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
            { type: 'text', text: '🏷️ เลข HN:', size: 'xs', color: '#64748B', flex: 2 },
            { type: 'text', text: p.hn, size: 'xs', color: '#1E293B', flex: 3 },
          ]},
          { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
            { type: 'text', text: '📍 พักที่:', size: 'xs', color: '#64748B', flex: 2 },
            { type: 'text', text: address, size: 'xs', color: '#1E293B', flex: 3, wrap: true },
          ]},
          { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
            { type: 'text', text: '🔴 สถานะ:', size: 'xs', color: '#64748B', flex: 2 },
            { type: 'text', text: statusText, size: 'xs', color: '#DC2626', weight: 'bold', flex: 3, wrap: true },
          ]},
          ...(p.phone ? [{
            type: 'box' as const, layout: 'horizontal' as const, spacing: 'sm' as const, contents: [
              { type: 'text' as const, text: '📞 โทรศัพท์:', size: 'xs' as const, color: '#64748B', flex: 2 },
              { type: 'text' as const, text: p.phone, size: 'xs' as const, color: '#1E293B', flex: 3 },
            ],
          }] : []),
          { type: 'separator', margin: 'sm' },
          { type: 'text', text: '*โปรดลงพื้นที่ติดตามเยี่ยมบ้านและประเมินอาการโดยด่วน', size: 'xxs', color: '#DC2626', wrap: true, margin: 'sm' },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '12px',
        contents: [
          ...(p.phone ? [{
            type: 'button' as const, style: 'secondary' as const, height: 'sm' as const,
            action: { type: 'uri' as const, label: '📞 โทรติดต่อผู้ป่วย/ญาติ', uri: `tel:${p.phone.replace(/[^0-9]/g, '')}` },
          }] : []),
          {
            type: 'button', style: 'secondary', height: 'sm',
            action: { type: 'uri', label: '🗺️ นำทางลงพื้นที่เยี่ยมบ้าน', uri: navUrl },
            margin: 'sm',
          },
          {
            type: 'button', style: 'primary', color: '#1D4ED8', height: 'sm',
            action: { type: 'uri', label: '✅ บันทึกข้อมูลติดตาม', uri: recordUrl },
            margin: 'sm',
          },
        ],
      },
    },
  };
}

function buildMissedFlex(p: {
  name: string; hn: string; moopart: string | null; tmbpart: string | null;
  missedDays: number | null; phone: string | null;
  lat: string | null; lng: string | null;
}) {
  const address = [p.moopart ? `หมู่ ${p.moopart}` : null, p.tmbpart ? `ต.${p.tmbpart}` : null]
    .filter(Boolean).join(' ') || 'ไม่ระบุ';
  const missedText = p.missedDays != null && p.missedDays > 0
    ? `ขาดนัดเกิน ${p.missedDays} วัน`
    : 'ขาดนัดคลินิก';
  const navUrl = mapsUrl(p.lat, p.lng, address);
  const recordUrl = `${LIFF_BASE}/save`;

  return {
    type: 'flex',
    altText: `⚠️ [ขาดนัด] ${p.name} — ${missedText}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#B45309', paddingAll: '14px',
        contents: [
          {
            type: 'box', layout: 'horizontal',
            contents: [
              { type: 'text', text: '🟠 SafeMind', color: '#FDE68A', size: 'xs', weight: 'bold', flex: 1 },
              { type: 'text', text: 'ขาดนัด', color: '#FEF3C7', size: 'xs', align: 'end' },
            ],
          },
          { type: 'text', text: '⚠️ แจ้งเตือน: ผู้ป่วยขาดนัดคลินิก / ขาดนัดรับยา', color: '#FFFFFF', weight: 'bold', size: 'sm', margin: 'sm', wrap: true },
          { type: 'text', text: 'คนไข้ในความดูแลของท่าน เกินกำหนดติดตามในระบบ', color: '#FDE68A', size: 'xs', margin: 'xs', wrap: true },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '14px',
        contents: [
          { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
            { type: 'text', text: '👤 ชื่อ-สกุล:', size: 'xs', color: '#64748B', flex: 2 },
            { type: 'text', text: p.name, size: 'xs', weight: 'bold', color: '#1E293B', flex: 3, wrap: true },
          ]},
          { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
            { type: 'text', text: '🏷️ เลข HN:', size: 'xs', color: '#64748B', flex: 2 },
            { type: 'text', text: p.hn, size: 'xs', color: '#1E293B', flex: 3 },
          ]},
          { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
            { type: 'text', text: '📍 พักที่:', size: 'xs', color: '#64748B', flex: 2 },
            { type: 'text', text: address, size: 'xs', color: '#1E293B', flex: 3, wrap: true },
          ]},
          { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
            { type: 'text', text: '⚠️ สถานะ:', size: 'xs', color: '#64748B', flex: 2 },
            { type: 'text', text: missedText, size: 'xs', color: '#D97706', weight: 'bold', flex: 3, wrap: true },
          ]},
          ...(p.phone ? [{
            type: 'box' as const, layout: 'horizontal' as const, spacing: 'sm' as const, contents: [
              { type: 'text' as const, text: '📞 โทรศัพท์:', size: 'xs' as const, color: '#64748B', flex: 2 },
              { type: 'text' as const, text: p.phone, size: 'xs' as const, color: '#1E293B', flex: 3 },
            ],
          }] : []),
          { type: 'separator', margin: 'sm' },
          { type: 'text', text: '*โปรดติดต่อสอบถามหรือติดตามผู้ป่วยเพื่อรับยาตามกำหนด', size: 'xxs', color: '#D97706', wrap: true, margin: 'sm' },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '12px',
        contents: [
          ...(p.phone ? [{
            type: 'button' as const, style: 'secondary' as const, height: 'sm' as const,
            action: { type: 'uri' as const, label: '📞 โทรติดต่อผู้ป่วย/ญาติ', uri: `tel:${p.phone.replace(/[^0-9]/g, '')}` },
          }] : []),
          {
            type: 'button', style: 'secondary', height: 'sm',
            action: { type: 'uri', label: '🗺️ นำทางลงพื้นที่เยี่ยมบ้าน', uri: navUrl },
            margin: 'sm',
          },
          {
            type: 'button', style: 'primary', color: '#1D4ED8', height: 'sm',
            action: { type: 'uri', label: '✅ บันทึกข้อมูลติดตาม', uri: recordUrl },
            margin: 'sm',
          },
        ],
      },
    },
  };
}

// ──────────────────────────────────────────────
// main handler
// ──────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // Basic auth guard
  const secret = req.body?.secret ?? req.headers['x-notify-secret'];
  if (secret !== process.env.NOTIFY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isDebug = req.body?.debug === true;
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineToken) return res.status(500).json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not set' });

  try {
    const token = await getMachineToken();
    const authHeader = { Authorization: `Bearer ${token}` };

    // 1. ดึง users ทุก role ที่มี line_user_id จริง (VHV = role 5, แต่ดึงทุก role ก่อนกรอง)
    const usersRes = await axios.get(`${FASTAPI}/users?limit=500`, { headers: authHeader });
    const allUsers: any[] = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.items ?? []);
    const isRealLineId = (id: string) =>
      typeof id === 'string' && id.length >= 10 && !id.startsWith('UNLINKED');
    // กรองเฉพาะ VHV (role_id=5) ที่มี LINE จริง
    const vhvUsers = allUsers.filter((u: any) =>
      u.line_user_id && u.is_active && isRealLineId(u.line_user_id) && u.role_id === ROLE_VHV
    );

    if (vhvUsers.length === 0) {
      const withRealLine = allUsers.filter((u: any) => u.line_user_id && isRealLineId(u.line_user_id));
      return res.status(200).json({
        success: true,
        message: 'No active VHV users with LINE',
        total_users: allUsers.length,
        users_with_real_line: withRealLine.map((u: any) => ({
          name: u.full_name ?? u.username,
          role_id: u.role_id,
          is_active: u.is_active,
          line_user_id: u.line_user_id?.slice(0, 8) + '...',
        })),
      });
    }

    // 2. ดึง High Risk patients
    const PAGE = 500;
    const vRes = await axios.get(`${FASTAPI}/v-patients?limit=${PAGE}`, { headers: authHeader });
    const allVPatients: any[] = vRes.data?.items ?? (Array.isArray(vRes.data) ? vRes.data : []);
    const today = Date.now();
    const highRiskPatients = allVPatients.filter((p: any) => {
      if (!isHighOrSevere(p.smiv_result)) return false;
      if (!p.follow_up_date) return true;
      const d = new Date(p.follow_up_date);
      return isNaN(d.getTime()) || d.getTime() < today;
    });

    // 3. ดึง Missed Appointment patients (90 วันย้อนหลัง)
    const MISSED_BASE = process.env.MISSED_APPT_BASE_URL ?? 'http://58.64.14.151/api/v2/public/index.php/api/v1';
    const MISSED_KEY  = process.env.MISSED_APPT_API_KEY ?? '';
    const missedHeaders = MISSED_KEY ? { Authorization: `Bearer ${MISSED_KEY}` } : {};
    const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - 90);
    const missedRes = await axios.get(
      `${MISSED_BASE}/missed_appointment?nextdate_from=${toIsoDate(fromDate)}&nextdate_to=${toIsoDate(new Date())}&per_page=${PAGE}&page=1`,
      { headers: missedHeaders }
    ).catch(() => null);
    const missedRaw = missedRes?.data;
    const missedPatients: any[] = Array.isArray(missedRaw)
      ? missedRaw
      : (missedRaw?.data ?? missedRaw?.items ?? []);

    if (isDebug) {
      return res.status(200).json({
        debug: true,
        vhv_count: vhvUsers.length,
        vhv_sample: vhvUsers.slice(0, 3).map((u: any) => ({
          name: u.full_name, line_user_id: !!u.line_user_id, moopart: u.moopart, tmbpart: u.tmbpart,
        })),
        total_vpatients: allVPatients.length,
        high_risk_count: highRiskPatients.length,
        high_risk_sample: highRiskPatients.slice(0, 3).map((p: any) => ({
          hn: p.hn, name: p.pt_name, smiv: p.smiv_result, moopart: p.moopart, tmbpart: p.tmbpart,
        })),
        missed_count: missedPatients.length,
        missed_api_status: missedRes?.status ?? 'failed',
        missed_sample: missedPatients.slice(0, 2).map((p: any) => ({ hn: p.hn, name: p.patient_name, moopart: p.moopart, days: p.missed_days })),
        vpatient_smiv_values: [...new Set(allVPatients.slice(0, 50).map((p: any) => p.smiv_result))],
      });
    }

    // 4. ส่ง notification ทีละ VHV
    const lineHeaders = { Authorization: `Bearer ${lineToken}`, 'Content-Type': 'application/json' };
    const results: any[] = [];

    for (const vhv of vhvUsers) {
      const lineUserId: string = vhv.line_user_id;
      const vhvMoo: string | null = vhv.moopart ?? null;
      const vhvTmb: string | null = vhv.tmbpart ?? null;

      // กรอง patients ตาม moopart/tmbpart ของ VHV (trim spaces ก่อน compare)
      // test=true → ส่งทุกเคสให้ทุก VHV (ใช้ทดสอบ)
      const isTest = req.body?.test === true;
      const moo = vhvMoo?.trim() ?? null;
      const tmb = vhvTmb?.trim() ?? null;
      const myHighRisk = (moo && !isTest)
        ? highRiskPatients.filter((p: any) => p.moopart?.trim() === moo && (!tmb || p.tmbpart?.trim() === tmb))
        : highRiskPatients;
      const myMissed = (moo && !isTest)
        ? missedPatients.filter((p: any) => p.moopart?.trim() === moo && (!tmb || p.tmbpart?.trim() === tmb))
        : missedPatients;

      if (myHighRisk.length === 0 && myMissed.length === 0) continue;

      // ดึง address + phone สำหรับแต่ละ patient (parallel, best-effort)
      const buildMessages = async (patients: any[], type: 'high-risk' | 'missed') => {
        return Promise.all(patients.map(async (p: any) => {
          const hn: string = p.hn;

          // ดึง lat/lng จาก patient-address
          const addrRes = await axios.get(`${FASTAPI}/patient-address/hn/${encodeURIComponent(hn)}`, { headers: authHeader })
            .catch(() => null);
          const addrList: any[] = addrRes?.data?.items ?? (Array.isArray(addrRes?.data) ? addrRes?.data : []);
          const addr = addrList.sort((a: any, b: any) => b.address_id - a.address_id)[0] ?? null;
          const lat: string | null = addr?.latitude ?? null;
          const lng: string | null = addr?.longitude ?? null;

          // ดึง phone จาก patient data
          const patRes = await axios.get(`${FASTAPI}/patients/${encodeURIComponent(hn)}`, { headers: authHeader })
            .catch(() => null);
          const phone: string | null = patRes?.data?.hometel ?? null;

          if (type === 'high-risk') {
            return buildHighRiskFlex({
              name: p.pt_name ?? p.name ?? hn,
              hn,
              moopart: p.moopart ?? addr?.moopart ?? null,
              tmbpart: p.tmbpart ?? addr?.tmbpart ?? null,
              smiv: p.smiv_result,
              days: daysSince(p.follow_up_date),
              phone,
              lat,
              lng,
            });
          } else {
            return buildMissedFlex({
              name: p.patient_name ?? p.pt_name ?? hn,
              hn,
              moopart: p.moopart ?? addr?.moopart ?? null,
              tmbpart: p.tmbpart ?? addr?.tmbpart ?? null,
              missedDays: p.missed_days ?? null,
              phone,
              lat,
              lng,
            });
          }
        }));
      };

      const highRiskMsgs = await buildMessages(myHighRisk, 'high-risk');
      const missedMsgs = await buildMessages(myMissed, 'missed');
      const allMessages = [...highRiskMsgs, ...missedMsgs];

      // LINE push สูงสุด 5 messages ต่อครั้ง
      for (let i = 0; i < allMessages.length; i += 5) {
        const batch = allMessages.slice(i, i + 5);
        await axios.post(
          'https://api.line.me/v2/bot/message/push',
          { to: lineUserId, messages: batch },
          { headers: lineHeaders }
        ).catch((e: any) => {
          results.push({ lineUserId, error: e.response?.data ?? e.message });
        });
      }

      results.push({ lineUserId, vhv_name: vhv.full_name, high_risk: myHighRisk.length, missed: myMissed.length });
    }

    return res.status(200).json({
      success: true,
      vhv_count: vhvUsers.length,
      results,
    });
  } catch (err: any) {
    console.error('send-notifications error:', err.response?.data ?? err.message);
    return res.status(500).json({ error: err.response?.data ?? err.message });
  }
}
