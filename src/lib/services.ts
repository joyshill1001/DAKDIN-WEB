import { GoogleAuthProvider, deleteUser, reauthenticateWithPopup } from 'firebase/auth';
import {
  addDoc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type DocumentReference,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { AreaSel, Booking, Conv, Notif } from './types';

export function myUid(): string {
  return auth?.currentUser?.uid ?? '';
}

function fs() {
  if (!db) throw new Error('Firebase is not configured');
  return db;
}

// ---------------- notifications ----------------
export async function sendNotif(p: { toUid: string; type: string; title: string; body: string; refId?: string; docId?: string }) {
  try {
    const data = {
      toUid: p.toUid,
      fromUid: myUid(),
      type: p.type,
      title: p.title,
      body: p.body,
      refId: p.refId ?? '',
      read: false,
      createdAt: serverTimestamp(),
    };
    if (p.docId) await setDoc(doc(fs(), 'notifications', p.docId), data);
    else await addDoc(collection(fs(), 'notifications'), data);
  } catch {
    /* a failed notification must never block the action */
  }
}

export async function markNotifRead(id: string) {
  try {
    await updateDoc(doc(fs(), 'notifications', id), { read: true });
  } catch {
    /* ignore */
  }
}

export async function markAllNotifsRead(list: Notif[]) {
  const unread = list.filter((n) => !n.read);
  if (!unread.length) return;
  const b = writeBatch(fs());
  for (const n of unread) b.update(doc(fs(), 'notifications', n.id), { read: true });
  try {
    await b.commit();
  } catch {
    /* ignore */
  }
}

// ---------------- account / profile ----------------
export async function createUserDoc(uid: string, name: string, email: string, role: 'client' | 'worker') {
  await setDoc(doc(fs(), 'users', uid), {
    name,
    email,
    photo: '',
    role,
    status: 'active',
    createdAt: serverTimestamp(),
  });
}

/** One phone number = one account: the number is reserved in phone_index/{phone}. */
export async function saveRequiredProfile(p: {
  uid: string;
  oldPhone?: string;
  name: string;
  phone: string;
  address: string;
  area: AreaSel;
  photo?: string;
}) {
  const d = fs();
  const idx = doc(d, 'phone_index', p.phone);
  await runTransaction(d, async (tx) => {
    const cur = await tx.get(idx);
    if (cur.exists()) {
      const m = cur.data();
      if (m.banned === true) throw 'phone_banned';
      if (m.uid !== p.uid) throw 'phone_used';
    }
    let oldSnap = null;
    if (p.oldPhone && p.oldPhone !== p.phone) oldSnap = await tx.get(doc(d, 'phone_index', p.oldPhone));
    if (!cur.exists()) tx.set(idx, { uid: p.uid, updatedAt: serverTimestamp() });
    if (oldSnap && oldSnap.exists() && oldSnap.data().uid === p.uid && oldSnap.data().banned !== true) tx.delete(oldSnap.ref);
    tx.update(doc(d, 'users', p.uid), {
      name: p.name,
      phone: p.phone,
      address: p.address,
      area: p.area,
      ...(p.photo != null ? { photo: p.photo } : {}),
    });
  });
}

export async function updateUserArea(uid: string, area: AreaSel) {
  await updateDoc(doc(fs(), 'users', uid), { area });
}

// ---------------- bookings ----------------
export async function createBooking(data: DocumentData, workerUid: string, clientName: string) {
  const ref = doc(collection(fs(), 'bookings'));
  await setDoc(ref, {
    ...data,
    clientUid: myUid(),
    status: 'pending',
    reviewed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await sendNotif({
    toUid: workerUid,
    type: 'booking',
    title: 'নতুন কাজের অনুরোধ / New work request',
    body: clientName,
    refId: ref.id,
  });
}

export async function updateBooking(id: string, data: DocumentData) {
  await updateDoc(doc(fs(), 'bookings', id), { ...data, updatedAt: serverTimestamp() });
}

const statusLabels: Record<string, [string, string]> = {
  accepted: ['কাজ গৃহীত হয়েছে', 'Request accepted'],
  rejected: ['অনুরোধ বাতিল হয়েছে', 'Request rejected'],
  in_progress: ['কাজ শুরু হয়েছে', 'Work started'],
  completed: ['কাজ সম্পন্ন', 'Work completed'],
  cancelled: ['অনুরোধ বাতিল', 'Request cancelled'],
};

export async function setBookingStatus(b: Booking, status: string, actorIsWorker: boolean, note = '') {
  const d = fs();
  if (status === 'completed' && actorIsWorker) {
    // booking + job counter change together (the security rules check this)
    const batch = writeBatch(d);
    batch.update(doc(d, 'bookings', b.id), {
      status,
      jobCounted: true,
      ...(note ? { note } : {}),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(d, 'workers', b.workerUid), { jobs: increment(1), lastJobId: b.id });
    await batch.commit();
  } else {
    await updateBooking(b.id, { status, ...(note ? { note } : {}) });
  }
  const l = statusLabels[status];
  if (!l) return;
  await sendNotif({
    toUid: actorIsWorker ? b.clientUid : b.workerUid,
    type: 'booking',
    title: `${l[0]} / ${l[1]}`,
    body: actorIsWorker ? b.workerName : b.clientName,
    refId: b.id,
  });
}

export async function submitReview(b: Booking, rating: number, text: string, clientName: string) {
  const d = fs();
  const batch = writeBatch(d);
  batch.set(doc(d, 'reviews', b.id), {
    bookingId: b.id,
    workerUid: b.workerUid,
    clientUid: b.clientUid,
    clientName,
    rating,
    text,
    photos: [],
    createdAt: serverTimestamp(),
  });
  batch.update(doc(d, 'bookings', b.id), { reviewed: true });
  batch.update(doc(d, 'workers', b.workerUid), {
    ratingSum: increment(rating),
    ratingCount: increment(1),
    lastReviewId: b.id,
  });
  await batch.commit();
  await sendNotif({ toUid: b.workerUid, type: 'review', title: 'নতুন রিভিউ / New review', body: `${rating} ★`, refId: b.id });
}

// ---------------- chat ----------------
export const convId = (clientUid: string, workerUid: string) => `${clientUid}_${workerUid}`;

export async function sendMessage(c: {
  clientUid: string;
  workerUid: string;
  clientName: string;
  workerName: string;
  clientPhoto?: string;
  workerPhoto?: string;
  blocked: boolean;
  msg: DocumentData;
  last: string;
  myName: string;
}) {
  if (c.blocked) throw 'blocked';
  const me = myUid();
  const other = me === c.clientUid ? c.workerUid : c.clientUid;
  const id = convId(c.clientUid, c.workerUid);
  const d = fs();
  const ref = doc(d, 'conversations', id);
  const batch = writeBatch(d);
  batch.set(
    ref,
    {
      clientUid: c.clientUid,
      workerUid: c.workerUid,
      clientName: c.clientName,
      workerName: c.workerName,
      ...(c.clientPhoto ? { clientPhoto: c.clientPhoto } : {}),
      ...(c.workerPhoto ? { workerPhoto: c.workerPhoto } : {}),
      members: [c.clientUid, c.workerUid],
      lastText: c.last,
      updatedAt: serverTimestamp(),
      unread: { [other]: increment(1), [me]: 0 },
      deletedBy: arrayRemove(me, other),
    },
    { merge: true },
  );
  batch.set(doc(collection(ref, 'messages')), { ...c.msg, from: me, createdAt: serverTimestamp() });
  await batch.commit();
  // one notification per chat (refreshed, not duplicated)
  await sendNotif({ toUid: other, type: 'message', title: c.myName, body: c.last, refId: id, docId: `msg_${id}_${other}` });
}

export async function markConvRead(id: string) {
  try {
    await setDoc(
      doc(fs(), 'conversations', id),
      { unread: { [myUid()]: 0 }, lastRead: { [myUid()]: serverTimestamp() } },
      { merge: true },
    );
  } catch {
    /* ignore */
  }
}

export async function hideConversation(c: Conv) {
  const me = myUid();
  await setDoc(doc(fs(), 'conversations', c.id), { deletedBy: arrayUnion(me) }, { merge: true });
}

// ---------------- saved / report ----------------
export async function toggleSaved(workerUid: string, save: boolean) {
  const ref = doc(fs(), 'saved_workers', `${myUid()}_${workerUid}`);
  if (save) await setDoc(ref, { ownerUid: myUid(), workerUid, createdAt: serverTimestamp() });
  else await deleteDoc(ref);
}

export async function submitReport(p: { targetUid: string; targetName: string; targetType: string; reason: string; details?: string }) {
  await addDoc(collection(fs(), 'reports'), {
    reporterUid: myUid(),
    targetUid: p.targetUid,
    targetName: p.targetName,
    targetType: p.targetType,
    reason: p.reason,
    details: p.details ?? '',
    status: 'open',
    createdAt: serverTimestamp(),
  });
  await sendNotif({ toUid: 'admin', type: 'report', title: 'নতুন রিপোর্ট / New report', body: `${p.targetName}: ${p.reason}` });
}

// ---------------- delete account ----------------
/** Re-checks the Google login, deletes the user's Firestore data, then the sign-in account. */
export async function deleteMyAccount(): Promise<void> {
  const u = auth?.currentUser;
  if (!u) return;
  const d = fs();
  try {
    await reauthenticateWithPopup(u, new GoogleAuthProvider());
  } catch {
    throw 'cancelled';
  }
  const uid = u.uid;
  const refs = async (col: string, field: string): Promise<DocumentReference[]> => {
    try {
      const q = await getDocs(query(collection(d, col), where(field, '==', uid), limit(400)));
      return q.docs.map((x) => x.ref);
    } catch {
      return [];
    }
  };
  const del: DocumentReference[] = [
    ...(await refs('notifications', 'toUid')),
    ...(await refs('saved_workers', 'ownerUid')),
    ...(await refs('shops', 'ownerUid')),
    ...(await refs('shop_reviews', 'uid')),
    ...(await refs('bookings', 'clientUid')),
    ...(await refs('bookings', 'workerUid')),
    ...(await refs('reviews', 'workerUid')),
    doc(d, 'verify_requests', uid),
  ];
  const scrub = await refs('reviews', 'clientUid');
  const chats: DocumentReference[] = [];
  try {
    const q = await getDocs(query(collection(d, 'conversations'), where('members', 'array-contains', uid), limit(300)));
    q.docs.forEach((x) => chats.push(x.ref));
  } catch {
    /* ignore */
  }
  let phone = '';
  try {
    phone = String((await getDoc(doc(d, 'users', uid))).data()?.phone ?? '');
  } catch {
    /* ignore */
  }

  // the profile goes first (the rules then allow the cleanup below)
  const b0 = writeBatch(d);
  for (const c of ['workers', 'workers_private', 'workers_photos', 'users']) b0.delete(doc(d, c, uid));
  await b0.commit();

  const run = async (ops: ((b: ReturnType<typeof writeBatch>) => void)[]) => {
    for (let i = 0; i < ops.length; i += 400) {
      const b = writeBatch(d);
      ops.slice(i, i + 400).forEach((op) => op(b));
      try {
        await b.commit();
      } catch {
        /* best effort */
      }
    }
  };
  await run(del.map((r) => (b) => b.delete(r)));
  await run(scrub.map((r) => (b) => b.update(r, { clientName: 'মুছে ফেলা ব্যবহারকারী', text: '', photos: [] })));
  await run(chats.map((r) => (b) => b.update(r, { deletedBy: arrayUnion(uid) })));
  if (phone) {
    try {
      const ph = doc(d, 'phone_index', phone);
      const s = await getDoc(ph);
      if (s.exists() && s.data().uid === uid && s.data().banned !== true) await deleteDoc(ph);
    } catch {
      /* ignore */
    }
  }
  try {
    await deleteUser(u);
  } catch (e) {
    const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : '';
    if (code.includes('requires-recent-login')) throw 'recent-login';
    throw e;
  }
}
