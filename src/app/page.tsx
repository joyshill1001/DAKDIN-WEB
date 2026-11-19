'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useArea } from '@/lib/area-ctx';
import { useCategories, useWorkersInArea } from '@/lib/hooks';
import { areaKey, areaLabel, workerRating } from '@/lib/types';
import AreaPicker from '@/components/AreaPicker';
import WorkerCard from '@/components/WorkerCard';
import { LoginCard } from '@/components/AuthGate';
import { CategoryIcon, Spinner } from '@/components/ui';

export default function Home() {
  const { t, en } = useLang();
  const { fbUser, me, configured } = useAuth();
  const { area, setArea } = useArea();
  const router = useRouter();
  const cats = useCategories();
  const [pick, setPick] = useState(false);
  const [q, setQ] = useState('');
  const w = useWorkersInArea(fbUser && area ? areaKey(area) : null, area?.union ?? '');

  if (fbUser && me?.role === 'worker') {
    // workers land on their dashboard
    if (typeof window !== 'undefined') router.replace('/dashboard/');
    return <Spinner className="py-24" />;
  }

  const top = [...w.data].sort((a, b) => Number(b.featured) - Number(a.featured) || workerRating(b) - workerRating(a)).slice(0, 6);

  function search(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/workers/?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div className="space-y-8">
      {/* hero */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand via-brand2 to-[#FF9A4D] p-6 text-white shadow-float md:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/10" />
        <div className="relative max-w-2xl">
          <p className="mb-2 text-[14px] font-semibold text-white/90">{t('ডাক দিন · সম্পূর্ণ ফ্রি', 'DakDin · 100% free')}</p>
          <h1 className="text-[28px] font-extrabold leading-tight md:text-[40px]">
            {t('আপনার এলাকার দক্ষ কারিগর, এক জায়গায়', 'Skilled local workers, all in one place')}
          </h1>
          <p className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-white/90">
            {t('ইলেকট্রিশিয়ান, প্লাম্বার, মিস্ত্রি ও মেকানিক। এলাকা বেছে খুঁজুন, চ্যাটে কথা বলুন, কাজের অনুরোধ পাঠান।', 'Electricians, plumbers, masons and mechanics. Pick your area, search, chat and send a job request.')}
          </p>
          <button onClick={() => setPick(true)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-[14.5px] font-semibold backdrop-blur">
            📍 {area ? areaLabel(area, en) : t('আপনার এলাকা বেছে নিন', 'Choose your area')} <span aria-hidden>▾</span>
          </button>
          <form onSubmit={search} className="mt-4 flex max-w-xl gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('কাজ বা কারিগরের নাম খুঁজুন', 'Search a skill or worker name')}
              className="min-h-[52px] flex-1 rounded-2xl border-0 bg-white px-4 text-[15.5px] text-ink outline-none placeholder:text-muted/60"
            />
            <button className="min-h-[52px] rounded-2xl bg-ink px-5 font-bold text-white">{t('খুঁজুন', 'Search')}</button>
          </form>
        </div>
      </section>

      {/* categories */}
      <section aria-labelledby="cats">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="cats" className="text-[21px] font-bold">{t('সেবার ধরন', 'Services')}</h2>
          <Link href="/categories/" className="text-[14.5px] font-semibold text-brand">{t('সব দেখুন', 'See all')}</Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8">
          {cats.slice(0, 16).map((c) => (
            <Link key={c.id} href={`/workers/?cat=${c.id}`} className="card flex flex-col items-center gap-2 px-2 py-4 text-center transition hover:-translate-y-0.5">
              <CategoryIcon c={c} size={54} />
              <span className="line-clamp-2 text-[13px] font-semibold leading-tight">{en ? c.en || c.bn : c.bn}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* guest */}
      {!fbUser && configured && (
        <section>
          <LoginCard reason={t('কারিগর দেখতে ও যোগাযোগ করতে Google দিয়ে ঢুকুন।', 'Sign in with Google to see workers and contact them.')} />
        </section>
      )}

      {/* top workers in my area */}
      {fbUser && (
        <section aria-labelledby="near">
          <div className="mb-3 flex items-end justify-between">
            <h2 id="near" className="text-[21px] font-bold">{t('আপনার এলাকার কারিগর', 'Workers in your area')}</h2>
            <Link href="/workers/" className="text-[14.5px] font-semibold text-brand">{t('সব দেখুন', 'See all')}</Link>
          </div>
          {!area ? (
            <button onClick={() => setPick(true)} className="btn-primary">{t('এলাকা বেছে নিন', 'Choose your area')}</button>
          ) : w.loading ? (
            <Spinner />
          ) : top.length === 0 ? (
            <p className="card p-6 text-center text-muted">{t('এই এলাকায় এখনো কোনো কারিগর নেই।', 'No workers in this area yet.')}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{top.map((x) => <WorkerCard key={x.uid} w={x} />)}</div>
          )}
        </section>
      )}

      {/* worker CTA (a worker account is chosen when the account is created) */}
      {!fbUser && (
        <section className="card flex flex-col items-start gap-3 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[20px] font-bold">{t('আপনি কি কারিগর?', 'Are you a worker?')}</h2>
            <p className="text-[14.5px] text-muted">{t('ফ্রি যুক্ত হয়ে নিজের এলাকায় কাজ পান।', 'Join for free and get jobs in your area.')}</p>
          </div>
          <Link href="/welcome/" className="btn-primary">{t('কারিগর হিসেবে যুক্ত হন', 'Join as a worker')}</Link>
        </section>
      )}

      <AreaPicker open={pick} onClose={() => setPick(false)} onPick={setArea} withUnion />
    </div>
  );
}
