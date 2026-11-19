import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LangProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';
import { AreaProvider } from '@/lib/area-ctx';
import { ToastProvider } from '@/components/ui';
import Shell from '@/components/Shell';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: { default: 'ডাক দিন — আপনার এলাকার কারিগর', template: '%s · ডাক দিন' },
  description:
    'ইলেকট্রিশিয়ান, প্লাম্বার, মিস্ত্রি ও মেকানিক। এলাকা বেছে খুঁজুন, চ্যাটে কথা বলুন। সম্পূর্ণ ফ্রি।',
  applicationName: 'DakDin',
  openGraph: {
    title: 'ডাক দিন — DakDin',
    description: 'আপনার এলাকার দক্ষ কারিগর, সরাসরি আপনার কাছে।',
    type: 'website',
    locale: 'bn_BD',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#E8590C',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <LangProvider>
          <AuthProvider>
            <AreaProvider>
              <ToastProvider>
                <Shell>{children}</Shell>
              </ToastProvider>
            </AreaProvider>
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
