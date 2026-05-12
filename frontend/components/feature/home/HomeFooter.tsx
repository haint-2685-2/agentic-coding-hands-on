import Image from 'next/image';
import Link from 'next/link';
import type { HomeStrings } from '@/lib/i18n/home';

interface HomeFooterProps {
  strings: HomeStrings;
}

export function HomeFooter({ strings }: HomeFooterProps) {
  return (
    <footer
      className="relative z-10 mt-[80px] flex w-full flex-col items-center gap-[32px] border-t border-saa-divider bg-[rgba(11,15,18,0.9)] px-6 py-[40px] lg:px-[144px]"
    >
      <div className="flex w-full max-w-[1224px] flex-col items-start justify-between gap-[24px] md:flex-row md:items-center">
        <Link
          href="/"
          aria-label="SAA 2025"
          className="flex h-[64px] w-[69px] items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
        >
          <Image
            src="/assets/homepage-saa/footer-logo.png"
            alt="SAA 2025"
            width={69}
            height={64}
            className="h-[64px] w-[69px] object-contain"
          />
        </Link>
        <nav aria-label="Footer" className="flex flex-wrap gap-[24px]">
          <FooterNavLink href="/">{strings.navAbout}</FooterNavLink>
          <FooterNavLink href="/awards">{strings.navAwards}</FooterNavLink>
          <FooterNavLink href="/kudos">{strings.navKudos}</FooterNavLink>
          <FooterNavLink href="/standards">{strings.footerStandards}</FooterNavLink>
        </nav>
      </div>
      <p className="font-montserrat text-[12px] font-medium text-white/60">
        {strings.footer}
      </p>
    </footer>
  );
}

function FooterNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-montserrat text-[14px] font-bold leading-[20px] text-white/80 transition-colors hover:text-saa-gold focus-visible:text-saa-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold/60"
    >
      {children}
    </Link>
  );
}
