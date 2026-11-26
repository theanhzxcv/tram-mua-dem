export const MUSIC_TRACKS = [
  { id: 'lofi', name: 'Lo-fi Đêm Mưa', icon: '☕', intervalMs: 3400 },
  { id: 'piano', name: 'Piano Khuya', icon: '🎹', intervalMs: 2600 },
  { id: 'chime', name: 'Gió & Chuông Đêm', icon: '🎐', intervalMs: 3100 },
  { id: 'musicbox', name: 'Hộp Nhạc Ngủ', icon: '✨', intervalMs: 2500 }
];

export const SLEEP_TIMER_OPTIONS = [
  { label: 'Tắt', minutes: 0 },
  { label: '15 phút', minutes: 15 },
  { label: '30 phút', minutes: 30 },
  { label: '45 phút', minutes: 45 }
];

export const PERSONA_POOL = [
  { name: 'Mèo Mưa', avatar: '🐱' },
  { name: 'Đom Đóm', avatar: '✨' },
  { name: 'Cú Đêm', avatar: '🦉' },
  { name: 'Trăng Non', avatar: '🌙' },
  { name: 'Hạt Sương', avatar: '💧' },
  { name: 'Gió Khuya', avatar: '🍃' },
  { name: 'Trà Nóng', avatar: '🍵' },
  { name: 'Cáo Khuya', avatar: '🦊' }
];

export const MOOD_OPTIONS = [
  { id: 'overthinking', label: 'Nhiều suy nghĩ', icon: '💭' },
  { id: 'sleepless', label: 'Trằn trọc khó ngủ', icon: '🌙' },
  { id: 'tired', label: 'Hơi kiệt sức', icon: '🫧' },
  { id: 'calm', label: 'Muốn yên tĩnh', icon: '🍵' }
];

export const BOT_PERSONAS = [
  { id: 'bot_keeper', name: 'Người Gác Trạm Đêm', avatar: '🕯️', isBot: true },
  { id: 'bot_owl', name: 'Cú Đêm Nghe Mưa', avatar: '🦉', isBot: true },
  { id: 'bot_tea', name: 'Trà Nóng Khuya', avatar: '🍵', isBot: true }
];

export const BREATH_PRESETS = {
  '478': {
    id: '478',
    name: '4-7-8 Ngủ sâu',
    subtitle: 'Hít vào 4s • Giữ hơi 7s • Thở ra 8s — Dịu hệ thần kinh trước khi ngủ.',
    readyBadge: '4-7-8',
    stages: [
      { key: 'inhale', label: 'Hít vào', secs: 4, scale: 1.24, guide: 'Hít vào thật sâu và nhẹ nhàng qua mũi...' },
      { key: 'hold', label: 'Giữ hơi', secs: 7, scale: 1.24, guide: 'Giữ hơi nhẹ nhàng, thả lỏng hai bờ vai...' },
      { key: 'exhale', label: 'Thở ra', secs: 8, scale: 0.88, guide: 'Thở ra thật chậm qua miệng, để suy nghĩ lắng xuống...' }
    ]
  },
  box: {
    id: 'box',
    name: '4-4-4-4 Cân bằng',
    subtitle: 'Hít 4s • Giữ 4s • Thở 4s • Nghỉ 4s — Lấy lại nhịp bình tĩnh tức thì.',
    readyBadge: '4-4-4-4',
    stages: [
      { key: 'inhale', label: 'Hít vào', secs: 4, scale: 1.22, guide: 'Hít vào chậm rãi, cảm nhận lồng ngực mở rộng...' },
      { key: 'hold', label: 'Giữ hơi', secs: 4, scale: 1.22, guide: 'Giữ nhịp thật êm, không gồng cơ cổ...' },
      { key: 'exhale', label: 'Thở ra', secs: 4, scale: 0.88, guide: 'Thở ra đều đặn, thả trôi áp lực...' },
      { key: 'hold', label: 'Thả lỏng', secs: 4, scale: 0.88, guide: 'Nghỉ một nhịp tĩnh lặng trước chu kỳ mới...' }
    ]
  }
};

export const BOT_HEALING_REPLIES = [
  'Mình đang ngồi nghe bạn đây. Ban đêm mọi thứ tĩnh lặng nên những điều nhỏ nhất cũng dễ khiến lòng nặng trĩu hơn...',
  'Bạn không cần phải tìm câu trả lời cho mọi chuyện ngay trong đêm nay đâu. Thả lỏng vai một chút nhé.',
  'Hôm nay bạn đã cố gắng nhiều rồi. Ở Trạm Mưa Đêm này, bạn được phép mệt và được phép chậm lại.',
  'Nếu đầu óc căng quá, mình thử vẽ vài nét lên cửa kính mưa hoặc đánh một ván Cờ Caro 6x6 cho nhẹ đầu nhé?',
  'Cứ viết hết ra đây đi, để những suy nghĩ rối bời ấy trôi theo tiếng mưa ngoài hiên.'
];

export const BOT_CONTEXT_RULES = [
  {
    keywords: ['ngủ', 'thức', 'khuya', 'trằn trọc', 'mất ngủ'],
    replies: [
      'Đêm khuya mà đầu óc vẫn chạy liên tục thì mệt thật. Bạn thử bật tiếng mưa nhẹ và hít 2 nhịp thở 4-7-8 cùng mình xem sao nhé 🌬️',
      'Không cần ép bản thân phải ngủ ngay lập tức đâu — chỉ cần nhắm mắt nghỉ ngơi một chút cũng đã giúp cơ thể hồi phục rồi.'
    ]
  },
  {
    keywords: ['việc', 'deadline', 'sếp', 'học', 'thi', 'áp lực', 'stress'],
    replies: [
      'Những chuyện ngày mai cứ để ngày mai của bạn giải quyết. Lúc này trên trạm mưa chỉ có hiện tại và hơi ấm tách trà thôi 🍵',
      'Bạn đã gồng mình gánh nhiều trách nhiệm quá rồi. Đặt xuống một đêm không làm bạn kém đi chút nào đâu.'
    ]
  },
  {
    keywords: ['buồn', 'cô đơn', 'tủi', 'khóc', 'chán', 'mệt'],
    replies: [
      'Nghe bạn nói mà mình muốn rót cho bạn một tách trà ấm. Dù ngoài kia có ồn ào hay lạnh lẽo thế nào, đêm nay bạn không phải một mình.',
      'Cảm xúc buồn hay mệt cũng giống một cơn mưa rào — không cần xua đi vội, cứ ngồi dưới mái hiên chờ nó dịu dần nhé.'
    ]
  },
  {
    keywords: ['lo', 'sợ', 'nghĩ', 'overthinking', 'rối'],
    replies: [
      'Bộ não ban đêm hay phóng đại những kịch bản xấu nhất lắm. Bạn thử mở mục “Thả suy nghĩ” để viết điều đó ra rồi nhìn nó tan theo mưa nhé ✨',
      'Khi suy nghĩ quay vòng, hãy thử chú ý 3 âm thanh bạn nghe thấy lúc này — tiếng mưa, tiếng thở và sự tĩnh lặng của căn phòng.'
    ]
  }
];

export const RELEASE_AFFIRMATIONS = [
  'Suy nghĩ ấy đã tan vào màn mưa đêm rồi. Giờ bạn chỉ cần thở nhẹ một hơi thôi.',
  'Bạn không phải là những lo âu thoáng qua trong tâm trí mình. Đêm nay hãy dịu dàng với bản thân nhé.',
  'Mọi chuyện không cần phải hoàn hảo ngay lúc này. Một bước nhỏ ngày mai cũng đủ rồi.',
  'Cơn mưa ngoài kia sẽ giữ giùm bạn nỗi bận lòng này đến sáng mai.'
];

export const QUICK_CHAT_PROMPTS = [
  'Đêm nay đầu mình hơi nhiều suy nghĩ...',
  'Nghe tiếng mưa cùng nhau một lát nhé',
  'Mình chỉ cần ai đó lắng nghe một chút thôi'
];

export const FROSTED_COLORS = [
  { hex: '#fbbf24', label: 'Vàng ấm' },
  { hex: '#38bdf8', label: 'Xanh trăng' },
  { hex: '#c084fc', label: 'Tím dịu' },
  { hex: '#fb7185', label: 'Hồng nhạt' }
];

export const BRUSH_SIZES = [
  { size: 4, label: 'Mảnh' },
  { size: 7, label: 'Vừa' },
  { size: 12, label: 'Đậm' }
];

export const CARO_SIZE = 6;
export const CARO_WIN_LENGTH = 4;
export const CARO_TURN_SECONDS = 15;

export function describeRainDensity(val) {
  if (val === 0) return 'Tạnh mưa';
  if (val <= 25) return 'Mưa phùn';
  if (val <= 60) return 'Mưa vừa';
  if (val <= 85) return 'Mưa nặng hạt';
  return 'Mưa rào đêm';
}

export function createRandomPersona(existingId) {
  const pick = PERSONA_POOL[Math.floor(Math.random() * PERSONA_POOL.length)];
  const num = Math.floor(100 + Math.random() * 899);
  return {
    id: existingId || 'user_' + Math.random().toString(36).slice(2, 10),
    name: `${pick.name} #${num}`,
    avatar: pick.avatar
  };
}
