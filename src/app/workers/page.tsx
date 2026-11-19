'use client';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { useArea } from '@/lib/area-ctx';
import { useCategories, useWorkersInArea } from '@/lib/hooks';
import { areaKey, areaLabel, workerRating, type Worker } from '@/lib/types';
import AuthGate from '@/components/AuthGate';
import AreaPicker from '@/components/AreaPicker';
import WorkerCard from '@/components/WorkerCard';
import { Empty, PageTitle, Spinner, ErrorBox } from '@/components/ui';
import { cx } from '@/lib/util';

function rank(a: Worker, b: Worker) {
  const c = workerRating(b) - workerRating(a);
  if (c !== 0) return c;
  if (a.verified !== b.verified) return a.verified ? -1 : 1;
  return b.ratingCount - a.ratingCount;
}

function List() {
  const { t, en, n } = useLang();
  const sp = useSearchParams();
  const router = useRouter();
  const { area, setArea } = useArea();
  const cats = useCategories();
  const [pick, setPick] = useState(false);
  const cat = sp.get('cat');
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [avail, setAvail] = useState(false);
  const [verified, setVerified] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<'top' | 'exp' | 'price' | 'new'>('top');
  const r = useWorkersInArea(area ? areaKey(area) : null, area?.union ?? '');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const l = r.data.filter((w) => {
      if (cat && w.catId !== cat) return false;
      if (avail && !w.available) return false;
      if (verified && !w.verified) return false;
      if (workerRating(w) < minRating) return false;
      if (s && !`${w.name} ${w.catName} ${w.skills.join(' ')} ${w.desc}`.toLowerCase().includes(s)) return false;
      return true;
    });
    if (sort === 'exp') l.sort((a, b) => b.exp - a.exp);
    else if (sort === 'price') l.sort((a, b) => (a.hr ?? a.day ?? 1e9) - (b.hr ?? b.day ?? 1e9));
    else if (sort === 'new') l.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    else l.sort(rank);
    return l;
  }, [r.data, cat, avail, verified, minRating, q, sort]);

  const catName = cats.find((c) => c.id === cat);

  return (
    <div>
      <PageTitle
        title={catName ? (en ? catName.en || catName.bn : catName.bn) : t('কারিগর', 'Workers')}
        sub={area ? `📍 ${areaLabel(area, en)}` : undefined}
        right={
          <button onClick={() => setPick(true)} className="btn-soft !min-h-[42px] !px-4 text-sm">
            📍 {t('এলাকা বদলান', 'Change area')}
          </button>
        }
      />

      <div className="mb-4 space-y-3">
        <input className="input" placeholder={t('নাম বা কাজ দিয়ে খুঁজুন', 'Search by name or skill')} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
          <button className={cx('chip', !cat && 'chip-on')} onClick={() => router.replace('/workers/')}>{t('সব', 'All')}</button>
          {cats.map((c) => (
            <button key={c.id} className={cx('chip', cat === c.id && 'chip-on')} onClick={() => router.replace(`/workers/?cat=${c.id}`)}>
              {en ? c.en || c.bn : c.bn}
            </button>
          ))}
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
          <button className={cx('chip', avail && 'chip-on')} onClick={() => setAvail(!avail)}>🟢 {t('এখন পাওয়া যাচ্ছে', 'Available now')}</button>
          <button className={cx('chip', verified && 'chip-on')} onClick={() => setVerified(!verified)}>✔ {t('যাচাইকৃত', 'Verified')}</button>
          <button className={cx('chip', minRating === 4 && 'chip-on')} onClick={() => setMinRating(minRating === 4 ? 0 : 4)}>★ {n(4)}+</button>
          <select className="chip !pr-6" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label={t('সাজান', 'Sort')}>
            <option value="top">{t('সেরা রেটিং', 'Top rated')}</option>
            <option value="exp">{t('বেশি অভিজ্ঞতা', 'Most experienced')}</option>
            <option value="price">{t('কম দাম', 'Lowest price')}</option>
            <option value="new">{t('নতুন', 'Newest')}</option>
          </select>
        </div>
      </div>

      {!area ? (
        <Empty icon="📍" text={t('আগে আপনার এলাকা বেছে নিন।', 'Choose your area first.')} action={<button onClick={() => setPick(true)} className="btn-primary">{t('এলাকা বেছে নিন', 'Choose area')}</button>} />
      ) : r.loading ? (
        <Spinner />
      ) : r.error ? (
        <ErrorBox />
      ) : list.length === 0 ? (
        <Empty text={t('এই এলাকায় এখনো কোনো কারিগর পাওয়া যায়নি। অন্য এলাকা বা ফিল্টার চেষ্টা করুন।', 'No workers found here. Try another area or filter.')} />
      ) : (
        <>
          <p className="mb-3 text-[13.5px] text-muted">{t(`${n(list.length)} জন কারিগর`, `${list.length} workers`)}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((w) => <WorkerCard key={w.uid} w={w} />)}</div>
        </>
      )}
      <AreaPicker open={pick} onClose={() => setPick(false)} onPick={setArea} withUnion />
    </div>
  );
}

export default function WorkersPage() {
  return (
    <AuthGate reason="কারিগর দেখতে Google দিয়ে ঢুকুন।">
      <Suspense fallback={<Spinner />}>
        <List />
      </Suspense>
    </AuthGate>
  );
}
