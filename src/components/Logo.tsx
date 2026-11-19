export default function Logo({ size = 36, text = true }: { size?: number; text?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
        <rect width="48" height="48" rx="13" fill="#E8590C" />
        <path d="M14 12h10c8 0 13 5 13 12s-5 12-13 12H14z" fill="#fff" />
        <path d="M20 18h4c4 0 7 2.6 7 6s-3 6-7 6h-4z" fill="#3A2A1E" />
        <circle cx="24" cy="24" r="2.6" fill="#E8590C" />
      </svg>
      {text && <span className="text-[21px] font-extrabold leading-none tracking-tight text-ink">ডাক দিন</span>}
    </span>
  );
}
