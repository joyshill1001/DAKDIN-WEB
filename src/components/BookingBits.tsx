'use client';
import { Pill } from './ui';
import { useLang } from '@/lib/i18n';

export const statusText: Record<string, [string, string]> = {
  pending: ['অপেক্ষমাণ', 'Pending'],
  accepted: ['গৃহীত', 'Accepted'],
  rejected: ['বাতিল (কারিগর)', 'Rejected'],
  in_progress: ['চলছে', 'In progress'],
  completed: ['সম্পন্ন', 'Completed'],
  cancelled: ['বাতিল', 'Cancelled'],
};

export function StatusPill({ s }: { s: string }) {
  const { t } = useLang();
  const tone = s === 'completed' ? 'good' : s === 'rejected' || s === 'cancelled' ? 'danger' : s === 'pending' ? 'gold' : 'brand';
  const l = statusText[s] ?? [s, s];
  return <Pill tone={tone}>{t(l[0], l[1])}</Pill>;
}
