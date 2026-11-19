'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useCategories } from '@/lib/hooks';
import { CategoryIcon, PageTitle } from '@/components/ui';

export default function Categories() {
  const { t, en } = useLang();
  const cats = useCategories();
  const [q, setQ] = useState('');
  const s = q.trim().toLowerCase();
  const list = s ? cats.filter((c) => `${c.bn} ${c.en}`.toLowerCase().includes(s)) : cats;
  return (
    <div>
      <PageTitle title={t('সব সেবা', 'All services')} sub={t('যে কাজ দরকার সেটা বেছে নিন', 'Pick the work you need')} />
      <input className="input mb-5 max-w-md" placeholder={t('সেবা খুঁজুন...', 'Search services...')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {list.map((c) => (
          <Link key={c.id} href={`/workers/?cat=${c.id}`} className="card flex items-center gap-3 p-3 transition hover:-translate-y-0.5">
            <CategoryIcon c={c} size={52} />
            <span className="text-[14.5px] font-semibold leading-tight">{en ? c.en || c.bn : c.bn}</span>
          </Link>
        ))}
      </div>
      {list.length === 0 && <p className="py-10 text-center text-muted">{t('কিছু পাওয়া যায়নি।', 'Nothing found.')}</p>}
    </div>
  );
}
