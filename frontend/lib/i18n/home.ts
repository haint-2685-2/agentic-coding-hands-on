import type { Locale } from './locale';

export interface HomeStrings {
  // Header
  navAbout: string;
  navAwards: string;
  navKudos: string;
  languagePickerLabel: string;
  notificationLabel: string;
  accountLabel: string;
  // Hero
  heroLine1: string;
  heroLine2: string;
  comingSoon: string;
  days: string;
  hours: string;
  minutes: string;
  countdownSummary: string;
  // Event info
  eventTimeLabel: string;
  eventLocationLabel: string;
  eventTimeFallback: string;
  eventLocationFallback: string;
  broadcastNoteFallback: string;
  // CTA
  ctaAwards: string;
  ctaKudos: string;
  // Awards section
  awardsSectionTitle: string;
  awardsSectionSubtitle: string;
  awardsEmpty: string;
  awardsError: string;
  awardDetail: string;
  // Kudos promo
  kudosTitle: string;
  kudosBody: string;
  kudosCta: string;
  // Footer
  footer: string;
  footerStandards: string;
  // Avatar menu
  menuProfile: string;
  menuAdmin: string;
  menuSignOut: string;
  // Notifications
  notificationsHeading: string;
  notificationsEmpty: string;
  markAllRead: string;
  // Floating widget
  widgetWriteKudo: string;
  widgetViewAwards: string;
  widgetRules: string;
}

const vi: HomeStrings = {
  navAbout: 'About SAA 2025',
  navAwards: 'Hạng mục giải thưởng',
  navKudos: 'Sun* Kudos',
  languagePickerLabel: 'Chọn ngôn ngữ',
  notificationLabel: 'Thông báo',
  accountLabel: 'Tài khoản',
  heroLine1: 'ROOT',
  heroLine2: 'FURTHER',
  comingSoon: 'Sự kiện sắp diễn ra',
  days: 'DAYS',
  hours: 'HOURS',
  minutes: 'MINUTES',
  countdownSummary: 'Còn {d} ngày {h} giờ {m} phút',
  eventTimeLabel: 'Thời gian',
  eventLocationLabel: 'Địa điểm',
  eventTimeFallback: '18h30 · 20/12/2025',
  eventLocationFallback: 'Sun* HQ, Hà Nội',
  broadcastNoteFallback: 'Livestream trên Sun* Workplace',
  ctaAwards: 'VỀ GIẢI THƯỞNG',
  ctaKudos: 'VỀ KUDOS',
  awardsSectionTitle: 'Hệ thống giải thưởng',
  awardsSectionSubtitle: '6 hạng mục danh giá vinh danh những Sun-er xuất sắc nhất năm 2025.',
  awardsEmpty: 'Sắp công bố',
  awardsError: 'Không tải được danh sách giải thưởng. Vui lòng thử lại.',
  awardDetail: 'Chi tiết',
  kudosTitle: 'Sun* Kudos',
  kudosBody:
    'Trao gửi sự ghi nhận và yêu thương đến đồng nghiệp. Mỗi Kudo là một viên gạch xây dựng văn hoá Sun*.',
  kudosCta: 'Chi tiết',
  footer: 'Bản quyền thuộc về Sun* © 2025',
  footerStandards: 'Tiêu chuẩn',
  menuProfile: 'Hồ sơ',
  menuAdmin: 'Admin Dashboard',
  menuSignOut: 'Đăng xuất',
  notificationsHeading: 'Thông báo',
  notificationsEmpty: 'Bạn chưa có thông báo',
  markAllRead: 'Đánh dấu đã đọc tất cả',
  widgetWriteKudo: 'Viết Kudos',
  widgetViewAwards: 'Xem giải thưởng',
  widgetRules: 'Thể lệ SAA',
};

const en: HomeStrings = {
  navAbout: 'About SAA 2025',
  navAwards: 'Award Information',
  navKudos: 'Sun* Kudos',
  languagePickerLabel: 'Select language',
  notificationLabel: 'Notifications',
  accountLabel: 'Account',
  heroLine1: 'ROOT',
  heroLine2: 'FURTHER',
  comingSoon: 'Coming soon',
  days: 'DAYS',
  hours: 'HOURS',
  minutes: 'MINUTES',
  countdownSummary: '{d} days {h} hours {m} minutes remaining',
  eventTimeLabel: 'Time',
  eventLocationLabel: 'Location',
  eventTimeFallback: '6:30 PM · 20 Dec 2025',
  eventLocationFallback: 'Sun* HQ, Hanoi',
  broadcastNoteFallback: 'Livestream on Sun* Workplace',
  ctaAwards: 'ABOUT AWARDS',
  ctaKudos: 'ABOUT KUDOS',
  awardsSectionTitle: 'Awards Catalogue',
  awardsSectionSubtitle: 'Six distinguished categories celebrating the most outstanding Sun-ers of 2025.',
  awardsEmpty: 'Coming soon',
  awardsError: 'Failed to load awards. Please retry.',
  awardDetail: 'View detail',
  kudosTitle: 'Sun* Kudos',
  kudosBody:
    'Send appreciation and love to your colleagues. Every Kudo is a brick that builds Sun*’s culture.',
  kudosCta: 'View detail',
  footer: 'Copyright © 2025 Sun*',
  footerStandards: 'Standards',
  menuProfile: 'Profile',
  menuAdmin: 'Admin Dashboard',
  menuSignOut: 'Sign out',
  notificationsHeading: 'Notifications',
  notificationsEmpty: 'You have no notifications yet',
  markAllRead: 'Mark all read',
  widgetWriteKudo: 'Write Kudos',
  widgetViewAwards: 'View Awards',
  widgetRules: 'SAA Rules',
};

const ja: HomeStrings = {
  navAbout: 'SAA 2025 について',
  navAwards: '賞のカテゴリー',
  navKudos: 'Sun* Kudos',
  languagePickerLabel: '言語を選択',
  notificationLabel: '通知',
  accountLabel: 'アカウント',
  heroLine1: 'ROOT',
  heroLine2: 'FURTHER',
  comingSoon: 'まもなく開催',
  days: 'DAYS',
  hours: 'HOURS',
  minutes: 'MINUTES',
  countdownSummary: '残り {d} 日 {h} 時間 {m} 分',
  eventTimeLabel: '日時',
  eventLocationLabel: '会場',
  eventTimeFallback: '18:30 · 2025年12月20日',
  eventLocationFallback: 'Sun* HQ、ハノイ',
  broadcastNoteFallback: 'Sun* Workplace でライブ配信',
  ctaAwards: '賞について',
  ctaKudos: 'KUDOS について',
  awardsSectionTitle: '賞のカテゴリー',
  awardsSectionSubtitle: '2025年で最も活躍した Sun-er を称える 6 つの名誉ある賞。',
  awardsEmpty: '近日公開',
  awardsError: '賞の一覧を読み込めませんでした。もう一度お試しください。',
  awardDetail: '詳細を見る',
  kudosTitle: 'Sun* Kudos',
  kudosBody:
    '同僚への感謝と称賛を届けましょう。ひとつひとつの Kudo が Sun* のカルチャーを形づくります。',
  kudosCta: '詳細を見る',
  footer: '© 2025 Sun* All rights reserved.',
  footerStandards: 'ガイドライン',
  menuProfile: 'プロフィール',
  menuAdmin: '管理者ダッシュボード',
  menuSignOut: 'サインアウト',
  notificationsHeading: '通知',
  notificationsEmpty: '通知はまだありません',
  markAllRead: 'すべて既読にする',
  widgetWriteKudo: 'Kudos を書く',
  widgetViewAwards: '賞を見る',
  widgetRules: 'SAA の規約',
};

const TABLE: Record<Locale, HomeStrings> = { vi, en, ja };

export function getHomeStrings(locale: Locale): HomeStrings {
  return TABLE[locale];
}
