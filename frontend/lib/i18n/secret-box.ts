import type { Locale } from './locale';

export interface SecretBoxStrings {
  modalTitle: string;
  modalAriaLabel: string;
  instruction: string;
  counterLabel: string;
  openButtonLabelAvailable: string; // contains {n}
  openButtonLabelEmpty: string;
  openingCaption: string;
  closeButtonLabel: string;
  errorNoBoxes: string;
  errorRateLimited: string; // contains {n}
  errorAccountDisabled: string;
  errorNetwork: string;
  errorGeneric: string;
  fallbackBadgeAlt: string; // contains {name}
}

const vi: SecretBoxStrings = {
  modalTitle: 'KHÁM PHÁ SECRET BOX CỦA BẠN',
  modalAriaLabel: 'Cửa sổ mở secret box',
  instruction: 'Click vào box để mở',
  counterLabel: 'Secretbox chưa mở',
  openButtonLabelAvailable: 'Mở Secret Box (còn {n})',
  openButtonLabelEmpty: 'Mở Secret Box (đã hết)',
  openingCaption: 'Đang mở…',
  closeButtonLabel: 'Đóng',
  errorNoBoxes: 'Bạn đã mở hết secret box rồi.',
  errorRateLimited: 'Vui lòng đợi {n}s rồi thử lại.',
  errorAccountDisabled: 'Tài khoản đã bị khóa.',
  errorNetwork: 'Mất kết nối, vui lòng thử lại.',
  errorGeneric: 'Có lỗi xảy ra, vui lòng thử lại.',
  fallbackBadgeAlt: 'Huy hiệu {name}',
};

const en: SecretBoxStrings = {
  modalTitle: 'DISCOVER YOUR SECRET BOX',
  modalAriaLabel: 'Open secret box dialog',
  instruction: 'Click the box to open',
  counterLabel: 'Unopened secret boxes',
  openButtonLabelAvailable: 'Open a secret box ({n} remaining)',
  openButtonLabelEmpty: 'Open a secret box (none remaining)',
  openingCaption: 'Opening…',
  closeButtonLabel: 'Close',
  errorNoBoxes: 'No more secret boxes to open.',
  errorRateLimited: "You're opening too fast — please wait {n}s.",
  errorAccountDisabled: 'Your account has been disabled.',
  errorNetwork: 'Connection lost, please try again.',
  errorGeneric: 'Something went wrong, please try again.',
  fallbackBadgeAlt: '{name} badge',
};

const ja: SecretBoxStrings = {
  modalTitle: 'シークレットボックスを開ける',
  modalAriaLabel: 'シークレットボックスを開けるダイアログ',
  instruction: 'ボックスをクリックして開けてください',
  counterLabel: '未開封のシークレットボックス',
  openButtonLabelAvailable: 'シークレットボックスを開ける（残り {n}）',
  openButtonLabelEmpty: 'シークレットボックスを開ける（残りなし）',
  openingCaption: '開けています…',
  closeButtonLabel: '閉じる',
  errorNoBoxes: 'これ以上開けるシークレットボックスはありません。',
  errorRateLimited: '操作が早すぎます。{n}秒後にもう一度お試しください。',
  errorAccountDisabled: 'アカウントが無効化されています。',
  errorNetwork: '接続が切れました。もう一度お試しください。',
  errorGeneric: 'エラーが発生しました。もう一度お試しください。',
  fallbackBadgeAlt: '{name} バッジ',
};

const TABLES: Record<Locale, SecretBoxStrings> = { vi, en, ja };

export function getSecretBoxStrings(locale: Locale): SecretBoxStrings {
  return TABLES[locale];
}
