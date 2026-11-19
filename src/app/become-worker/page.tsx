'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useCategories } from '@/lib/hooks';
import { areaKey, areaLabel, workerFrom, type AreaSel, type Worker } from '@/lib/types';
import { sendNotif } from '@/lib/services';
import { fileToB64, b64Src } from '@/lib/image';
import { asciiDigits, friendlyError } from '@/lib/util';
import AuthGate from '@/components/AuthGate';
import AreaPicker from '@/components/AreaPicker';
import { Avatar, Field, PageTitle, Spinner, Toggle, useToast } from '@/components/ui';

type Entry = { entry: string; name: string };

function Form() {
  const { t, en } = useLang();
  const { fbUser, me } = useAuth();
  const cats = useCategories();
  const toast = useToast();
  const router = useRouter();
  const uid = fbUser!.uid;
  const [loaded, setLoaded] = useState(false);
  const [exists, setExists] = useState(false);
  const [old, setOld] = useState<Worker | null>(null);
  const [name, setName] = useState(me?.name ?? '');
  const [phone, setPhone] = useState(me?.phone ?? '');
  const [photo, setPhoto] = useState('');
  const [catId, setCatId] = useState('');
  const [skills, setSkills] = useState('');
  const [exp, setExp] = useState('');
  const [hr, setHr] = useState('');
  const [day, setDay] = useState('');
  const [nego, setNego] = useState(true);
  const [desc, setDesc] = useState('');
  const [addr, setAddr] = useState(me?.address ?? '');
  const [home, setHome] = useState<AreaSel | null>(me?.area ?? null);
  const [serve, setServe] = useState<Entry[]>([]);
  const [fb, setFb] = useState('');
  const [yt, setYt] = useState('');
  const [tt, setTt] = useState('');
  const [works, setWorks] = useState<string[]>([]);
  const [pickHome, setPickHome] = useState(false);
  const [pickServe, setPickServe] = useState(false);
  const [busy, setBusy] = useState(false);
  const photoIn = useRef<HTMLInputElement>(null);
  const workIn = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!db) return;
    (async () => {
      try {
        const [w, pv, ph] = await Promise.all([getDoc(doc(db!, 'workers', uid)), getDoc(doc(db!, 'workers_private', uid)), getDoc(doc(db!, 'workers_photos', uid))]);
        if (w.exists()) {
          const x = workerFrom(uid, w.data());
          setExists(true);
          setOld(x);
          setName(x.name); setPhoto(x.photo); setCatId(x.catId); setSkills(x.skills.join(', ')); setExp(x.exp ? String(x.exp) : '');
          setHr(x.hr != null ? String(x.hr) : ''); setDay(x.day != null ? String(x.day) : ''); setNego(x.nego); setDesc(x.desc); setAddr(x.address);
          setFb(x.fb); setYt(x.yt); setTt(x.tt);
          const entries = x.serveEntries.length ? x.serveEntries : x.serveKeys.map((k) => `${k}|`);
          setServe(entries.map((e, i) => ({ entry: e, name: x.serveNames[i] ?? e.split('|')[0] })));
          if (x.homeKey) {
            const [dEn, uEn] = x.homeKey.split('/');
            setHome({ divBn: x.divBn, distBn: x.distBn, distEn: dEn, upBn: x.upBn, upEn: uEn, union: x.union, ward: null });
          }
        }
        if (pv.exists() && pv.data().phone) setPhone(String(pv.data().phone));
        if (ph.exists() && Array.isArray(ph.data().photos)) setWorks(ph.data().photos as string[]);
      } catch {
        /* first time: nothing saved yet */
      }
      setLoaded(true);
    })();
  }, [uid]);

  if (!loaded) return <Spinner />;

  async function pick(f: File | undefined | null, kind: 'photo' | 'work') {
    if (!f) return;
    try {
      if (kind === 'photo') {
        setPhoto(await fileToB64(f, { maxSide: 256, quality: 0.72, limit: 90000, aspect: 1 }));
      } else {
        const b = await fileToB64(f, { maxSide: 800, quality: 0.7, limit: 110000 });
        setWorks((w) => [...w, b].slice(0, 6));
      }
    } catch {
      toast(t('ছবিটি বড়। অন্য ছবি দিন।', 'That picture is too big.'));
    }
  }

  function addServe(a: AreaSel) {
    const entry = `${areaKey(a)}|${a.union}`;
    if (serve.some((s) => s.entry === entry)) return;
    setServe([...serve, { entry, name: `${a.union ? a.union + ', ' : ''}${a.upBn}, ${a.distBn}` }]);
  }

  async function save() {
    const ph = asciiDigits(phone);
    if (name.trim().length < 2) return toast(t('নাম লিখুন।', 'Enter your name.'));
    if (!/^01[3-9][0-9]{8}$/.test(ph)) return toast(t('সঠিক মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)।', 'Enter a valid mobile number.'));
    if (!catId) return toast(t('ক্যাটাগরি বেছে নিন।', 'Choose a category.'));
    if (!home) return toast(t('আপনার এলাকা বেছে নিন।', 'Choose your home area.'));
    if (desc.trim().length < 10) return toast(t('নিজের সম্পর্কে অন্তত কয়েক লাইন লিখুন।', 'Write a short description.'));
    let entries = serve.map((s) => s.entry);
    let names = serve.map((s) => s.name);
    // the home upazila is always served as a whole
    if (!entries.some((e) => e.split('|')[0] === areaKey(home))) {
      entries = [`${areaKey(home)}|`, ...entries];
      names = [`${home.upBn}, ${home.distBn}`, ...names];
    }
    const keys = [...new Set(entries.map((e) => e.split('|')[0]))];
    const cat = cats.find((c) => c.id === catId);
    const data = {
      name: name.trim(),
      photo,
      catId,
      catName: cat?.bn ?? '',
      skills: skills.split(/[,،\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 10),
      exp: parseInt(asciiDigits(exp)) || 0,
      hr: parseInt(asciiDigits(hr)) || null,
      day: parseInt(asciiDigits(day)) || null,
      nego,
      desc: desc.trim(),
      address: addr.trim(),
      homeKey: areaKey(home),
      divBn: home.divBn,
      distBn: home.distBn,
      upBn: home.upBn,
      union: home.union,
      fb: fb.trim(),
      yt: yt.trim(),
      tt: tt.trim(),
      serveKeys: keys,
      serveEntries: entries,
      serveNames: names,
    };
    setBusy(true);
    try {
      const d = db!;
      const b = writeBatch(d);
      const ref = doc(d, 'workers', uid);
      if (exists) b.update(ref, data);
      else b.set(ref, { ...data, approval: 'pending', verified: false, featured: false, available: true, ratingSum: 0, ratingCount: 0, jobs: 0, createdAt: serverTimestamp() });
      b.set(doc(d, 'workers_private', uid), { phone: ph, updatedAt: serverTimestamp() });
      b.set(doc(d, 'workers_photos', uid), { photos: works });
      b.update(doc(d, 'users', uid), { name: name.trim(), photo });
      await b.commit();
      if (!exists) await sendNotif({ toUid: 'admin', type: 'worker_new', title: 'নতুন কারিগর নিবন্ধন / New worker', body: name.trim(), refId: uid });
      toast(exists ? t('প্রোফাইল সংরক্ষিত হয়েছে', 'Profile saved') : t('আবেদন জমা হয়েছে! অনুমোদনের পর আপনি সার্চে আসবেন।', 'Submitted! You will appear in search after approval.'));
      router.replace('/dashboard/');
    } catch (e) {
      toast(friendlyError(e, en));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title={exists ? t('কারিগর প্রোফাইল', 'Worker profile') : t('কারিগর হিসেবে যুক্ত হন', 'Join as a worker')} sub={old ? undefined : t('অ্যাডমিন অনুমোদনের পর আপনি গ্রাহকদের সার্চে আসবেন।', 'You appear in search after admin approval.')} />
      <div className="card space-y-4 p-5">
        <div className="flex items-center gap-3">
          <Avatar name={name || '?'} photo={photo} size={72} />
          <button type="button" onClick={() => photoIn.current?.click()} className="btn-soft !min-h-[40px] text-sm">{t('ছবি দিন', 'Add photo')}</button>
          <input ref={photoIn} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0], 'photo'); e.target.value = ''; }} />
        </div>
        <Field label={t('নাম', 'Name')}><input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={t('মোবাইল নম্বর', 'Mobile number')} hint={t('এই নম্বর কারও কাছে দেখানো হয় না। আপনি চ্যাটে নিজে শেয়ার করলে তবেই দেখা যাবে।', 'Not shown to anyone unless you share it in chat.')}>
          <input className="input" inputMode="tel" value={phone} maxLength={14} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label={t('কাজের ধরন', 'Category')}>
          <select className="input" value={catId} onChange={(e) => setCatId(e.target.value)}>
            <option value="">{t('বেছে নিন', 'Choose')}</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{en ? c.en || c.bn : c.bn}</option>)}
          </select>
        </Field>
        <Field label={t('দক্ষতা (কমা দিয়ে লিখুন)', 'Skills (comma separated)')}><input className="input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder={t('ওয়্যারিং, ফ্যান মেরামত', 'Wiring, fan repair')} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label={t('অভিজ্ঞতা (বছর)', 'Experience (yrs)')}><input className="input" inputMode="numeric" value={exp} onChange={(e) => setExp(e.target.value)} /></Field>
          <Field label={t('ঘণ্টা প্রতি ৳', 'Per hour ৳')}><input className="input" inputMode="numeric" value={hr} onChange={(e) => setHr(e.target.value)} /></Field>
          <Field label={t('দিন প্রতি ৳', 'Per day ৳')}><input className="input" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} /></Field>
        </div>
        <Toggle on={nego} onChange={setNego} label={t('দরদাম করা যাবে', 'Price is negotiable')} />
        <Field label={t('নিজের সম্পর্কে', 'About you')}><textarea className="input !py-3" rows={4} maxLength={500} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
        <Field label={t('আপনার এলাকা', 'Home area')}>
          <button type="button" onClick={() => setPickHome(true)} className="input text-left">{home ? areaLabel(home, en) : t('এলাকা বেছে নিন', 'Choose area')}</button>
        </Field>
        <Field label={t('ঠিকানা', 'Address')}><input className="input" maxLength={150} value={addr} onChange={(e) => setAddr(e.target.value)} /></Field>
        <div>
          <span className="label">{t('যে এলাকায় কাজ করেন', 'Areas you serve')}</span>
          <div className="mb-2 flex flex-wrap gap-2">
            {serve.map((s) => (
              <span key={s.entry} className="chip">{s.name}<button onClick={() => setServe(serve.filter((x) => x.entry !== s.entry))} className="ml-1 text-muted" aria-label="remove">×</button></span>
            ))}
          </div>
          <button type="button" onClick={() => setPickServe(true)} className="btn-soft !min-h-[42px] text-sm">＋ {t('এলাকা যোগ করুন', 'Add area')}</button>
          <p className="mt-1 text-[12.5px] text-muted">{t('আপনার নিজের উপজেলা সবসময় যুক্ত থাকে।', 'Your home upazila is always included.')}</p>
        </div>
        <div>
          <span className="label">{t('কাজের ছবি (সর্বোচ্চ ৬টি)', 'Work photos (max 6)')}</span>
          <div className="flex flex-wrap gap-2">
            {works.map((p, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b64Src(p)} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setWorks(works.filter((_, j) => j !== i))} className="absolute right-1 top-1 h-6 w-6 rounded-full bg-ink/70 text-white" aria-label="remove">×</button>
              </div>
            ))}
            {works.length < 6 && <button type="button" onClick={() => workIn.current?.click()} className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-line text-2xl text-muted">＋</button>}
          </div>
          <input ref={workIn} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0], 'work'); e.target.value = ''; }} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Facebook"><input className="input" value={fb} onChange={(e) => setFb(e.target.value)} /></Field>
          <Field label="YouTube"><input className="input" value={yt} onChange={(e) => setYt(e.target.value)} /></Field>
          <Field label="TikTok"><input className="input" value={tt} onChange={(e) => setTt(e.target.value)} /></Field>
        </div>
        <button disabled={busy} onClick={save} className="btn-primary w-full">{busy ? '...' : exists ? t('সংরক্ষণ করুন', 'Save') : t('জমা দিন', 'Submit for approval')}</button>
      </div>
      <AreaPicker open={pickHome} onClose={() => setPickHome(false)} onPick={setHome} withUnion />
      <AreaPicker open={pickServe} onClose={() => setPickServe(false)} onPick={addServe} withUnion title={t('কাজের এলাকা যোগ করুন', 'Add a service area')} />
    </div>
  );
}

export default function BecomeWorker() {
  return (
    <AuthGate role="worker" reason="কারিগর প্রোফাইল বানাতে Google দিয়ে ঢুকুন।">
      <Form />
    </AuthGate>
  );
}
