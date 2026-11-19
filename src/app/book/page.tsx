'use client';
import { Suspense, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useWorker } from '@/lib/hooks';
import { createBooking } from '@/lib/services';
import { fileToB64, b64Src } from '@/lib/image';
import { friendlyError } from '@/lib/util';
import AuthGate from '@/components/AuthGate';
import { Avatar, Empty, Field, PageTitle, Spinner, useToast } from '@/components/ui';

function Form() {
  const wid = useSearchParams().get('worker');
  const { t, en } = useLang();
  const { me } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { worker: w, loading } = useWorker(wid);
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loc, setLoc] = useState(me?.address ?? '');
  const [instr, setInstr] = useState('');
  const [imgs, setImgs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  if (loading) return <Spinner />;
  if (!w || !wid) return <Empty icon="🙈" text={t('কারিগর পাওয়া যায়নি।', 'Worker not found.')} />;
  if (w.uid === me?.uid) return <Empty text={t('নিজেকে অনুরোধ পাঠানো যায় না।', 'You cannot request yourself.')} />;
  const today = new Date().toISOString().slice(0, 10);

  async function addImg(f?: File | null) {
    if (!f) return;
    try {
      const b = await fileToB64(f, { maxSide: 900, quality: 0.7, limit: 140000 });
      setImgs((x) => [...x, b].slice(0, 2));
    } catch {
      toast(t('ছবিটি বড়। অন্য ছবি দিন।', 'That picture is too big. Pick another.'));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (desc.trim().length < 10) return toast(t('কাজের বিবরণ কয়েক লাইনে লিখুন।', 'Describe the work in a few words.'));
    if (!date) return toast(t('তারিখ দিন।', 'Choose a date.'));
    if (loc.trim().length < 5) return toast(t('ঠিকানা লিখুন।', 'Enter the address.'));
    setBusy(true);
    try {
      await createBooking(
        {
          workerUid: w!.uid,
          clientName: me!.name,
          workerName: w!.name,
          catId: w!.catId,
          catName: w!.catName,
          desc: desc.trim(),
          locText: loc.trim(),
          date,
          time,
          instr: instr.trim(),
          images: imgs,
          note: '',
        },
        w!.uid,
        me!.name,
      );
      toast(t('অনুরোধ পাঠানো হয়েছে।', 'Request sent.'));
      router.replace('/bookings/');
    } catch (err) {
      toast(friendlyError(err, en));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title={t('কাজের অনুরোধ', 'Job request')} />
      <div className="card mb-4 flex items-center gap-3 p-3">
        <Avatar name={w.name} photo={w.photo} size={52} />
        <div><b className="text-[16px]">{w.name}</b><p className="text-[13.5px] text-brand">{w.catName}</p></div>
      </div>
      <form onSubmit={submit} className="card space-y-4 p-5">
        <Field label={t('কী কাজ করাতে চান?', 'What work do you need?')}>
          <textarea className="input !py-3" rows={4} maxLength={600} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('যেমন: ঘরের ফ্যান ঘুরছে না, শব্দ হচ্ছে।', 'e.g. The ceiling fan is not turning.')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('তারিখ', 'Date')}><input type="date" min={today} className="input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label={t('সময় (ঐচ্ছিক)', 'Time (optional)')}><input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        </div>
        <Field label={t('কাজের ঠিকানা', 'Work address')}><textarea className="input !py-3" rows={2} maxLength={150} value={loc} onChange={(e) => setLoc(e.target.value)} /></Field>
        <Field label={t('বিশেষ নির্দেশনা (ঐচ্ছিক)', 'Instructions (optional)')}><input className="input" maxLength={150} value={instr} onChange={(e) => setInstr(e.target.value)} /></Field>
        <div>
          <span className="label">{t('ছবি (সর্বোচ্চ ২টি, ঐচ্ছিক)', 'Photos (max 2, optional)')}</span>
          <div className="flex flex-wrap gap-2">
            {imgs.map((p, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b64Src(p)} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setImgs(imgs.filter((_, j) => j !== i))} className="absolute right-1 top-1 h-6 w-6 rounded-full bg-ink/70 text-white" aria-label="remove">×</button>
              </div>
            ))}
            {imgs.length < 2 && (
              <button type="button" onClick={() => file.current?.click()} className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-line text-2xl text-muted">＋</button>
            )}
          </div>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { addImg(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        <button disabled={busy} className="btn-primary w-full">{busy ? '...' : t('অনুরোধ পাঠান', 'Send request')}</button>
        <p className="text-center text-[12.5px] text-muted">{t('আপনার ফোন নম্বর কারিগরকে দেখানো হয় না।', 'Your phone number is not shown to the worker.')}</p>
      </form>
    </div>
  );
}

export default function BookPage() {
  return (
    <AuthGate role="client" reason="কাজের অনুরোধ পাঠাতে Google দিয়ে ঢুকুন।">
      <Suspense fallback={<Spinner />}>
        <Form />
      </Suspense>
    </AuthGate>
  );
}
