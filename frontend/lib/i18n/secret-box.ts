import type { Locale } from './locale';

export interface SecretBoxStrings {
  modalTitle: string;
  modalAriaLabel: string;
  instruction: string;
  counterLabel: string;
  openButtonLabel: (remaining: number) => string;
  openingCaption: string;
  closeButtonLabel: string;
  errorNoBoxes: string;
  errorRateLimited: (retryAfter: number) => string;
  errorAccountDisabled: string;
  errorNetwork: string;
  errorGeneric: string;
  fallbackBadgeAlt: (badgeName: string) => string;
}

const vi: SecretBoxStrings = {
  modalTitle: 'KHÁM PHÁ SECRET BOX CỦA BẠN',
  modalAriaLabel: 'Cửa sổ mở secret box',
  instruction: 'Click vào box để mở',
  counterLabel: 'Secretbox chưa mở',
  openButtonLabel: (remaining: number) =>
    remaining > 0
      ? `Mở Secret Box (còn ${remaining})`
      : 'Mở Secret Box (đã hết)',
  openingCaption: 'Đang mở…',
  closeButtonLabel: 'Đóng',
  errorNoBoxes: 'Bạn đã mở hết secret box rồi.',
  errorRateLimited: (retryAfter: number) =>
    `Vui lòng đợi ${retryAfter}s rồi thử lại.`,
  errorAccountDisabled: 'Tài khoản đã bị khóa.',
  errorNetwork: 'Mất kết nối, vui lòng thử lại.',
  errorGeneric: 'Có lỗi xảy ra, vui lòng thử lại.',
  fallbackBadgeAlt: (badgeName: string) => `Huy hiệu ${badgeName}`,
};

const en: SecretBoxStrings = {
  modalTitle: 'DISCOVER YOUR SECRET BOX',
  modalAriaLabel: 'Open secret box dialog',
  instruction: 'Click the box to open',
  counterLabel: 'Unopened secret boxes',
  openButtonLabel: (remaining: number) =>
    remaining > 0
      ? `Open a secret box (${remaining} remaining)`
      : 'Open a secret box (none remaining)',
  openingCaption: 'Opening…',
  closeButtonLabel: 'Close',
  errorNoBoxes: 'No more secret boxes to open.',
  errorRateLimited: (retryAfter: number) =>
    `You're opening too fast — please wait ${retryAfter}s.`,
  errorAccountDisabled: 'Your account has been disabled.',
  errorNetwork: 'Connection lost, please try again.',
  errorGeneric: 'Something went wrong, please try again.',
  fallbackBadgeAlt: (badgeName: string) => `${badgeName} badge`,
};

const ja: SecretBoxStrings = {
  modalTitle: 'シークレットボックスを開ける',
  modalAriaLabel: 'シークレットボックスを開けるダイアログ',
  instruction: 'ボックスをクリックして開けてください',
  counterLabel: '未開封のシークレットボックス',
  openButtonLabel: (remaining: number) =>
    remaining > 0
      ? `シークレットボックスを開ける（残り ${remaining}）`
      : 'シークレットボックスを開ける（残りなし）',
  openingCaption: '開けています…',
  closeButtonLabel: '閉じる',
  errorNoBoxes: 'これ以上開けるシークレットボックスはありません。',
  errorRateLimited: (retryAfter: number) =>
    `操作が早すぎます。${retryAfter}秒後にもう一度お試しください。`,
  errorAccountDisabled: 'アカウントが無効化されています。',
  errorNetwork: '接続が切れました。もう一度お試しください。',
  errorGeneric: 'エラーが発生しました。もう一度お試しください。',
  fallbackBadgeAlt: (badgeName: string) => `${badgeName} バッジ`,
};

const TABLES: Record<Locale, SecretBoxStrings> = { vi, en, ja };

export function getSecretBoxStrings(locale: Locale): SecretBoxStrings {
  return TABLES[locale];
}
