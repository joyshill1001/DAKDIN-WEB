'use client';
import { useLang } from '@/lib/i18n';
import { PageTitle } from '@/components/ui';

export default function Privacy() {
  const { t } = useLang();
  const items: [string, string][] = [
    ['আমরা আপনার নাম, ইমেইল, ফোন নম্বর, ঠিকানা ও এলাকা সংরক্ষণ করি, শুধু সেবা চালানোর জন্য।', 'We store your name, email, phone number, address and area only to run the service.'],
    ['কারিগরের ফোন নম্বর সবার কাছে দেখানো হয় না। কারিগর নিজে চ্যাটে শেয়ার করলে তবেই দেখা যায়।', 'A worker’s phone number is not shown publicly. It is visible only when the worker shares it in chat.'],
    ['আপনার তথ্য কারো কাছে বিক্রি করা হয় না।', 'Your data is never sold.'],
    ['প্রোফাইল থেকে যেকোনো সময় অ্যাকাউন্ট মুছে ফেলতে পারেন।', 'You can delete your account from your profile at any time.'],
  ];
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title={t('গোপনীয়তা নীতি', 'Privacy policy')} />
      <ol className="card space-y-3 p-5 text-[15.5px] leading-relaxed">
        {items.map((x, i) => <li key={i}>{t(x[0], x[1])}</li>)}
      </ol>
    </div>
  );
}
