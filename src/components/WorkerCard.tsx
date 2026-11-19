'use client';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { workerAreaText, workerRating, type Worker } from '@/lib/types';
import { Avatar, Stars, Verified, Pill } from './ui';

export function priceText(w: Worker, t: (bn: string, en: string) => string, money: (n: number) => string): string {
  const p: string[] = [];
  if (w.hr != null) p.push(`${money(w.hr)}${t('/ঘণ্টা', '/hr')}`);
  if (w.day != null) p.push(`${money(w.day)}${t('/দিন', '/day')}`);
  return p.length ? p.join(' · ') : t('দর কথা বলে ঠিক', 'Negotiable');
}

export function isNew(w: Worker): boolean {
  return !!w.createdAt && Date.now() - w.createdAt.getTime() < 15 * 86400000;
}

export default function WorkerCard({ w }: { w: Worker }) {
  const { t, n, money } = useLang();
  const href = `/worker/?id=${w.uid}`;
  return (
    <article className="card rise relative flex flex-col gap-3 p-4">
      {isNew(w) && (
        <span className="absolute right-3 top-3 rounded-full bg-good px-2.5 py-0.5 text-[11.5px] font-bold text-white">{t('নতুন', 'NEW')}</span>
      )}
      <Link href={href} className="flex items-center gap-3">
        <div className="relative">
          <Avatar name={w.name} photo={w.photo} size={64} className="ring-4 ring-soft" />
          <span
            className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${w.available ? 'bg-good' : 'bg-[#B9ADA3]'}`}
            title={w.available ? t('কাজ নিচ্ছেন', 'Available') : t('ব্যস্ত', 'Busy')}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 text-[17px] font-bold leading-tight">
            <span className="truncate">{w.name}</span>
            {w.verified && <Verified />}
          </h3>
          <p className="truncate text-[14px] font-medium text-brand">{w.catName}</p>
          <p className="truncate text-[13px] text-muted">📍 {workerAreaText(w)}</p>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px]">
        <Stars value={workerRating(w)} count={w.ratingCount} />
        {w.exp > 0 && <span className="text-muted">{t(`${n(w.exp)} বছরের অভিজ্ঞতা`, `${w.exp} yrs experience`)}</span>}
        {w.jobs > 0 && <span className="text-muted">{t(`${n(w.jobs)}টি কাজ`, `${w.jobs} jobs`)}</span>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-bold text-ink">{priceText(w, t, money)}</span>
        {w.nego && <Pill tone="gold">{t('দরদাম চলে', 'Negotiable')}</Pill>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link href={`/chat/?with=${w.uid}`} className="btn-soft !min-h-[44px] !text-[14.5px]">
          💬 {t('মেসেজ', 'Message')}
        </Link>
        <Link href={`/book/?worker=${w.uid}`} className="btn-primary !min-h-[44px] !text-[14.5px]">
          {t('কাজের অনুরোধ', 'Request job')}
        </Link>
      </div>
    </article>
  );
}
