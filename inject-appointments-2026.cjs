/**
 * inject-appointments-2026.cjs
 *
 * Inject mock oapp records with 2026 dates to demonstrate "append-only" pattern.
 * Each HN gets 3-5 rows: each row = 1 visit that ended with a new appointment.
 * The latest row's `nextdate` = real upcoming appointment.
 *
 * Pattern for each patient:
 *   Row 1: vstdate=Jan, nextdate=Feb  (visit_vn=null → missed the Feb appt)
 *   Row 2: vstdate=Feb, nextdate=Mar  (only if they came in Feb)
 *   Row 3: vstdate=Mar, nextdate=Apr  ← latest → this is the "real" next appt
 */

const http = require('http');

const API_HOST = '210.246.215.95';
const API_PORT = 8000;
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbjk5IiwiaWF0IjoxNzc0MzQ0MTE5LCJleHAiOjE3NzQzNDU5MTl9.mdAy9dZMdmGbvmxFc___Y3P_lVSL8U_3z5T-20It9GI';

// Generate a simple VN: date-based + random suffix
function makeVN(dateStr, suffix) {
  return dateStr.replace(/-/g, '') + String(suffix).padStart(6, '0');
}

// Offset a date by N months
function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

// --------------------------------------------------
// Define realistic patient scenarios
// Each scenario has a list of "visit chains"
// --------------------------------------------------
const PATIENTS = [
  // ── HN-RED-01: นาย แดง อาการรุนแรง — Red, มาตลอด
  {
    hn: 'HN-RED-01',
    clinic: '001',
    doctor: 'DR001',
    app_cause: 'ติดตามอาการจิตเวช SMI-V สีแดง',
    note2: 'ห้ามนัดคนเดียว',
    visits: [
      { vstdate: '2026-01-06', nextdate: '2026-02-03', visit_vn_filled: true },
      { vstdate: '2026-02-03', nextdate: '2026-03-03', visit_vn_filled: true },
      { vstdate: '2026-03-03', nextdate: '2026-04-07', visit_vn_filled: false }, // ← ล่าสุด
    ],
  },

  // ── HN-RED-02: นาง ร้อนใจ วิตกกังวล — Red, ผิดนัด 1 ครั้ง
  {
    hn: 'HN-RED-02',
    clinic: '010',
    doctor: 'DR002',
    app_cause: 'ติดตามความวิตกกังวล ปรับยา',
    note2: 'FBS ก่อนพบแพทย์',
    visits: [
      { vstdate: '2026-01-10', nextdate: '2026-02-10', visit_vn_filled: false }, // ผิดนัด
      { vstdate: '2026-02-24', nextdate: '2026-03-24', visit_vn_filled: true  },
      { vstdate: '2026-03-24', nextdate: '2026-04-21', visit_vn_filled: false }, // ← ล่าสุด วันนี้
    ],
  },

  // ── HN-YEL-01: นาย เหลือง เฝ้าระวัง — Yellow, upcoming
  {
    hn: 'HN-YEL-01',
    clinic: '001',
    doctor: 'DR001',
    app_cause: 'ติดตามอาการซึมเศร้าระดับเฝ้าระวัง',
    note2: '',
    visits: [
      { vstdate: '2026-01-15', nextdate: '2026-02-12', visit_vn_filled: true },
      { vstdate: '2026-02-12', nextdate: '2026-03-12', visit_vn_filled: true },
      { vstdate: '2026-03-12', nextdate: '2026-04-09', visit_vn_filled: false }, // ← ล่าสุด
    ],
  },

  // ── HN-YEL-02: นางสาว สมใจ เฝ้าดู — Yellow, ขาดนัดต่อเนื่อง
  {
    hn: 'HN-YEL-02',
    clinic: '001',
    doctor: 'DR001',
    app_cause: 'ติดตามอาการ ขาดยาต่อเนื่อง',
    note2: 'FBS + HbA1c',
    visits: [
      { vstdate: '2026-01-20', nextdate: '2026-02-17', visit_vn_filled: false }, // ผิดนัด
      { vstdate: '2026-02-17', nextdate: '2026-03-17', visit_vn_filled: false }, // ผิดนัดอีก
      { vstdate: '2026-03-17', nextdate: '2026-04-14', visit_vn_filled: false }, // ← overdue
    ],
  },

  // ── HN-GRN-01: นาย เขียว สบายดี — Green, upcoming
  {
    hn: 'HN-GRN-01',
    clinic: '020',
    doctor: 'DR003',
    app_cause: 'ตรวจติดตามสุขภาพจิต ระดับปกติ',
    note2: '',
    visits: [
      { vstdate: '2026-02-01', nextdate: '2026-03-01', visit_vn_filled: true },
      { vstdate: '2026-03-01', nextdate: '2026-04-05', visit_vn_filled: false }, // ← ล่าสุด
    ],
  },

  // ── HN-GRN-02: นาง สันติ สุขสงบ — Green, already attended (มาแล้ว)
  {
    hn: 'HN-GRN-02',
    clinic: '020',
    doctor: 'DR003',
    app_cause: 'ตรวจประจำปี สุขภาพจิตดี',
    note2: '',
    visits: [
      { vstdate: '2026-02-14', nextdate: '2026-03-14', visit_vn_filled: true }, // มาแล้ว
    ],
  },

  // ── HN-R-10: นาย กฤษณะ มีอาการ — Red, นัดวันนี้!
  {
    hn: 'HN-R-10',
    clinic: '010',
    doctor: 'DR002',
    app_cause: 'ฉุกเฉินจิตเวช ติดตามอาการหลังวิกฤต',
    note2: '',
    visits: [
      { vstdate: '2026-03-10', nextdate: '2026-03-24', visit_vn_filled: false }, // นัดวันนี้!
    ],
  },

  // ── HN-R-11: นาง วาสนา อาการรุนแรง — Red, upcoming
  {
    hn: 'HN-R-11',
    clinic: '010',
    doctor: 'DR002',
    app_cause: 'ติดตามอาการรุนแรง ประสานคนในครอบครัว',
    note2: '',
    visits: [
      { vstdate: '2026-01-05', nextdate: '2026-02-02', visit_vn_filled: true },
      { vstdate: '2026-02-02', nextdate: '2026-03-02', visit_vn_filled: true },
      { vstdate: '2026-03-02', nextdate: '2026-04-02', visit_vn_filled: false },
    ],
  },

  // ── HN-Y-10: นาง สุนิสา เฝ้าระวัง — Yellow, upcoming
  {
    hn: 'HN-Y-10',
    clinic: '001',
    doctor: 'DR001',
    app_cause: 'ติดตามอาการ เฝ้าระวัง',
    note2: '',
    visits: [
      { vstdate: '2026-02-10', nextdate: '2026-03-10', visit_vn_filled: true },
      { vstdate: '2026-03-10', nextdate: '2026-04-14', visit_vn_filled: false },
    ],
  },

  // ── HN-G-10: นาย สมชาย ปกติ — Green, upcoming
  {
    hn: 'HN-G-10',
    clinic: '015',
    doctor: 'DR004',
    app_cause: 'นัดตรวจประจำ 3 เดือน',
    note2: '',
    visits: [
      { vstdate: '2026-01-20', nextdate: '2026-02-17', visit_vn_filled: true },
      { vstdate: '2026-02-17', nextdate: '2026-03-24', visit_vn_filled: true },
      { vstdate: '2026-03-24', nextdate: '2026-04-28', visit_vn_filled: false },
    ],
  },
];


// --------------------------------------------------
// POST one oapp record
// --------------------------------------------------
function postOapp(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/oapp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'accept': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// --------------------------------------------------
// Main
// --------------------------------------------------
async function main() {
  console.log('🏥 Injecting mock oapp appointments (2026)...\n');
  let successCount = 0;
  let failCount = 0;

  for (const patient of PATIENTS) {
    console.log(`\n📋 Patient HN: ${patient.hn} (${patient.visits.length} visits)`);

    for (let i = 0; i < patient.visits.length; i++) {
      const visit = patient.visits[i];
      const vn = makeVN(visit.vstdate, i + 1);
      const oapp_id_guid = `mock-2026-${patient.hn}-${i + 1}-${Date.now()}`;

      // visit_vn: if the patient came, simulate the "return VN" as the next row's VN
      const visit_vn = visit.visit_vn_filled
        ? makeVN(visit.nextdate, 99) // simulate: they came (got a new VN on nextdate)
        : null;

      // Generate unique oapp_id: timestamp base + patient index + row index
      const baseId = Math.floor(Date.now() / 1000); // unix seconds ~1.7B
      const patientIdx = PATIENTS.indexOf(patient);
      const oapp_id = baseId + (patientIdx * 100) + i + 1;

      const payload = {
        oapp_id: oapp_id,
        hn: patient.hn,
        vn: vn,
        vstdate: visit.vstdate,
        nextdate: visit.nextdate,
        nexttime: '09:00:00',
        clinic: patient.clinic,
        depcode: patient.clinic,
        doctor: patient.doctor,
        note: null,
        spclty: '01',
        app_user: 'inject-script',
        app_cause: patient.app_cause,
        contact_point: 'หน้าห้องตรวจ',
        note1: null,
        note2: patient.note2 || null,
        app_no: i + 1,
        print_sticker: 'Y',
        enddate: null,
        endtime: null,
        label_color: null,
        doctor_schedule_id: null,
        ward: null,
        patient_visit: visit.visit_vn_filled ? 'Y' : null,
        nexttime_end: null,
        next_pttype: null,
        visit_vn: visit_vn,
        oapp_id_guid: oapp_id_guid,
        person_vaccine_id: null,
        provis_aptype_code: null,
        date_count: 30,
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
        update_datetime: new Date().toISOString(),
        oapp_status_id: visit.visit_vn_filled ? 2 : 1,
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
        const result = await postOapp(payload);
        if (result.status === 200 || result.status === 201) {
          successCount++;
          const status = visit.visit_vn_filled ? '✅ มาแล้ว' : '⏳ รอมา';
          console.log(`  Row ${i + 1}: vstdate=${visit.vstdate} → nextdate=${visit.nextdate} | ${status}`);
        } else {
          failCount++;
          console.log(`  Row ${i + 1}: ❌ HTTP ${result.status}`, JSON.stringify(result.body).slice(0, 100));
        }
      } catch (e) {
        failCount++;
        console.log(`  Row ${i + 1}: ❌ Error:`, e.message);
      }

      // Small delay to avoid flooding
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log(`\n✅ Done! ${successCount} records injected, ${failCount} failed.`);
  console.log('\n🔍 Expected result in /appointments page:');
  console.log('  HN T2601001 → nextdate 2026-04-07 (upcoming)');
  console.log('  HN T2601002 → nextdate 2026-04-21 (upcoming)');
  console.log('  HN T2601003 → nextdate 2026-04-23 (upcoming)');
  console.log('  HN T2601004 → nextdate 2026-04-14 (overdue - missed!)');
  console.log('  HN T2601005 → nextdate 2026-03-24 (TODAY!)');
  console.log('  HN T2601006 → nextdate 2026-04-07 (upcoming)');
  console.log('  HN T2601007 → nextdate 2026-03-14 (attended - came already)');
}

main();
