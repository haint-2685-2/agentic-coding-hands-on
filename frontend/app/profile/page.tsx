import Image from 'next/image';
import { redirect } from 'next/navigation';
import { readLocaleFromCookies } from '@/lib/auth/locale-cookie';
import { getOptionalMe } from '@/lib/auth/optional-session';
import { getHomeStrings } from '@/lib/i18n/home';
import type { Me } from '@/lib/api/home/types';
import { HomeHeader } from '@/components/feature/home/HomeHeader';
import { HomeFooter } from '@/components/feature/home/HomeFooter';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const me = await getOptionalMe();
  if (!me) {
    redirect('/login?next=/profile');
  }

  const locale = readLocaleFromCookies();
  const strings = getHomeStrings(locale);

  return (
    <div className="relative min-h-screen overflow-hidden bg-saa-bg text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[1392px]">
        <Image
          src="/assets/homepage-saa/keyvisual-bg.png"
          alt=""
          aria-hidden="true"
          width={1512}
          height={1392}
          priority
          className="h-full w-full object-cover opacity-60"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-transparent via-saa-bg/40 to-saa-bg"
        />
      </div>

      <HomeHeader locale={locale} strings={strings} me={me} />

      <main className="relative z-10 mx-auto flex w-full max-w-[1024px] flex-col gap-[40px] px-6 pb-[120px] pt-[160px] lg:px-[80px]">
        <header className="flex flex-col gap-[8px]">
          <p className="font-montserrat text-[14px] font-medium uppercase tracking-[2px] text-saa-gold/70">
            Sun&#42; Annual Awards 2025
          </p>
          <h1 className="font-montserrat text-[36px] font-bold leading-[44px] text-white md:text-[48px] md:leading-[56px]">
            {strings.menuProfile}
          </h1>
        </header>

        <HeroCard me={me} />

        <DetailCard me={me} />
      </main>

      <HomeFooter strings={strings} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function HeroCard({ me }: { me: Me }) {
  const initials = me.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
  const roleLabel = me.role === 'admin' ? 'Admin' : 'Sun-er';

  return (
    <section
      aria-label="Tổng quan hồ sơ"
      className="relative overflow-hidden rounded-[20px] border border-saa-border/40 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent px-[32px] py-[40px] shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-[6px] md:px-[48px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[120px] -top-[120px] h-[320px] w-[320px] rounded-full bg-saa-gold/10 blur-[80px]"
      />
      <div className="relative flex flex-col items-center gap-[32px] md:flex-row md:items-center md:gap-[40px]">
        <div className="relative shrink-0">
          <span
            aria-hidden="true"
            className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-saa-gold/60 via-saa-gold-glow/30 to-transparent blur-md"
          />
          <div className="relative h-[96px] w-[96px] overflow-hidden rounded-full border-2 border-saa-gold/70 bg-[#1A2129] md:h-[112px] md:w-[112px]">
            {me.avatar_url ? (
              <Image
                src={upscaleAvatar(me.avatar_url, 256)}
                alt={me.full_name}
                fill
                sizes="(min-width: 768px) 112px, 96px"
                className="object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-full w-full items-center justify-center font-montserrat text-[40px] font-bold text-saa-gold"
              >
                {initials || me.full_name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-[12px] text-center md:items-start md:text-left">
          <h2 className="font-montserrat text-[28px] font-bold leading-[36px] text-saa-gold md:text-[36px] md:leading-[44px]">
            {me.full_name}
          </h2>
          <p className="break-all font-montserrat text-[14px] font-medium leading-[20px] text-white/70 md:text-[16px]">
            {me.email}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-[8px] md:justify-start">
            <RolePill role={me.role} label={roleLabel} />
            {me.department_name && <DepartmentPill name={me.department_name} />}
            <StatusPill active={me.is_active} />
          </div>
        </div>
      </div>
    </section>
  );
}

function RolePill({ role, label }: { role: 'admin' | 'user'; label: string }) {
  const isAdmin = role === 'admin';
  return (
    <span
      className={[
        'inline-flex items-center gap-[6px] rounded-full border px-[12px] py-[6px] font-montserrat text-[12px] font-bold uppercase tracking-[1px]',
        isAdmin
          ? 'border-saa-gold/60 bg-saa-gold/15 text-saa-gold'
          : 'border-white/20 bg-white/[0.06] text-white/85',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={isAdmin ? 'h-[6px] w-[6px] rounded-full bg-saa-gold' : 'h-[6px] w-[6px] rounded-full bg-white/70'}
      />
      {label}
    </span>
  );
}

function DepartmentPill({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-[6px] rounded-full border border-saa-border/60 bg-saa-bg/40 px-[12px] py-[6px] font-montserrat text-[12px] font-bold uppercase tracking-[1px] text-white/85">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="text-saa-gold"
      >
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 12h.01M9 15h.01M13 9h.01M13 12h.01M13 15h.01" />
      </svg>
      {name}
    </span>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-[6px] rounded-full border px-[12px] py-[6px] font-montserrat text-[12px] font-bold uppercase tracking-[1px]',
        active
          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
          : 'border-saa-danger/50 bg-saa-danger/10 text-red-300',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'h-[6px] w-[6px] rounded-full',
          active ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-saa-danger',
        ].join(' ')}
      />
      {active ? 'Đang hoạt động' : 'Đã vô hiệu'}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function DetailCard({ me }: { me: Me }) {
  return (
    <section
      aria-label="Thông tin chi tiết"
      className="rounded-[20px] border border-saa-border/40 bg-saa-kudo-container/60 px-[24px] py-[32px] backdrop-blur-[6px] md:px-[40px]"
    >
      <h3 className="mb-[24px] font-montserrat text-[14px] font-bold uppercase tracking-[2px] text-saa-gold/80">
        Thông tin tài khoản
      </h3>
      <dl className="grid grid-cols-1 gap-x-[40px] gap-y-[24px] sm:grid-cols-2">
        <Field label="Họ và tên" value={me.full_name} />
        <Field label="Email" value={me.email} mono />
        <Field label="Phòng ban" value={me.department_name ?? 'Chưa gán'} />
        <Field label="Vai trò" value={me.role === 'admin' ? 'Admin' : 'Sun-er'} />
        <Field label="Ngôn ngữ" value={localeLabel(me.locale)} />
        <Field
          label="Trạng thái"
          value={me.is_active ? 'Đang hoạt động' : 'Đã vô hiệu'}
        />
        <Field label="ID nội bộ" value={me.id} mono />
      </dl>
    </section>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[6px] border-l-2 border-saa-gold/30 pl-[16px]">
      <dt className="font-montserrat text-[11px] font-medium uppercase tracking-[1.5px] text-white/50">
        {label}
      </dt>
      <dd
        className={[
          'break-words text-[16px] leading-[24px] text-white',
          mono ? 'font-mono text-[14px]' : 'font-montserrat font-semibold',
        ].join(' ')}
      >
        {value}
      </dd>
    </div>
  );
}

// Google avatar URLs end with `=s96-c` (96px square crop). Swap to a larger
// requested size so the displayed image is sharp on hi-DPI displays. No-op
// for non-Google URLs.
function upscaleAvatar(url: string, size: number): string {
  if (!/googleusercontent\.com/.test(url)) return url;
  return url.replace(/=s\d+-c$/, `=s${size}-c`);
}

function localeLabel(locale: string): string {
  switch (locale) {
    case 'vi':
      return 'Tiếng Việt';
    case 'en':
      return 'English';
    case 'ja':
      return '日本語';
    default:
      return locale;
  }
}
