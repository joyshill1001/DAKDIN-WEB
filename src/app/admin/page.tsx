'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLang } from '@/lib/i18n';
import { workerFrom, str, type Worker } from '@/lib/types';
import { sendNotif } from '@/lib/services';
import AuthGate from '@/components/AuthGate';
import { Avatar, Empty, PageTitle, Segmented, Spinner, useToast } from '@/components/ui';

type Rep = { id: string; targetName: string; targetUid: string; reason: string; details: string; status: string };

function Panel() {
  const { t } = useLang();
  const toast = useToast();
  const [tab, setTab] = useState<'pending' | 'approved' | 'reports'>('pending');
  const [ws, setWs] = useState<Worker[] | null>(null);
  const [reps, setReps] = useState<Rep[] | null>(null);

  useEffect(() => {
    if (!db || tab === 'reports') return;
    setWs(null);
    return onSnapshot(
      query(collection(db, 'workers'), where('approval', '==', tab), limit(100)),
      (s) => setWs(s.docs.map((d) => workerFrom(d.id, d.data()))),
      () => setWs([]),
    );
  }, [tab]);
  useEffect(() => {
    if (!db || tab !== 'reports') return;
    setReps(null);
    return onSnapshot(
      query(collection(db, 'reports'), where('status', '==', 'open'), limit(100)),
      (s) => setReps(s.docs.map((d) => ({ id: d.id, targetName: str(d.data(), 'targetName'), targetUid: str(d.data(), 'targetUid'), reason: str(d.data(), 'reason'), details: str(d.data(), 'details'), status: 'open' }))),
      () => setReps([]),
    );
  }, [tab]);

  async function setApproval(w: Worker, approval: string) {
    try {
      await updateDoc(doc(db!, 'workers', w.uid), { approval });
      await sendNotif({
        toUid: w.uid,
        type: 'worker_status',
        title: approval === 'approved' ? 'আপনার প্রোফাইল অনুমোদিত হয়েছে 🎉' : 'আপনার আবেদন বাতিল হয়েছে',
        body: approval === 'approved' ? 'এখন গ্রাহকরা আপনাকে খুঁজে পাবেন।' : 'প্রোফাইল ঠিক করে আবার চেষ্টা করুন।',
        refId: w.uid,
      });
    } catch {
      toast(t('করা যায়নি।', 'Failed.'));
    }
  }
  async function flag(w: Worker, k: 'verified' | 'featured') {
    try {
      await updateDoc(doc(db!, 'workers', w.uid), { [k]: !w[k] });
    } catch {
      toast(t('করা যায়নি।', 'Failed.'));
    }
  }
  async function resolve(r: Rep) {
    try {
      await updateDoc(doc(db!, 'reports', r.id), { status: 'resolved' });
    } catch {
      toast(t('করা যায়নি।', 'Failed.'));
    }
  }
  const list = useMemo(() => ws ?? [], [ws]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title={t('অ্যাডমিন প্যানেল', 'Admin panel')} />
      <Segmented value={tab} onChange={setTab} options={[['pending', t('অপেক্ষমাণ', 'Pending')], ['approved', t('অনুমোদিত', 'Approved')], ['reports', t('রিপোর্ট', 'Reports')]]} />
      <div className="mt-3 space-y-3">
        {tab === 'reports' ? (
          reps === null ? <Spinner /> : reps.length === 0 ? <Empty icon="✅" text={t('কোনো খোলা রিপোর্ট নেই।', 'No open reports.')} /> : reps.map((r) => (
            <div key={r.id} className="card p-4">
              <b>{r.targetName}</b> <span className="text-[13px] text-danger">{r.reason}</span>
              {r.details && <p className="mt-1 text-[14px] text-muted">{r.details}</p>}
              <div className="mt-2 flex gap-2">
                <Link href={`/worker/?id=${r.targetUid}`} className="btn-soft !min-h-[40px] text-sm">{t('দেখুন', 'View')}</Link>
                <button onClick={() => resolve(r)} className="btn-primary !min-h-[40px] text-sm">{t('সমাধান', 'Resolve')}</button>
              </div>
            </div>
          ))
        ) : ws === null ? <Spinner /> : list.length === 0 ? <Empty icon="📭" text={t('কিছু নেই।', 'Nothing here.')} /> : list.map((w) => (
          <div key={w.uid} className="card p-4">
            <div className="flex items-center gap-3">
              <Avatar name={w.name} photo={w.photo} size={52} />
              <div className="min-w-0 flex-1">
                <Link href={`/worker/?id=${w.uid}`} className="block truncate font-bold">{w.name}</Link>
                <span className="text-[13.5px] text-muted">{w.catName} · {w.upBn}, {w.distBn}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {tab === 'pending' ? (
                <>
                  <button onClick={() => setApproval(w, 'approved')} className="btn-primary !min-h-[40px] text-sm">{t('অনুমোদন', 'Approve')}</button>
                  <button onClick={() => setApproval(w, 'rejected')} className="btn-danger !min-h-[40px] text-sm">{t('বাতিল', 'Reject')}</button>
                </>
              ) : (
                <>
                  <button onClick={() => flag(w, 'verified')} className="btn-soft !min-h-[40px] text-sm">{w.verified ? '✔ ' : ''}{t('ভেরিফাইড', 'Verified')}</button>
                  <button onClick={() => flag(w, 'featured')} className="btn-soft !min-h-[40px] text-sm">{w.featured ? '★ ' : ''}{t('ফিচার্ড', 'Featured')}</button>
                  <button onClick={() => setApproval(w, 'suspended')} className="btn-danger !min-h-[40px] text-sm">{t('স্থগিত', 'Suspend')}</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGate role="admin" reason="অ্যাডমিন হিসেবে ঢুকুন।">
      <Panel />
    </AuthGate>
  );
}
