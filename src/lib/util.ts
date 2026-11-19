const BN = '০১২৩৪৫৬৭৮৯';

export function toBnDigits(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => BN[Number(d)]);
}

export function asciiDigits(s: string): string {
  return s.replace(/[০-৯]/g, (c) => String(BN.indexOf(c)));
}

/** Bangladesh mobile: 01XXXXXXXXX (accepts Bangla digits, +880, spaces). */
export function normalizePhone(raw: string): string {
  let s = asciiDigits(raw).replace(/[^0-9+]/g, '');
  if (s.startsWith('+880')) s = '0' + s.slice(4);
  if (s.startsWith('880') && s.length === 13) s = '0' + s.slice(3);
  return s;
}

export function isValidPhone(raw: string): boolean {
  return /^01[3-9][0-9]{8}$/.test(normalizePhone(raw));
}

export function timeAgo(d: Date | null | undefined, en: boolean): string {
  if (!d) return '';
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  const f = (n: number) => (en ? String(n) : toBnDigits(n));
  if (s < 60) return en ? 'just now' : 'এইমাত্র';
  if (s < 3600) return en ? `${f(Math.floor(s / 60))}m ago` : `${f(Math.floor(s / 60))} মিনিট আগে`;
  if (s < 86400) return en ? `${f(Math.floor(s / 3600))}h ago` : `${f(Math.floor(s / 3600))} ঘণ্টা আগে`;
  if (s < 86400 * 30) return en ? `${f(Math.floor(s / 86400))}d ago` : `${f(Math.floor(s / 86400))} দিন আগে`;
  return d.toLocaleDateString(en ? 'en-GB' : 'bn-BD');
}

export function colorFromName(name: string): string {
  const palette = ['#E8590C', '#2B7FD9', '#1E8C4F', '#8A5A2B', '#6A4CE0', '#D9468F', '#0FA3B8', '#D99A14'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

export function cx(...a: Array<string | false | null | undefined>): string {
  return a.filter(Boolean).join(' ');
}

const BAD = ['fuck', 'shit', 'bitch', 'মাদারচোদ', 'চোদ', 'বাল', 'হারামি', 'শুয়োর'];
export function hasBadWords(t: string): boolean {
  const x = t.toLowerCase();
  return BAD.some((w) => x.includes(w));
}

export function friendlyError(e: unknown, en: boolean): string {
  const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : '';
  if (code.includes('permission-denied')) return en ? 'Not allowed. Please sign in again.' : 'অনুমতি নেই। আবার লগইন করুন।';
  if (code.includes('unavailable') || code.includes('network')) return en ? 'No internet connection.' : 'ইন্টারনেট সংযোগ নেই।';
  if (code.includes('popup-closed') || code.includes('cancelled')) return en ? 'Cancelled.' : 'বাতিল করা হয়েছে।';
  if (e === 'phone_used') return en ? 'This phone number is already used by another account.' : 'এই ফোন নম্বর অন্য অ্যাকাউন্টে আছে।';
  if (e === 'phone_banned') return en ? 'This number cannot be used. Contact support.' : 'এই নম্বর ব্যবহার করা যাবে না। সাপোর্টে যোগাযোগ করুন।';
  if (typeof e === 'string') return e;
  return en ? 'Something went wrong. Please try again.' : 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।';
}
