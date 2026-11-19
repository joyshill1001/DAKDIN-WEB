'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useConversation, useMessages, useWorker } from '@/lib/hooks';
import { convId, markConvRead, sendMessage } from '@/lib/services';
import { friendlyError, hasBadWords, timeAgo } from '@/lib/util';
import { setDoc, arrayRemove, arrayUnion, serverTimestamp } from 'firebase/firestore';
import AuthGate from '@/components/AuthGate';
import { Avatar, Empty, Spinner, useToast } from '@/components/ui';
import type { Message } from '@/lib/types';

function Room() {
  const sp = useSearchParams();
  const { t, en } = useLang();
  const { fbUser, me } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const me_uid = fbUser!.uid;
  const idParam = sp.get('id');
  const withParam = sp.get('with');
  const cid = idParam ?? (withParam ? convId(me_uid, withParam) : null);
  const [clientUid, workerUid] = cid ? cid.split('_') : ['', ''];
  const iAmWorker = me_uid === workerUid;
  const otherUid = iAmWorker ? clientUid : workerUid;

  const conv = useConversation(cid);
  const msgs = useMessages(cid);
  const { worker: wDoc } = useWorker(!iAmWorker ? workerUid : null);
  const [other, setOther] = useState<{ name: string; photo: string } | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const marked = useRef(-1);

  // names for a brand-new chat (no conversation document yet)
  useEffect(() => {
    if (conv) return;
    if (!iAmWorker && wDoc) setOther({ name: wDoc.name, photo: wDoc.photo });
  }, [conv, iAmWorker, wDoc]);

  useEffect(() => {
    if (!cid || !conv) return;
    const un = conv.unread[me_uid] ?? 0;
    if (un > 0 && marked.current !== un) {
      marked.current = un;
      markConvRead(cid);
    }
  }, [conv, cid, me_uid]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.data.length]);

  if (!cid || !clientUid || !workerUid) return <Empty text={t('কথোপকথন পাওয়া যায়নি।', 'Conversation not found.')} />;
  if (me_uid !== clientUid && me_uid !== workerUid) return <Empty text={t('এই চ্যাট আপনার নয়।', 'This chat is not yours.')} />;

  const clientName = conv?.clientName || (iAmWorker ? other?.name ?? '' : me?.name ?? '');
  const workerName = conv?.workerName || (iAmWorker ? me?.name ?? '' : other?.name ?? wDoc?.name ?? '');
  const otherName = iAmWorker ? clientName : workerName;
  const otherPhoto = (iAmWorker ? conv?.clientPhoto : conv?.workerPhoto) || other?.photo || '';
  const myName = me?.name ?? '';
  const blocked = (conv?.blockedBy ?? []).length > 0;
  const iBlocked = (conv?.blockedBy ?? []).includes(me_uid);

  async function send(msg: Record<string, unknown>, last: string) {
    if (!clientName || !workerName) return toast(t('একটু অপেক্ষা করুন...', 'One moment...'));
    setBusy(true);
    try {
      await sendMessage({ clientUid, workerUid, clientName, workerName, clientPhoto: iAmWorker ? '' : me?.photo, workerPhoto: iAmWorker ? me?.photo : wDoc?.photo, blocked, msg, last, myName });
    } catch (e) {
      toast(e === 'blocked' ? t('এই কথোপকথনে মেসেজ পাঠানো বন্ধ (ব্লক করা আছে)।', 'Messaging is turned off (blocked).') : friendlyError(e, en));
    }
    setBusy(false);
  }
  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    if (hasBadWords(v)) return toast(t('অশালীন শব্দ ব্যবহার করা যাবে না। ভদ্রভাবে লিখুন।', 'Abusive words are not allowed. Please be polite.'));
    setText('');
    await send({ type: 'text', text: v }, v);
  }
  async function sharePhone() {
    try {
      const s = await getDoc(doc(db!, 'workers_private', me_uid));
      const phone = s.data()?.phone as string | undefined;
      if (!phone) return toast(t('আপনার নম্বর পাওয়া যায়নি। প্রোফাইলে নম্বর দিন।', 'Your number is missing. Add it in your profile.'));
      await send({ type: 'phone_share', text: '', phone }, 'নম্বর শেয়ার করেছেন');
    } catch (e) {
      toast(friendlyError(e, en));
    }
  }
  async function toggleBlock() {
    try {
      await setDoc(doc(db!, 'conversations', cid!), { blockedBy: iBlocked ? arrayRemove(me_uid) : arrayUnion(me_uid), updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      toast(friendlyError(e, en));
    }
  }

  const asked = msgs.data.some((m) => m.type === 'phone_request');
  const shared = msgs.data.some((m) => m.type === 'phone_share');

  function bubble(m: Message) {
    const mine = m.from === me_uid;
    if (m.type === 'phone_request') {
      return (
        <div className="mx-auto my-2 max-w-[85%] rounded-2xl border border-line bg-white p-3 text-center text-[14px]">
          {mine ? t('আপনি ফোন নম্বর চেয়েছেন', 'You asked for the phone number') : t('গ্রাহক আপনার ফোন নম্বর চেয়েছেন', 'The client asked for your phone number')}
          {iAmWorker && !mine && !shared && (
            <div className="mt-2 flex justify-center gap-2">
              <button onClick={sharePhone} className="btn-primary !min-h-[40px] !px-4 text-sm">{t('নম্বর দিন', 'Share')}</button>
              <button onClick={() => send({ type: 'text', text: t('এখন নম্বর দিচ্ছি না, এখানেই কথা বলুন।', 'I am not sharing my number now. Let us talk here.') }, '...')} className="btn-ghost !min-h-[40px] !px-4 text-sm">{t('না', 'No')}</button>
            </div>
          )}
        </div>
      );
    }
    if (m.type === 'phone_share') {
      return (
        <div className="mx-auto my-2 max-w-[85%] rounded-2xl bg-[#E0F3E8] p-3 text-center text-[14.5px]">
          {t('ফোন নম্বর:', 'Phone number:')} <a className="font-bold text-good underline" href={`tel:${m.phone}`}>{m.phone}</a>
        </div>
      );
    }
    return (
      <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-[15.5px] leading-snug ${mine ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-white'}`}>
          <p className="whitespace-pre-wrap break-words">{m.text}</p>
          <p className={`mt-1 text-[11px] ${mine ? 'text-white/70' : 'text-muted'}`}>{timeAgo(m.createdAt, en)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] max-w-2xl flex-col md:h-[calc(100dvh-7rem)]">
      <div className="card mb-3 flex items-center gap-3 p-3">
        <button onClick={() => router.back()} className="text-xl" aria-label="back">←</button>
        <Avatar name={otherName || '?'} photo={otherPhoto} size={44} />
        <div className="min-w-0 flex-1"><b className="block truncate text-[16px]">{otherName}</b></div>
        {!iAmWorker && !asked && !shared && (
          <button onClick={() => send({ type: 'phone_request', text: '' }, 'নম্বর চেয়েছেন')} className="chip">📞 {t('নম্বর চাই', 'Ask number')}</button>
        )}
        {conv && <button onClick={toggleBlock} className="chip">{iBlocked ? t('আনব্লক', 'Unblock') : t('ব্লক', 'Block')}</button>}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto rounded-3xl bg-white/50 p-3">
        {msgs.loading ? <Spinner /> : msgs.data.length === 0 ? (
          <p className="py-10 text-center text-muted">{t('এখনো মেসেজ নেই। আপনার প্রথম মেসেজ লিখুন।', 'No messages yet. Say hello.')}</p>
        ) : msgs.data.map((m) => <div key={m.id}>{bubble(m)}</div>)}
        <div ref={bottom} />
      </div>
      {blocked ? (
        <p className="mt-3 rounded-2xl bg-white p-3 text-center text-[14px] text-muted">{t('মেসেজ পাঠানো বন্ধ আছে (ব্লক করা)।', 'Messaging is off (blocked).')}</p>
      ) : (
        <form onSubmit={sendText} className="mt-3 flex gap-2">
          <input className="input flex-1" value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder={t('মেসেজ লিখুন...', 'Type a message...')} />
          <button disabled={busy || !text.trim()} className="btn-primary !px-5" aria-label="send">➤</button>
        </form>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthGate reason="চ্যাট করতে Google দিয়ে ঢুকুন।">
      <Suspense fallback={<Spinner />}>
        <Room />
      </Suspense>
    </AuthGate>
  );
}
