import Image from 'next/image';
import Link from 'next/link';
import { readLocaleFromCookies } from '@/lib/auth/locale-cookie';
import { getNotFoundStrings } from '@/lib/i18n/not-found';

export default function NotFound() {
  const locale = readLocaleFromCookies();
  const strings = getNotFoundStrings(locale);

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-saa-bg px-[24px] py-[80px] text-white">
      <div className="flex w-full max-w-[760px] flex-col items-center gap-[40px]">
        <Image
          src="/assets/error-404/illustration.png"
          alt={strings.title}
          width={1438}
          height={917}
          priority
          className="h-auto w-full max-w-[680px] select-none"
        />
        <p className="text-center font-montserrat text-[16px] leading-[24px] text-white/80 md:text-[18px] md:leading-[28px]">
          {strings.description}
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-saa-gold px-[32px] py-[14px] font-montserrat text-[16px] font-bold text-saa-bg transition-colors hover:bg-[#FFE08A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold/60"
        >
          {strings.ctaHome}
        </Link>
      </div>
    </main>
  );
}
