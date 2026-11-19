'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useNotifications } from '@/lib/hooks';
import { markAllNotifsRead, markNotifRead } from '@/lib/services';
import { timeAgo } from '@/lib/util';
import AuthGate from '@/components/AuthGate';
import { Empty, PageTitle, Spinner } from '@/components/ui';

function List() {
  const { t, en } = useLang();
  const { fbUser } = useAuth();
  const r = useNotifications(fbUser!.uid);
  const href = (type: string, ref: string) => (type === 'message' ? `/chat/?id=${ref}` : type === 'booking' || type === 'review' ? `/booking/?id=${ref}` : '/notifications/');
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title={t('নোটিফিকেশন', 'Notifications')} right={r.data.some((x) => !x.read) ? <button onClick={() => markAllNotifsRead(r.data)} className="chip">{t('সব পড়া হয়েছে', 'Mark all read')}</button> : undefined} />
      {r.loading ? <Spinner /> : r.data.length === 0 ? <Empty icon="🔔" text={t('কোনো নোটিফিকেশন নেই।', 'No notifications.')} /> : (
        <ul className="space-y-2">
          {r.data.map((x) => (
            <li key={x.id}>
              <Link href={href(x.type, x.refId)} onClick={() => !x.read && markNotifRead(x.id)} className={`card block p-3.5 ${x.read ? '' : 'border-brand/40 bg-soft/60'}`}>
                <b className="block text-[15px]">{x.title}</b>
                <span className="text-[14px] text-muted">{x.body}</span>
                <span className="mt-1 block text-[12px] text-muted">{timeAgo(x.createdAt, en)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGate reason="নোটিফিকেশন দেখতে Google দিয়ে ঢুকুন।">
      <List />
    </AuthGate>
  );
}
