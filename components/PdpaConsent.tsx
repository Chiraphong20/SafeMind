import React, { useRef, useState } from 'react';
import { ShieldCheck, X, ChevronDown, Phone, Mail } from 'lucide-react';

interface Props {
  onAccept: () => void;
  onReject: () => void;
}

export default function PdpaConsent({ onAccept, onReject }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    if (atBottom) setScrolledToBottom(true);
  }

  const canAccept = scrolledToBottom && checked;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-6 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="bg-[#0B3D6B] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <p className="text-sky-300 text-xs font-bold tracking-wide">🧠 SafeMind AI</p>
              <h1 className="text-white font-bold text-base leading-tight">นโยบายความเป็นส่วนตัว</h1>
              <p className="text-sky-200 text-xs mt-0.5">โรงพยาบาลปากช่องนานา · มีผลบังคับใช้ 1 ส.ค. 2569</p>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-start gap-2">
          <span className="text-amber-500 text-base mt-0.5 shrink-0">⚠️</span>
          <p className="text-amber-800 text-xs leading-relaxed">
            กรุณาอ่านนโยบายความเป็นส่วนตัวด้านล่างให้ครบถ้วนก่อนสมัครใช้งาน
            หากท่านไม่ยอมรับเงื่อนไข ระบบจะไม่สามารถดำเนินการต่อได้
          </p>
        </div>

        {/* Scroll indicator */}
        {!scrolledToBottom && (
          <div className="flex items-center justify-center gap-1.5 py-2 bg-blue-50 border-b border-blue-100">
            <ChevronDown className="w-3.5 h-3.5 text-blue-500 animate-bounce" />
            <span className="text-blue-600 text-xs font-medium">เลื่อนลงเพื่ออ่านให้ครบ</span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-500 animate-bounce" />
          </div>
        )}

        {/* Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-[52vh] overflow-y-auto px-5 py-4 text-slate-700 text-sm leading-relaxed space-y-4"
        >
          {/* 1 */}
          <section>
            <h2 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="text-[#0B3D6B]">1.</span> บทนำและวัตถุประสงค์
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              โรงพยาบาลปากช่องนานา ตระหนักและให้ความสำคัญอย่างยิ่งต่อการคุ้มครองข้อมูลส่วนบุคคลและการรักษาความลับของผู้ป่วย
              ผู้รับบริการ และผู้ใช้งานระบบสารสนเทศ นโยบายฉบับนี้จัดทำขึ้นเพื่อชี้แจงการเก็บรวบรวม การใช้ การเปิดเผย
              และการคุ้มครองข้อมูลส่วนบุคคลของผู้ใช้งานระบบ SafeMind AI ซึ่งเป็นระบบปัญญาประดิษฐ์เพื่อสนับสนุนการดูแล
              ติดตาม และเฝ้าระวังผู้ป่วยจิตเวชกลุ่มเสี่ยงในชุมชน ภายใต้ พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
              และกฎหมายอื่นที่เกี่ยวข้อง
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="text-[#0B3D6B]">2.</span> ผู้ควบคุมและผู้ประมวลผลข้อมูล
            </h2>
            <div className="space-y-1.5">
              <div className="bg-blue-50 rounded-lg p-3 text-xs">
                <p className="font-semibold text-blue-800 mb-0.5">ผู้ควบคุมข้อมูลส่วนบุคคล (Data Controller)</p>
                <p className="text-blue-700">โรงพยาบาลปากช่องนานา — กลุ่มภารกิจสุขภาพดิจิทัล</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-xs">
                <p className="font-semibold text-slate-700 mb-0.5">ผู้ประมวลผลข้อมูลส่วนบุคคล (Data Processor)</p>
                <p className="text-slate-600">ห้างหุ้นส่วนจำกัด เมเนเจอร์ ซัพพลาย — ผู้พัฒนาระบบ ดำเนินการตามขอบเขต DPA ที่กำหนดโดยโรงพยาบาลเท่านั้น</p>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="text-[#0B3D6B]">3.</span> ข้อมูลส่วนบุคคลที่เก็บรวบรวม
            </h2>
            <div className="space-y-1.5">
              {[
                { label: 'ข้อมูลระบุตัวตน', detail: 'ชื่อ-นามสกุล, เลขบัตรประชาชน, วันเกิด, เพศ, รูปถ่าย' },
                { label: 'ข้อมูลการติดต่อ', detail: 'ที่อยู่, หมายเลขโทรศัพท์, อีเมล' },
                { label: 'ข้อมูลบัญชีผู้ใช้', detail: 'Username, Role, ประวัติล็อกอิน, Audit Log' },
                { label: 'ข้อมูลสุขภาพจิต (ข้อมูลอ่อนไหว)', detail: 'ประวัติการเจ็บป่วย, ผลประเมิน SMI-V, บันทึกเยี่ยมบ้าน, บันทึก Telehealth, ตารางนัดหมาย' },
                { label: 'ข้อมูลทางเทคนิค', detail: 'Log Files, IP Address, Device ID, Browser Type' },
              ].map(({ label, detail }) => (
                <div key={label} className="flex gap-2 text-xs">
                  <span className="shrink-0 mt-0.5 text-[#0B3D6B]">▸</span>
                  <div><span className="font-semibold text-slate-700">{label}:</span>{' '}<span className="text-slate-600">{detail}</span></div>
                </div>
              ))}
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="text-[#0B3D6B]">4.</span> วัตถุประสงค์ในการประมวลผลข้อมูล
            </h2>
            <ol className="space-y-1 text-xs text-slate-600 list-decimal list-inside">
              <li>การให้บริการทางการแพทย์และติดตามผู้ป่วยจิตเวชกลุ่มเสี่ยง (SMI-V)</li>
              <li>การบริหารจัดการระบบสาธารณสุข นัดหมาย เยี่ยมบ้าน และ Telemedicine</li>
              <li>การยืนยันตัวตนและควบคุมสิทธิ์ตามบทบาทหน้าที่ (RBAC)</li>
              <li>การพัฒนาระบบ AI เพื่อการประเมินความเสี่ยงทางการแพทย์</li>
              <li>การปฏิบัติตามกฎหมายด้านความมั่นคงปลอดภัยสารสนเทศและสาธารณสุข</li>
            </ol>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="text-[#0B3D6B]">5.</span> ฐานทางกฎหมายในการประมวลผล (Legal Basis)
            </h2>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="font-semibold text-slate-700 mb-1">ข้อมูลทั่วไป</p>
                <p className="text-slate-600">อาศัยฐานการปฏิบัติหน้าที่ตามกฎหมาย (Legal Obligation) และฐานประโยชน์สาธารณะ (Public Task)</p>
              </div>
              <div className="bg-rose-50 rounded-lg p-3">
                <p className="font-semibold text-rose-700 mb-1">ข้อมูลสุขภาพจิต (ข้อมูลอ่อนไหว)</p>
                <p className="text-rose-600">อาศัยข้อยกเว้น มาตรา 26 PDPA ได้แก่ ฐานการบำบัดรักษาทางการแพทย์, ฐานประโยชน์สาธารณะด้านสาธารณสุข และฐานการป้องกันอันตรายต่อชีวิต</p>
              </div>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="text-[#0B3D6B]">6.</span> การเปิดเผยและส่งต่อข้อมูล
            </h2>
            <div className="space-y-1 text-xs text-slate-600">
              <p className="flex gap-2"><span className="shrink-0 text-[#0B3D6B]">▸</span>บุคลากรทางการแพทย์ภายในโรงพยาบาลและเครือข่าย รพ.สต. ที่มีหน้าที่เกี่ยวข้องโดยตรง</p>
              <p className="flex gap-2"><span className="shrink-0 text-[#0B3D6B]">▸</span>ผู้พัฒนาระบบ (ห้างหุ้นส่วนจำกัด เมเนเจอร์ ซัพพลาย) ภายใต้ข้อตกลง DPA อย่างเคร่งครัด</p>
              <p className="flex gap-2"><span className="shrink-0 text-[#0B3D6B]">▸</span>หน่วยงานรัฐตามที่กฎหมายหรือคำสั่งศาลกำหนด</p>
              <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2.5">
                <p className="text-red-700 font-semibold text-xs">🚫 ข้อห้ามสำคัญ:</p>
                <p className="text-red-600 text-xs mt-0.5">โรงพยาบาลและผู้พัฒนาระบบ จะไม่เปิดเผย ส่งต่อ หรือขายข้อมูลส่วนบุคคลเพื่อวัตถุประสงค์ทางการค้าโดยเด็ดขาด</p>
              </div>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="text-[#0B3D6B]">7.</span> ระยะเวลาในการเก็บรักษาข้อมูล
            </h2>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex gap-2"><span className="shrink-0 text-[#0B3D6B]">▸</span><span><span className="font-medium text-slate-700">ข้อมูลประวัติการรักษา:</span> อย่างน้อย 5 ปี นับจากการรักษาครั้งสุดท้าย</span></div>
              <div className="flex gap-2"><span className="shrink-0 text-[#0B3D6B]">▸</span><span><span className="font-medium text-slate-700">บันทึกการใช้งานระบบ (Audit Log):</span> ไม่น้อยกว่า 90 วัน ตาม พ.ร.บ.คอมพิวเตอร์</span></div>
              <p className="text-slate-500 text-xs mt-1">เมื่อพ้นกำหนดระยะเวลา โรงพยาบาลจะลบหรือทำให้ข้อมูลไม่สามารถระบุตัวบุคคลได้ (Anonymization)</p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="text-[#0B3D6B]">8.</span> สิทธิของเจ้าของข้อมูลส่วนบุคคล
            </h2>
            <div className="grid grid-cols-1 gap-1 text-xs">
              {[
                'สิทธิขอเข้าถึงและรับสำเนาข้อมูล (Right of Access)',
                'สิทธิขอแก้ไขข้อมูลให้ถูกต้อง (Right to Rectification)',
                'สิทธิขอให้ลบหรือทำลายข้อมูล (Right to Erasure)',
                'สิทธิขอให้ระงับการใช้ข้อมูลชั่วคราว (Right to Restriction)',
                'สิทธิในการขอโอนย้ายข้อมูล (Right to Data Portability)',
                'สิทธิในการคัดค้านการประมวลผล (Right to Object)',
                'สิทธิในการถอนความยินยอม (Right to Withdraw Consent)',
                'สิทธิในการร้องเรียนต่อ สคส. (Right to Complain)',
              ].map(r => (
                <div key={r} className="flex items-start gap-1.5 text-slate-600">
                  <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="text-[#0B3D6B]">9.</span> มาตรการรักษาความมั่นคงปลอดภัย
            </h2>
            <div className="space-y-1 text-xs text-slate-600">
              {[
                'เข้ารหัสข้อมูลด้วย HTTPS / TLS 1.3 ตลอดการสื่อสาร',
                'ยืนยันตัวตนผ่าน LINE OA + Username/Password พร้อมควบคุมสิทธิ์ตามบทบาท (RBAC)',
                'บันทึก Audit Log การเข้าถึงและเปลี่ยนแปลงข้อมูลทุกครั้ง',
                'ระบบ HCI 3-Node Cluster สำรองข้อมูลอัตโนมัติ พร้อม Disaster Recovery Plan',
              ].map(m => (
                <div key={m} className="flex gap-2">
                  <span className="shrink-0 text-sky-500">🔒</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 10 */}
          <section>
            <h2 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="text-[#0B3D6B]">10.</span> ช่องทางการติดต่อ
            </h2>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-slate-700">ผู้ควบคุมข้อมูล / DPO</p>
                <p className="text-slate-600">โรงพยาบาลปากช่องนานา (กลุ่มงานสุขภาพดิจิทัล)</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  <span className="flex items-center gap-1 text-slate-500"><Mail className="w-3 h-3" />pnnh_r9@moph.go.th</span>
                  <span className="flex items-center gap-1 text-slate-500"><Phone className="w-3 h-3" />044-311856 ต่อ 341,342</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-slate-500"><Mail className="w-3 h-3" />itpakchongnana496@gmail.com (DPO)</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-slate-700">ผู้พัฒนาระบบ (Data Processor)</p>
                <p className="text-slate-600">ห้างหุ้นส่วนจำกัด เมเนเจอร์ ซัพพลาย</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  <span className="flex items-center gap-1 text-slate-500"><Mail className="w-3 h-3" />systemitjo@gmail.com</span>
                  <span className="flex items-center gap-1 text-slate-500"><Phone className="w-3 h-3" />081-878-7175</span>
                </div>
              </div>
            </div>
          </section>

          {/* 11 */}
          <section>
            <h2 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="text-[#0B3D6B]">11.</span> การเปลี่ยนแปลงนโยบาย
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              โรงพยาบาลอาจปรับปรุงนโยบายนี้เป็นครั้งคราว โดยจะระบุวันที่มีผลบังคับใช้ล่าสุดไว้เสมอ
              หากมีการเปลี่ยนแปลงสาระสำคัญ โรงพยาบาลจะแจ้งให้ท่านทราบและขอความยินยอมใหม่ผ่านระบบ SafeMind AI
            </p>
          </section>

          {/* Bottom padding */}
          <div className="h-4" />
        </div>

        {/* Checkbox + Buttons */}
        <div className="border-t border-slate-100 bg-white px-5 py-4 space-y-3">
          {/* Checkbox consent */}
          <label className={`flex items-start gap-3 cursor-pointer rounded-xl border p-3 transition-all ${checked ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
            <div
              onClick={() => setChecked(v => !v)}
              className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}
            >
              {checked && (
                <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-xs text-slate-700 leading-relaxed">
              ข้าพเจ้าได้อ่านและเข้าใจ<span className="font-semibold text-slate-800">นโยบายความเป็นส่วนตัว</span>ของระบบ SafeMind AI
              โรงพยาบาลปากช่องนานา และ<span className="font-semibold text-slate-800">ยินยอมให้โรงพยาบาลประมวลผลข้อมูลส่วนบุคคล</span>ของข้าพเจ้า
              ตามวัตถุประสงค์และเงื่อนไขที่กำหนดไว้ข้างต้นทุกประการ
            </span>
          </label>

          {!scrolledToBottom && (
            <p className="text-center text-xs text-slate-400">เลื่อนอ่านให้ครบก่อนกดยอมรับ</p>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onReject}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" />
              ไม่ยอมรับ
            </button>
            <button
              onClick={onAccept}
              disabled={!canAccept}
              className={`flex-[2] flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all ${
                canAccept
                  ? 'bg-[#0B3D6B] text-white hover:bg-[#0a3360] shadow-md'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              ยอมรับและดำเนินการต่อ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
