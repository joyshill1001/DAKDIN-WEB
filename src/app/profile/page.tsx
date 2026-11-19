'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { areaLabel, type AreaSel } from '@/lib/types';
import { deleteMyAccount, saveRequiredProfile } from '@/lib/services';
import { fileToB64 } from '@/lib/image';
import { friendlyError, isValidPhone, normalizePhone } from '@/lib/util';
import AuthGate from '@/components/AuthGate';
import AreaPicker from '@/components/AreaPicker';
import { Avatar, Field, Modal, PageTitle, useToast } from '@/components/ui';

function Me() {
  const { t, en, setLang } = useLang();
  const { me, signOut } = useAuth();
  const toast = useToast();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(me?.name ?? '');
  const [phone, setPhone] = useState(me?.phone ?? '');
  const [addr, setAddr] = useState(me?.address ?? '');
  const [area, setArea] = useState<AreaSel | null>(me?.area ?? null);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [pick, setPick] = useState(false);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  if (!me) return null;

  async function save() {
    const p = normalizePhone(phone);
    if (name.trim().length < 3) return toast(t('পূর্ণ নাম লিখুন।', 'Enter your full name.'));
    if (!isValidPhone(p)) return toast(t('সঠিক মোবাইল নম্বর দিন।', 'Enter a valid mobile number.'));
    if (!area) return toast(t('এলাকা বেছে নিন।', 'Choose your area.'));
    if (addr.trim().length < 5) return toast(t('ঠিকানা লিখুন।', 'Enter your address.'));
    setBusy(true);
    try {
      await saveRequiredProfile({ uid: me!.uid, oldPhone: me!.phone, name: name.trim(), phone: p, address: addr.trim(), area, photo });
      setEdit(false);
      toast(t('সংরক্ষণ হয়েছে।', 'Saved.'));
    } catch (e) {
      toast(friendlyError(e, en));
    }
    setBusy(false);
  }
  async function pickPhoto(f?: File | null) {
    if (!f) return;
    try {
      setPhoto(await fileToB64(f, { maxSide: 256, quality: 0.72, limit: 90000, aspect: 1 }));
    } catch {
      toast(t('ছবিটি বড়। অন্য ছবি দিন।', 'That picture is too big.'));
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await deleteMyAccount();
    } catch (e) {
      toast(e === 'cancelled' ? t('বাতিল করা হয়েছে।', 'Cancelled.') : e === 'recent-login' ? t('নিরাপত্তার জন্য আবার লগইন করে চেষ্টা করুন।', 'Please sign in again and retry.') : friendlyError(e, en));
      setBusy(false);
    }
  }

  const Link2 = ({ href, icon, label }: { href: string; icon: string; label: string }) => (
    <Link href={href} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5"><span className="text-2xl">{icon}</span><span className="flex-1 font-semibold">{label}</span><span className="text-muted">›</span></Link>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageTitle title={t('প্রোফাইল', 'Profile')} />
      <section className="card flex items-center gap-4 p-5">
        <Avatar name={me.name} photo={me.photo} size={72} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[20px] font-extrabold">{me.name}</h2>
          <p className="truncate text-[14px] text-muted">{me.email}</p>
          <p className="text-[14px] text-muted">📞 {me.phone}</p>
          {me.area && <p className="text-[14px] text-muted">📍 {areaLabel(me.area, en)}</p>}
        </div>
        <button onClick={() => setEdit(true)} className="btn-soft !min-h-[40px] !px-4 text-sm">{t('সম্পাদনা', 'Edit')}</button>
      </section>

      <div className="space-y-3">
        {me.role === 'client' && <Link2 href="/saved/" icon="♡" label={t('সংরক্ষিত কারিগর', 'Saved workers')} />}
        {me.role === 'worker' && <Link2 href="/become-worker/" icon="🛠️" label={t('কারিগর প্রোফাইল সম্পাদনা', 'Edit worker profile')} />}
        {me.role === 'admin' && <Link2 href="/admin/" icon="🛡️" label={t('অ্যাডমিন প্যানেল', 'Admin panel')} />}
        <Link2 href="/notifications/" icon="🔔" label={t('নোটিফিকেশন', 'Notifications')} />
        <Link2 href="/terms/" icon="📄" label={t('শর্তাবলী', 'Terms')} />
        <Link2 href="/privacy/" icon="🔒" label={t('গোপনীয়তা নীতি', 'Privacy policy')} />
        <div className="card flex items-center justify-between gap-3 p-4">
          <span className="font-semibold">🌐 {t('ভাষা', 'Language')}</span>
          <div className="flex gap-2">
            <button onClick={() => setLang('bn')} className={`chip ${!en ? 'chip-on' : ''}`}>বাংলা</button>
            <button onClick={() => setLang('en')} className={`chip ${en ? 'chip-on' : ''}`}>English</button>
          </div>
        </div>
      </div>

      <button onClick={() => signOut()} className="btn-ghost w-full">{t('লগআউট', 'Log out')}</button>
      <button onClick={() => setDel(true)} className="mx-auto block text-[13.5px] text-danger underline">{t('অ্যাকাউন্ট মুছে ফেলুন', 'Delete account')}</button>

      <Modal open={edit} onClose={() => setEdit(false)} title={t('প্রোফাইল সম্পাদনা', 'Edit profile')}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={name || me.name} photo={photo ?? me.photo} size={64} />
            <button type="button" onClick={() => file.current?.click()} className="btn-soft !min-h-[40px] text-sm">{t('ছবি বদলান', 'Change photo')}</button>
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
          <Field label={t('পূর্ণ নাম', 'Full name')}><input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label={t('মোবাইল নম্বর', 'Mobile number')}><input className="input" inputMode="tel" value={phone} maxLength={14} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label={t('এলাকা', 'Area')}>
            <button type="button" onClick={() => setPick(true)} className="input text-left">{area ? areaLabel(area, en) : t('এলাকা বেছে নিন', 'Choose area')}</button>
          </Field>
          <Field label={t('ঠিকানা', 'Address')}><textarea className="input !py-3" rows={2} maxLength={150} value={addr} onChange={(e) => setAddr(e.target.value)} /></Field>
          <button disabled={busy} onClick={save} className="btn-primary w-full">{busy ? '...' : t('সংরক্ষণ করুন', 'Save')}</button>
        </div>
      </Modal>
      <AreaPicker open={pick} onClose={() => setPick(false)} onPick={setArea} withUnion />
      <Modal open={del} onClose={() => setDel(false)} title={t('অ্যাকাউন্ট মুছবেন?', 'Delete account?')}>
        <p className="mb-4 text-[15px] text-muted">{t('আপনার প্রোফাইল, বুকিং ও সংরক্ষিত তথ্য মুছে যাবে। এটা ফেরানো যাবে না।', 'Your profile, bookings and saved data will be removed. This cannot be undone.')}</p>
        <button disabled={busy} onClick={remove} className="btn-danger w-full">{busy ? '...' : t('হ্যাঁ, মুছে ফেলুন', 'Yes, delete')}</button>
      </Modal>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGate reason="প্রোফাইল দেখতে Google দিয়ে ঢুকুন।">
      <Me />
    </AuthGate>
  );
}
