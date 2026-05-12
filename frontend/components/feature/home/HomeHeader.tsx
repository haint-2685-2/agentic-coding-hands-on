import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { HomeStrings } from '@/lib/i18n/home';
import type { Locale } from '@/lib/i18n/locale';
import type { Me } from '@/lib/api/home/types';
import { LanguagePicker } from '@/components/feature/login/LanguagePicker';

// Auth-aware surfaces are dynamically imported and only mounted when `me`
// is set, so anonymous bundles never pay for them.
const NotificationBell = dynamic(
  () => import('./NotificationBell').then((m) => m.NotificationBell),
  { ssr: false, loading: () => null },
);
const AvatarMenu = dynamic(
  () => import('./AvatarMenu').then((m) => m.AvatarMenu),
  { ssr: false, loading: () => null },
);
const LanguageSwitchAuthed = dynamic(
  () => import('./LanguageSwitchAuthed').then((m) => m.LanguageSwitchAuthed),
  { ssr: false, loading: () => null },
);

interface HomeHeaderProps {
  locale: Locale;
  strings: HomeStrings;
  me: Me | null;
}

export function HomeHeader({ locale, strings, me }: HomeHeaderProps) {
  return (
    <header
      className="absolute left-0 right-0 top-0 z-30 flex h-[80px] w-full items-center justify-between px-6 py-[12px] lg:px-[144px]"
      style={{ backgroundColor: 'rgba(16, 20, 23, 0.8)' }}
    >
      <div className="flex h-[56px] items-center gap-[24px] lg:gap-[64px]">
        <Link
          href="/"
          aria-label="SAA 2025"
          className="flex h-[48px] w-[52px] items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
        >
          <Image
            src="/assets/homepage-saa/logo.png"
            alt="SAA 2025"
            width={52}
            height={48}
            priority
            className="h-[48px] w-[52px] object-cover"
          />
        </Link>
        <nav
          aria-label="Primary"
          className="hidden h-[56px] items-center gap-[24px] md:flex"
        >
          <HeaderNavLink href="/" selected>
            {strings.navAbout}
          </HeaderNavLink>
          <HeaderNavLink href="/awards">{strings.navAwards}</HeaderNavLink>
          <HeaderNavLink href="/kudos">{strings.navKudos}</HeaderNavLink>
        </nav>
      </div>

      <div className="flex h-[56px] items-center gap-[16px]">
        {me ? (
          <>
            <NotificationBell ariaLabel={strings.notificationLabel} />
            <LanguageSwitchAuthed
              locale={locale}
              ariaLabel={strings.languagePickerLabel}
            />
            <AvatarMenu me={me} strings={strings} />
          </>
        ) : (
          <LanguagePicker
            locale={locale}
            ariaLabel={strings.languagePickerLabel}
          />
        )}
      </div>
    </header>
  );
}

function HeaderNavLink({
  href,
  selected,
  children,
}: {
  href: string;
  selected?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        'flex h-[52px] items-center px-[16px] font-montserrat text-[14px] font-bold leading-[20px] tracking-[0.1px] transition-colors',
        selected
          ? 'border-b-2 border-saa-gold text-saa-gold [text-shadow:0_0_6px_#FAE287]'
          : 'text-white/90 hover:text-saa-gold focus-visible:text-saa-gold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold/60 rounded-[4px]',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}
