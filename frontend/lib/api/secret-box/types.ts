/**
 * Domain types shared by the typed API wrappers and the Server Action.
 *
 * Mirrors the backend contract in
 * `../backend/.momorph/specs/J3-4YFIpMM-open-secret-box/spec.md`.
 */

export interface Badge {
  code: string;
  name: string;
  description: string;
  image_path: string;
}

export interface OpenedHistoryEntry {
  badge_code: string;
  badge_name: string;
  opened_at: string;
}

export interface SecretBoxesResponse {
  unopened_count: number;
  opened_count: number;
  opened: OpenedHistoryEntry[];
}

export type OpenBoxErrorCode =
  | 'secret_box/no_boxes'
  | 'rate/limited'
  | 'auth/account-disabled'
  | 'auth/required'
  | 'network'
  | 'unknown';

export type OpenBoxResult =
  | { ok: true; badge: Badge; unopened_count: number }
  | {
      ok: false;
      code: OpenBoxErrorCode;
      message: string;
      retryAfter?: number;
    };
