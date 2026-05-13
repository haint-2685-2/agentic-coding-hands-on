import { permanentRedirect } from 'next/navigation';

// Alias for the Awards page. Spec FR docs (and many internal links / test
// cases) reference `/he-thong-giai`; the canonical route is `/awards`.
// Keeping both stable so old links don't break.
export default function HeThongGiaiAlias() {
  permanentRedirect('/awards');
}
