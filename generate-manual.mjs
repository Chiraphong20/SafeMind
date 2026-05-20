import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
  ShadingType, VerticalAlign, convertInchesToTwip
} from 'docx';
import { writeFileSync } from 'fs';

const tealColor = '0D9488';
const lightTeal = 'E6F7F5';
const headerBg = '1E293B';
const orangeBg = 'FEF3C7';

const h1 = (text) => new Paragraph({
  text,
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: tealColor, space: 4 } },
  run: { color: '0F172A', bold: true }
});

const h2 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 26, color: tealColor })],
  spacing: { before: 360, after: 120 },
});

const h3 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 24, color: '334155' })],
  spacing: { before: 280, after: 100 },
});

const body = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, size: 22, color: '374151', ...opts })],
  spacing: { after: 100 },
});

const bullet = (text, bold = false) => new Paragraph({
  children: [new TextRun({ text, size: 22, bold, color: '374151' })],
  bullet: { level: 0 },
  spacing: { after: 80 },
});

const note = (text) => new Paragraph({
  children: [
    new TextRun({ text: '  ' + text + '  ', size: 20, color: '92400E', italics: true })
  ],
  shading: { type: ShadingType.CLEAR, fill: orangeBg },
  spacing: { before: 100, after: 160 },
  indent: { left: convertInchesToTwip(0.2) }
});

const spacer = () => new Paragraph({ text: '', spacing: { after: 80 } });

const makeTable = (headers, rows) => {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(h => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20 })],
        alignment: AlignmentType.CENTER,
      })],
      shading: { type: ShadingType.CLEAR, fill: '0F766E' },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 80, bottom: 80, left: 120, right: 120 }
    }))
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: cell, size: 20, color: '1E293B' })],
      })],
      shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? 'FFFFFF' : 'F8FAFC' },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 60, bottom: 60, left: 120, right: 120 }
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left:   { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      right:  { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      insideH:{ style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
      insideV:{ style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    },
    margins: { top: 0, bottom: 0 }
  });
};

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'TH Sarabun New', size: 22 } }
    }
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top:    convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left:   convertInchesToTwip(1.2),
          right:  convertInchesToTwip(1.2),
        }
      }
    },
    children: [

      // ===== TITLE =====
      new Paragraph({
        children: [new TextRun({ text: 'คู่มือการใช้งานระบบ SafeMind', bold: true, size: 48, color: '0F766E' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'ระบบลงทะเบียนและอนุมัติสมาชิก', size: 26, color: '64748B' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),

      // ===== PART 1 =====
      h1('ส่วนที่ 1  การสมัครสมาชิก (ผู้ใช้งานทั่วไป)'),
      body('ผู้ใช้งานสามารถสมัครสมาชิกผ่านแอปพลิเคชัน LINE เท่านั้น โดยระบบจะผูกบัญชีกับ LINE ID ของคุณโดยอัตโนมัติ'),
      spacer(),

      h2('ขั้นตอนที่ 1 — เปิดแอปผ่าน LINE'),
      body('เมื่อเปิดแอปครั้งแรก ระบบจะขอสิทธิ์เข้าถึง LINE Profile ของคุณ หากสำเร็จ แถบสถานะจะเปลี่ยนเป็น สีเขียว พร้อมแสดงข้อความ:'),
      new Paragraph({
        children: [new TextRun({ text: '   Verified ID: xxxxxxxxxx...', size: 20, font: 'Courier New', color: '0D9488' })],
        shading: { type: ShadingType.CLEAR, fill: 'F0FDF4' },
        spacing: { before: 80, after: 160 },
        indent: { left: convertInchesToTwip(0.3) }
      }),
      note('หากแถบยังเป็นสีเหลือง ให้รอสักครู่จนระบบโหลดข้อมูลเสร็จก่อนกรอกฟอร์ม'),
      spacer(),

      h2('ขั้นตอนที่ 2 — กรอกข้อมูลในแบบฟอร์ม'),
      body('กรอกข้อมูลให้ครบในแต่ละช่อง ดังนี้:'),
      spacer(),

      makeTable(
        ['ช่องข้อมูล', 'คำอธิบาย', 'บังคับ'],
        [
          ['Username',       'ชื่อผู้ใช้สำหรับเข้าสู่ระบบ',                                   'บังคับ'],
          ['Password',       'รหัสผ่านของบัญชี',                                               'บังคับ'],
          ['อีเมล',           'ที่อยู่อีเมลสำหรับติดต่อ',                                      'บังคับ'],
          ['ชื่อ-นามสกุล',    'ชื่อจริงของผู้สมัคร',                                           'บังคับ'],
          ['บทบาท',           'เลือกตามตำแหน่งที่ดำรงอยู่',                                   'บังคับ'],
          ['LINE ID',        'ไอดีไลน์ส่วนตัว (ไม่ใช่ชื่อที่แสดง)',                           'บังคับ'],
          ['เบอร์โทรศัพท์',   '10 หลัก ขึ้นต้นด้วย 0 เช่น 0812345678',                       'บังคับ'],
          ['เลขบัตรประชาชน',  '13 หลัก ไม่มีขีด',                                             'บังคับ'],
          ['หมายเหตุ',        'ข้อมูลเพิ่มเติมอื่น ๆ (ถ้ามี)',                                'ไม่บังคับ'],
        ]
      ),
      spacer(),

      h2('ขั้นตอนที่ 3 — เลือกบทบาทให้ถูกต้อง'),
      body('ระบบจะแสดงช่องข้อมูลเพิ่มเติมตามบทบาทที่เลือก ดังนี้:'),
      spacer(),

      makeTable(
        ['บทบาท', 'ข้อมูลเพิ่มเติมที่ต้องกรอก'],
        [
          ['รพ.สต.',         'เลือก โรงพยาบาล / รพ.สต. ที่สังกัด จากรายการ'],
          ['อสม.',           'เลือก ตำบล และ หมู่บ้าน (หมู่ที่) ที่รับผิดชอบ'],
          ['ตำรวจ',          'เลือก สถานีตำรวจ ที่สังกัด จากรายการ'],
          ['ปกครอง',         'เลือก ตำบล และ หมู่บ้าน (หมู่ที่) ที่รับผิดชอบ'],
          ['ผู้ใช้งานทั่วไป', 'ไม่ต้องกรอกข้อมูลเพิ่มเติม'],
        ]
      ),
      spacer(),

      note('สถานที่ที่ให้เลือกครอบคลุมพื้นที่อำเภอปากช่อง จังหวัดนครราชสีมา เท่านั้น'),
      spacer(),

      h2('ขั้นตอนที่ 4 — ส่งข้อมูลและรอการอนุมัติ'),
      bullet('กดปุ่ม  "ยืนยันการลงทะเบียน"  ที่ด้านล่างของฟอร์ม'),
      bullet('รอให้ระบบประมวลผล (ปุ่มจะแสดงวงกลมหมุน)'),
      bullet('เมื่อสำเร็จ จะมีหน้าจอแจ้งว่า "ลงทะเบียน SafeMind สำเร็จ"'),
      bullet('รอแอดมินอนุมัติ — ระบบจะยังไม่สามารถใช้งานได้จนกว่าจะได้รับการอนุมัติ'),
      spacer(),

      note('หากพบข้อผิดพลาด ให้ตรวจสอบว่ากรอกข้อมูลครบและถูกต้อง เช่น เบอร์โทร 10 หลัก, บัตรประชาชน 13 หลัก'),
      spacer(),


      // ===== PART 2 =====
      h1('ส่วนที่ 2  การอนุมัติสมาชิก (แอดมิน)'),
      spacer(),

      h2('การเข้าสู่ระบบแอดมิน'),
      h3('ขั้นตอน:'),
      bullet('เปิดหน้า Admin Dashboard ในเบราว์เซอร์'),
      bullet('กรอก ชื่อผู้ใช้งาน และ รหัสผ่าน ที่มีสิทธิ์ระดับแอดมิน'),
      bullet('กดปุ่ม  "เข้าสู่ระบบ Admin"'),
      spacer(),

      note('หากพบข้อความ "คุณไม่มีสิทธิ์เข้าถึงหน้านี้" แสดงว่าบัญชีดังกล่าวไม่ใช่ระดับ Admin กรุณาติดต่อผู้ดูแลระบบ'),
      spacer(),

      h2('หน้าจัดการผู้ใช้งาน'),
      body('หลังเข้าสู่ระบบ ให้คลิกเมนู  "จัดการผู้ใช้งาน"  ในแถบเมนูด้านซ้าย ตารางจะแสดงรายชื่อผู้ใช้ทั้งหมดที่รออนุมัติ (สถานะ "รอตรวจสอบ")'),
      spacer(),

      makeTable(
        ['คอลัมน์', 'ข้อมูลที่แสดง'],
        [
          ['ชื่อ / เบอร์โทร', 'ชื่อ-นามสกุล และเบอร์โทรศัพท์ของผู้สมัคร'],
          ['หน่วยงาน',        'ชื่อหน่วยงาน / รพ.สต. / ตำบล-หมู่บ้านที่สังกัด'],
          ['สถานะ',           '"รอตรวจสอบ" (สีส้ม) หรือ "อนุมัติแล้ว" (สีเขียว)'],
          ['จัดการ',          'ปุ่มอนุมัติ และ ปุ่มยกเลิกคำขอ'],
        ]
      ),
      spacer(),

      h2('การอนุมัติสมาชิก'),
      bullet('1.  ตรวจสอบข้อมูลผู้สมัครในตาราง (ชื่อ, เบอร์, หน่วยงาน)'),
      bullet('2.  กดปุ่ม  "อนุมัติ"  (สีดำ) ที่แถวของผู้สมัครท่านนั้น'),
      bullet('3.  ระบบจะแสดง popup ยืนยัน — กด "OK" เพื่อยืนยัน หรือ "ยกเลิก" เพื่อยกเลิก'),
      bullet('4.  รอสักครู่ ปุ่มจะแสดง "กำลังอนุมัติ..." จนกระบวนการเสร็จสิ้น'),
      bullet('5.  รายชื่อนั้นจะหายออกจากรายการ แสดงว่าอนุมัติสำเร็จแล้ว'),
      spacer(),

      note('ขณะที่กำลังอนุมัติรายการหนึ่ง ปุ่มในแถวอื่น ๆ จะถูกซ่อนชั่วคราวเพื่อป้องกันการกดซ้ำ'),
      spacer(),

      h2('การยกเลิกคำขอสมัคร'),
      bullet('1.  กดปุ่ม  "ยกเลิกคำขอ"  (ไอคอนถังขยะ สีแดง) ที่แถวของผู้สมัครท่านนั้น'),
      bullet('2.  ระบบจะแสดง popup ยืนยัน พร้อมชื่อผู้สมัคร — กด "OK" เพื่อยืนยัน'),
      bullet('3.  ผู้ใช้งานนั้นจะถูกลบออกจากระบบทันที ไม่สามารถกู้คืนได้'),
      spacer(),

      note('การยกเลิกคำขอจะลบข้อมูลผู้ใช้ออกจากระบบถาวร ผู้สมัครต้องกรอกข้อมูลใหม่อีกครั้งหากต้องการสมัครใหม่'),
      spacer(),

      h2('ฟังก์ชันอื่น ๆ บนหน้าจัดการผู้ใช้'),
      makeTable(
        ['ฟังก์ชัน', 'วิธีใช้', 'หมายเหตุ'],
        [
          ['รีเฟรชข้อมูล', 'กดปุ่ม "รีเฟรชข้อมูล" มุมขวาบน', 'โหลดรายชื่อล่าสุดจากเซิร์ฟเวอร์'],
          ['ค้นหา',        'พิมพ์ชื่อหรือเบอร์โทรในช่องค้นหา', 'กรองรายการแบบ Real-time'],
        ]
      ),
      spacer(),

      h2('เมนูอื่น ๆ ในระบบแอดมิน'),
      makeTable(
        ['เมนู', 'หน้าที่'],
        [
          ['จัดการผู้ใช้งาน',   'อนุมัติ / ยกเลิกคำขอสมัครสมาชิก'],
          ['ตารางประเมิน SMI-V', 'ดูและจัดการผลประเมินสุขภาพจิต (SMI-V)'],
          ['Spot Map',          'ดูแผนที่จุดเฝ้าระวังในพื้นที่'],
        ]
      ),
      spacer(),

      note('กดปุ่ม "ออกจากระบบ" ที่ด้านล่างของแถบเมนูซ้ายทุกครั้งหลังใช้งานเสร็จ เพื่อความปลอดภัย'),
      spacer(),

    ]
  }]
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('SafeMind_Manual.docx', buffer);
console.log('Created SafeMind_Manual.docx');
