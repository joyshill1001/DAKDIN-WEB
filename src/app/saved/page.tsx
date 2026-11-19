'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useSavedWorkerIds } from '@/lib/hooks';
import { workerFrom, type Worker } from '@/lib/types';
import AuthGate from '@/components/AuthGate';
import WorkerCard from '@/components/WorkerCard';
import { Empty, PageTitle, Spinner } from '@/components/ui';

function List() {
  const { t } = useLang();
  const { fbUser } = useAuth();
  const ids = useSavedWorkerIds(fbUser!.uid);
  const [list, setList] = useState<Worker[] | null>(null);
  useEffect(() => {
    if (ids.loading || !db) return;
    Promise.all(ids.data.map((id) => getDoc(doc(db!, 'workers', id)).then((s) => (s.exists() ? workerFrom(s.id, s.data()) : null)).catch(() => null))).then((r) =>
      setList(r.filter((x): x is Worker => !!x)),
    );
  }, [ids.data, ids.loading]);
  return (
    <div>
      <PageTitle title={t('সংরক্ষিত কারিগর', 'Saved workers')} />
      {list === null ? <Spinner /> : list.length === 0 ? <Empty icon="♡" text={t('এখনো কাউকে সংরক্ষণ করেননি।', 'You have not saved anyone yet.')} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((w) => <WorkerCard key={w.uid} w={w} />)}</div>
      )}
    </div>
  );
}

export default function SavedPage() {
  return (
    <AuthGate reason="সংরক্ষিত কারিগর দেখতে Google দিয়ে ঢুকুন।">
      <List />
    </AuthGate>
  );
}
