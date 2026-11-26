import { html, useEffect, useState } from '../lib/html.js';

export function MatchingScreen({ persona, onMeetBot, onCancel }) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    setElapsedSec(0);
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const isLongWait = elapsedSec >= 5;

  return html`
    <section className="matching-wrap animate-fade-up">
      <div className="glass-card matching-card">
        <div className="radar-stage">
          <span className="radar-ring"></span>
          <span className="radar-ring-delay"></span>
          <div className="radar-core">${persona.avatar}</div>
        </div>

        <div>
          <h2 className="matching-title">
            ${isLongWait ? 'Đêm nay màn mưa hơi vắng...' : 'Đang dò sóng giữa màn mưa...'}
          </h2>
          <p className="matching-sub">
            ${isLongWait
              ? 'Bạn có thể tiếp tục chờ thêm (hoặc mở thêm 1 tab khác), hoặc bấm bên dưới để trò chuyện ngay với Người Gác Trạm Đêm.'
              : 'Trạm đang lắng nghe xem có ai đó cũng đang thao thức lúc này để nối dây trò chuyện 1-1 cùng bạn.'}
          </p>
          <p className="matching-elapsed">Đã dò sóng ${elapsedSec}s</p>
        </div>

        <div className="lobby-actions">
          <button
            type="button"
            className="btn-soft-amber"
            onClick=${onMeetBot}
          >
            🕯️ Gặp Người Gác Trạm Đêm ngay
          </button>
          <button
            type="button"
            className="btn-secondary-dark"
            onClick=${onCancel}
          >
            ← Quay lại màn hình chính
          </button>
        </div>
      </div>
    </section>
  `;
}
