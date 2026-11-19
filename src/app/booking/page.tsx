'use client';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useBooking } from '@/lib/hooks';
import { setBookingStatus, submitReview, convId } from '@/lib/services';
import { b64Src } from '@/lib/image';
import { friendlyError, timeAgo } from '@/lib/util';
import AuthGate from '@/components/AuthGate';
import { StatusPill } from '@/components/BookingBits';
import { Empty, Modal, Spinner, useToast } from '@/components/ui';

function Detail() {
  const id = useSearchParams().get('id');
  const { t, en } = useLang();
  const { fbUser, me } = useAuth();
  const toast = useToast();
  const { booking: b, loading } = useBooking(id);
  const [busy, setBusy] = useState(false);
  const [rate, setRate] = useState(false);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');

  if (loading) return <Spinner />;
  if (!b || !fbUser) return <Empty icon="🙈" text={t('বুকিং পাওয়া যায়নি।', 'Booking not found.')} />;
  const iAmWorker = fbUser.uid === b.workerUid;
  const iAmClient = fbUser.uid === b.clientUid;
  const other = iAmWorker ? b.clientName : b.workerName;

  async function act(status: string) {
    setBusy(true);
    try {
      await setBookingStatus(b!, status, iAmWorker);
    } catch (e) {
      toast(friendlyError(e, en));
    }
    setBusy(false);
  }
  async function review() {
    setBusy(true);
    try {
      await submitReview(b!, stars, text.trim().slice(0, 500), me?.name ?? '');
      setRate(false);
      toast(t('রিভিউ দেওয়ার জন্য ধন্যবাদ।', 'Thanks for your review.'));
    } catch (e) {
      toast(friendlyError(e, en));
    }
    setBusy(false);
  }

  const chat = `/chat/?id=${convId(b.clientUid, b.workerUid)}`;
  const Row = ({ k, v }: { k: string; v: string }) => v ? (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0"><span className="text-muted">{k}</span><span className="text-right font-medium">{v}</span></div>
  ) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="card p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div><h1 className="text-[22px] font-extrabold">{other}</h1><p className="text-brand">{b.catName}</p></div>
          <StatusPill s={b.status} />
        </div>
        <p className="mb-3 whitespace-pre-line rounded-2xl bg-soft p-3 text-[15.5px] leading-relaxed">{b.desc}</p>
        <Row k={t('তারিখ', 'Date')} v={b.date} />
        <Row k={t('সময়', 'Time')} v={b.time} />
        <Row k={t('ঠিকানা', 'Address')} v={b.locText} />
        <Row k={t('নির্দেশনা', 'Instructions')} v={b.instr} />
        <Row k={t('নোট', 'Note')} v={b.note} />
        <Row k={t('পাঠানো হয়েছে', 'Sent')} v={timeAgo(b.createdAt, en)} />
        {b.images.length > 0 && (
          <div className="mt-3 flex gap-2">
            {b.images.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={b64Src(p)} alt="" className="h-28 w-28 rounded-2xl object-cover" />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={chat} className="btn-soft sm:col-span-2">💬 {t('মেসেজ করুন', 'Message')}</Link>
        {iAmWorker && b.status === 'pending' && (<>
          <button disabled={busy} onClick={() => act('accepted')} className="btn-primary">{t('গ্রহণ করুন', 'Accept')}</button>
          <button disabled={busy} onClick={() => act('rejected')} className="btn-ghost">{t('বাতিল করুন', 'Reject')}</button>
        </>)}
        {iAmWorker && b.status === 'accepted' && (<>
          <button disabled={busy} onClick={() => act('in_progress')} className="btn-primary">{t('কাজ শুরু করুন', 'Start work')}</button>
          <button disabled={busy} onClick={() => act('cancelled')} className="btn-ghost">{t('বাতিল করুন', 'Cancel')}</button>
        </>)}
        {iAmWorker && b.status === 'in_progress' && (
          <button disabled={busy} onClick={() => act('completed')} className="btn-primary sm:col-span-2">{t('কাজ সম্পন্ন', 'Mark completed')}</button>
        )}
        {iAmClient && ['pending', 'accepted'].includes(b.status) && (
          <button disabled={busy} onClick={() => act('cancelled')} className="btn-ghost sm:col-span-2">{t('অনুরোধ বাতিল করুন', 'Cancel request')}</button>
        )}
        {iAmClient && b.status === 'completed' && !b.reviewed && (
          <button onClick={() => setRate(true)} className="btn-primary sm:col-span-2">★ {t('রিভিউ দিন', 'Leave a review')}</button>
        )}
      </div>

      <Modal open={rate} onClose={() => setRate(false)} title={t('কাজটি কেমন হলো?', 'How was the work?')}>
        <div className="space-y-4">
          <div className="flex justify-center gap-2" role="radiogroup" aria-label="rating">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} role="radio" aria-checked={stars === s} onClick={() => setStars(s)} className={`text-4xl ${s <= stars ? 'text-gold' : 'text-[#E0D6CC]'}`}>★</button>
            ))}
          </div>
          <textarea className="input !py-3" rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('আপনার অভিজ্ঞতা লিখুন (ঐচ্ছিক)', 'Write your experience (optional)')} />
          <button disabled={busy} onClick={review} className="btn-primary w-full">{t('জমা দিন', 'Submit')}</button>
        </div>
      </Modal>
    </div>
  );
}

export default function BookingPage() {
  return (
    <AuthGate reason="বুকিং দেখতে Google দিয়ে ঢুকুন।">
      <Suspense fallback={<Spinner />}>
        <Detail />
      </Suspense>
    </AuthGate>
  );
}
