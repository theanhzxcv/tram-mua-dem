import { html, useEffect, useRef, useState } from '../lib/html.js';
import { RELEASE_AFFIRMATIONS } from '../data/constants.js';

export function ThoughtReleaseModal({ isOpen, onClose, onReleased }) {
  const [thought, setThought] = useState('');
  const [phase, setPhase] = useState('writing'); // 'writing' | 'dissolving' | 'done'
  const [affirmation, setAffirmation] = useState('');
  const [releasedCount, setReleasedCount] = useState(0);
  const canvasRef = useRef(null);
  const onReleasedRef = useRef(onReleased);
  onReleasedRef.current = onReleased;

  useEffect(() => {
    if (!isOpen) {
      setThought('');
      setPhase('writing');
    }
  }, [isOpen]);

  useEffect(() => {
    if (phase !== 'dissolving') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth || 380;
    canvas.height = canvas.offsetHeight || 220;

    const palette = ['#fbbf24', '#38bdf8', '#c084fc', '#fde68a'];
    const particles = Array.from({ length: 72 }, () => ({
      x: canvas.width * (0.2 + Math.random() * 0.6),
      y: canvas.height * (0.35 + Math.random() * 0.4),
      vx: (Math.random() - 0.5) * 1.4,
      vy: -(0.8 + Math.random() * 2.1),
      r: 1.5 + Math.random() * 3.2,
      alpha: 0.7 + Math.random() * 0.3,
      color: palette[Math.floor(Math.random() * palette.length)]
    }));

    let rafId = null;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + Math.sin(elapsed * 0.004 + i) * 0.35;
        p.y += p.vy;
        p.alpha = Math.max(0, p.alpha - 0.0085);

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (elapsed < 1750) {
        rafId = requestAnimationFrame(step);
      } else {
        setPhase('done');
        onReleasedRef.current?.();
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [phase]);

  if (!isOpen) return null;

  const handleRelease = (e) => {
    e.preventDefault();
    if (!thought.trim()) return;
    const pick = RELEASE_AFFIRMATIONS[releasedCount % RELEASE_AFFIRMATIONS.length];
    setAffirmation(pick);
    setReleasedCount((c) => c + 1);
    setPhase('dissolving');
    setThought('');
  };

  return html`
    <div className="breath-modal-backdrop">
      <div className="breath-card release-card animate-fade-up">
        <div className="breath-top">
          <span className="breath-title">✨ Thả Trôi Suy Nghĩ Vào Mưa</span>
          <button
            type="button"
            className="icon-close-sm"
            aria-label="Đóng không gian thả suy nghĩ"
            onClick=${onClose}
          >
            ✕
          </button>
        </div>

        <p className="release-sub">
          Không lưu lại, không phán xét — viết ra điều đang khiến bạn trăn trở rồi để màn mưa cuốn nó đi.
        </p>

        ${phase === 'writing' &&
        html`
          <form className="release-form" onSubmit=${handleRelease}>
            <textarea
              className="release-textarea"
              rows="5"
              placeholder="Ví dụ: Mình cứ nghĩ mãi về chuyện hôm nay, sợ ngày mai mọi thứ không ổn..."
              value=${thought}
              onChange=${(e) => setThought(e.target.value)}
            ></textarea>
            <div className="breath-actions">
              <button
                type="submit"
                className="btn-primary-amber"
                disabled=${!thought.trim()}
              >
                🌧️ Thả trôi theo mưa
              </button>
            </div>
          </form>
        `}

        ${phase === 'dissolving' &&
        html`
          <div className="release-stage">
            <canvas ref=${canvasRef} className="release-canvas"></canvas>
            <p className="release-dissolving-text">Đang tan nhẹ vào màn mưa đêm...</p>
          </div>
        `}

        ${phase === 'done' &&
        html`
          <div className="release-done animate-fade-up">
            <div className="release-done-icon">🕯️</div>
            <p className="release-affirmation">${affirmation}</p>
            <div className="breath-actions">
              <button
                type="button"
                className="btn-soft-amber"
                onClick=${() => setPhase('writing')}
              >
                ✍️ Viết tiếp một suy nghĩ khác
              </button>
              <button
                type="button"
                className="btn-breath-reset"
                onClick=${onClose}
              >
                Đóng
              </button>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}
