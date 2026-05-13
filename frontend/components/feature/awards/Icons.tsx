// Inline 24×24 SVG glyphs mirroring the Figma `MM_MEDIA_*` icon set used on
// the Awards screen. Stroke uses `currentColor` so callers control color via
// Tailwind `text-*` classes.

interface IconProps {
  className?: string;
}

// Figma `MM_MEDIA_Target` (componentId 214:1808) — concentric circles with
// crosshair. Used on every LeftRailNav item and each award card title.
export function TargetIcon({ className }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
    </svg>
  );
}

// Figma `MM_MEDIA_Diamond` (componentId 214:1817) — facet diamond. Used
// next to "Số lượng giải thưởng".
export function DiamondIcon({ className }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 9h14L12 21z" />
      <path d="M5 9l3-5h8l3 5" />
      <path d="M8 4l-3 5M16 4l3 5" />
      <path d="M5 9l7 12M19 9l-7 12M8 4l1.5 5M16 4l-1.5 5" />
    </svg>
  );
}

// Figma `MM_MEDIA_License` (componentId 214:1830) — ribbon / certificate.
// Used next to "Giá trị giải thưởng".
export function LicenseIcon({ className }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="9" r="6" />
      <path d="M9 13.5l-2.5 7L10 19l2 2 2-2 3.5 1.5L15 13.5" />
      <path d="M9 9l2 2 4-4" />
    </svg>
  );
}
