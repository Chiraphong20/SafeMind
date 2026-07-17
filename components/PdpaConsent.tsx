import React, { useState } from 'react';

interface Props {
  onAccept: () => void;
  onReject: () => void;
}

export default function PdpaConsent({ onAccept, onReject }: Props) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* Page title */}
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-xl font-bold text-slate-800">เอกสารแสดงความยินยอม</h1>
      </div>

      {/* Card */}
      <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1">

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4 text-sm text-slate-700 leading-relaxed">

          {/* Title */}
          <div>
            <h2 className="font-bold text-base text-slate-900 leading-snug mb-3">
              นโยบายความเป็นส่วนตัว (Privacy Notice)<br />
              ระบบ SafeMind AI · โรงพยาบาลปากช่องนานา
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold">มีผลบังคับใช้:</span> 1 สิงหาคม 2569 ·{' '}
              <span className="font-semibold">ผู้ควบคุมข้อมูลส่วนบุคคล:</span> โรงพยาบาลปากช่องนานา
            </p>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            การกดปุ่ม <span className="font-semibold">"ยินยอม"</span> ถือว่าคุณได้อ่าน เข้าใจ และตกลง
            ผูกพันตามนโยบายนี้ รวมถึงให้ความยินยอมในการเก็บ ใช้ และเปิดเผยข้อมูลส่วนบุคคล
            หากคุณไม่ยินยอม ขอให้ยุติการสมัครใช้งานระบบนี้
          </p>

          <hr className="border-slate-100" />

          {/* 1 */}
          <section>
            <h3 className="font-bold text-slate-800 mb-2">1. บทนำและวัตถุประสงค์</h3>
            <p className="text-sm text-slate-600">
              โรงพยาบาลปากช่องนานา ตระหนักและให้ความสำคัญต่อการคุ้มครองข้อมูลส่วนบุคคล
              นโยบายฉบับนี้ชี้แจงการเก็บรวบรวม การใช้ และการเปิดเผยข้อมูลของผู้ใช้งานระบบ
              SafeMind AI ซึ่งเป็นระบบสนับสนุนการดูแลผู้ป่วยจิตเวชกลุ่มเสี่ยงในชุมชน
              ภายใต้ พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) และกฎหมายที่เกี่ยวข้อง
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* 2 */}
          <section>
            <h3 className="font-bold text-slate-800 mb-2">2. ผู้ควบคุมและผู้ประมวลผลข้อมูล</h3>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold text-slate-700">ผู้ควบคุมข้อมูลส่วนบุคคล (Data Controller):</span>{' '}
              โรงพยาบาลปากช่องนานา โดยกลุ่มภารกิจสุขภาพดิจิทัล
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-700">ผู้ประมวลผลข้อมูลส่วนบุคคล (Data Processor):</span>{' '}
              ห้างหุ้นส่วนจำกัด เมเนเจอร์ ซัพพลาย ในฐานะผู้พัฒนาระบบ ดำเนินการตามขอบเขต
              ข้อตกลงการประมวลผลข้อมูล (DPA) ที่กำหนดโดยโรงพยาบาลเท่านั้น
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* 3 */}
          <section>
            <h3 className="font-bold text-slate-800 mb-2">3. ข้อมูลส่วนบุคคลที่เก็บรวบรวม</h3>
            <div className="space-y-1.5 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-700">ข้อมูลระบุตัวตน:</span> ชื่อ-นามสกุล, เลขบัตรประชาชน, วันเกิด, เพศ, รูปถ่าย</p>
              <p><span className="font-semibold text-slate-700">ข้อมูลการติดต่อ:</span> ที่อยู่, หมายเลขโทรศัพท์, อีเมล</p>
              <p><span className="font-semibold text-slate-700">ข้อมูลบัญชีผู้ใช้:</span> Username, Role, ประวัติล็อกอิน, Audit Log</p>
              <p><span className="font-semibold text-slate-700">ข้อมูลสุขภาพจิต (ข้อมูลอ่อนไหว):</span> ประวัติการเจ็บป่วย, ผลประเมิน SMI-V, บันทึกเยี่ยมบ้าน, บันทึก Telehealth, ตารางนัดหมาย</p>
              <p><span className="font-semibold text-slate-700">ข้อมูลทางเทคนิค:</span> Log Files, IP Address, Device ID, Browser Type</p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 4 */}
          <section>
            <h3 className="font-bold text-slate-800 mb-2">4. วัตถุประสงค์ในการประมวลผลข้อมูล</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
              <li>การให้บริการทางการแพทย์และติดตามผู้ป่วยจิตเวชกลุ่มเสี่ยง (SMI-V)</li>
              <li>การบริหารจัดการนัดหมาย เยี่ยมบ้าน และบริการ Telemedicine</li>
              <li>การยืนยันตัวตนและควบคุมสิทธิ์ตามบทบาทหน้าที่ (RBAC)</li>
              <li>การพัฒนาระบบ AI เพื่อการประเมินความเสี่ยงทางการแพทย์</li>
              <li>การปฏิบัติตามกฎหมายด้านความมั่นคงปลอดภัยสารสนเทศและสาธารณสุข</li>
            </ol>
          </section>

          <hr className="border-slate-100" />

          {/* 5 */}
          <section>
            <h3 className="font-bold text-slate-800 mb-2">5. ฐานทางกฎหมายในการประมวลผล (Legal Basis)</h3>
            <p className="text-sm text-slate-600 mb-1.5">
              <span className="font-semibold text-slate-700">ข้อมูลทั่วไป:</span>{' '}
              อาศัยฐานการปฏิบัติหน้าที่ตามกฎหมาย (Legal Obligation) และฐานประโยชน์สาธารณะ (Public Task)
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-700">ข้อมูลสุขภาพจิต (ข้อมูลอ่อนไหว):</span>{' '}
              อาศัยข้อยกเว้น มาตรา 26 PDPA ได้แก่ ฐานการบำบัดรักษาทางการแพทย์,
              ฐานประโยชน์สาธารณะด้านสาธารณสุข และฐานการป้องกันอันตรายต่อชีวิต
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* 6 */}
          <section>
            <h3 className="font-bold text-slate-800 mb-2">6. การเปิดเผยและส่งต่อข้อมูล</h3>
            <div className="space-y-1 text-sm text-slate-600">
              <p>· บุคลากรทางการแพทย์ภายในโรงพยาบาลและเครือข่าย รพ.สต. ที่มีหน้าที่เกี่ยวข้อง</p>
              <p>· ผู้พัฒนาระบบภายใต้ข้อตกลง DPA อย่างเคร่งครัด</p>
              <p>· หน่วยงานรัฐตามที่กฎหมายหรือคำสั่งศาลกำหนด</p>
              <p className="text-red-600 font-medium mt-2">
                โรงพยาบาลและผู้พัฒนาระบบจะไม่เปิดเผยหรือขายข้อมูลเพื่อวัตถุประสงค์ทางการค้าโดยเด็ดขาด
              </p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 7 */}
          <section>
            <h3 className="font-bold text-slate-800 mb-2">7. ระยะเวลาในการเก็บรักษาข้อมูล</h3>
            <div className="space-y-1 text-sm text-slate-600">
              <p>· <span className="font-semibold text-slate-700">ข้อมูลประวัติการรักษา:</span> อย่างน้อย 5 ปี นับจากการรักษาครั้งสุดท้าย</p>
              <p>· <span className="font-semibold text-slate-700">บันทึกการใช้งานระบบ (Audit Log):</span> ไม่น้อยกว่า 90 วัน ตาม พ.ร.บ.คอมพิวเตอร์</p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 8 */}
          <section>
            <h3 className="font-bold text-slate-800 mb-2">8. สิทธิของเจ้าของข้อมูลส่วนบุคคล</h3>
            <div className="space-y-1 text-sm text-slate-600">
              <p>· สิทธิขอเข้าถึงและรับสำเนาข้อมูล (Right of Access)</p>
              <p>· สิทธิขอแก้ไขข้อมูลให้ถูกต้อง (Right to Rectification)</p>
              <p>· สิทธิขอให้ลบหรือทำลายข้อมูล (Right to Erasure)</p>
              <p>· สิทธิขอให้ระงับการใช้ข้อมูลชั่วคราว (Right to Restriction)</p>
              <p>· สิทธิในการขอโอนย้ายข้อมูล (Right to Data Portability)</p>
              <p>· สิทธิในการคัดค้านการประมวลผล (Right to Object)</p>
              <p>· สิทธิในการถอนความยินยอม (Right to Withdraw Consent)</p>
              <p>· สิทธิในการร้องเรียนต่อ สคส. (Right to Complain)</p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 9 */}
          <section>
            <h3 className="font-bold text-slate-800 mb-2">9. มาตรการรักษาความมั่นคงปลอดภัย</h3>
            <div className="space-y-1 text-sm text-slate-600">
              <p>· เข้ารหัสข้อมูลด้วย HTTPS / TLS 1.3 ตลอดการสื่อสาร</p>
              <p>· ยืนยันตัวตนผ่าน LINE OA + Username/Password พร้อมควบคุมสิทธิ์ตามบทบาท (RBAC)</p>
              <p>· บันทึก Audit Log การเข้าถึงและเปลี่ยนแปลงข้อมูลทุกครั้ง</p>
              <p>· ระบบ HCI 3-Node Cluster สำรองข้อมูลอัตโนมัติ พร้อม Disaster Recovery Plan</p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 10 */}
          <section>
            <h3 className="font-bold text-slate-800 mb-2">10. ช่องทางการติดต่อ</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-700">ผู้ควบคุมข้อมูลส่วนบุคคล / DPO</p>
                <p>โรงพยาบาลปากช่องนานา (กลุ่มงานสุขภาพดิจิทัล)</p>
                <p>โทรศัพท์: 044-311856 ต่อ 341, 342</p>
                <p>อีเมล: <span className="text-blue-600">pnnh_r9@moph.go.th</span></p>
                <p>อีเมล DPO: <span className="text-blue-600">itpakchongnana496@gmail.com</span></p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">ผู้พัฒนาระบบ (Data Processor)</p>
                <p>ห้างหุ้นส่วนจำกัด เมเนเจอร์ ซัพพลาย</p>
                <p>โทรศัพท์: 081-878-7175</p>
                <p>อีเมล: <span className="text-blue-600">systemitjo@gmail.com</span></p>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 11 */}
          <section>
            <h3 className="font-bold text-slate-800 mb-2">11. การเปลี่ยนแปลงนโยบาย</h3>
            <p className="text-sm text-slate-600">
              โรงพยาบาลอาจปรับปรุงนโยบายนี้เป็นครั้งคราว โดยจะระบุวันที่มีผลบังคับใช้ล่าสุดไว้เสมอ
              หากมีการเปลี่ยนแปลงสาระสำคัญ โรงพยาบาลจะแจ้งให้ท่านทราบและขอความยินยอมใหม่
              ผ่านระบบ SafeMind AI
            </p>
          </section>

          {/* Bottom spacing */}
          <div className="h-2" />
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200" />

        {/* Fixed bottom: checkbox + buttons */}
        <div className="px-5 py-4 bg-white space-y-3">

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setChecked(v => !v)}
              className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                checked ? 'bg-[#1a3d6b] border-[#1a3d6b]' : 'bg-white border-slate-300'
              }`}
            >
              {checked && (
                <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm text-slate-700 leading-snug">
              ข้าพเจ้าได้อ่านและยอมรับเงื่อนไขและนโยบายคุ้มครองข้อมูลส่วนบุคคลแล้ว
            </span>
          </label>

          {/* ยินยอม button */}
          <button
            onClick={onAccept}
            disabled={!checked}
            className={`w-full py-3.5 rounded-xl text-base font-semibold transition-colors ${
              checked
                ? 'bg-[#1a3d6b] text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            ยินยอม
          </button>

          {/* ไม่ยินยอม link */}
          <button
            onClick={onReject}
            className="w-full py-1.5 text-center text-base font-medium text-blue-600"
          >
            ไม่ยินยอม
          </button>
        </div>
      </div>
    </div>
  );
}
