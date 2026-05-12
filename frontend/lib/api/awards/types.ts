/**
 * Detail-variant award shape (`GET /awards?detail=true`). Extends the public
 * summary shape from `lib/api/home/types.ts` with fields exposed only behind
 * the auth gate (prize money, eligibility, long copy).
 *
 * Authoritative shape:
 *   backend/.momorph/specs/zFYDgyj_pD-he-thong-giai/spec.md
 */

export type AwardUnitType =
  | 'Đơn vị'
  | 'Tập thể'
  | 'Cá nhân'
  | 'Cá nhân hoặc Tập thể';

export interface AwardDetail {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  long_description: string;
  hero_image_path: string;
  display_order: number;
  quantity: number;
  unit_type: AwardUnitType;
  value_vnd: number;
  value_vnd_team: number | null;
}
