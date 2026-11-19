'use client';
import { useMemo, useState } from 'react';
import { useAreas, makeArea, type District, type Division, type Upazila } from '@/lib/areas';
import { useLang } from '@/lib/i18n';
import type { AreaSel } from '@/lib/types';
import { Modal, Spinner, ErrorBox } from './ui';

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (a: AreaSel) => void;
  /** let the user also choose a union (after the upazila) */
  withUnion?: boolean;
  title?: string;
};

/** Division -> district -> upazila -> (union). One list at a time, with search. */
export default function AreaPicker({ open, onClose, onPick, withUnion = false, title }: Props) {
  const { t, en } = useLang();
  const { areas, error } = useAreas();
  const [div, setDiv] = useState<Division | null>(null);
  const [dist, setDist] = useState<District | null>(null);
  const [up, setUp] = useState<Upazila | null>(null);
  const [q, setQ] = useState('');

  const step = up ? 'union' : dist ? 'upazila' : div ? 'district' : 'division';

  const items = useMemo(() => {
    if (!areas) return [];
    const nm = (bn: string, e: string) => (en ? e : bn);
    let list: { key: string; label: string; sub?: string; run: () => void }[] = [];
    if (step === 'division') list = areas.divisions.map((d) => ({ key: d.en, label: nm(d.bn, d.en), run: () => setDiv(d) }));
    else if (step === 'district') list = div!.districts.map((d) => ({ key: d.en, label: nm(d.bn, d.en), run: () => setDist(d) }));
    else if (step === 'upazila')
      list = dist!.upazilas.map((u) => ({
        key: u.en,
        label: nm(u.bn, u.en),
        run: () => {
          if (withUnion && u.unions.length) setUp(u);
          else finish(dist!, u, '');
        },
      }));
    else list = up!.unions.map((u) => ({ key: u, label: u, run: () => finish(dist!, up!, u) }));
    const s = q.trim().toLowerCase();
    return s ? list.filter((x) => x.label.toLowerCase().includes(s)) : list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, step, div, dist, up, q, en, withUnion]);

  function reset() {
    setDiv(null);
    setDist(null);
    setUp(null);
    setQ('');
  }
  function finish(d: District, u: Upazila, union: string) {
    onPick(makeArea(d, u, union));
    reset();
    onClose();
  }
  function back() {
    setQ('');
    if (up) setUp(null);
    else if (dist) setDist(null);
    else if (div) setDiv(null);
  }

  const crumbs = [div, dist, up].filter(Boolean).map((x) => (en ? (x as { en: string }).en : (x as { bn: string }).bn));
  const heading = {
    division: t('বিভাগ বেছে নিন', 'Choose division'),
    district: t('জেলা বেছে নিন', 'Choose district'),
    upazila: t('উপজেলা বেছে নিন', 'Choose upazila'),
    union: t('ইউনিয়ন বেছে নিন', 'Choose union'),
  }[step];

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={title ?? t('এলাকা বেছে নিন', 'Choose area')}>
      {!areas && !error && <Spinner />}
      {error && <ErrorBox />}
      {areas && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            {step !== 'division' && (
              <button onClick={back} className="btn-ghost !min-h-[40px] !px-3 text-sm" aria-label={t('পেছনে', 'Back')}>
                ← {t('পেছনে', 'Back')}
              </button>
            )}
            <p className="text-[13.5px] font-semibold text-muted">{crumbs.length ? crumbs.join(' › ') : heading}</p>
          </div>
          {crumbs.length > 0 && <p className="mb-2 text-[15px] font-bold">{heading}</p>}
          <input className="input mb-3" placeholder={t('খুঁজুন...', 'Search...')} value={q} onChange={(e) => setQ(e.target.value)} />
          {step === 'union' && (
            <button className="btn-soft mb-2 w-full" onClick={() => finish(dist!, up!, '')}>
              {t('পুরো উপজেলা (ইউনিয়ন নয়)', 'Whole upazila (no union)')}
            </button>
          )}
          <ul className="grid grid-cols-2 gap-2">
            {items.map((x) => (
              <li key={x.key}>
                <button onClick={x.run} className="w-full rounded-2xl border border-line bg-white px-3 py-3 text-left text-[15px] font-medium hover:border-brand">
                  {x.label}
                </button>
              </li>
            ))}
          </ul>
          {items.length === 0 && <p className="py-6 text-center text-muted">{t('কিছু পাওয়া যায়নি।', 'Nothing found.')}</p>}
        </div>
      )}
    </Modal>
  );
}
