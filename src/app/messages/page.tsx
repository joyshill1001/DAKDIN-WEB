'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useConversations } from '@/lib/hooks';
import { timeAgo } from '@/lib/util';
import AuthGate from '@/components/AuthGate';
import { Avatar, Empty, ErrorBox, PageTitle, Spinner } from '@/components/ui';

function List() {
  const { t, en, n } = useLang();
  const { fbUser } = useAuth();
  const uid = fbUser!.uid;
  const r = useConversations(uid);
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title={t('মেসেজ', 'Messages')} />
      {r.loading ? <Spinner /> : r.error ? <ErrorBox /> : r.data.length === 0 ? (
        <Empty icon="💬" text={t('এখনো কোনো কথোপকথন নেই। কারিগরের প্রোফাইল থেকে মেসেজ শুরু করুন।', 'No conversations yet. Start from a worker profile.')} />
      ) : (
        <ul className="space-y-2">
          {r.data.map((c) => {
            const name = uid === c.clientUid ? c.workerName : c.clientName;
            const photo = uid === c.clientUid ? c.workerPhoto : c.clientPhoto;
            const un = c.unread[uid] ?? 0;
            return (
              <li key={c.id}>
                <Link href={`/chat/?id=${c.id}`} className="card flex items-center gap-3 p-3 transition hover:-translate-y-0.5">
                  <Avatar name={name} photo={photo} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2"><b className="truncate text-[16px]">{name}</b><span className="shrink-0 text-[12px] text-muted">{timeAgo(c.updatedAt, en)}</span></div>
                    <p className={`truncate text-[14px] ${un ? 'font-semibold text-ink' : 'text-muted'}`}>{c.lastText}</p>
                  </div>
                  {un > 0 && <span className="min-w-[22px] rounded-full bg-brand px-1.5 text-center text-[12px] font-bold leading-[22px] text-white">{n(un)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <AuthGate reason="মেসেজ দেখতে Google দিয়ে ঢুকুন।">
      <List />
    </AuthGate>
  );
}
