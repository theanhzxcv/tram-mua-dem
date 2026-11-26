import { html } from '../lib/html.js';
import {
  describeRainDensity,
  MUSIC_TRACKS,
  SLEEP_TIMER_OPTIONS
} from '../data/constants.js';

function formatRemaining(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AudioPopover({ audio, onClose, popoverRef }) {
  return html`
    <div
      ref=${popoverRef}
      className="audio-popover animate-fade-up"
      role="dialog"
      aria-label="Không gian mưa và âm thanh"
    >
      <div className="popover-head">
        <span className="popover-title">
          <span>🎚️</span>
          <span>Không Gian Mưa & Âm Thanh</span>
        </span>
        <button
          type="button"
          className="icon-close-sm"
          onClick=${onClose}
          aria-label="Đóng bảng âm thanh"
        >
          ✕
        </button>
      </div>

      <div className="popover-stack">
        <div className="toggle-grid-2">
          <button
            type="button"
            className=${audio.rainAudioOn ? 'switch-btn active-amber' : 'switch-btn'}
            onClick=${audio.toggleRainAudio}
          >
            <span>🌧️</span>
            <span>${audio.rainAudioOn ? 'Tiếng mưa: Bật' : 'Tiếng mưa: Tắt'}</span>
          </button>
          <button
            type="button"
            className=${audio.musicAudioOn ? 'switch-btn active-indigo' : 'switch-btn'}
            onClick=${audio.toggleMusicAudio}
          >
            <span>🎵</span>
            <span>${audio.musicAudioOn ? 'Nhạc: Bật' : 'Nhạc: Tắt'}</span>
          </button>
        </div>

        <div className="slider-block">
          <div className="slider-head">
            <label htmlFor="rainDensitySlider">💧 Mật độ mưa</label>
            <span className="val-amber">
              ${audio.rainDensity}% • ${describeRainDensity(audio.rainDensity)}
            </span>
          </div>
          <input
            id="rainDensitySlider"
            type="range"
            min="0"
            max="100"
            value=${audio.rainDensity}
            onChange=${(e) => audio.setRainDensity(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="slider-block">
          <div className="slider-head">
            <label htmlFor="rainVolumeSlider">🌧️ Cường độ tiếng mưa</label>
            <span className="val-sky">${audio.rainVolume}%</span>
          </div>
          <input
            id="rainVolumeSlider"
            type="range"
            min="0"
            max="100"
            value=${audio.rainVolume}
            onChange=${(e) => audio.setRainVolume(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="slider-block">
          <div className="slider-head">
            <label htmlFor="musicVolumeSlider">🎵 Âm lượng nhạc nền</label>
            <span className="val-indigo">${audio.musicVolume}%</span>
          </div>
          <input
            id="musicVolumeSlider"
            type="range"
            min="0"
            max="100"
            value=${audio.musicVolume}
            onChange=${(e) => audio.setMusicVolume(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="track-section">
          <div className="track-section-head">
            <span>Chọn bản nhạc êm dịu:</span>
            <span className="val-amber">${audio.currentTrack.name}</span>
          </div>
          <div className="track-grid">
            ${MUSIC_TRACKS.map(
              (t, idx) => html`
                <button
                  key=${t.id}
                  type="button"
                  className=${idx === audio.trackIdx ? 'track-btn selected' : 'track-btn'}
                  onClick=${() => audio.selectTrack(idx, true)}
                >
                  <span>${t.icon}</span>
                  <span>${t.name}</span>
                </button>
              `
            )}
          </div>
        </div>

        <div className="track-section">
          <div className="track-section-head">
            <span>🌙 Hẹn giờ tắt khi ngủ:</span>
            <span className="val-indigo">
              ${audio.sleepMinutes > 0
                ? `Còn ${formatRemaining(audio.sleepRemainingSec)}`
                : 'Không hẹn'}
            </span>
          </div>
          <div className="sleep-grid">
            ${SLEEP_TIMER_OPTIONS.map(
              (opt) => html`
                <button
                  key=${opt.minutes}
                  type="button"
                  className=${audio.sleepMinutes === opt.minutes ? 'sleep-chip selected' : 'sleep-chip'}
                  onClick=${() => audio.setSleepTimer(opt.minutes)}
                >
                  ${opt.label}
                </button>
              `
            )}
          </div>
        </div>
      </div>
    </div>
  `;
}
