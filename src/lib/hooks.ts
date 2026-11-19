'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { db } from './firebase';
import { defaultCategories, type Category } from './data';
import {
  bookingFrom,
  convFrom,
  messageFrom,
  notifFrom,
  reviewFrom,
  servesAt,
  str,
  workerFrom,
  type Booking,
  type Conv,
  type Message,
  type Notif,
  type Review,
  type Worker,
} from './types';

type Live<T> = { data: T; loading: boolean; error: boolean };

function useQuerySnap<T>(q: Query<DocumentData> | null, map: (id: string, d: DocumentData) => T, deps: unknown[]): Live<T[]> {
  const [state, setState] = useState<Live<T[]>>({ data: [], loading: !!q, error: false });
  useEffect(() => {
    if (!q) {
      setState({ data: [], loading: false, error: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: false }));
    return onSnapshot(
      q,
      (s) => setState({ data: s.docs.map((d) => map(d.id, d.data())), loading: false, error: false }),
      () => setState({ data: [], loading: false, error: true }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function useCategories(): Category[] {
  const [cats, setCats] = useState<Category[]>(defaultCategories);
  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      collection(db, 'categories'),
      (s) => {
        const l = s.docs
          .map((d) => {
            const m = d.data();
            return {
              id: d.id,
              bn: str(m, 'bn'),
              en: str(m, 'en'),
              icon: str(m, 'icon') || 'handyman',
              iconImg: str(m, 'iconImg'),
              enabled: m.enabled !== false,
              order: typeof m.order === 'number' ? m.order : 0,
            } as Category;
          })
          .filter((c) => c.enabled)
          .sort((a, b) => a.order - b.order);
        setCats(l.length ? l : defaultCategories);
      },
      () => setCats(defaultCategories),
    );
  }, []);
  return cats;
}

/** Approved workers who serve the given upazila key. Other filters are applied in the browser. */
export function useWorkersInArea(key: string | null, union = ''): Live<Worker[]> {
  const q = useMemo(() => {
    if (!db || !key) return null;
    return query(
      collection(db, 'workers'),
      where('approval', '==', 'approved'),
      where('serveKeys', 'array-contains', key),
      limit(200),
    );
  }, [key]);
  const r = useQuerySnap(q, workerFrom, [key]);
  const data = useMemo(() => r.data.filter((w) => servesAt(w, key ?? '', union)), [r.data, key, union]);
  return { ...r, data };
}

export function useWorker(uid: string | null): { worker: Worker | null; loading: boolean } {
  const [s, setS] = useState<{ worker: Worker | null; loading: boolean }>({ worker: null, loading: !!uid });
  useEffect(() => {
    if (!uid || !db) {
      setS({ worker: null, loading: false });
      return;
    }
    setS((x) => ({ ...x, loading: true }));
    return onSnapshot(
      doc(db, 'workers', uid),
      (d) => setS({ worker: d.exists() ? workerFrom(d.id, d.data()) : null, loading: false }),
      () => setS({ worker: null, loading: false }),
    );
  }, [uid]);
  return s;
}

export function useWorkerReviews(uid: string | null): Live<Review[]> {
  const q = useMemo(() => (db && uid ? query(collection(db, 'reviews'), where('workerUid', '==', uid), limit(50)) : null), [uid]);
  const r = useQuerySnap(q, reviewFrom, [uid]);
  const data = useMemo(() => [...r.data].sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)), [r.data]);
  return { ...r, data };
}

/** Bookings where I am the client or the worker. */
export function useMyBookings(uid: string | null, as: 'client' | 'worker'): Live<Booking[]> {
  const q = useMemo(
    () => (db && uid ? query(collection(db, 'bookings'), where(as === 'client' ? 'clientUid' : 'workerUid', '==', uid), limit(100)) : null),
    [uid, as],
  );
  const r = useQuerySnap(q, bookingFrom, [uid, as]);
  const data = useMemo(() => [...r.data].sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)), [r.data]);
  return { ...r, data };
}

export function useBooking(id: string | null): { booking: Booking | null; loading: boolean } {
  const [s, setS] = useState<{ booking: Booking | null; loading: boolean }>({ booking: null, loading: !!id });
  useEffect(() => {
    if (!id || !db) {
      setS({ booking: null, loading: false });
      return;
    }
    return onSnapshot(
      doc(db, 'bookings', id),
      (d) => setS({ booking: d.exists() ? bookingFrom(d.id, d.data()) : null, loading: false }),
      () => setS({ booking: null, loading: false }),
    );
  }, [id]);
  return s;
}

export function useConversations(uid: string | null): Live<Conv[]> {
  const q = useMemo(() => (db && uid ? query(collection(db, 'conversations'), where('members', 'array-contains', uid), limit(100)) : null), [uid]);
  const r = useQuerySnap(q, convFrom, [uid]);
  const data = useMemo(
    () =>
      r.data
        .filter((c) => !uid || !c.deletedBy.includes(uid))
        .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0)),
    [r.data, uid],
  );
  return { ...r, data };
}

export function useConversation(id: string | null): Conv | null {
  const [c, setC] = useState<Conv | null>(null);
  useEffect(() => {
    if (!id || !db) {
      setC(null);
      return;
    }
    return onSnapshot(
      doc(db, 'conversations', id),
      (d) => setC(d.exists() ? convFrom(d.id, d.data()) : null),
      () => setC(null),
    );
  }, [id]);
  return c;
}

export function useMessages(id: string | null): Live<Message[]> {
  const q = useMemo(() => (db && id ? query(collection(db, 'conversations', id, 'messages'), orderBy('createdAt', 'asc'), limit(300)) : null), [id]);
  return useQuerySnap(q, messageFrom, [id]);
}

export function useNotifications(uid: string | null): Live<Notif[]> {
  const q = useMemo(() => (db && uid ? query(collection(db, 'notifications'), where('toUid', '==', uid), limit(60)) : null), [uid]);
  const r = useQuerySnap(q, notifFrom, [uid]);
  const data = useMemo(() => [...r.data].sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)), [r.data]);
  return { ...r, data };
}

export function useSavedWorkerIds(uid: string | null): Live<string[]> {
  const q = useMemo(() => (db && uid ? query(collection(db, 'saved_workers'), where('ownerUid', '==', uid), limit(100)) : null), [uid]);
  return useQuerySnap(q, (_id, d) => str(d, 'workerUid'), [uid]);
}

export function useIsSaved(uid: string | null, workerUid: string | null): boolean {
  const [s, setS] = useState(false);
  useEffect(() => {
    if (!db || !uid || !workerUid) {
      setS(false);
      return;
    }
    return onSnapshot(
      doc(db, 'saved_workers', `${uid}_${workerUid}`),
      (d) => setS(d.exists()),
      () => setS(false),
    );
  }, [uid, workerUid]);
  return s;
}
