import { html, useEffect, useRef, useState } from '../lib/html.js';
import { AudioPopover } from './AudioPopover.js';

export function Header({ audio, onOpenBreathing, onOpenRelease }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);
  const rainBtnRef = useRef(null);

  useEffect(() => {
    if (!popoverOpen) return;
    const handleOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        rainBtnRef.current &&
        !rainBtnRef.current.contains(e.target)
      ) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [popoverOpen]);

  const handleToggleRainMenu = () => {
    setPopoverOpen((prev) => {
      const next = !prev;
      if (next && !audio.rainAudioOn) {
        audio.ensureRainOn();
      }
      return next;
    });
  };

  return html`
    <header className="site-header">
      <div className="header-inner">
        <div className="brand-group">
          <span className="brand-candle candle-glow" aria-hidden="true">🕯️</span>
          <span className="brand-title">Trạm Mưa Đêm</span>
          <span className="brand-badge">React</span>
        </div>

        <div className="header-controls">
          <button
            ref=${rainBtnRef}
            type="button"
            className="hdr-pill"
            title="Chế độ mưa, mật độ, âm lượng & hẹn giờ ngủ"
            onClick=${handleToggleRainMenu}
          >
            <span>🌧️</span>
            <span>Mưa</span>
            ${audio.sleepMinutes > 0 && html`<span className="sleep-mini-tag">🌙</span>`}
            <span className=${audio.rainAudioOn ? 'status-dot on-amber' : 'status-dot'}></span>
          </button>

          <div className="music-pill-group">
            <button
              type="button"
              className="music-next-btn"
              title="Bấm để chuyển bản nhạc tiếp theo"
              onClick=${audio.nextTrack}
            >
              <span>🎵</span>
              <span>Đổi nhạc</span>
              <span className="header-track-name">${audio.currentTrack.name}</span>
            </button>
            <button
              type="button"
              className="music-toggle-btn"
              title="Bật/tắt nhạc nền"
              onClick=${audio.toggleMusicAudio}
            >
              <span>${audio.musicAudioOn ? '⏸' : '▶'}</span>
              <span className=${audio.musicAudioOn ? 'status-dot on-indigo' : 'status-dot'}></span>
            </button>
          </div>

          <button
            type="button"
            className="hdr-pill hdr-pill-release"
            title="Viết ra nỗi lo và thả trôi theo màn mưa"
            onClick=${onOpenRelease}
          >
            <span>✨</span>
            <span className="label-desktop">Thả suy nghĩ</span>
            <span className="label-mobile">Thả</span>
          </button>

          <button
            type="button"
            className="hdr-pill hdr-pill-breath"
            onClick=${onOpenBreathing}
          >
            <span>🌬️</span>
            <span className="label-desktop">Thở 4-7-8</span>
            <span className="label-mobile">4-7-8</span>
          </button>
        </div>
      </div>

      ${popoverOpen &&
      html`
        <${AudioPopover}
          audio=${audio}
          popoverRef=${popoverRef}
          onClose=${() => setPopoverOpen(false)}
        />
      `}
    </header>
  `;
}
