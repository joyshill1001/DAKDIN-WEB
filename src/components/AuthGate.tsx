'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { friendlyError } from '@/lib/util';
import { profileComplete } from '@/lib/types';
import Logo from './Logo';
import { Spinner } from './ui';

export function SetupNotice() {
  const { t } = useLang();
  return (
    <div className="card mx-auto my-10 max-w-xl p-6 text-[15px] leading-relaxed">
      <h2 className="mb-2 text-xl font-bold">{t('Firebase এখনও যুক্ত হয়নি', 'Firebase is not connected yet')}</h2>
      <p className="text-muted">
        {t(
          'সাইটের `.env.local` ফাইলে Firebase ওয়েব কনফিগ বসান (README.md দেখুন)। তারপর `npm run dev` আবার চালান।',
          'Put the Firebase web config in the site’s `.env.local` file (see README.md), then restart `npm run dev`.',
        )}
      </p>
    </div>
  );
}

export function LoginCard({ reason }: { reason?: string }) {
  const { t, en } = useLang();
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function go() {
    setBusy(true);
    setErr('');
    try {
      await signIn();
    } catch (e) {
      setErr(friendlyError(e, en));
    }
    setBusy(false);
  }
  return (
    <div className="card rise mx-auto my-8 w-full max-w-md p-6 text-center md:p-8">
      <div className="mb-4 flex justify-center">
        <Logo size={56} text={false} />
      </div>
      <h2 className="text-2xl font-extrabold">{t('ডাকদিনে স্বাগতম', 'Welcome to DAKDIN')}</h2>
      <p className="mb-5 mt-2 text-[15px] text-muted">
        {reason ?? t('আপনার এলাকার দক্ষ কারিগর, এক জায়গায়।', 'Skilled local workers, all in one place.')}
      </p>
      <button onClick={go} disabled={busy} className="btn-ghost w-full !min-h-[54px] !text-base">
        {busy ? (
          t('অপেক্ষা করুন...', 'Please wait...')
        ) : (
          <>
            <span className="text-2xl font-black text-[#4285F4]">G</span>
            {t('Google দিয়ে চালিয়ে যান', 'Continue with Google')}
          </>
        )}
      </button>
      {err && <p className="mt-3 text-sm text-danger">{err}</p>}
      <p className="mt-4 text-[12.5px] text-muted">
        {t('চালিয়ে গেলে আপনি শর্তাবলী ও গোপনীয়তা নীতি মানছেন।', 'By continuing you accept the Terms and Privacy Policy.')}
      </p>
    </div>
  );
}

/** Wrap a page that needs a signed-in user with a finished profile. */
export default function AuthGate({
  children,
  role,
  reason,
}: {
  children: ReactNode;
  /** only this role may see the page (admin always can) */
  role?: 'client' | 'worker' | 'admin';
  reason?: string;
}) {
  const { configured, loading, fbUser, me, meReady } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const needsWelcome = !!fbUser && meReady && (!me || (me.role !== 'admin' && !profileComplete(me)));
  useEffect(() => {
    if (needsWelcome) router.replace('/welcome/');
  }, [needsWelcome, router]);

  if (!configured) return <SetupNotice />;
  if (loading || (fbUser && !meReady)) return <Spinner className="py-24" />;
  if (!fbUser) return <LoginCard reason={reason} />;
  if (needsWelcome) return <Spinner className="py-24" />;
  if (me && me.status !== 'active') {
    return (
      <div className="card mx-auto my-10 max-w-md p-6 text-center">
        <div className="mb-2 text-4xl">⛔</div>
        <p className="text-[15.5px] text-muted">
          {t('আপনার অ্যাকাউন্ট স্থগিত বা বন্ধ করা হয়েছে। সাহায্যের জন্য সাপোর্টে যোগাযোগ করুন।', 'Your account is suspended or closed. Please contact support.')}
        </p>
      </div>
    );
  }
  if (role && me && me.role !== role && me.role !== 'admin') {
    return (
      <div className="card mx-auto my-10 max-w-md p-6 text-center text-muted">
        {t('এই পেজটি আপনার অ্যাকাউন্টের জন্য নয়।', 'This page is not for your account type.')}
      </div>
    );
  }
  return <>{children}</>;
}
