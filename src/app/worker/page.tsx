'use client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useIsSaved, useWorker, useWorkerReviews } from '@/lib/hooks';
import { submitReport, toggleSaved } from '@/lib/services';
import { workerAreaText, workerRating } from '@/lib/types';
import { reportReasons } from '@/lib/data';
import { b64Src } from '@/lib/image';
import { friendlyError, timeAgo } from '@/lib/util';
import AuthGate from '@/components/AuthGate';
import { priceText } from '@/components/WorkerCard';
import { Avatar, Empty, Modal, Pill, Spinner, Stars, Verified, useToast } from '@/components/ui';

function Profile() {
  const id = useSearchParams().get('id');
  const { t, en, n, money } = useLang();
  const { fbUser, me } = useAuth();
  const toast = useToast();
  const { worker: w, loading } = useWorker(id);
  const reviews = useWorkerReviews(id);
  const saved = useIsSaved(fbUser?.uid ?? null, id);
  const [works, setWorks] = useState<string[]>([]);
  const [rep, setRep] = useState(false);
  const [reason, setReason] = useState(0);
  const [details, setDetails] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !db) return;
    getDoc(doc(db, 'workers_photos', id))
      .then((s) => setWorks(s.exists() && Array.isArray(s.data().photos) ? (s.data().photos as string[]) : []))
      .catch(() => {});
  }, [id]);

  if (loading) return <Spinner />;
  if (!w) return <Empty icon="🙈" text={t('এই কারিগরকে পাওয়া যায়নি।', 'This worker was not found.')} />;
  const mine = fbUser?.uid === w.uid;

  async function save() {
    try {
      await toggleSaved(w!.uid, !saved);
      toast(saved ? t('সংরক্ষণ সরানো হয়েছে', 'Removed from saved') : t('সংরক্ষণ করা হয়েছে', 'Saved'));
    } catch (e) {
      toast(friendlyError(e, en));
    }
  }
  async function report() {
    try {
      await submitReport({ targetUid: w!.uid, targetName: w!.name, targetType: 'worker', reason: reportReasons[reason][en ? 1 : 0], details });
      setRep(false);
      setDetails('');
      toast(t('রিপোর্ট পাঠানো হয়েছে। ধন্যবাদ।', 'Report sent. Thank you.'));
    } catch (e) {
      toast(friendlyError(e, en));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-brand via-brand2 to-[#FF9A4D]" />
        <div className="-mt-12 px-5 pb-5">
          <Avatar name={w.name} photo={w.photo} size={96} className="ring-4 ring-white" />
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-[24px] font-extrabold">{w.name}{w.verified && <Verified size={22} />}</h1>
              <p className="text-[15.5px] font-semibold text-brand">{w.catName}</p>
              <p className="text-[14px] text-muted">📍 {workerAreaText(w)}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Pill tone={w.available ? 'good' : 'muted'}>{w.available ? t('● কাজ নিচ্ছেন', '● Available') : t('এখন ব্যস্ত', 'Busy now')}</Pill>
              {fbUser && !mine && (
                <button onClick={save} className="chip" aria-pressed={saved}>{saved ? '♥ ' + t('সংরক্ষিত', 'Saved') : '♡ ' + t('সংরক্ষণ', 'Save')}</button>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-soft p-3"><b className="block text-[19px]"><Stars value={workerRating(w)} count={0} size={16} /></b><span className="text-[12.5px] text-muted">{t(`${n(w.ratingCount)}টি রিভিউ`, `${w.ratingCount} reviews`)}</span></div>
            <div className="rounded-2xl bg-soft p-3"><b className="block text-[19px]">{n(w.jobs)}</b><span className="text-[12.5px] text-muted">{t('সম্পন্ন কাজ', 'Jobs done')}</span></div>
            <div className="rounded-2xl bg-soft p-3"><b className="block text-[19px]">{n(w.exp)}</b><span className="text-[12.5px] text-muted">{t('বছর অভিজ্ঞতা', 'Yrs exp.')}</span></div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-white p-3">
            <span className="text-[13.5px] text-muted">{t('মজুরি', 'Rate')}</span>
            <span className="text-[17px] font-bold">{priceText(w, t, money)}</span>
          </div>
          {!mine && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href={`/chat/?with=${w.uid}`} className="btn-soft">💬 {t('মেসেজ', 'Message')}</Link>
              <Link href={`/book/?worker=${w.uid}`} className="btn-primary">{t('কাজের অনুরোধ', 'Request job')}</Link>
            </div>
          )}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-2 text-[18px] font-bold">{t('পরিচিতি', 'About')}</h2>
        <p className="whitespace-pre-line text-[15.5px] leading-relaxed">{w.desc}</p>
        {w.skills.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{w.skills.map((s) => <Pill key={s}>{s}</Pill>)}</div>}
        {w.serveNames.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-1 text-[14px] font-semibold text-muted">{t('যে এলাকায় কাজ করেন', 'Areas served')}</h3>
            <p className="text-[14.5px]">{w.serveNames.join(' · ')}</p>
          </div>
        )}
      </section>

      {works.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 text-[18px] font-bold">{t('কাজের ছবি', 'Work photos')}</h2>
          <div className="grid grid-cols-3 gap-2">
            {works.map((p, i) => (
              <button key={i} onClick={() => setPhoto(p)} className="aspect-square overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b64Src(p)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="card p-5">
        <h2 className="mb-3 text-[18px] font-bold">{t('রিভিউ', 'Reviews')}</h2>
        {reviews.loading ? <Spinner /> : reviews.data.length === 0 ? (
          <p className="text-muted">{t('এখনো কোনো রিভিউ নেই।', 'No reviews yet.')}</p>
        ) : (
          <ul className="space-y-3">
            {reviews.data.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-white p-3">
                <div className="flex items-center justify-between"><b className="text-[14.5px]">{r.clientName || t('গ্রাহক', 'Client')}</b><Stars value={r.rating} size={13} /></div>
                {r.text && <p className="mt-1 text-[14.5px]">{r.text}</p>}
                <p className="mt-1 text-[12px] text-muted">{timeAgo(r.createdAt, en)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {fbUser && !mine && me?.role !== 'admin' && (
        <button onClick={() => setRep(true)} className="mx-auto block text-[13.5px] text-muted underline">{t('এই কারিগরকে রিপোর্ট করুন', 'Report this worker')}</button>
      )}

      <Modal open={rep} onClose={() => setRep(false)} title={t('রিপোর্ট করুন', 'Report')}>
        <div className="space-y-3">
          {reportReasons.map((r, i) => (
            <label key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
              <input type="radio" name="reason" checked={reason === i} onChange={() => setReason(i)} className="accent-brand" />
              <span>{en ? r[1] : r[0]}</span>
            </label>
          ))}
          <textarea className="input !py-3" rows={3} maxLength={300} placeholder={t('বিস্তারিত (ঐচ্ছিক)', 'Details (optional)')} value={details} onChange={(e) => setDetails(e.target.value)} />
          <button onClick={report} className="btn-primary w-full">{t('পাঠান', 'Send')}</button>
        </div>
      </Modal>
      <Modal open={!!photo} onClose={() => setPhoto(null)} title={t('কাজের ছবি', 'Work photo')}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo && <img src={b64Src(photo)} alt="" className="w-full rounded-2xl" />}
      </Modal>
    </div>
  );
}

export default function WorkerPage() {
  return (
    <AuthGate reason="কারিগরের প্রোফাইল দেখতে Google দিয়ে ঢুকুন।">
      <Suspense fallback={<Spinner />}>
        <Profile />
      </Suspense>
    </AuthGate>
  );
}
