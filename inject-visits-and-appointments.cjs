/**
 * inject-visits-and-appointments.cjs
 * 
 * Step 1: Login to get fresh token
 * Step 2: For each patient, POST /oapp records (one per "visit chain row")
 * 
 * The script auto-refreshes the token every 20 requests to avoid expiry.
 */

const http = require('http');

const API_HOST = '210.246.215.95';
const API_PORT = 8000;
const USERNAME = 'admin99';
const PASSWORD = 'admin99';

// ─── Login & get token ────────────────────────────────────────────────────────
function getToken() {
  return new Promise((resolve, reject) => {
    const body = `username=${USERNAME}&password=${PASSWORD}`;
    const options = {
      hostname: API_HOST, port: API_PORT, path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = http.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.access_token) { console.log('🔑 Token OK'); resolve(j.access_token); }
          else reject('No access_token: ' + d);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── POST one oapp record ──────────────────────────────────────────────────────
function postOapp(token, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: API_HOST, port: API_PORT, path: '/oapp', method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`,
        'accept': 'application/json', 'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = http.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: (() => { try { return JSON.parse(d); } catch { return d; } })() }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Patient visit chains ──────────────────────────────────────────────────────
// Each patient gets multiple rows = demonstrates append-only pattern
const PATIENTS = [
  {
    hn: 'HN-RED-01', clinic: '001', doctor: 'DR001',
    app_cause: 'ติดตามอาการจิตเวช SMI-V สีแดง', note2: 'ห้ามนัดคนเดียว',
    visits: [
      { vstdate: '2026-01-06', nextdate: '2026-02-03', came: true },
      { vstdate: '2026-02-03', nextdate: '2026-03-03', came: true },
      { vstdate: '2026-03-03', nextdate: '2026-04-07', came: false }, // ← latest → real next appt
    ],
  },
  {
    hn: 'HN-RED-02', clinic: '010', doctor: 'DR002',
    app_cause: 'ติดตามความวิตกกังวล ปรับยา', note2: 'FBS ก่อนพบแพทย์',
    visits: [
      { vstdate: '2026-01-10', nextdate: '2026-02-10', came: false }, // ผิดนัด
      { vstdate: '2026-02-24', nextdate: '2026-03-24', came: true  }, // มาช้า
      { vstdate: '2026-03-24', nextdate: '2026-04-21', came: false }, // ← latest
    ],
  },
  {
    hn: 'HN-YEL-01', clinic: '001', doctor: 'DR001',
    app_cause: 'ติดตามอาการซึมเศร้าระดับเฝ้าระวัง', note2: '',
    visits: [
      { vstdate: '2026-01-15', nextdate: '2026-02-12', came: true },
      { vstdate: '2026-02-12', nextdate: '2026-03-12', came: true },
      { vstdate: '2026-03-12', nextdate: '2026-04-09', came: false }, // ← latest
    ],
  },
  {
    hn: 'HN-YEL-02', clinic: '001', doctor: 'DR001',
    app_cause: 'ติดตามอาการ ขาดยาต่อเนื่อง', note2: 'FBS + HbA1c',
    visits: [
      { vstdate: '2026-01-20', nextdate: '2026-02-17', came: false }, // ผิดนัด
      { vstdate: '2026-02-17', nextdate: '2026-03-17', came: false }, // ผิดนัดอีก
      { vstdate: '2026-03-10', nextdate: '2026-04-07', came: false }, // ← latest = overdue
    ],
  },
  {
    hn: 'HN-GRN-01', clinic: '020', doctor: 'DR003',
    app_cause: 'ตรวจติดตามสุขภาพจิต ระดับปกติ', note2: '',
    visits: [
      { vstdate: '2026-02-01', nextdate: '2026-03-01', came: true },
      { vstdate: '2026-03-01', nextdate: '2026-04-05', came: false }, // ← latest
    ],
  },
  {
    hn: 'HN-GRN-02', clinic: '020', doctor: 'DR003',
    app_cause: 'ตรวจประจำปี สุขภาพจิตดี', note2: '',
    visits: [
      { vstdate: '2026-02-14', nextdate: '2026-03-14', came: true }, // มาแล้ว
    ],
  },
  {
    hn: 'HN-R-10', clinic: '010', doctor: 'DR002',
    app_cause: 'ฉุกเฉินจิตเวช ติดตามอาการหลังวิกฤต', note2: '',
    visits: [
      { vstdate: '2026-03-10', nextdate: '2026-03-24', came: false }, // นัดวันนี้!
    ],
  },
  {
    hn: 'HN-R-11', clinic: '010', doctor: 'DR002',
    app_cause: 'ติดตามอาการรุนแรง ประสานคนในครอบครัว', note2: '',
    visits: [
      { vstdate: '2026-01-05', nextdate: '2026-02-02', came: true },
      { vstdate: '2026-02-02', nextdate: '2026-03-02', came: true },
      { vstdate: '2026-03-02', nextdate: '2026-04-02', came: false }, // ← latest
    ],
  },
  {
    hn: 'HN-R-12', clinic: '010', doctor: 'DR002',
    app_cause: 'ติดตามวิกฤต ผู้ป่วยชนม์ชนก ประวัติรุนแรง', note2: 'แจ้งครอบครัวก่อนพบ',
    visits: [
      { vstdate: '2026-02-20', nextdate: '2026-03-20', came: false }, // overdue
    ],
  },
  {
    hn: 'HN-Y-10', clinic: '001', doctor: 'DR001',
    app_cause: 'ติดตามอาการ เฝ้าระวัง สุนิสา', note2: '',
    visits: [
      { vstdate: '2026-02-10', nextdate: '2026-03-10', came: true },
      { vstdate: '2026-03-10', nextdate: '2026-04-14', came: false }, // ← latest
    ],
  },
  {
    hn: 'HN-Y-11', clinic: '001', doctor: 'DR001',
    app_cause: 'ติดตาม เฝ้าดู ประทีป', note2: '',
    visits: [
      { vstdate: '2026-02-15', nextdate: '2026-03-15', came: true },
      { vstdate: '2026-03-15', nextdate: '2026-04-19', came: false }, // ← latest
    ],
  },
  {
    hn: 'HN-Y-12', clinic: '001', doctor: 'DR001',
    app_cause: 'ติดตาม มาลี ร้อนใจ', note2: '',
    visits: [
      { vstdate: '2026-01-25', nextdate: '2026-02-22', came: true },
      { vstdate: '2026-02-22', nextdate: '2026-03-29', came: false }, // ← latest upcoming
    ],
  },
  {
    hn: 'HN-G-10', clinic: '015', doctor: 'DR004',
    app_cause: 'นัดตรวจประจำ 3 เดือน สมชาย', note2: '',
    visits: [
      { vstdate: '2026-01-20', nextdate: '2026-02-17', came: true },
      { vstdate: '2026-02-17', nextdate: '2026-03-24', came: true },
      { vstdate: '2026-03-24', nextdate: '2026-04-28', came: false }, // ← latest
    ],
  },
  {
    hn: 'HN-G-11', clinic: '015', doctor: 'DR004',
    app_cause: 'นัดตรวจ ศิริพร สุขสงบ', note2: '',
    visits: [
      { vstdate: '2026-03-05', nextdate: '2026-04-05', came: false }, // ← latest
    ],
  },
  {
    hn: 'HN-G-12', clinic: '015', doctor: 'DR004',
    app_cause: 'นัดตรวจ วิชัย สุขภาพดี', note2: '',
    visits: [
      { vstdate: '2026-02-28', nextdate: '2026-03-28', came: false }, // ← latest upcoming
    ],
  },
];

// ─── Build oapp_id from base time + indices ────────────────────────────────────
const BASE_ID = 900000 + Math.floor((Date.now() / 1000) % 10000);

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔑 Logging in...');
  let token = await getToken();

  let successCount = 0, failCount = 0, requestCount = 0;

  for (let pi = 0; pi < PATIENTS.length; pi++) {
    const patient = PATIENTS[pi];
    console.log(`\n📋 HN: ${patient.hn} (${patient.visits.length} rows)`);

    for (let i = 0; i < patient.visits.length; i++) {
      // Refresh token every 15 requests
      if (requestCount > 0 && requestCount % 15 === 0) {
        console.log('  🔄 Refreshing token...');
        token = await getToken();
      }

      const visit = patient.visits[i];
      const oapp_id = BASE_ID + (pi * 10) + i + 1;
      const vn = `${visit.vstdate.replace(/-/g, '')}${String(pi + 1).padStart(3, '0')}${String(i + 1).padStart(3, '0')}`;
      const visit_vn = visit.came ? `${visit.nextdate.replace(/-/g, '')}${String(pi + 1).padStart(3, '0')}099` : null;

      const payload = {
        oapp_id,
        hn: patient.hn,
        vn,
        vstdate: visit.vstdate,
        nextdate: visit.nextdate,
        nexttime: '09:00:00',
        clinic: patient.clinic,
        depcode: patient.clinic,
        doctor: patient.doctor,
        note: null,
        spclty: '01',
        app_user: 'inject-2026',
        app_cause: patient.app_cause,
        contact_point: 'ห้องตรวจ',
        note1: null,
        note2: patient.note2 || null,
        app_no: i + 1,
        print_sticker: 'Y',
        enddate: null,
        endtime: null,
        label_color: null,
        doctor_schedule_id: null,
        ward: null,
        patient_visit: visit.came ? 'Y' : null,
        nexttime_end: null,
        next_pttype: null,
        visit_vn,
        oapp_id_guid: `mock-2026-${patient.hn}-${i + 1}`,
        person_vaccine_id: null,
        provis_aptype_code: null,
        date_count: 28,
        an: null,
        hos_guid: null,
        entry_date: visit.vstdate,
        entry_time: '09:00:00',
        operation_appointment: null,
        operation_patient_type: null,
        operation_note: null,
        operation_doctor_code: null,
        operation_anes_type: null,
        kcheck: null,
        update_datetime: new Date().toISOString().replace('Z', '').split('.')[0],
        oapp_status_id: visit.came ? 2 : 1,
        perform_text: null,
        lab_list_text: patient.note2 || null,
        xray_list_text: null,
        clinic_visit_type_id: null,
        visit_no: i + 1,
        opd_queue_slot_id: null,
        opd_queue_schedule_id: null,
        opd_qs_slot_id: null,
        oapp_ref_id: null,
        referin_vn: null,
        oapp_week_range_limit_id: null,
        ext_ref_id: null,
        moph_ic_ref_id: null,
        is_refill: null,
      };

      try {
        const result = await postOapp(token, payload);
        requestCount++;
        const isOk = result.status === 200 || result.status === 201;
        if (isOk) {
          successCount++;
          const label = visit.came ? '✅ มาแล้ว' : visit.nextdate <= '2026-03-24' ? '🔴 overdue' : '📅 upcoming';
          console.log(`  Row ${i + 1}: vstdate=${visit.vstdate} → nextdate=${visit.nextdate} | ${label}`);
        } else {
          failCount++;
          const errDetail = typeof result.body === 'object' ? JSON.stringify(result.body).slice(0, 120) : result.body.slice(0, 120);
          console.log(`  Row ${i + 1}: ❌ HTTP ${result.status} ${errDetail}`);
        }
      } catch (e) {
        failCount++;
        console.log(`  Row ${i + 1}: ❌ Error:`, e.message);
      }

      await new Promise(r => setTimeout(r, 80));
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ ${successCount} injected  ❌ ${failCount} failed`);
  if (successCount > 0) {
    console.log('\n📊 Expected view in /appointments:');
    console.log('  HN-RED-01  → 2026-04-07 (upcoming)');
    console.log('  HN-RED-02  → 2026-04-21 (upcoming)');
    console.log('  HN-YEL-01  → 2026-04-09 (upcoming)');
    console.log('  HN-YEL-02  → 2026-04-07 (OVERDUE!)');
    console.log('  HN-R-10    → 2026-03-24 (TODAY!)');
    console.log('  HN-R-12    → 2026-03-20 (OVERDUE!)');
    console.log('  HN-GRN-02  → 2026-03-14 (attended)');
  }
}

main().catch(console.error);
