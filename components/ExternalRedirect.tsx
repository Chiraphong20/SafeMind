import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ExternalRedirectProps {
  lineUserId: string;
  targetPath: string; // e.g. "telehealth/pcu", "dashboard"
}

// target path → URL หน้าปลายทางใน sm_FontEnd
const TARGET_MAP: Record<string, string> = {
  login:    '/dashboard',
  pin:      '/smiv-dashboard',
  save:     '/patient-check/record',
  check:    '/patient-check/record',
  calendar: '/clinic',
  tele:     '/telehealth-auto',
  report:   '/patient-report-error',
};

const SM_BASE = 'https://safemind-ai.net:8080';

export default function ExternalRedirect({ lineUserId, targetPath }: ExternalRedirectProps) {
  useEffect(() => {
    if (!lineUserId) return;
    const smTarget = TARGET_MAP[targetPath] ?? '/dashboard';
    const url = `${SM_BASE}/line-auth?lineUserId=${encodeURIComponent(lineUserId)}&target=${encodeURIComponent(smTarget)}`;
    window.location.href = url;
  }, [lineUserId, targetPath]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-teal-600">
      <Loader2 className="w-10 h-10 animate-spin mb-3" />
      <p className="text-sm text-slate-400 animate-pulse">กำลังเชื่อมต่อระบบ...</p>
    </div>
  );
}
