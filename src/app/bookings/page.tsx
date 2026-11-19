'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useMyBookings } from '@/lib/hooks';
import AuthGate from '@/components/AuthGate';
import { StatusPill } from '@/components/BookingBits';
import { Empty, ErrorBox, PageTitle, Segmented, Spinner } from '@/components/ui';

function List() {
  const { t } = useLang();
  const { fbUser, me } = useAuth();
  const as = me?.role === 'worker' ? 'worker' : 'client';
  const r = useMyBookings(fbUser?.uid ?? null, as);
  const [tab, setTab] = useState<'active' | 'done' | 'closed'>('active');
  const list = r.data.filter((b) =>
    tab === 'active' ? ['pending', 'accepted', 'in_progress'].includes(b.status) : tab === 'done' ? b.status === 'completed' : ['rejected', 'cancelled'].includes(b.status),
  );
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title={as === 'worker' ? t('কাজের অনুরোধ', 'Job requests') : t('আমার বুকিং', 'My bookings')} />
      <Segmented value={tab} onChange={setTab} options={[['active', t('চলমান', 'Active')], ['done', t('সম্পন্ন', 'Done')], ['closed', t('বাতিল', 'Closed')]]} />
      <div className="mt-3 space-y-3">
        {r.loading ? <Spinner /> : r.error ? <ErrorBox /> : list.length === 0 ? (
          <Empty icon="📋" text={t('এখানে কিছু নেই।', 'Nothing here yet.')} action={as === 'client' ? <Link href="/categories/" className="btn-primary">{t('কারিগর খুঁজুন', 'Find a worker')}</Link> : undefined} />
        ) : (
          list.map((b) => (
            <Link key={b.id} href={`/booking/?id=${b.id}`} className="card rise block p-4 transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <b className="block truncate text-[16.5px]">{as === 'worker' ? b.clientName : b.workerName}</b>
                  <span className="text-[13.5px] text-brand">{b.catName}</span>
                </div>
                <StatusPill s={b.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-[14.5px] text-muted">{b.desc}</p>
              <p className="mt-2 text-[13px] text-muted">📅 {b.date}{b.time ? ` · ${b.time}` : ''}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <AuthGate reason="বুকিং দেখতে Google দিয়ে ঢুকুন।">
      <List />
    </AuthGate>
  );
}
