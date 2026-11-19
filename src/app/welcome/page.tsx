'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useArea } from '@/lib/area-ctx';
import { areaLabel, profileComplete, type AreaSel } from '@/lib/types';
import { createUserDoc, saveRequiredProfile } from '@/lib/services';
import { friendlyError, isValidPhone, normalizePhone } from '@/lib/util';
import { LoginCard, SetupNotice } from '@/components/AuthGate';
import AreaPicker from '@/components/AreaPicker';
import { Field, Spinner, PageTitle } from '@/components/ui';
import { cx } from '@/lib/util';

/** First visit: choose a role and fill the required profile (once). */
export default function Welcome() {
  const { t, en } = useLang();
  const { configured, loading, fbUser, me, meReady } = useAuth();
  const { area: browseArea } = useArea();
  const router = useRouter();
  const [role, setRole] = useState<'client' | 'worker'>('client');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addr, setAddr] = useState('');
  const [area, setArea] = useState<AreaSel | null>(null);
  const [agree, setAgree] = useState(false);
  const [pick, setPick] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (fbUser && !name) setName(fbUser.displayName ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbUser]);
  useEffect(() => {
    if (me) {
      setName((x) => x || me.name);
      setPhone((x) => x || me.phone);
      setAddr((x) => x || me.address);
      setArea((x) => x ?? me.area);
    } else if (browseArea) setArea((x) => x ?? browseArea);
  }, [me, browseArea]);
  useEffect(() => {
    if (me && profileComplete(me)) router.replace(me.role === 'worker' ? '/become-worker/' : '/');
  }, [me, router]);

  if (!configured) return <SetupNotice />;
  if (loading || (fbUser && !meReady)) return <Spinner className="py-24" />;
  if (!fbUser) return <LoginCard />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = normalizePhone(phone);
    if (name.trim().length < 3) return setErr(t('পূর্ণ নাম লিখুন।', 'Enter your full name.'));
    if (!isValidPhone(p)) return setErr(t('সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।', 'Enter a valid mobile number (01XXXXXXXXX).'));
    if (!area) return setErr(t('আপনার এলাকা বেছে নিন।', 'Choose your area.'));
    if (addr.trim().length < 5) return setErr(t('ঠিকানা লিখুন।', 'Enter your address.'));
    if (!agree) return setErr(t('শর্তাবলী মেনে নিতে টিক দিন।', 'Please accept the terms.'));
    setBusy(true);
    setErr('');
    try {
      const u = fbUser!;
      if (!me) await createUserDoc(u.uid, name.trim(), u.email ?? '', role);
      await saveRequiredProfile({ uid: u.uid, oldPhone: me?.phone, name: name.trim(), phone: p, address: addr.trim(), area });
      // the Gate redirects once the profile document updates
    } catch (e2) {
      setErr(friendlyError(e2, en));
      setBusy(false);
    }
  }

  const roleCard = (r: 'client' | 'worker', icon: string, title: string, sub: string) => (
    <button type="button" onClick={() => !me && setRole(r)} className={cx('card flex items-center gap-3 p-4 text-left transition', (me ? me.role : role) === r ? 'border-brand ring-2 ring-brand/30' : '')}>
      <span className="text-3xl">{icon}</span>
      <span className="flex-1"><b className="block text-[16.5px]">{title}</b><span className="text-[13.5px] text-muted">{sub}</span></span>
      <span className={(me ? me.role : role) === r ? 'text-brand' : 'text-line'}>{(me ? me.role : role) === r ? '●' : '○'}</span>
    </button>
  );

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title={t('অ্যাকাউন্ট তৈরি', 'Create account')} sub={t('এই তথ্য শুধু একবারই লাগবে। ফোন নম্বর কারও কাছে দেখানো হয় না।', 'Asked only once. Your number is never shown to others.')} />
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {roleCard('client', '🔎', t('আমি কারিগর খুঁজছি', 'I need a worker'), t('গ্রাহক', 'Client'))}
          {roleCard('worker', '🛠️', t('আমি কারিগর', 'I am a worker'), t('ফ্রি যুক্ত হয়ে কাজ পান', 'Join free and get jobs'))}
        </div>
        <div className="card space-y-4 p-5">
          <Field label={t('পূর্ণ নাম', 'Full name')}><input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label={t('মোবাইল নম্বর', 'Mobile number')}><input className="input" inputMode="tel" placeholder="01XXXXXXXXX" maxLength={14} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label={t('আপনার এলাকা', 'Your area')}>
            <button type="button" onClick={() => setPick(true)} className="input flex items-center justify-between text-left">
              <span className={area ? '' : 'text-muted/60'}>{area ? areaLabel(area, en) : t('এলাকা বেছে নিন', 'Choose area')}</span><span>📍</span>
            </button>
          </Field>
          <Field label={t('বাড়ি/রাস্তা/গ্রামের ঠিকানা', 'House / road / village address')}><textarea className="input !py-3" rows={2} maxLength={150} value={addr} onChange={(e) => setAddr(e.target.value)} /></Field>
          <label className="flex items-start gap-3 text-[14.5px]">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-5 w-5 accent-brand" />
            <span>{t('আমি শর্তাবলী ও গোপনীয়তা নীতি মানছি', 'I accept the Terms and Privacy Policy')}</span>
          </label>
        </div>
        {err && <p className="rounded-2xl bg-[#F8E3DB] p-3 text-[14.5px] text-danger" role="alert">{err}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? '...' : t('চালিয়ে যান', 'Continue')}</button>
      </form>
      <AreaPicker open={pick} onClose={() => setPick(false)} onPick={setArea} withUnion />
    </div>
  );
}
