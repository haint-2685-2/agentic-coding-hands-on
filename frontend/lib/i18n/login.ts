import type { Locale } from './locale';

export interface LoginStrings {
  heroTitle: string;
  heroLine1: string;
  heroLine2: string;
  loginButton: string;
  loginButtonAriaLabel: string;
  redirecting: string;
  languagePickerLabel: string;
  errorForbiddenDomain: string;
  errorEmailNotVerified: string;
  errorCookiesBlocked: string;
  errorStateMismatch: string;
  errorInvalidCallback: string;
  errorGeneric: string;
  cookiesHelpLink: string;
  footer: string;
}

const vi: LoginStrings = {
  heroTitle: 'ROOT FURTHER',
  heroLine1: 'Bắt đầu hành trình của bạn cùng SAA 2025.',
  heroLine2: 'Đăng nhập để khám phá!',
  loginButton: 'LOGIN With Google',
  loginButtonAriaLabel: 'Đăng nhập bằng Google',
  redirecting: 'Đang chuyển hướng…',
  languagePickerLabel: 'Chọn ngôn ngữ',
  errorForbiddenDomain:
    'Chỉ tài khoản Google của Sun* được phép đăng nhập.',
  errorEmailNotVerified: 'Email của bạn chưa được xác thực.',
  errorCookiesBlocked:
    'Trình duyệt đang chặn cookie. Vui lòng bật cookie cho trang này rồi thử lại.',
  errorStateMismatch:
    'Phiên đăng nhập không hợp lệ. Vui lòng thử lại.',
  errorInvalidCallback:
    'Đăng nhập thất bại do phản hồi không hợp lệ. Vui lòng thử lại.',
  errorGeneric: 'Đăng nhập thất bại, vui lòng thử lại.',
  cookiesHelpLink: 'Cách bật cookie',
  footer: 'Bản quyền thuộc về Sun* © 2025',
};

const en: LoginStrings = {
  heroTitle: 'ROOT FURTHER',
  heroLine1: 'Start your journey with SAA 2025.',
  heroLine2: 'Sign in to explore!',
  loginButton: 'LOGIN With Google',
  loginButtonAriaLabel: 'Sign in with Google',
  redirecting: 'Redirecting…',
  languagePickerLabel: 'Select language',
  errorForbiddenDomain: 'Only Sun-asterisk Google accounts are allowed.',
  errorEmailNotVerified: 'Your email is not verified.',
  errorCookiesBlocked:
    'Cookies are blocked by your browser. Please enable cookies for this site and try again.',
  errorStateMismatch: 'Invalid sign-in state. Please try again.',
  errorInvalidCallback:
    'Sign-in failed due to an invalid callback. Please try again.',
  errorGeneric: 'Sign-in failed, please try again.',
  cookiesHelpLink: 'How to enable cookies',
  footer: 'Copyright © 2025 Sun*',
};

const ja: LoginStrings = {
  heroTitle: 'ROOT FURTHER',
  heroLine1: 'SAA 2025 と一緒に旅を始めましょう。',
  heroLine2: 'サインインして探索してください！',
  loginButton: 'LOGIN With Google',
  loginButtonAriaLabel: 'Google でサインイン',
  redirecting: 'リダイレクトしています…',
  languagePickerLabel: '言語を選択',
  errorForbiddenDomain: 'Sun-asterisk の Google アカウントのみログインできます。',
  errorEmailNotVerified: 'メールアドレスが認証されていません。',
  errorCookiesBlocked:
    'ブラウザでクッキーがブロックされています。このサイトでクッキーを有効にしてもう一度お試しください。',
  errorStateMismatch: 'サインインの状態が無効です。もう一度お試しください。',
  errorInvalidCallback:
    '無効なコールバックによりサインインに失敗しました。もう一度お試しください。',
  errorGeneric: 'サインインに失敗しました。もう一度お試しください。',
  cookiesHelpLink: 'クッキーを有効にする方法',
  footer: '© 2025 Sun* All rights reserved.',
};

const TABLES: Record<Locale, LoginStrings> = { vi, en, ja };

export function getLoginStrings(locale: Locale): LoginStrings {
  return TABLES[locale];
}

export type LoginErrorCode =
  | 'auth/forbidden-domain'
  | 'auth/email-not-verified'
  | 'auth/cookies-blocked'
  | 'auth/state-mismatch'
  | 'auth/invalid-callback'
  | (string & {});

export function errorCodeToMessage(
  code: string | undefined,
  locale: Locale,
): string | null {
  if (!code) return null;
  const strings = getLoginStrings(locale);
  switch (code) {
    case 'auth/forbidden-domain':
      return strings.errorForbiddenDomain;
    case 'auth/email-not-verified':
      return strings.errorEmailNotVerified;
    case 'auth/cookies-blocked':
      return strings.errorCookiesBlocked;
    case 'auth/state-mismatch':
      return strings.errorStateMismatch;
    case 'auth/invalid-callback':
      return strings.errorInvalidCallback;
    default:
      return strings.errorGeneric;
  }
}
