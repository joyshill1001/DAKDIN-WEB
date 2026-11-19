'use client';
import { useLang } from '@/lib/i18n';
import { PageTitle } from '@/components/ui';

export default function Terms() {
  const { t } = useLang();
  const items: [string, string][] = [
    ['ডাক দিন একটি ফ্রি ডিরেক্টরি ও যোগাযোগের প্ল্যাটফর্ম। কারিগর ও গ্রাহক নিজেরা কাজ ও মজুরি ঠিক করেন।', 'DakDin is a free directory and messaging platform. Workers and clients agree on the work and the pay themselves.'],
    ['পেমেন্ট সরাসরি গ্রাহক ও কারিগরের মধ্যে হয়। ডাক দিন কোনো টাকা সংগ্রহ বা কমিশন নেয় না।', 'Payment is made directly between client and worker. DakDin does not collect money or take a commission.'],
    ['ভুয়া তথ্য, প্রতারণা বা অশোভন আচরণ করলে অ্যাকাউন্ট স্থগিত বা মুছে ফেলা হতে পারে।', 'Accounts may be suspended or removed for fake information, fraud or abusive behaviour.'],
    ['একটি মোবাইল নম্বর দিয়ে একটিই অ্যাকাউন্ট খোলা যাবে।', 'One mobile number can open only one account.'],
  ];
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title={t('শর্তাবলী', 'Terms of use')} />
      <ol className="card space-y-3 p-5 text-[15.5px] leading-relaxed">
        {items.map((x, i) => <li key={i}>{t(x[0], x[1])}</li>)}
      </ol>
    </div>
  );
}
