import axios from 'axios';

const FASTAPI_BASE = "https://safemind-ai.net/api";
const LIFF_ID = '2009105092-WldkRhqH';
const liffBase = `https://liff.line.me/${LIFF_ID}`;

type UserInfo = {
  full_name: string;
  station_name: string | null;
  moopart: string | null;
  tmbpart: string | null;
  addressid: string | null;
  role_id: number | null;
};

// ดึงข้อมูล user จาก line_user_id ด้วย machine token
async function getUserByLineId(lineUserId: string): Promise<(UserInfo & { health_center_name: string | null }) | null> {
  try {
    const tokenRes = await axios.post(
      `${FASTAPI_BASE}/token`,
      new URLSearchParams({ username: 'admin99', password: 'admin99' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const jwt: string = tokenRes.data.access_token;
    const authHeader = { Authorization: `Bearer ${jwt}` };

    // fetch users ทั้งหมดแล้ว filter ด้วย line_user_id
    let u: any = null;
    const r = await axios.get(`${FASTAPI_BASE}/users`, {
      headers: authHeader,
      params: { limit: 500 },
    });
    const list: any[] = Array.isArray(r.data) ? r.data : (r.data?.items ?? r.data?.data ?? []);
    u = list.find((item: any) => item.line_user_id === lineUserId) ?? null;
    if (!u) console.warn(`[getUserByLineId] no user matched line_user_id=${lineUserId} (total fetched: ${list.length})`);

    if (!u) return null;
    return {
      full_name: u.full_name ?? u.name ?? u.username ?? 'เจ้าหน้าที่',
      health_center_name: u.health_center_name ?? u.health_center?.name ?? null,
      station_name: u.station_name ?? u.hospital_name ?? null,
      moopart: u.moopart ?? null,
      tmbpart: u.tmbpart ?? null,
      addressid: u.addressid ?? null,
      role_id: u.role_id ?? null,
    };
  } catch (err: any) {
    console.error('[getUserByLineId] unexpected error:', err.message);
    return null;
  }
}

// ดึงจำนวนเคส High Risk + ขาดนัด ตามพื้นที่ของ user
async function fetchCaseSummary(user: UserInfo): Promise<{ highRisk: number; missed: number }> {
  try {
    const tokenRes = await axios.post(
      `${FASTAPI_BASE}/token`,
      new URLSearchParams({ username: 'admin99', password: 'admin99' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const authHeader = { Authorization: `Bearer ${tokenRes.data.access_token}` };

    // ดึง v-patients (ผู้ป่วยที่มีข้อมูล SMI-V)
    const vRes = await axios.get(`${FASTAPI_BASE}/v-patients?limit=500`, { headers: authHeader })
      .catch(() => null);
    const allVPatients: any[] = vRes?.data?.items ?? (Array.isArray(vRes?.data) ? vRes?.data : []);

    // กรองตามพื้นที่ — VHV (role 5): ใช้ moopart+tmbpart, รพ.สต. (role 6+): ใช้ tmbpart
    const moo = user.moopart?.trim() ?? null;
    const tmb = user.tmbpart?.trim() ?? null;

    const areaPatients = allVPatients.filter((p: any) => {
      const pTmb = p.tmbpart?.trim() ?? null;
      const pMoo = p.moopart?.trim() ?? null;
      if (!tmb) return true; // ถ้าไม่มีพื้นที่ ให้แสดงทั้งหมด
      if (moo && user.role_id === 5) return pMoo === moo && pTmb === tmb;
      return pTmb === tmb;
    });

    const today = Date.now();
    const highRisk = areaPatients.filter((p: any) => {
      const smiv = String(p.smiv_result ?? '').toLowerCase();
      const isHigh = smiv.includes('สีแดง') || smiv.includes('high') || smiv.includes('สูง') || smiv.includes('รุนแรง');
      if (!isHigh) return false;
      if (!p.follow_up_date) return true;
      const d = new Date(p.follow_up_date);
      return isNaN(d.getTime()) || d.getTime() < today;
    }).length;

    // ดึงเคสขาดนัด
    const MISSED_BASE = process.env.MISSED_APPT_BASE_URL ?? 'http://58.64.14.151/api/v2/public/index.php/api/v1';
    const MISSED_KEY  = process.env.MISSED_APPT_API_KEY ?? '';
    const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - 90);
    const toDate = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const missedRes = await axios.get(
      `${MISSED_BASE}/missed_appointment?nextdate_from=${fmt(fromDate)}&nextdate_to=${fmt(toDate)}&per_page=500&page=1`,
      { headers: MISSED_KEY ? { Authorization: `Bearer ${MISSED_KEY}` } : {} }
    ).catch(() => null);
    const missedRaw = missedRes?.data;
    const allMissed: any[] = Array.isArray(missedRaw) ? missedRaw : (missedRaw?.data ?? missedRaw?.items ?? []);

    const missed = allMissed.filter((p: any) => {
      const pTmb = p.tmbpart?.trim() ?? null;
      const pMoo = p.moopart?.trim() ?? null;
      if (!tmb) return true;
      if (moo && user.role_id === 5) return pMoo === moo && pTmb === tmb;
      return pTmb === tmb;
    }).length;

    return { highRisk, missed };
  } catch {
    return { highRisk: 0, missed: 0 };
  }
}

// Flex สรุปภารกิจติดตามประจำวัน
function buildDailySummaryFlex(stationName: string, highRisk: number, missed: number) {
  const hasUrgent = highRisk > 0 || missed > 0;
  return {
    type: 'flex',
    altText: `สรุปภารกิจ: High Risk ${highRisk} ราย, ขาดนัด ${missed} ราย`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1a3d6b',
        paddingAll: '14px',
        contents: [
          {
            type: 'box', layout: 'horizontal',
            contents: [
              { type: 'text', text: '📋', size: 'sm', flex: 0 },
              { type: 'text', text: ' สรุปภารกิจติดตามประจำวัน', color: '#ffffff', weight: 'bold', size: 'sm', flex: 1 },
            ],
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '14px',
        spacing: 'sm',
        contents: [
          {
            type: 'text',
            text: `วันนี้ในเขตความรับผิดชอบของ ${stationName} มีเคสเร่งด่วนที่ค้างต้องติดตามดังนี้ครับ:`,
            wrap: true, size: 'sm', color: '#334155',
          },
          ...(highRisk > 0 ? [{
            type: 'text' as const,
            text: `🔴 1. เคสเสี่ยงสูง (High Risk): ${highRisk} ราย`,
            size: 'sm' as const, color: '#B91C1C', weight: 'bold' as const, wrap: true,
          }] : []),
          ...(missed > 0 ? [{
            type: 'text' as const,
            text: `📅 2. เคสขาดนัดคลินิก: ${missed} ราย`,
            size: 'sm' as const, color: '#92400e', weight: 'bold' as const, wrap: true,
          }] : []),
          ...(!hasUrgent ? [{
            type: 'text' as const,
            text: '✅ ไม่มีเคสเร่งด่วนค้างอยู่ในพื้นที่ครับ',
            size: 'sm' as const, color: '#16a34a',
          }] : []),
          {
            type: 'text',
            text: 'กรุณากดปุ่มด้านล่างเพื่อเลือกดูรายชื่อคนไข้และเริ่มลงบันทึกข้อมูลครับ',
            wrap: true, size: 'xs', color: '#64748b', margin: 'md',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        spacing: 'sm',
        contents: [
          {
            type: 'button', style: 'primary', color: '#1a3d6b', height: 'sm',
            action: { type: 'uri', label: '🔍 ดูรายชื่อเคสทั้งหมด', uri: `${liffBase}/patient-check` },
          },
          {
            type: 'button', style: 'secondary', height: 'sm',
            action: { type: 'uri', label: '📅 เคสขาดนัดคลินิก', uri: `${liffBase}/patient-check` },
          },
          {
            type: 'button', style: 'secondary', height: 'sm',
            action: { type: 'uri', label: '🏠 บันทึกการเยี่ยมบ้าน', uri: `${liffBase}/save` },
          },
        ],
      },
    },
  };
}

// สร้าง Flex Message ทักทายแบบ personalized
function buildWelcomeFlex(name: string, hcName: string | null) {
  const subtitle = hcName ? `สังกัด: ${hcName}` : 'ยินดีต้อนรับสู่ SafeMind';
  return {
    type: 'flex',
    altText: `สวัสดีครับ ${name} ยินดีต้อนรับสู่ SafeMind 💙`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0B3D6B',
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '🧠 SafeMind',
                color: '#7DD3FC',
                size: 'xs',
                weight: 'bold',
                flex: 1,
              },
              {
                type: 'text',
                text: '✅ ยืนยันตัวตนแล้ว',
                color: '#34D399',
                size: 'xs',
                align: 'end',
              },
            ],
          },
          {
            type: 'text',
            text: `สวัสดีครับ ${name}`,
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
            margin: 'sm',
          },
          {
            type: 'text',
            text: subtitle,
            color: '#93C5FD',
            size: 'sm',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '14px',
        contents: [
          {
            type: 'text',
            text: 'น้อง SafeMind ยินดีต้อนรับ! ระบบได้ยืนยันสิทธิ์ของท่านและเชื่อมข้อมูลเรียบร้อยแล้ว',
            wrap: true,
            size: 'sm',
            color: '#334155',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            backgroundColor: '#F0FFF4',
            cornerRadius: '8px',
            paddingAll: '10px',
            contents: [
              {
                type: 'text',
                text: '✅ บัญชีของท่านปลอดภัยและพร้อมใช้งาน ท่านสามารถกดปุ่มทำงานหรือเลือกเมนูด้านล่างได้ทันที',
                wrap: true,
                size: 'xs',
                color: '#047857',
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '12px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#0284C7',
            height: 'sm',
            action: {
              type: 'uri',
              label: '🚀 เริ่มต้นใช้งานระบบ SafeMind',
              uri: `${liffBase}/login`,
            },
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📖 คู่มือการใช้งานเบื้องต้น',
              uri: 'https://safemind-ai.net/help',
            },
            margin: 'sm',
          },
        ],
      },
    },
  };
}

// ─── บันทึกข้อมูล flow helpers ────────────────────────────────────────────────

// ดึง Machine token จาก FastAPI
async function getMachineToken(): Promise<string> {
  const r = await axios.post(
    `${FASTAPI_BASE}/token`,
    new URLSearchParams({ username: 'admin99', password: 'admin99' }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return r.data.access_token as string;
}

// ดึงรายชื่อเคสเร่งด่วน (High Risk + ขาดนัด) ตามพื้นที่ของ user
async function fetchUrgentPatients(user: UserInfo): Promise<Array<{
  hn: string; name: string; type: 'hr' | 'ms'; area: string;
}>> {
  try {
    const jwt = await getMachineToken();
    const authHeader = { Authorization: `Bearer ${jwt}` };
    const moo = user.moopart?.trim() ?? null;
    const tmb = user.tmbpart?.trim() ?? null;

    const areaMatch = (p: any) => {
      const pTmb = p.tmbpart?.trim() ?? null;
      const pMoo = p.moopart?.trim() ?? null;
      if (!tmb) return true;
      if (moo && user.role_id === 5) return pMoo === moo && pTmb === tmb;
      return pTmb === tmb;
    };

    // High Risk จาก v-patients
    const vRes = await axios.get(`${FASTAPI_BASE}/v-patients?limit=500`, { headers: authHeader }).catch(() => null);
    const allV: any[] = vRes?.data?.items ?? (Array.isArray(vRes?.data) ? vRes.data : []);
    const highRisk = allV.filter(areaMatch).filter((p: any) => {
      const s = String(p.smiv_result ?? '').toLowerCase();
      return s.includes('สีแดง') || s.includes('high') || s.includes('สูง') || s.includes('รุนแรง') || s.includes('severe');
    }).slice(0, 8).map((p: any) => ({
      hn: String(p.hn ?? ''),
      name: String(p.pt_name ?? p.name ?? 'ไม่ทราบชื่อ'),
      type: 'hr' as const,
      area: `หมู่ ${p.moopart ?? '-'}`,
    }));

    // ขาดนัด จาก missed appointment API
    const MISSED_BASE = process.env.MISSED_APPT_BASE_URL ?? 'http://58.64.14.151/api/v2/public/index.php/api/v1';
    const MISSED_KEY = process.env.MISSED_APPT_API_KEY ?? '';
    const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - 90);
    const toDate = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const missedRes = await axios.get(
      `${MISSED_BASE}/missed_appointment?nextdate_from=${fmt(fromDate)}&nextdate_to=${fmt(toDate)}&per_page=200&page=1`,
      { headers: MISSED_KEY ? { Authorization: `Bearer ${MISSED_KEY}` } : {} }
    ).catch(() => null);
    const rawMissed = missedRes?.data;
    const allMissed: any[] = Array.isArray(rawMissed) ? rawMissed : (rawMissed?.data ?? rawMissed?.items ?? []);
    const seenHns = new Set(highRisk.map(p => p.hn));
    const missed = allMissed.filter(areaMatch)
      .filter((p: any) => !seenHns.has(String(p.hn ?? '')))
      .slice(0, 6)
      .map((p: any) => ({
        hn: String(p.hn ?? ''),
        name: String(p.pt_name ?? p.patient_name ?? p.name ?? 'ไม่ทราบชื่อ'),
        type: 'ms' as const,
        area: `หมู่ ${p.moopart ?? '-'}`,
      }));

    return [...highRisk, ...missed].slice(0, 12); // LINE Carousel สูงสุด 12 bubbles
  } catch {
    return [];
  }
}

// สร้าง Flex Carousel แสดงรายชื่อผู้ป่วย
function buildPatientListFlex(
  patients: Array<{ hn: string; name: string; type: 'hr' | 'ms'; area: string }>
) {
  if (patients.length === 0) {
    return { type: 'text', text: '✅ ขณะนี้ไม่มีเคสเร่งด่วนที่ต้องติดตามในพื้นที่ของท่านครับ' };
  }

  const bubbles = patients.map(p => {
    const isHR = p.type === 'hr';
    const headerBg = isHR ? '#991B1B' : '#92400E';
    const typeLabel = isHR ? '🔴 High Risk' : '📅 ขาดนัด';
    // limit name to 15 chars to stay well under 300-byte postback limit
    const shortName = encodeURIComponent(p.name.slice(0, 15));
    const postbackData = `action=select_patient&hn=${p.hn}&nm=${shortName}&tp=${p.type}`;
    return {
      type: 'bubble',
      size: 'micro',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: headerBg, paddingAll: '8px',
        contents: [{ type: 'text', text: typeLabel, color: '#fff', size: 'xs', weight: 'bold' }],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '10px', spacing: 'xs',
        contents: [
          { type: 'text', text: p.name, size: 'sm', weight: 'bold', wrap: true, color: '#1e293b', maxLines: 2 },
          { type: 'text', text: `HN: ${p.hn}`, size: 'xxs', color: '#64748b' },
          { type: 'text', text: p.area, size: 'xxs', color: '#64748b', wrap: true },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '8px',
        contents: [{
          type: 'button', style: 'primary', color: headerBg, height: 'sm',
          action: {
            type: 'postback', label: 'เลือก',
            data: postbackData,
            displayText: `เลือก: ${p.name.slice(0, 20)}`,
          },
        }],
      },
    };
  });

  return {
    type: 'flex',
    altText: `เคสเร่งด่วน ${patients.length} ราย — กดเลือกรายชื่อเพื่อบันทึกข้อมูล`,
    contents: { type: 'carousel', contents: bubbles },
  };
}

// สร้าง Flex เมนูเลือกช่องทางบันทึกสำหรับผู้ป่วยที่เลือก
function buildPatientActionFlex(hn: string, name: string, caseType: string) {
  const isHR = caseType === 'hr';
  const typeLabel = isHR ? '🔴 เสี่ยงสูง' : '📅 ขาดนัด';
  return {
    type: 'flex',
    altText: `บันทึกข้อมูล: ${name}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#1a3d6b', paddingAll: '14px',
        contents: [
          { type: 'text', text: '📝 เลือกช่องทางบันทึก', color: '#ffffff', weight: 'bold', size: 'sm' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '14px', spacing: 'sm',
        contents: [
          { type: 'text', text: name, weight: 'bold', size: 'md', color: '#1e293b', wrap: true },
          { type: 'text', text: `HN: ${hn}  ·  ${typeLabel}`, size: 'xs', color: '#64748b' },
          { type: 'separator', margin: 'md' },
          {
            type: 'text', text: 'เลือกช่องทางบันทึกการติดตาม:', size: 'xs', color: '#475569',
            wrap: true, margin: 'md',
          },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px', spacing: 'sm',
        contents: [
          {
            type: 'button', style: 'primary', color: '#16a34a', height: 'sm',
            action: {
              type: 'postback', label: '✅ ติดตามเรียบร้อยแล้ว',
              data: `action=follow_done&hn=${hn}`,
              displayText: `✅ บันทึกว่าติดตาม ${name.slice(0, 15)} เรียบร้อยแล้ว`,
            },
          },
          {
            type: 'button', style: 'secondary', height: 'sm',
            action: {
              type: 'uri', label: '🧡 บันทึกผ่าน V-CARE',
              uri: 'https://vcare.jvkorat.go.th/smiv/login',
            },
          },
          {
            type: 'button', style: 'secondary', height: 'sm',
            action: {
              type: 'uri', label: '💙 บันทึกผ่าน SafeMind',
              uri: `${liffBase}/save?hn=${encodeURIComponent(hn)}`,
            },
          },
          {
            type: 'button', style: 'secondary', height: 'sm',
            action: {
              type: 'postback', label: '❌ ไม่ใช่เคสในเขต',
              data: `action=wrong_area&hn=${hn}`,
              displayText: `❌ แจ้งว่า ${name.slice(0, 15)} ไม่ใช่เคสในเขต`,
            },
          },
        ],
      },
    },
  };
}

// สร้าง Flex เลือกเหตุผลแจ้งข้อมูลผิดพลาด (4 ปุ่ม)
function buildReportErrorFlex(hn: string, name: string) {
  return {
    type: 'flex',
    altText: `⚠️ แจ้งปรับปรุงข้อมูลเคส ${name}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#dc2626', paddingAll: '14px',
        contents: [
          { type: 'text', text: '⚠️ แจ้งปรับปรุงข้อมูลเคส', color: '#ffffff', weight: 'bold', size: 'sm' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '14px', spacing: 'sm',
        contents: [
          { type: 'text', text: name, weight: 'bold', size: 'md', color: '#1e293b', wrap: true },
          { type: 'text', text: `HN: ${hn}`, size: 'xs', color: '#64748b' },
          { type: 'separator', margin: 'md' },
          {
            type: 'text', text: 'เลือกเหตุผลที่ต้องการแจ้ง:',
            size: 'xs', color: '#475569', wrap: true, margin: 'md',
          },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px', spacing: 'sm',
        contents: [
          {
            type: 'button', style: 'primary', color: '#dc2626', height: 'sm',
            action: {
              type: 'postback', label: '❌ ไม่ใช่คนไข้ในเขต',
              data: `action=report_reason&hn=${hn}&reason=wrong-jurisdiction`,
              displayText: 'แจ้ง: ไม่ใช่คนไข้ในเขตรับผิดชอบ',
            },
          },
          {
            type: 'button', style: 'secondary', height: 'sm',
            action: {
              type: 'postback', label: '🚗 ย้ายที่อยู่/ติดต่อไม่ได้',
              data: `action=report_reason&hn=${hn}&reason=unreachable`,
              displayText: 'แจ้ง: ผู้ป่วยย้ายที่อยู่หรือติดต่อไม่ได้',
            },
          },
          {
            type: 'button', style: 'secondary', height: 'sm',
            action: {
              type: 'postback', label: '📊 ข้อมูลอาการไม่ตรงความจริง',
              data: `action=report_reason&hn=${hn}&reason=inaccurate-status`,
              displayText: 'แจ้ง: ข้อมูลอาการ/สถานะไม่ตรงความจริง',
            },
          },
          {
            type: 'button', style: 'secondary', height: 'sm',
            action: {
              type: 'postback', label: '✏️ อื่นๆ (พิมพ์ระบุ)',
              data: `action=report_reason&hn=${hn}&reason=other`,
              displayText: 'แจ้ง: อื่นๆ (จะพิมพ์ระบุเหตุผล)',
            },
          },
        ],
      },
    },
  };
}

// บันทึก patient-follow ผ่าน Machine token
async function recordPatientFollow(hn: string, followStatus: string, remark: string): Promise<boolean> {
  try {
    const jwt = await getMachineToken();
    const today = new Date().toISOString().slice(0, 10);
    await axios.post(
      `${FASTAPI_BASE}/patient-follow`,
      { hn, follow_status: followStatus, follow_date: today, remark, created_date: today },
      { headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' } }
    );
    return true;
  } catch {
    return false;
  }
}

// ค้นหา record "รอข้อมูลเพิ่มเติม" ที่ฝากไว้สำหรับ LINE user นี้ (ใช้กับ reason=other)
async function findPendingOtherRecord(lineUserId: string): Promise<{ id: number; hn: string; rawRemark: string } | null> {
  try {
    const jwt = await getMachineToken();
    const r = await axios.get(`${FASTAPI_BASE}/patient-follow`, {
      params: { follow_status: 'รอข้อมูลเพิ่มเติม', limit: 50 },
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const items: any[] = r.data?.items ?? (Array.isArray(r.data) ? r.data : []);
    const match = items.find((item: any) => (item.remark ?? '').includes(`|lid=${lineUserId}`));
    if (!match) return null;
    const rawRemark: string = match.remark ?? '';
    const hnMatch = rawRemark.match(/hn=([^|]+)/);
    return { id: match.id, hn: hnMatch ? hnMatch[1] : '', rawRemark };
  } catch {
    return null;
  }
}

// ─── end บันทึกข้อมูล helpers ─────────────────────────────────────────────────

// Flex สำหรับคนที่ยังไม่ได้ลงทะเบียน
function buildRegisterFlex() {
  return {
    type: 'flex',
    altText: 'ยินดีต้อนรับสู่ SafeMind 💙 สมัครได้ที่เมนูข้างล่างครับ',
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0B3D6B',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '🧠 SafeMind',
            color: '#7DD3FC',
            size: 'xs',
            weight: 'bold',
          },
          {
            type: 'text',
            text: 'ยินดีต้อนรับ!',
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
            margin: 'sm',
          },
          {
            type: 'text',
            text: 'ระบบสุขภาพจิต อำเภอปากช่อง',
            color: '#93C5FD',
            size: 'sm',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '14px',
        spacing: 'sm',
        contents: [
          {
            type: 'text',
            text: 'ขณะนี้บัญชี LINE ของท่านยังไม่ได้ลงทะเบียนในระบบครับ',
            wrap: true,
            size: 'sm',
            color: '#334155',
          },
          {
            type: 'text',
            text: '👇 สมัครได้ที่เมนูข้างล่างครับ',
            wrap: true,
            size: 'sm',
            color: '#0B3D6B',
            weight: 'bold',
          },
        ],
      },
    },
  };
}

export default async function handler(req: any, res: any) {
  // Add CORS headers for local development testing
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const events = req.body?.events;
  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ message: 'No events found' });
  }

  try {
    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) {
      console.warn('LINE_CHANNEL_ACCESS_TOKEN is not set.');
      return res.status(500).json({ error: 'Configuration error' });
    }

    // Flex Message — เมนูตารางบริการ
    const scheduleFlexMessage = {
      type: 'flex',
      altText: 'เลือกประเภทตารางบริการ',
      contents: {
        type: 'bubble',
        size: 'kilo',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#1a56db',
          paddingAll: '16px',
          contents: [
            {
              type: 'text',
              text: '📅 ตารางบริการ',
              color: '#ffffff',
              weight: 'bold',
              size: 'lg',
            },
            {
              type: 'text',
              text: 'เลือกประเภทตารางที่ต้องการดู',
              color: '#ffffffcc',
              size: 'sm',
              margin: 'xs',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          paddingAll: '12px',
          contents: [
            {
              type: 'button',
              style: 'primary',
              color: '#1a56db',
              height: 'sm',
              action: {
                type: 'uri',
                label: '🏥 คลินิกจิตเวช (ทั่วไป)',
                uri: `${liffBase}/calendar?type=general`,
              },
              margin: 'none',
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'none',
              paddingStart: '8px',
              contents: [
                {
                  type: 'text',
                  text: 'เช้า 08:00–12:00  |  บ่าย 13:00–16:00',
                  size: 'xs',
                  color: '#64748b',
                  margin: 'xs',
                },
              ],
            },
            { type: 'separator', margin: 'sm' },
            {
              type: 'button',
              style: 'primary',
              color: '#0e7490',
              height: 'sm',
              action: {
                type: 'uri',
                label: '⭐ คลินิกพิเศษ SMC จิตเวช',
                uri: `${liffBase}/calendar?type=smc`,
              },
              margin: 'sm',
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'none',
              paddingStart: '8px',
              contents: [
                {
                  type: 'text',
                  text: 'เย็น 17:00–20:00',
                  size: 'xs',
                  color: '#64748b',
                  margin: 'xs',
                },
              ],
            },
            { type: 'separator', margin: 'sm' },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'uri',
                label: '📋 ตารางเวรจิตแพทย์ประจำเดือน',
                uri: `${liffBase}/calendar?type=duty`,
              },
              margin: 'sm',
            },
          ],
        },
      },
    };

    // Process each event
    for (const event of events) {
      // Handle postback: record_visit — ดึงรายชื่อเคสเร่งด่วนและแสดงเป็น Flex Carousel
      if (event.type === 'postback' && event.postback?.data === 'action=record_visit') {
        const lineUserId: string = event.source?.userId;
        const user = lineUserId ? await getUserByLineId(lineUserId) : null;
        let replyMessages: any[];
        if (!user) {
          replyMessages = [{ type: 'text', text: '⚠️ ไม่พบข้อมูลบัญชีในระบบ กรุณาติดต่อผู้ดูแลระบบครับ' }];
        } else {
          const patients = await fetchUrgentPatients(user);
          const listFlex = buildPatientListFlex(patients);
          const stationName = user.station_name ?? user.health_center_name ?? 'พื้นที่ของท่าน';
          replyMessages = patients.length > 0
            ? [
                { type: 'text', text: `📋 เคสเร่งด่วนใน${stationName}: ${patients.length} ราย\nกดเลือกรายชื่อเพื่อบันทึกข้อมูลครับ` },
                listFlex,
              ]
            : [listFlex];
        }
        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          { replyToken: event.replyToken, messages: replyMessages },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
        ).catch((e: any) => console.warn('reply record_visit failed:', e.response?.data || e.message));
        continue;
      }

      // Handle postback: select_patient — แสดง Action Menu 4 ปุ่ม
      if (event.type === 'postback' && (event.postback?.data ?? '').startsWith('action=select_patient')) {
        const params = new URLSearchParams(event.postback.data);
        const hn = params.get('hn') ?? '';
        const name = decodeURIComponent(params.get('nm') ?? 'ผู้ป่วย');
        const caseType = params.get('tp') ?? 'hr';
        const actionFlex = buildPatientActionFlex(hn, name, caseType);
        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          { replyToken: event.replyToken, messages: [actionFlex] },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
        ).catch((e: any) => console.warn('reply select_patient failed:', e.response?.data || e.message));
        continue;
      }

      // Handle postback: follow_done — บันทึกว่าติดตามสำเร็จ → POST /patient-follow status=success
      if (event.type === 'postback' && (event.postback?.data ?? '').startsWith('action=follow_done')) {
        const params = new URLSearchParams(event.postback.data);
        const hn = params.get('hn') ?? '';
        const ok = await recordPatientFollow(hn, 'success', 'บันทึกจาก LINE: ติดตามเรียบร้อยแล้ว');
        const thaiTime = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
        const msg = ok
          ? `✅ บันทึกเรียบร้อยแล้วครับ!\n\nHN: ${hn}\nสถานะ: ติดตามสำเร็จ\nเวลา: ${thaiTime}`
          : `✅ รับทราบแล้วครับ\nHN: ${hn} — บันทึกไม่สำเร็จ กรุณาแจ้งผู้ดูแลระบบ`;
        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          { replyToken: event.replyToken, messages: [{ type: 'text', text: msg }] },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
        ).catch((e: any) => console.warn('reply follow_done failed:', e.response?.data || e.message));
        continue;
      }

      // Handle postback: wrong_area — แจ้งว่าไม่ใช่เคสในเขต → POST /patient-follow status=แจ้งข้อมูลผิดพลาด
      if (event.type === 'postback' && (event.postback?.data ?? '').startsWith('action=wrong_area')) {
        const params = new URLSearchParams(event.postback.data);
        const hn = params.get('hn') ?? '';
        await recordPatientFollow(hn, 'แจ้งข้อมูลผิดพลาด', 'บันทึกจาก LINE: ไม่ใช่เคสในเขตความรับผิดชอบ');
        const msg = `📝 รับทราบแล้วครับ\n\nHN: ${hn} ถูกบันทึกว่า "ไม่ใช่เคสในเขต"\nและแจ้งข้อมูลไปยังผู้ดูแลระบบแล้ว\n\nขอบคุณที่แจ้งให้ทราบครับ`;
        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          { replyToken: event.replyToken, messages: [{ type: 'text', text: msg }] },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
        ).catch((e: any) => console.warn('reply wrong_area failed:', e.response?.data || e.message));
        continue;
      }

      // Handle postback: report_error — แสดง Flex 4 ปุ่มเหตุผลสำหรับเคสแรกของพื้นที่
      if (event.type === 'postback' && event.postback?.data === 'action=report_error') {
        const lineUserId: string = event.source?.userId;
        const user = lineUserId ? await getUserByLineId(lineUserId) : null;
        let replyMessages: any[];
        if (!user) {
          replyMessages = [{ type: 'text', text: '⚠️ ไม่พบข้อมูลบัญชีในระบบ กรุณาติดต่อผู้ดูแลระบบครับ' }];
        } else {
          const patients = await fetchUrgentPatients(user);
          if (patients.length === 0) {
            replyMessages = [{ type: 'text', text: '✅ ไม่มีเคสเร่งด่วนในพื้นที่ของท่านขณะนี้ครับ' }];
          } else {
            const p = patients[0];
            replyMessages = [buildReportErrorFlex(p.hn, p.name)];
          }
        }
        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          { replyToken: event.replyToken, messages: replyMessages },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
        ).catch((e: any) => console.warn('reply report_error failed:', e.response?.data || e.message));
        continue;
      }

      // Handle postback: report_reason — บันทึกเหตุผลการแจ้งข้อมูลผิดพลาด
      if (event.type === 'postback' && (event.postback?.data ?? '').startsWith('action=report_reason')) {
        const params = new URLSearchParams(event.postback.data);
        const hn = params.get('hn') ?? '';
        const reason = params.get('reason') ?? '';
        const lineUserId: string = event.source?.userId ?? '';

        // ดึงข้อมูลผู้แจ้งเพื่อฝังใน remark ให้แอดมินเห็น
        const reporter = lineUserId ? await getUserByLineId(lineUserId) : null;
        const reporterName = reporter?.full_name ?? 'เจ้าหน้าที่';
        const stationName = reporter?.station_name ?? reporter?.health_center_name ?? '';

        const REASON_LABELS: Record<string, string> = {
          'wrong-jurisdiction': 'ไม่ใช่คนไข้ในเขตรับผิดชอบ',
          'unreachable': 'ผู้ป่วยย้ายที่อยู่/ติดต่อไม่ได้',
          'inaccurate-status': 'ข้อมูลอาการ/สถานะไม่ตรงความจริง',
        };

        let msg: string;
        if (reason === 'other') {
          // เก็บ pending — รอ user พิมพ์เหตุผลต่อ (ฝัง reporter ไว้ใน PENDING marker ด้วย)
          await recordPatientFollow(
            hn, 'รอข้อมูลเพิ่มเติม',
            `PENDING_OTHER|hn=${hn}|lid=${lineUserId}|reporter=${reporterName}|station=${stationName}`
          );
          msg = `📝 รับทราบแล้วครับ\n\nHN: ${hn}\nกรุณาพิมพ์ข้อความระบุเหตุผลเพิ่มเติม แล้วส่งเข้าแชทได้เลยครับ`;
        } else {
          const label = REASON_LABELS[reason] ?? reason;
          // remark ใช้ key: value pattern เดียวกับ parseRemark ใน LineManagePage
          const remarkParts = [`เหตุผล: ${label}`, `ผู้แจ้ง: ${reporterName}`];
          if (stationName) remarkParts.push(`รพ.สต.: ${stationName}`);
          await recordPatientFollow(hn, 'แจ้งข้อมูลผิดพลาด', remarkParts.join(' | '));
          const thaiTime = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
          msg = `✅ บันทึกเรียบร้อยแล้วครับ!\n\nHN: ${hn}\nเหตุผล: ${label}\nเวลา: ${thaiTime}\n\nระบบจะแจ้งให้ผู้ดูแลตรวจสอบต่อไปครับ`;
        }

        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          { replyToken: event.replyToken, messages: [{ type: 'text', text: msg }] },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
        ).catch((e: any) => console.warn('reply report_reason failed:', e.response?.data || e.message));
        continue;
      }

      // Handle postback — ตารางบริการ
      if (event.type === 'postback' && event.postback?.data === 'action=schedule_menu') {
        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          { replyToken: event.replyToken, messages: [scheduleFlexMessage] },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
        );
        continue;
      }

      // Handle message — "เริ่มต้นใช้งานระบบ SafeMind" → สรุปภารกิจประจำวันตาม รพ.สต.
      if (event.type === 'message' && event.message?.type === 'text') {
        const text: string = (event.message.text ?? '').trim();
        const lineUserId: string = event.source?.userId;
        const replyToken: string = event.replyToken;

        if (text === 'เริ่มต้นใช้งานระบบ SafeMind' && lineUserId) {
          const user = await getUserByLineId(lineUserId);
          let replyMessages: any[];

          if (user) {
            const stationName = user.station_name ?? user.health_center_name ?? 'หน่วยงานของท่าน';
            const { highRisk, missed } = await fetchCaseSummary(user);
            replyMessages = [buildDailySummaryFlex(stationName, highRisk, missed)];
          } else {
            // fallback — ถ้าหา user ไม่เจอ
            replyMessages = [{
              type: 'text',
              text: '⚠️ ไม่พบข้อมูลบัญชีของท่านในระบบ กรุณาติดต่อเจ้าหน้าที่ครับ',
            }];
          }

          await axios.post(
            'https://api.line.me/v2/bot/message/reply',
            { replyToken, messages: replyMessages },
            { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
          ).catch((e: any) => console.warn('Reply failed:', e.response?.data || e.message));
          continue;
        }

        // รับข้อความที่ผู้ใช้พิมพ์หลังกด "อื่นๆ (พิมพ์ระบุ)"
        if (lineUserId && text) {
          const pending = await findPendingOtherRecord(lineUserId);
          if (pending) {
            const jwt = await getMachineToken();
            // ดึง reporter info จาก PENDING marker ที่เก็บไว้
            const rawRemark: string = pending.rawRemark ?? '';
            const getField = (key: string) => { const m = rawRemark.match(new RegExp(`${key}=([^|]+)`)); return m ? m[1] : ''; };
            const reporterName = getField('reporter') || 'เจ้าหน้าที่';
            const stationName  = getField('station');
            const remarkParts = [`เหตุผล: อื่นๆ — ${text}`, `ผู้แจ้ง: ${reporterName}`];
            if (stationName) remarkParts.push(`รพ.สต.: ${stationName}`);
            await axios.put(
              `${FASTAPI_BASE}/patient-follow/${pending.id}`,
              { follow_status: 'แจ้งข้อมูลผิดพลาด', remark: remarkParts.join(' | ') },
              { headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' } }
            ).catch(() => {});
            const thaiTime = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
            const replyMsg = `✅ รับข้อมูลเรียบร้อยแล้วครับ!\n\nHN: ${pending.hn}\nเหตุผล: ${text}\nเวลา: ${thaiTime}\n\nระบบจะแจ้งให้ผู้ดูแลตรวจสอบต่อไปครับ`;
            await axios.post(
              'https://api.line.me/v2/bot/message/reply',
              { replyToken, messages: [{ type: 'text', text: replyMsg }] },
              { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
            ).catch((e: any) => console.warn('reply pending_other failed:', e.response?.data || e.message));
            continue;
          }
        }
      }

      // Handle the "follow" event — personalized greeting + auto switch Rich Menu
      if (event.type === 'follow') {
        const lineUserId: string = event.source?.userId;
        const replyToken: string = event.replyToken;

        // ค้นหาข้อมูล user จากระบบ
        const user = lineUserId ? await getUserByLineId(lineUserId) : null;

        const flexMessage = user
          ? buildWelcomeFlex(user.full_name, user.health_center_name)
          : buildRegisterFlex();

        // ส่ง Flex ทักทายกลับ
        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          { replyToken, messages: [flexMessage] },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
        );

        // ถ้า user ลงทะเบียนแล้ว → สลับ Rich Menu เป็น Menu 2 ทันที
        // (block/unblock จะรีเซ็ต Rich Menu กลับเป็น default เสมอ)
        if (user && lineUserId) {
          const RICHMENU_2_ID = 'richmenu-4346f6ab2b688b71be97175b7121297d';
          await axios.post(
            `https://api.line.me/v2/bot/user/${lineUserId}/richmenu/${RICHMENU_2_ID}`,
            {},
            { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` } }
          ).catch(() => { /* non-critical */ });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Events processed' });
  } catch (error: any) {
    console.error('Webhook Error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
