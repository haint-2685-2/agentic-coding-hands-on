// Per-user "Hero" tier badge. The PNG asset shipped from Figma includes the
// full hover-popup (pill + description) so we CSS-crop just the pill at the
// top-left. Source frame is ~546x316; the pill occupies the top-left
// rectangle ~300x90 — we scale that down to 150x46 on screen.
import type { HeroTier } from '@/lib/api/kudos/types';

interface HeroBadgeProps {
  tier: HeroTier;
  /** Tooltip on hover. Defaults to the human-readable description. */
  title?: string | false;
  /** Display height in px. Width scales proportionally. Default 28. */
  height?: number;
}

const META: Record<
  Exclude<HeroTier, null>,
  { label: string; description: string }
> = {
  new: {
    label: 'New Hero',
    description:
      'Có 1–4 người gửi Kudos cho bạn. Hành trình lan tỏa điều tốt đẹp bắt đầu.',
  },
  rising: {
    label: 'Rising Hero',
    description:
      'Có 5–9 người gửi Kudos cho bạn. Hình ảnh bạn đang lớn dần trong trái tim đồng đội.',
  },
  super: {
    label: 'Super Hero',
    description:
      'Có 10–20 người gửi Kudos cho bạn. Bạn đã trở thành biểu tượng được tin tưởng và yêu quý.',
  },
  legend: {
    label: 'Legend Hero',
    description:
      'Có hơn 20 người gửi Kudos cho bạn. Bạn đã trở thành huyền thoại.',
  },
};

// Source PNG geometry (same for all 4 tiers — Figma "Hover danh hiệu" frames):
//   frame = 546 x 316, pill bbox ≈ (0, 0) → (450, 96)
//   The rounded right-end of the pill ends around x≈420; +30px breathing room
//   so neither the cap nor the green leaf on the right side gets clipped.
const PILL_W_SRC = 450;
const PILL_H_SRC = 96;
const FRAME_W_SRC = 546;

export function HeroBadge({ tier, title, height = 28 }: HeroBadgeProps) {
  if (tier === null) return null;
  const meta = META[tier];
  const resolvedTitle = title === false ? undefined : title ?? meta.description;

  // Display width is pill aspect (300/90 ≈ 3.33) * height.
  const width = Math.round(height * (PILL_W_SRC / PILL_H_SRC));
  // Background size so the pill renders at exactly `width` px wide. The full
  // frame is scaled by (width / pill_w_src) → frame_w on screen = scale * frame_w_src.
  const bgWidth = Math.round((width * FRAME_W_SRC) / PILL_W_SRC);

  return (
    <span
      role="img"
      aria-label={meta.label}
      title={resolvedTitle}
      style={{
        display: 'inline-block',
        width: `${width}px`,
        height: `${height}px`,
        flexShrink: 0,
        backgroundImage: `url(/assets/kudos-live-board/hero-badges/${tier}.png)`,
        backgroundSize: `${bgWidth}px auto`,
        backgroundPosition: '0 0',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
