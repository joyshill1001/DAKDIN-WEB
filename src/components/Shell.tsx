'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useConversations, useNotifications } from '@/lib/hooks';
import { cx } from '@/lib/util';
import Logo from './Logo';

type Item = { href: string; icon: string; bn: string; en: string; badge?: number };

export default function Shell({ children }: { children: ReactNode }) {
  const { fbUser, me } = useAuth();
  const { t, en, setLang, n } = useLang();
  const path = usePathname() ?? '/';
  const uid = fbUser?.uid ?? null;
  const convs = useConversations(uid);
  const notifs = useNotifications(uid);
  const unreadMsgs = uid ? convs.data.reduce((s, c) => s + (c.unread[uid] ?? 0), 0) : 0;
  const unreadNotifs = notifs.data.filter((x) => !x.read).length;

  const role = me?.role ?? 'client';
  const items: Item[] = !fbUser
    ? [
        { href: '/', icon: '🏠', bn: 'হোম', en: 'Home' },
        { href: '/categories/', icon: '🧰', bn: 'সেবা', en: 'Services' },
      ]
    : role === 'worker'
      ? [
          { href: '/dashboard/', icon: '📊', bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
          { href: '/bookings/', icon: '📋', bn: 'অনুরোধ', en: 'Requests' },
          { href: '/messages/', icon: '💬', bn: 'মেসেজ', en: 'Messages', badge: unreadMsgs },
          { href: '/profile/', icon: '👤', bn: 'প্রোফাইল', en: 'Profile' },
        ]
      : [
          { href: '/', icon: '🏠', bn: 'হোম', en: 'Home' },
          { href: '/categories/', icon: '🧰', bn: 'সেবা', en: 'Services' },
          { href: '/bookings/', icon: '📋', bn: 'বুকিং', en: 'Bookings' },
          { href: '/messages/', icon: '💬', bn: 'মেসেজ', en: 'Messages', badge: unreadMsgs },
          { href: '/profile/', icon: '👤', bn: 'প্রোফাইল', en: 'Profile' },
        ];

  const active = (h: string) => (h === '/' ? path === '/' : path.startsWith(h));

  return (
    <div className="min-h-screen pb-28 md:pb-10">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link href={fbUser && role === 'worker' ? '/dashboard/' : '/'} aria-label="DakDin">
            <Logo />
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="main">
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={cx(
                  'relative rounded-xl px-3.5 py-2 text-[15px] font-semibold transition',
                  active(i.href) ? 'bg-soft text-brand' : 'text-muted hover:bg-white',
                )}
              >
                {t(i.bn, i.en)}
                {!!i.badge && <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[11px] text-white">{n(i.badge)}</span>}
              </Link>
            ))}
            {me?.role === 'admin' && (
              <Link href="/admin/" className={cx('rounded-xl px-3.5 py-2 text-[15px] font-semibold', active('/admin') ? 'bg-soft text-brand' : 'text-muted hover:bg-white')}>
                {t('অ্যাডমিন', 'Admin')}
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setLang(en ? 'bn' : 'en')}
              className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[13.5px] font-bold text-ink"
              aria-label="language"
            >
              {en ? 'বাংলা' : 'English'}
            </button>
            {fbUser && (
              <Link href="/notifications/" aria-label={t('নোটিফিকেশন', 'Notifications')} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-lg">
                🔔
                {unreadNotifs > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-brand px-1 text-center text-[11px] font-bold leading-[18px] text-white">{n(unreadNotifs)}</span>
                )}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5">{children}</main>

      <footer className="mx-auto mt-12 hidden max-w-6xl px-4 text-center text-[13px] text-muted md:block">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <Link href="/terms/" className="hover:text-brand">{t('শর্তাবলী', 'Terms')}</Link>
          <Link href="/privacy/" className="hover:text-brand">{t('গোপনীয়তা নীতি', 'Privacy Policy')}</Link>
          <span>© DAKDIN · MADE FOR BANGLADESH</span>
        </div>
      </footer>

      {/* mobile bottom bar */}
      <nav
        aria-label="bottom"
        className="fixed inset-x-0 bottom-0 z-40 px-3 md:hidden"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around rounded-[28px] border border-white/80 bg-white/92 p-1.5 shadow-float">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={cx(
                'relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11.5px] font-semibold transition',
                active(i.href) ? 'bg-brand text-white shadow-float' : 'text-muted',
              )}
            >
              <span className="text-[20px] leading-none">{i.icon}</span>
              <span className="max-w-full truncate px-1">{t(i.bn, i.en)}</span>
              {!!i.badge && (
                <span className="absolute right-3 top-0.5 min-w-[17px] rounded-full bg-danger px-1 text-center text-[10.5px] font-bold leading-[17px] text-white">{n(i.badge)}</span>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
