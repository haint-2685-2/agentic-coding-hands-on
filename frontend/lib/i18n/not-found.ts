import type { Locale } from './locale';

export interface NotFoundStrings {
  title: string;
  description: string;
  ctaHome: string;
}

const VI: NotFoundStrings = {
  title: 'NOT FOUND',
  description: 'Trang bạn đang tìm không tồn tại hoặc đã bị xoá.',
  ctaHome: 'Về trang chủ',
};

const EN: NotFoundStrings = {
  title: 'NOT FOUND',
  description: "The resource you're looking for doesn't exist or has been removed.",
  ctaHome: 'Back to home',
};

const JA: NotFoundStrings = {
  title: 'NOT FOUND',
  description: 'お探しのページは存在しないか、削除されました。',
  ctaHome: 'ホームに戻る',
};

export function getNotFoundStrings(locale: Locale): NotFoundStrings {
  if (locale === 'en') return EN;
  if (locale === 'ja') return JA;
  return VI;
}
