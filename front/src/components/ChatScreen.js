import { html, useEffect, useRef, useState } from '../lib/html.js';
import { QUICK_CHAT_PROMPTS } from '../data/constants.js';

export function ChatScreen({
  partner,
  partnerStatusText,
  messages,
  partnerTyping,
  badges,
  pendingInviteGame,
  showInviteBanner,
  onAcceptInvite,
  onDismissInvite,
  onOpenGame,
  onSendMessage,
  onSendGameInvite,
  onTypingSignal,
  onFindNewPartner,
  onLeaveStation,
  hidden
}) {
  const [inputValue, setInputValue] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current && !hidden) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, partnerTyping, hidden]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setInputValue('');
    onSendMessage(trimmed);
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
    onTypingSignal?.();
  };

  return html`
    <section className="chat-wrap">
      <div className=${`glass-card chat-card${hidden ? ' hidden' : ''}`}>
        <div className="chat-head">
          <div className="partner-info">
            <div className="partner-avatar">${partner.avatar}</div>
            <div className="partner-text">
              <div className="partner-name-row">
                <h2 className="partner-name">${partner.name}</h2>
                <span className="online-dot"></span>
              </div>
              <p className="partner-status">${partnerStatusText}</p>
            </div>
          </div>

          <div className="chat-head-actions">
            <div className="badge-anchor">
              <button
                type="button"
                className="chat-tool-btn"
                onClick=${() => onOpenGame('draw')}
              >
                <span>🪟</span>
                <span>Vẽ kính</span>
              </button>
              ${badges.draw && html`<span className="red-notify-dot"></span>`}
            </div>

            <div className="badge-anchor">
              <button
                type="button"
                className="chat-tool-btn"
                onClick=${() => onOpenGame('caro')}
              >
                <span>🌙</span>
                <span>Cờ Caro</span>
              </button>
              ${badges.caro && html`<span className="red-notify-dot"></span>`}
            </div>

            <button
              type="button"
              className="chat-tool-btn"
              title="Tìm người cùng thức mới"
              onClick=${onFindNewPartner}
            >
              <span>↻</span>
              <span className="label-desktop">Tìm người mới</span>
            </button>

            <button
              type="button"
              className="chat-tool-btn leave-btn"
              title="Quay lại sảnh chào"
              onClick=${onLeaveStation}
            >
              <span>🚪</span>
              <span className="label-desktop">Rời trạm</span>
            </button>
          </div>
        </div>

        ${showInviteBanner && pendingInviteGame &&
        html`
          <div className="invite-banner animate-fade-up">
            <div className="invite-banner-left">
              <span style=${{ fontSize: '20px' }}>
                ${pendingInviteGame === 'caro' ? '🌙' : '🪟'}
              </span>
              <p className="invite-banner-text">
                ${partner.name} lần đầu mời bạn cùng ${pendingInviteGame === 'caro' ? 'chơi Cờ Caro 6x6' : 'vẽ lên cửa kính mưa'}!
              </p>
            </div>
            <div className="invite-banner-btns">
              <button
                type="button"
                className="btn-later-sm"
                onClick=${onDismissInvite}
              >
                Để sau
              </button>
              <button
                type="button"
                className="btn-accept-sm"
                onClick=${onAcceptInvite}
              >
                Tham gia ngay
              </button>
            </div>
          </div>
        `}

        <div ref=${listRef} className="message-list">
          ${messages.map((m) =>
            m.kind === 'sys'
              ? html`
                  <div key=${m.id} className="sys-row animate-fade-up">
                    <span className="sys-pill">${m.text}</span>
                  </div>
                `
              : html`
                  <div
                    key=${m.id}
                    className=${m.sender === 'me' ? 'msg-row me animate-fade-up' : 'msg-row partner animate-fade-up'}
                  >
                    <div className="msg-bubble">
                      <div>${m.text}</div>
                      ${m.time && html`<span className="msg-time">${m.time}</span>`}
                    </div>
                  </div>
                `
          )}
        </div>

        ${partnerTyping &&
        html`
          <div className="typing-row">
            ${partner.name} đang gõ vài dòng...
          </div>
        `}

        <div className="quick-pills-bar no-scrollbar">
          <button
            type="button"
            className="quick-pill pill-amber"
            onClick=${() => onSendGameInvite('draw')}
          >
            Mời vẽ kính mưa 🪟
          </button>
          <button
            type="button"
            className="quick-pill pill-indigo"
            onClick=${() => onSendGameInvite('caro')}
          >
            Rủ chơi Cờ Caro 6x6 🌙
          </button>
          ${QUICK_CHAT_PROMPTS.map(
            (prompt) => html`
              <button
                key=${prompt}
                type="button"
                className="quick-pill"
                onClick=${() => onSendMessage(prompt)}
              >
                ${prompt}
              </button>
            `
          )}
        </div>

        <form className="chat-form" onSubmit=${handleSubmit}>
          <input
            type="text"
            autoComplete="off"
            className="chat-input"
            placeholder="Viết ra điều đang làm bạn trằn trọc..."
            value=${inputValue}
            onChange=${handleChange}
          />
          <button type="submit" className="btn-send">Gửi</button>
        </form>
      </div>
    </section>
  `;
}
