import Image from 'next/image';
import Link from 'next/link';
import type { KudosStats, LeaderboardEntry } from '@/lib/api/kudos/types';
import type { KudosStrings } from '@/lib/i18n/kudos';
import { SecretBoxCTA } from './SecretBoxCTA';

interface SidebarStatsProps {
  stats: KudosStats;
  strings: KudosStrings;
}

/**
 * RSC. Right rail with the personal stats block + 10-Sunner leaderboard +
 * secret box CTA. Receives the server-fetched stats; client refresh on
 * `kudo:created` is handled by an inner Client island if needed (future).
 */
export function SidebarStats({ stats, strings }: SidebarStatsProps) {
  return (
    <aside className="flex w-full max-w-[422px] flex-col gap-[24px]">
      <div className="flex flex-col items-stretch gap-[16px] rounded-[17px] border border-saa-border bg-saa-kudo-container px-[24px] py-[24px]">
        <StatRow label={strings.sidebarReceived} value={stats.my_received ?? 0} />
        <StatRow label={strings.sidebarSent} value={stats.my_sent ?? 0} />
        <StatRow label={strings.sidebarHearts} value={stats.my_hearts ?? 0} />
        <div className="h-px w-full bg-saa-divider" />
        <StatRow
          label={strings.sidebarBoxesOpened}
          value={stats.my_boxes_opened ?? 0}
        />
        <StatRow
          label={strings.sidebarBoxesPending}
          value={stats.my_boxes_pending ?? 0}
        />
        <SecretBoxCTA strings={strings} />
      </div>

      <Leaderboard
        title={strings.sidebarLeaderboardReceivers}
        entries={stats.top_receivers}
        emptyLabel={strings.sidebarEmpty}
      />
      <Leaderboard
        title={strings.sidebarLeaderboardSenders}
        entries={stats.top_senders}
        emptyLabel={strings.sidebarEmpty}
      />
    </aside>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex h-[40px] w-full items-center justify-between">
      <span className="font-montserrat text-[14px] font-bold leading-[20px] text-white/90 md:text-[16px] md:leading-[24px]">
        {label}
      </span>
      <span className="font-montserrat text-[24px] font-bold leading-[32px] text-saa-gold md:text-[32px] md:leading-[40px]">
        {value}
      </span>
    </div>
  );
}

interface LeaderboardProps {
  title: string;
  entries: LeaderboardEntry[];
  emptyLabel: string;
}

function Leaderboard({ title, entries, emptyLabel }: LeaderboardProps) {
  return (
    <section className="flex flex-col items-stretch gap-[16px] rounded-[17px] border border-saa-border bg-saa-kudo-container px-[16px] py-[24px] md:px-[24px]">
      <h2 className="text-center font-montserrat text-[18px] font-bold leading-[24px] text-saa-gold md:text-[22px] md:leading-[28px]">
        {title}
      </h2>
      {entries.length === 0 ? (
        <p className="text-center font-montserrat text-[14px] text-white/60">
          {emptyLabel}
        </p>
      ) : (
        <ol className="flex flex-col items-stretch gap-[12px]">
          {entries.slice(0, 10).map((entry, idx) => (
            <li key={entry.id}>
              <Link
                href={`/users/${entry.id}`}
                className="flex w-full items-center gap-[12px] rounded-[8px] px-[8px] py-[8px] transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
              >
                <span className="w-[24px] text-right font-montserrat text-[14px] font-bold text-saa-gold">
                  {idx + 1}
                </span>
                <div className="relative h-[40px] w-[40px] overflow-hidden rounded-full border border-saa-border bg-[#222] md:h-[48px] md:w-[48px]">
                  <Image
                    src={
                      entry.avatar_url ||
                      '/assets/kudos-live-board/default-avatar.svg'
                    }
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-montserrat text-[14px] font-bold leading-[20px] text-white">
                    {entry.full_name}
                  </span>
                  <span className="truncate font-montserrat text-[12px] font-medium leading-[16px] text-white/60">
                    {entry.department_name ?? '—'}
                  </span>
                </div>
                <span className="font-montserrat text-[16px] font-bold text-saa-gold">
                  {entry.count}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
