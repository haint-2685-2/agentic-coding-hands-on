import type { Locale } from './locale';

export interface AwardsStrings {
  superTitle: string;
  heading: string;
  navAriaLabel: string;
  quantityLabel: string;
  valueLabel: string;
  valuePerAward: string;
  valueIndividual: string;
  valueTeam: string;
  valueOr: string;
  kudosLabel: string;
  kudosTitle: string;
  kudosBody: string;
  kudosCta: string;
  empty: string;
  error: string;
}

const vi: AwardsStrings = {
  superTitle: 'Sun* Annual Awards 2025',
  heading: 'Hệ thống giải thưởng SAA 2025',
  navAriaLabel: 'Danh mục giải thưởng',
  quantityLabel: 'Số lượng giải thưởng:',
  valueLabel: 'Giá trị giải thưởng:',
  valuePerAward: 'cho mỗi giải thưởng',
  valueIndividual: 'cho giải cá nhân',
  valueTeam: 'cho giải tập thể',
  valueOr: 'Hoặc',
  kudosLabel: 'Phong trào ghi nhận',
  kudosTitle: 'Sun* Kudos',
  kudosBody:
    'ĐIỂM MỚI CỦA SAA 2025\nHoạt động ghi nhận và cảm ơn đồng nghiệp - lần đầu tiên được diễn ra dành cho tất cả Sunner. Hoạt động sẽ được triển khai vào tháng 11/2025, khuyến khích người Sun* chia sẻ những lời ghi nhận, cảm ơn đồng nghiệp trên hệ thống do BTC công bố. Đây sẽ là chất liệu để Hội đồng Heads tham khảo trong quá trình lựa chọn người đạt giải.',
  kudosCta: 'Chi tiết',
  empty: 'Hệ thống giải thưởng đang được cập nhật',
  error: 'Đã có lỗi, vui lòng tải lại trang.',
};

const en: AwardsStrings = {
  superTitle: 'Sun* Annual Awards 2025',
  heading: 'SAA 2025 Awards System',
  navAriaLabel: 'Awards categories',
  quantityLabel: 'Number of awards:',
  valueLabel: 'Prize value:',
  valuePerAward: 'per award',
  valueIndividual: 'for the individual prize',
  valueTeam: 'for the team prize',
  valueOr: 'Or',
  kudosLabel: 'Recognition movement',
  kudosTitle: 'Sun* Kudos',
  kudosBody:
    "WHAT'S NEW IN SAA 2025\nRecognition and thank-you activity for colleagues — for the first time available to all Sunners. Launching in November 2025, Sun-ers can share appreciation on the official platform. The kudos collected will inform the Heads Council during finalist selection.",
  kudosCta: 'View detail',
  empty: 'Awards catalogue is being updated.',
  error: 'Something went wrong. Please reload the page.',
};

const ja: AwardsStrings = { ...vi };

const TABLE: Record<Locale, AwardsStrings> = { vi, en, ja };

export function getAwardsStrings(locale: Locale): AwardsStrings {
  return TABLE[locale];
}
