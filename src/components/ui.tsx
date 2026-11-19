'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { b64Src } from '@/lib/image';
import { colorFromName, cx } from '@/lib/util';
import { useLang } from '@/lib/i18n';
import { iconColors, iconEmoji, type Category } from '@/lib/data';

// ---------------- toast ----------------
type ToastFn = (msg: string) => void;
const ToastCtx = createContext<ToastFn>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <div
          role="status"
          className="rise fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-md rounded-2xl bg-ink px-4 py-3 text-center text-[14.5px] font-medium text-white shadow-float md:bottom-8"
        >
          {msg}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

// ---------------- small pieces ----------------
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cx('flex justify-center py-10', className)} role="status" aria-label="loading">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-soft border-t-brand" />
    </div>
  );
}

export function Empty({ icon = '🔎', text, action }: { icon?: string; text: string; action?: ReactNode }) {
  return (
    <div className="card mx-auto my-6 flex max-w-md flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="text-5xl">{icon}</div>
      <p className="text-[15.5px] leading-relaxed text-muted">{text}</p>
      {action}
    </div>
  );
}

export function ErrorBox({ text }: { text?: string }) {
  const { t } = useLang();
  return (
    <div className="card mx-auto my-6 max-w-md border-danger/20 px-6 py-8 text-center text-danger">
      {text ?? t('লোড করা যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।', 'Could not load. Check your internet and try again.')}
    </div>
  );
}

export function Avatar({ name, photo, size = 48, className }: { name: string; photo?: string; size?: number; className?: string }) {
  const st = { width: size, height: size, fontSize: size * 0.42 };
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={b64Src(photo)} alt={name} style={st} className={cx('shrink-0 rounded-full object-cover object-top', className)} />;
  }
  return (
    <div
      style={{ ...st, background: colorFromName(name) }}
      className={cx('flex shrink-0 items-center justify-center rounded-full font-bold text-white', className)}
      aria-label={name}
    >
      {name ? [...name][0] : '?'}
    </div>
  );
}

export function Verified({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="verified" className="inline shrink-0">
      <path
        fill="#1D9BF0"
        d="M12 1.8l2.6 1.6 3-.2 1.2 2.8 2.6 1.6-.4 3 1.4 2.6-1.9 2.4-.2 3-3 .8-1.9 2.3-2.8-1.2-2.8 1.2-1.9-2.3-3-.8-.2-3L1.8 12l1.4-2.6-.4-3 2.6-1.6L6.6 2.2l3 .2z"
      />
      <path fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M8 12.3l2.7 2.7L16.2 9.5" />
    </svg>
  );
}

export function Stars({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  const { n } = useLang();
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-gold">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
      </svg>
      <span>{count === 0 ? n('০') : n(value.toFixed(1))}</span>
      {count != null && <span className="font-normal text-muted">({n(count)})</span>}
    </span>
  );
}

export function Pill({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'good' | 'gold' | 'danger' | 'muted' }) {
  const cls = {
    brand: 'bg-soft text-brand',
    good: 'bg-[#E0F3E8] text-good',
    gold: 'bg-[#FAEFD2] text-[#9A6B00]',
    danger: 'bg-[#F8E3DB] text-danger',
    muted: 'bg-[#F1ECE7] text-muted',
  }[tone];
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold', cls)}>{children}</span>;
}

export function CategoryIcon({ c, size = 56 }: { c: Category; size?: number }) {
  const col = iconColors[c.icon] ?? '#E8590C';
  return (
    <div
      style={{ width: size, height: size, background: col + '24', borderRadius: size * 0.3, fontSize: size * 0.48 }}
      className="flex shrink-0 items-center justify-center overflow-hidden"
      aria-hidden
    >
      {c.iconImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b64Src(c.iconImg)} alt="" width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        iconEmoji[c.icon] ?? '🔨'
      )}
    </div>
  );
}

export function PageTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-[24px] font-bold leading-tight text-ink md:text-[28px]">{title}</h1>
        {sub && <p className="mt-1 text-[14.5px] text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 md:items-center" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="rise flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-[28px] bg-cream shadow-float md:rounded-[28px]"
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-5">
          <h2 className="text-[19px] font-bold">{title}</h2>
          <button onClick={onClose} aria-label="close" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-muted shadow-sm">
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-6 pt-2" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[12.5px] text-muted">{hint}</p>}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto py-1" role="tablist">
      {options.map(([v, label]) => (
        <button key={v} role="tab" aria-selected={v === value} onClick={() => onChange(v)} className={cx('chip', v === value && 'chip-on')}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-left">
      <span className="text-[15px] font-medium">{label}</span>
      <span className={cx('relative h-7 w-12 rounded-full transition', on ? 'bg-brand' : 'bg-[#D9CFC6]')}>
        <span className={cx('absolute top-1 h-5 w-5 rounded-full bg-white transition-all', on ? 'left-6' : 'left-1')} />
      </span>
    </button>
  );
}
