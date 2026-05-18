/**
 * Zod-style hand-rolled validators mirroring the BE `POST /kudos` payload
 * defined in backend/.momorph/specs/ihQ26W78P2-viet-kudo/spec.md FR-001.
 *
 * No `zod` dependency is installed in this monorepo; this file is the FE
 * mirror only — the BE remains the authoritative validator.
 */

export interface KudoFormValues {
  receiver_id: string | null;
  receiver_full_name: string;
  receiver_department: string | null;
  title: string;
  message: string;
  hashtags: string[];
  image_paths: string[];
  is_anonymous: boolean;
  anonymous_display_name: string;
}

export type FieldName =
  | 'receiver_id'
  | 'title'
  | 'message'
  | 'hashtags'
  | 'images'
  | 'anonymous_display_name';

export type FieldErrors = Partial<Record<FieldName, string>>;

export interface ValidatedPayload {
  receiver_id: string;
  title: string;
  message: string;
  hashtags: string[];
  image_paths: string[];
  is_anonymous: boolean;
  anonymous_display_name?: string;
}

export const TITLE_MAX = 80;
export const MESSAGE_MAX = 1000;
export const HASHTAG_MAX = 5;
export const IMAGE_MAX = 5;
export const ANON_NAME_MAX = 50;
export const IMAGE_BYTES_MAX = 5 * 1024 * 1024;
export const IMAGE_MIMES = ['image/jpeg', 'image/png'] as const;

const REQUIRED_VI = 'Không được để trống';

// Strip tags + decode core entities. Runs in both SSR (regex) and CSR paths.
// `htmlToPlainText` from lib/kudos/sanitize-html lives in a Client-only
// module (uses `document`), so we keep a separate small helper here.
function htmlPlainText(html: string): string {
  if (!html) return '';
  const noTags = html.replace(/<br\s*\/?>(\s*)/gi, '\n').replace(/<[^>]*>/g, '');
  return noTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function validateKudoForm(v: KudoFormValues): {
  ok: boolean;
  errors: FieldErrors;
  payload?: ValidatedPayload;
} {
  const errors: FieldErrors = {};

  if (!v.receiver_id) {
    errors.receiver_id = REQUIRED_VI;
  }

  const title = v.title.trim();
  if (title.length === 0) {
    errors.title = REQUIRED_VI;
  } else if (title.length > TITLE_MAX) {
    errors.title = `Tối đa ${TITLE_MAX} ký tự`;
  }

  // `message` stores rich-text HTML; measure the *visible* content so a few
  // formatting tags don't count toward the user's char budget.
  const messageHtml = v.message;
  const messagePlain = htmlPlainText(messageHtml).trim();
  if (messagePlain.length === 0) {
    errors.message = REQUIRED_VI;
  } else if (messagePlain.length > MESSAGE_MAX) {
    errors.message = `Tối đa ${MESSAGE_MAX} ký tự`;
  }

  if (v.hashtags.length === 0) {
    errors.hashtags = REQUIRED_VI;
  } else if (v.hashtags.length > HASHTAG_MAX) {
    errors.hashtags = `Tối đa ${HASHTAG_MAX} hashtag`;
  }

  if (v.image_paths.length > IMAGE_MAX) {
    errors.images = `Tối đa ${IMAGE_MAX} ảnh`;
  }

  let anonName: string | undefined;
  if (v.is_anonymous && v.anonymous_display_name.trim().length > 0) {
    const trimmed = v.anonymous_display_name.trim();
    if (trimmed.length > ANON_NAME_MAX) {
      errors.anonymous_display_name = `Tối đa ${ANON_NAME_MAX} ký tự`;
    } else {
      anonName = trimmed;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: {},
    payload: {
      receiver_id: v.receiver_id as string,
      title,
      message: messageHtml.trim(),
      hashtags: v.hashtags,
      image_paths: v.image_paths,
      is_anonymous: v.is_anonymous,
      ...(anonName ? { anonymous_display_name: anonName } : {}),
    },
  };
}

export function fieldOrder(): FieldName[] {
  return [
    'receiver_id',
    'title',
    'message',
    'hashtags',
    'images',
    'anonymous_display_name',
  ];
}

export function emptyKudoForm(): KudoFormValues {
  return {
    receiver_id: null,
    receiver_full_name: '',
    receiver_department: null,
    title: '',
    message: '',
    hashtags: [],
    image_paths: [],
    is_anonymous: false,
    anonymous_display_name: '',
  };
}
