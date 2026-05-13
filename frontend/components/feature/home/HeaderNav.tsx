// Client: needs `usePathname()` to derive the active nav link.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderNavProps {
  labels: {
    about: string;
    awards: string;
    kudos: string;
  };
}

const ITEMS: Array<{ href: string; key: keyof HeaderNavProps['labels'] }> = [
  { href: '/', key: 'about' },
  { href: '/awards', key: 'awards' },
  { href: '/kudos', key: 'kudos' },
];

// `/awards/...` and `/he-thong-giai` (alias route) both belong to the
// Awards tab; `/kudos/...` belongs to Kudos; everything else (including
// `/`) defaults to About.
function isActive(href: string, pathname: string): boolean {
  if (href === '/') {
    return pathname === '/' || pathname.startsWith('/login');
  }
  if (href === '/awards') {
    return pathname.startsWith('/awards') || pathname.startsWith('/he-thong-giai');
  }
  return pathname.startsWith(href);
}

export function HeaderNav({ labels }: HeaderNavProps) {
  const pathname = usePathname() ?? '/';
  return (
    <nav
      aria-label="Primary"
      className="hidden h-[56px] items-center gap-[24px] md:flex"
    >
      {ITEMS.map((item) => {
        const selected = isActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={selected ? 'page' : undefined}
            className={[
              'flex h-[52px] items-center px-[16px] font-montserrat text-[14px] font-bold leading-[20px] tracking-[0.1px] transition-colors',
              selected
                ? 'border-b-2 border-saa-gold text-saa-gold [text-shadow:0_0_6px_#FAE287]'
                : 'text-white/90 hover:text-saa-gold focus-visible:text-saa-gold',
              'rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold/60',
            ].join(' ')}
          >
            {labels[item.key]}
          </Link>
        );
      })}
    </nav>
  );
}
