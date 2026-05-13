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
  seconds: string;
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
  // Root Further story (use **term** to mark gold-highlighted spans).
  storyOverline: string;
  storyIntro1: string;
  storyIntro2: string;
  storyIntro3: string;
  storyQuoteEn: string;
  storyQuoteVi: string;
  storyClosing1: string;
  storyClosing2: string;
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
  // Profile page
  profileSubtitle: string;
  profileSectionTitle: string;
  profileFieldFullName: string;
  profileFieldEmail: string;
  profileFieldDepartment: string;
  profileFieldRole: string;
  profileFieldLocale: string;
  profileFieldStatus: string;
  profileFieldUserId: string;
  profileRoleAdmin: string;
  profileRoleUser: string;
  profileStatusActive: string;
  profileStatusInactive: string;
  profileDepartmentUnset: string;
  profileLocaleVi: string;
  profileLocaleEn: string;
  profileLocaleJa: string;
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
  seconds: 'SECONDS',
  countdownSummary: 'Còn {d} ngày {h} giờ {m} phút',
  eventTimeLabel: 'Thời gian',
  eventLocationLabel: 'Địa điểm',
  eventTimeFallback: '18h30 · 31/07/2026',
  eventLocationFallback: 'Âu Cơ Art Center',
  broadcastNoteFallback: 'Tường thuật trực tiếp tại Group Facebook Sun* Family',
  ctaAwards: 'VỀ GIẢI THƯỞNG',
  ctaKudos: 'VỀ KUDOS',
  storyOverline: 'Chủ đề Sun* Annual Awards 2025',
  storyIntro1:
    'Đứng trước bối cảnh thay đổi như vũ bão của thời đại AI và yêu cầu ngày càng cao từ khách hàng, Sun* lựa chọn chiến lược đa dạng hóa năng lực để không chỉ nỗ lực trở thành tinh anh trong lĩnh vực của mình, mà còn hướng đến một cái đích cao hơn, nơi mọi Sunner đều là **"problem-solver"** — chuyên gia trong việc giải quyết mọi vấn đề, tìm lời giải cho mọi bài toán của dự án, khách hàng và xã hội.',
  storyIntro2:
    'Lấy cảm hứng từ sự đa dạng năng lực, khả năng phát triển linh hoạt cùng tinh thần đào sâu để bứt phá trong kỷ nguyên AI, **"Root Further"** đã được chọn để trở thành chủ đề chính thức của Lễ trao giải Sun* Annual Awards 2025.',
  storyIntro3:
    'Vượt ra khỏi nét nghĩa bề mặt, "Root Further" chính là hành trình chúng ta không ngừng vươn xa hơn, cắm rễ mạnh hơn, chạm đến những tầng "địa chất" ẩn sâu để tiếp tục tồn tại, vươn lên và nuôi dưỡng đam mê kiến tạo giá trị luôn cháy bỏng của người Sun*. Mượn hình ảnh bộ rễ liên tục đâm sâu vào lòng đất, mạnh mẽ len lỏi qua từng lớp "trầm tích" để thẩm thấu những gì tinh tuý nhất, người Sun* cũng đang "hấp thụ" dưỡng chất từ thời đại và những thử thách của thị trường để làm mới mình mỗi ngày, mở rộng năng lực và mạnh mẽ "bén rễ" vào kỷ nguyên AI — một tầng "địa chất" hoàn toàn mới, phức tạp và khó đoán, nhưng cũng hội tụ vô vàn tiềm năng cùng cơ hội.',
  storyQuoteEn: 'A tree with deep roots fears no storm',
  storyQuoteVi: '(Cây sâu bền rễ, bão giông chẳng nề — Ngạn ngữ Anh)',
  storyClosing1:
    'Trước giông bão, chỉ những tán cây có bộ rễ đủ mạnh mới có thể trụ vững. Một tổ chức với những cá nhân tự tin vào năng lực đa dạng, sẵn sàng kiến tạo và đón nhận thử thách, làm chủ sự thay đổi — đó là tổ chức không chỉ vững vàng trước biến động, mà còn khai thác được mọi lợi thế, chinh phục các thách thức của thời cuộc. Không đơn thuần là tên gọi của chương mới trên hành trình phát triển tổ chức, **"Root Further"** còn như một lời cổ vũ, động viên mỗi chúng ta hãy dám tin vào bản thân, dám đào sâu, khai mở mọi tiềm năng, dám phá bỏ giới hạn, dám trở thành phiên bản đa nhiệm và xuất sắc nhất của mình. Bởi trong thời đại AI, đa dạng năng lực và tận dụng sức mạnh thời cuộc chính là điều kiện tiên quyết để trường tồn.',
  storyClosing2:
    'Không ai biết trước ẩn sâu trong "lòng đất" của ngành công nghệ và thị trường hiện đại còn biết bao tầng "địa chất" bí ẩn. Chỉ biết rằng khi "Root Further" đã trở thành tinh thần cội rễ, chúng ta sẽ không sợ hãi, mà càng thấy hào hứng trước bất cứ vùng vô định nào trên hành trình tiến về phía trước. Vì ta luôn tin rằng, trong chính những miền vô tận đó, là bao điều kỳ diệu và cơ hội vươn mình đang chờ ta.',
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
  profileSubtitle: 'Sun* Annual Awards 2025',
  profileSectionTitle: 'Thông tin tài khoản',
  profileFieldFullName: 'Họ và tên',
  profileFieldEmail: 'Email',
  profileFieldDepartment: 'Phòng ban',
  profileFieldRole: 'Vai trò',
  profileFieldLocale: 'Ngôn ngữ',
  profileFieldStatus: 'Trạng thái',
  profileFieldUserId: 'ID nội bộ',
  profileRoleAdmin: 'Admin',
  profileRoleUser: 'Sun-er',
  profileStatusActive: 'Đang hoạt động',
  profileStatusInactive: 'Đã vô hiệu',
  profileDepartmentUnset: 'Chưa gán',
  profileLocaleVi: 'Tiếng Việt',
  profileLocaleEn: 'English',
  profileLocaleJa: '日本語',
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
  seconds: 'SECONDS',
  countdownSummary: '{d} days {h} hours {m} minutes remaining',
  eventTimeLabel: 'Time',
  eventLocationLabel: 'Location',
  eventTimeFallback: '6:30 PM · 31 Jul 2026',
  eventLocationFallback: 'Âu Cơ Art Center',
  broadcastNoteFallback: 'Live broadcast on the Sun* Family Facebook Group',
  ctaAwards: 'ABOUT AWARDS',
  ctaKudos: 'ABOUT KUDOS',
  storyOverline: 'Sun* Annual Awards 2025 Theme',
  storyIntro1:
    'Facing the AI era\'s breakneck pace of change and ever-higher customer expectations, Sun* is choosing a strategy of capability diversification — not only to be excellent in our craft, but to aim for a higher horizon where every Sunner is a **"problem-solver"**: an expert at unpacking any problem and finding answers for projects, customers, and society at large.',
  storyIntro2:
    'Inspired by versatility, agile growth, and the spirit of digging deeper to break through in the AI era, **"Root Further"** has been chosen as the official theme of the Sun* Annual Awards 2025.',
  storyIntro3:
    'Beyond its surface meaning, "Root Further" is the journey of constantly reaching farther, rooting stronger, and tapping the hidden "geological" layers so we keep surviving, rising, and nourishing the burning passion for value creation that defines Sun*. Just as roots push deeper into the earth, weaving through every "sediment" layer to draw the most essential nutrients, Sunners absorb the era\'s lessons and the market\'s challenges to renew ourselves daily, expand our capabilities, and root ourselves firmly into the AI era — a brand-new, complex, hard-to-predict layer of "geology" that is also rich with potential and opportunity.',
  storyQuoteEn: 'A tree with deep roots fears no storm',
  storyQuoteVi: '(English proverb)',
  storyClosing1:
    'In the face of storms, only trees with strong roots remain standing. An organisation of individuals who trust their versatility, embrace creation and challenge, and master change is one that not only weathers turbulence but harvests every advantage and conquers the demands of the times. More than the name of a new chapter in our journey, **"Root Further"** is a rallying call: dare to trust ourselves, dig deeper, unlock our potential, break our own ceilings, and become the most multidimensional, excellent version of who we can be. In the AI era, versatility plus harnessing the energy of the times is the prerequisite for endurance.',
  storyClosing2:
    'No one knows what mysterious "geological" layers still lie deep within tech and the modern market. We only know that once "Root Further" becomes our root spirit, we will not fear, but rather feel exhilarated by every undefined region on the road ahead. Because we always believe that within those infinite expanses lie endless wonders and opportunities to rise.',
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
  profileSubtitle: 'Sun* Annual Awards 2025',
  profileSectionTitle: 'Account information',
  profileFieldFullName: 'Full name',
  profileFieldEmail: 'Email',
  profileFieldDepartment: 'Department',
  profileFieldRole: 'Role',
  profileFieldLocale: 'Language',
  profileFieldStatus: 'Status',
  profileFieldUserId: 'Internal ID',
  profileRoleAdmin: 'Admin',
  profileRoleUser: 'Sun-er',
  profileStatusActive: 'Active',
  profileStatusInactive: 'Disabled',
  profileDepartmentUnset: 'Not assigned',
  profileLocaleVi: 'Vietnamese',
  profileLocaleEn: 'English',
  profileLocaleJa: 'Japanese',
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
  seconds: 'SECONDS',
  countdownSummary: '残り {d} 日 {h} 時間 {m} 分',
  eventTimeLabel: '日時',
  eventLocationLabel: '会場',
  eventTimeFallback: '18:30 · 2026年7月31日',
  eventLocationFallback: 'Âu Cơ Art Center',
  broadcastNoteFallback: 'Sun* Family Facebook グループでライブ配信',
  ctaAwards: '賞について',
  ctaKudos: 'KUDOS について',
  storyOverline: 'Sun* Annual Awards 2025 のテーマ',
  storyIntro1:
    'AI時代の激しい変化と、お客様からのますます高い要求を前に、Sun* は能力の多様化を戦略として選びました。自分の専門領域で卓越するだけでなく、すべての Sunner が **「problem-solver」** — プロジェクト、顧客、社会のあらゆる課題に対して解決策を見出す専門家であるという、より高い目標を目指しています。',
  storyIntro2:
    '多様な能力、しなやかな成長力、そして AI 時代を切り拓くために深く掘り下げる精神からインスピレーションを得て、**「Root Further」** が Sun* Annual Awards 2025 の公式テーマとして選ばれました。',
  storyIntro3:
    '表面的な意味を超えて、「Root Further」とはより遠くへ伸び、より強く根を張り、深層の「地質」に届くことで、生き残り、立ち上がり、価値創造への情熱を絶えず燃やし続ける旅です。根が大地に深く伸び、「堆積層」をかき分けて最も貴重な養分を吸収していくように、Sunner たちも時代から学び、市場の試練を糧として日々自らを更新し、能力を広げ、AI時代という全く新しく複雑で予測しがたい「地質層」に力強く「根を張って」いきます。そこには無限の可能性と機会が秘められています。',
  storyQuoteEn: 'A tree with deep roots fears no storm',
  storyQuoteVi: '(深く根を張った木は嵐を恐れない — 英語のことわざ)',
  storyClosing1:
    '嵐の前で、しっかりとした根を持つ木だけが立ち続けられます。多様な能力に自信を持ち、創造と挑戦を受け入れ、変化を乗りこなす個人で構成された組織こそ、変動に動じないだけでなく、あらゆる優位を活かし、時代の課題を制覇できる組織です。組織の新たな章のタイトルにとどまらず、**「Root Further」** は私たちを鼓舞する呼びかけでもあります — 自分を信じ、深く掘り下げ、潜在力を解き放ち、限界を超え、最も多面的で優れた自分になる勇気を持とう、と。AI時代において、能力の多様化と時代の力を活用することは、生き残るための前提条件なのです。',
  storyClosing2:
    'テクノロジー業界と現代の市場の「地中」にどれだけ多くの「地質層」が隠れているか、誰にもわかりません。ただ、「Root Further」が私たちの根の精神となれば、未知の領域を恐れず、むしろ前進する道のりのあらゆる未定領域に高揚を覚えるはずです。その果てしない領域の中にこそ、無数の驚きと飛躍の機会が私たちを待っていると、私たちはいつも信じているからです。',
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
  profileSubtitle: 'Sun* Annual Awards 2025',
  profileSectionTitle: 'アカウント情報',
  profileFieldFullName: '氏名',
  profileFieldEmail: 'メールアドレス',
  profileFieldDepartment: '部署',
  profileFieldRole: '権限',
  profileFieldLocale: '言語',
  profileFieldStatus: 'ステータス',
  profileFieldUserId: '内部 ID',
  profileRoleAdmin: '管理者',
  profileRoleUser: 'Sunner',
  profileStatusActive: '有効',
  profileStatusInactive: '無効',
  profileDepartmentUnset: '未割当',
  profileLocaleVi: 'ベトナム語',
  profileLocaleEn: '英語',
  profileLocaleJa: '日本語',
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
