import type { Locale } from './locale';

export interface KudosStrings {
  pageTitle: string;
  kvHeadline: string;
  kvSubline: string;
  quickInputPlaceholder: string;
  highlightTitle: string;
  hashtagAll: string;
  departmentAll: string;
  hashtagLabel: string;
  departmentLabel: string;
  spotlightTitle: string;
  spotlightSearchPlaceholder: string;
  spotlightKudosUnit: string;
  spotlightEmpty: string;
  spotlightTruncated: string;
  allKudosTitle: string;
  feedEmpty: string;
  feedLoading: string;
  feedLoadMore: string;
  cardSentVerb: string;
  cardShowMore: string;
  cardShowLess: string;
  cardCopyLink: string;
  cardLikeOwnDisabled: string;
  cardLike: string;
  cardUnlike: string;
  copySuccess: string;
  copyFailed: string;
  prevSlide: string;
  nextSlide: string;
  sidebarStatsTitle: string;
  sidebarReceived: string;
  sidebarSent: string;
  sidebarHearts: string;
  sidebarBoxesOpened: string;
  sidebarBoxesPending: string;
  sidebarOpenBox: string;
  sidebarLeaderboardSenders: string;
  sidebarLeaderboardReceivers: string;
  sidebarEmpty: string;
  rateLimited: string;
  loadError: string;
  retry: string;
  anonymousLabel: string;
}

const vi: KudosStrings = {
  pageTitle: 'Sun* Kudos',
  kvHeadline: 'Sun* Kudos',
  kvSubline: 'Trao gửi sự ghi nhận và yêu thương đến đồng nghiệp.',
  quickInputPlaceholder: 'Hôm nay, bạn muốn gửi lời cảm ơn tới ai?',
  highlightTitle: 'Highlight',
  hashtagAll: 'Tất cả hashtag',
  departmentAll: 'Tất cả phòng ban',
  hashtagLabel: 'Hashtag',
  departmentLabel: 'Phòng ban',
  spotlightTitle: 'Spotlight',
  spotlightSearchPlaceholder: 'Tìm tên Sunner...',
  spotlightKudosUnit: 'KUDOS',
  spotlightEmpty: 'Chưa có dữ liệu',
  spotlightTruncated: 'Hiển thị 500 Sunner đầu',
  allKudosTitle: 'All Kudos',
  feedEmpty: 'Hiện tại chưa có Kudos nào.',
  feedLoading: 'Đang tải...',
  feedLoadMore: 'Đang tải thêm...',
  cardSentVerb: 'gửi cho',
  cardShowMore: 'Xem thêm',
  cardShowLess: 'Thu gọn',
  cardCopyLink: 'Copy link',
  cardLikeOwnDisabled: 'Bạn không thể like Kudos của chính mình',
  cardLike: 'Thả tim',
  cardUnlike: 'Bỏ tim',
  copySuccess: 'Đã copy link — sẵn sàng chia sẻ!',
  copyFailed: 'Không thể copy link. Vui lòng thử lại.',
  prevSlide: 'Slide trước',
  nextSlide: 'Slide kế',
  sidebarStatsTitle: 'Thống kê',
  sidebarReceived: 'Kudos nhận',
  sidebarSent: 'Kudos gửi',
  sidebarHearts: 'Hearts',
  sidebarBoxesOpened: 'Hộp đã mở',
  sidebarBoxesPending: 'Hộp chờ mở',
  sidebarOpenBox: 'Mở quà',
  sidebarLeaderboardSenders: 'Top người gửi',
  sidebarLeaderboardReceivers: 'Top người nhận',
  sidebarEmpty: 'Chưa có dữ liệu',
  rateLimited: 'Bạn thao tác quá nhanh, thử lại sau.',
  loadError: 'Không tải được dữ liệu.',
  retry: 'Thử lại',
  anonymousLabel: 'Ẩn danh',
};

const en: KudosStrings = {
  pageTitle: 'Sun* Kudos',
  kvHeadline: 'Sun* Kudos',
  kvSubline: 'Send appreciation and love to your colleagues.',
  quickInputPlaceholder: 'Who would you like to thank today?',
  highlightTitle: 'Highlight',
  hashtagAll: 'All hashtags',
  departmentAll: 'All departments',
  hashtagLabel: 'Hashtag',
  departmentLabel: 'Department',
  spotlightTitle: 'Spotlight',
  spotlightSearchPlaceholder: 'Search Sunner name...',
  spotlightKudosUnit: 'KUDOS',
  spotlightEmpty: 'No data yet',
  spotlightTruncated: 'Showing top 500 Sunners',
  allKudosTitle: 'All Kudos',
  feedEmpty: 'No Kudos yet.',
  feedLoading: 'Loading...',
  feedLoadMore: 'Loading more...',
  cardSentVerb: 'sent to',
  cardShowMore: 'Show more',
  cardShowLess: 'Show less',
  cardCopyLink: 'Copy link',
  cardLikeOwnDisabled: 'You cannot like your own Kudos',
  cardLike: 'Like',
  cardUnlike: 'Unlike',
  copySuccess: 'Link copied — ready to share!',
  copyFailed: 'Could not copy. Please try again.',
  prevSlide: 'Previous slide',
  nextSlide: 'Next slide',
  sidebarStatsTitle: 'Statistics',
  sidebarReceived: 'Kudos received',
  sidebarSent: 'Kudos sent',
  sidebarHearts: 'Hearts',
  sidebarBoxesOpened: 'Boxes opened',
  sidebarBoxesPending: 'Boxes pending',
  sidebarOpenBox: 'Open gift',
  sidebarLeaderboardSenders: 'Top senders',
  sidebarLeaderboardReceivers: 'Top receivers',
  sidebarEmpty: 'No data yet',
  rateLimited: 'Too many requests, please retry shortly.',
  loadError: 'Failed to load data.',
  retry: 'Retry',
  anonymousLabel: 'Anonymous',
};

const ja: KudosStrings = { ...vi };

const TABLE: Record<Locale, KudosStrings> = { vi, en, ja };

export function getKudosStrings(locale: Locale): KudosStrings {
  return TABLE[locale];
}
