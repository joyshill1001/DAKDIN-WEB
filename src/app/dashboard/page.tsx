'use client';
import Link from 'next/link';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useMyBookings, useWorker } from '@/lib/hooks';
import { workerRating } from '@/lib/types';
import AuthGate from '@/components/AuthGate';
import { StatusPill } from '@/components/BookingBits';
import { Avatar, Empty, PageTitle, Pill, Spinner, Stars, Toggle, useToast } from '@/components/ui';

function Home() {
  const { t, n } = useLang();
  const { fbUser } = useAuth();
  const toast = useToast();
  const uid = fbUser!.uid;
  const { worker, loading } = useWorker(uid);
  const jobs = useMyBookings(uid, 'worker');
  if (loading) return <Spinner />;
  if (!worker)
    return (
      <div className="mx-auto max-w-xl">
        <Empty icon="🧰" text={t('আপনার কারিগর প্রোফাইল এখনো তৈরি হয়নি।', 'You have not created your worker profile yet.')} action={<Link href="/become-worker/" className="btn-primary">{t('প্রোফাইল বানান', 'Create profile')}</Link>} />
      </div>
    );
  const pending = jobs.data.filter((b) => b.status === 'pending');
  const active = jobs.data.filter((b) => ['accepted', 'in_progress'].includes(b.status));
  const st = worker.approval;
  async function toggle(v: boolean) {
    try {
      await updateDoc(doc(db!, 'workers', uid), { available: v });
    } catch {
      toast(t('সংরক্ষণ করা যায়নি।', 'Could not save.'));
    }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageTitle title={t('কারিগর ড্যাশবোর্ড', 'Worker dashboard')} right={<Link href="/become-worker/" className="btn-soft !min-h-[40px] text-sm">{t('প্রোফাইল এডিট', 'Edit profile')}</Link>} />
      <div className="card flex items-center gap-3 p-4">
        <Avatar name={worker.name} photo={worker.photo} size={60} />
        <div className="min-w-0 flex-1">
          <b className="block truncate text-[18px]">{worker.name}</b>
          <span className="text-[14px] text-muted">{worker.catName}</span>
          <div className="mt-1"><Stars value={workerRating(worker)} count={worker.ratingCount} /></div>
        </div>
        <Pill tone={st === 'approved' ? 'good' : st === 'pending' ? 'gold' : 'danger'}>
          {st === 'approved' ? t('অনুমোদিত', 'Approved') : st === 'pending' ? t('অপেক্ষমাণ', 'Pending') : st === 'rejected' ? t('বাতিল', 'Rejected') : t('স্থগিত', 'Suspended')}
        </Pill>
      </div>
      {st === 'pending' && <p className="card p-4 text-[14.5px]">⏳ {t('অ্যাডমিন যাচাই করছেন। অনুমোদনের পর আপনি গ্রাহকদের সার্চে আসবেন।', 'Admin is reviewing. You appear in search after approval.')}</p>}
      {st === 'rejected' && <p className="card p-4 text-[14.5px] text-danger">{t('আবেদন বাতিল হয়েছে। প্রোফাইল ঠিক করে আবার চেষ্টা করুন।', 'Your application was rejected. Update your profile.')}</p>}
      <div className="card p-4"><Toggle on={worker.available} onChange={toggle} label={t('এখন কাজ নিতে পারব', 'Available for work now')} /></div>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[[n(worker.jobs), t('সম্পন্ন কাজ', 'Jobs done')], [n(pending.length), t('নতুন অনুরোধ', 'New requests')], [n(active.length), t('চলমান', 'Active')]].map(([v, l]) => (
          <div key={l} className="card p-3"><b className="block text-[24px] text-brand">{v}</b><span className="text-[13px] text-muted">{l}</span></div>
        ))}
      </div>
      <h2 className="text-[18px] font-bold">{t('নতুন অনুরোধ', 'New requests')}</h2>
      {pending.length === 0 ? <p className="text-muted">{t('এখন কোনো নতুন অনুরোধ নেই।', 'No new requests.')}</p> : pending.map((b) => (
        <Link key={b.id} href={`/booking/?id=${b.id}`} className="card block p-4">
          <div className="flex justify-between gap-2"><b>{b.clientName}</b><StatusPill s={b.status} /></div>
          <p className="mt-1 line-clamp-2 text-[14.5px] text-muted">{b.desc}</p>
        </Link>
      ))}
      <Link href="/bookings/" className="btn-soft w-full">{t('সব কাজ দেখুন', 'See all jobs')}</Link>
    </div>
  );
}

export default function Dashboard() {
  return (
    <AuthGate role="worker" reason="ড্যাশবোর্ড দেখতে Google দিয়ে ঢুকুন।">
      <Home />
    </AuthGate>
  );
}
