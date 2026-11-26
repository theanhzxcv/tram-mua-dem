import { html, useState } from '../lib/html.js';
import { MOOD_OPTIONS } from '../data/constants.js';

export function LobbyScreen({
  persona,
  mood,
  audio,
  onSelectMood,
  onRerollPersona,
  onUpdateName,
  onStartMatching,
  onMeetBot,
  onOpenRelease
}) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(persona.name);

  const handleSaveName = (e) => {
    e.preventDefault();
    const cleaned = draftName.trim();
    if (cleaned) {
      onUpdateName(cleaned.slice(0, 28));
    } else {
      setDraftName(persona.name);
    }
    setEditingName(false);
  };

  const startEdit = () => {
    setDraftName(persona.name);
    setEditingName(true);
  };

  return html`
    <section className="lobby-wrap animate-fade-up">
      <div className="glass-card lobby-card">
        <div>
          <div className="candle-emblem">
            <span className="candle-glow">🕯️</span>
          </div>
          <h1 className="lobby-title">Ghé Trạm Mưa Đêm Một Chút Nhé</h1>
          <p className="lobby-desc">
            Một góc nhỏ yên tĩnh cho những đêm đầu óc quay cuồng vì <strong>overthinking</strong>.
            Nghe tiếng mưa đêm trong trẻo, thở chậm lại và trò chuyện ẩn danh 1-1 không áp lực.
          </p>
        </div>

        <div className="mood-section">
          <p className="mood-heading">Tâm trạng đêm nay của bạn thế nào?</p>
          <div className="mood-chips">
            ${MOOD_OPTIONS.map(
              (m) => html`
                <button
                  key=${m.id}
                  type="button"
                  className=${mood === m.id ? 'mood-chip active' : 'mood-chip'}
                  onClick=${() => onSelectMood(m.id)}
                >
                  <span>${m.icon}</span>
                  <span>${m.label}</span>
                </button>
              `
            )}
          </div>
        </div>

        <div className="persona-box">
          <div className="persona-left">
            <div className="persona-avatar">${persona.avatar}</div>
            <div className="persona-meta">
              <p className="persona-label">Danh tính đêm nay của bạn</p>
              ${editingName
                ? html`
                    <form className="persona-edit-form" onSubmit=${handleSaveName}>
                      <input
                        type="text"
                        className="persona-edit-input"
                        value=${draftName}
                        maxLength="28"
                        autoFocus
                        onChange=${(e) => setDraftName(e.target.value)}
                      />
                      <button type="submit" className="btn-save-name">Lưu</button>
                    </form>
                  `
                : html`<p className="persona-name">${persona.name}</p>`}
            </div>
          </div>

          <div className="persona-btns">
            ${!editingName &&
            html`
              <button
                type="button"
                className="btn-subtle"
                title="Tự đặt tên ẩn danh"
                onClick=${startEdit}
              >
                ✎ Sửa
              </button>
            `}
            <button
              type="button"
              className="btn-subtle"
              onClick=${() => {
                setEditingName(false);
                onRerollPersona();
              }}
            >
              ↻ Đổi
            </button>
          </div>
        </div>

        <div className="lobby-actions">
          <button
            type="button"
            className="btn-primary-amber"
            onClick=${onStartMatching}
          >
            <span>🌧️</span>
            <span>Tìm người cùng thức (Ghép đôi 1-1 ẩn danh)</span>
          </button>

          <button
            type="button"
            className="btn-secondary-dark"
            onClick=${onMeetBot}
          >
            <span>🕯️</span>
            <span>Trò chuyện ngay với Người Gác Trạm Đêm</span>
          </button>

          <div className="lobby-quick-row">
            <button
              type="button"
              className="btn-ghost-soft"
              onClick=${() => {
                if (!audio.rainAudioOn) audio.toggleRainAudio();
                if (!audio.musicAudioOn) audio.toggleMusicAudio();
              }}
            >
              <span>${audio.rainAudioOn && audio.musicAudioOn ? '🔊 Đang phát mưa & nhạc' : '🎧 Bật mưa & nhạc êm dịu'}</span>
            </button>
            <button
              type="button"
              className="btn-ghost-soft"
              onClick=${onOpenRelease}
            >
              <span>✨ Thả trôi suy nghĩ</span>
            </button>
          </div>
        </div>

        <p className="lobby-tip">
          Mẹo: Mở trang web ở 2 tab trình duyệt cùng lúc và bấm “Tìm người cùng thức” để ghép đôi thật thời gian thực.
        </p>
      </div>
    </section>
  `;
}
