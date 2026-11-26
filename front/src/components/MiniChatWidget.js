import { html, useEffect, useRef, useState } from '../lib/html.js';

export function MiniChatWidget({
  visible,
  partner,
  messages,
  isOpen,
  unreadCount,
  previewText,
  onToggle,
  onOpenFromPreview,
  onSendMessage
}) {
  const [inputValue, setInputValue] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!visible) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setInputValue('');
    onSendMessage(trimmed);
  };

  return html`
    <div>
      ${isOpen &&
      html`
        <div className="mini-chat-window animate-fade-up">
          <div className="mini-chat-head">
            <div style=${{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style=${{ fontSize: '17px' }}>${partner.avatar}</span>
              <div style=${{ minWidth: 0 }}>
                <p style=${{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ${partner.name}
                </p>
                <p style=${{ margin: '1px 0 0', fontSize: '10px', color: 'var(--emerald)' }}>
                  Vừa chơi vừa trò chuyện
                </p>
              </div>
            </div>
            <button
              type="button"
              className="icon-close-sm"
              title="Thu gọn thành bong bóng"
              onClick=${() => onToggle(false)}
            >
              —
            </button>
          </div>

          <div ref=${listRef} className="mini-message-list">
            ${messages.map((m) =>
              m.kind === 'sys'
                ? html`
                    <div key=${m.id} className="sys-row">
                      <span className="sys-pill">${m.text}</span>
                    </div>
                  `
                : html`
                    <div
                      key=${m.id}
                      className=${m.sender === 'me' ? 'msg-row me' : 'msg-row partner'}
                    >
                      <div className="msg-bubble">${m.text}</div>
                    </div>
                  `
            )}
          </div>

          <form className="mini-chat-form" onSubmit=${handleSubmit}>
            <input
              ref=${inputRef}
              type="text"
              autoComplete="off"
              className="mini-chat-input"
              placeholder="Nhắn nhanh..."
              value=${inputValue}
              onChange=${(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="btn-mini-send">Gửi</button>
          </form>
        </div>
      `}

      ${!isOpen && previewText &&
      html`
        <button
          type="button"
          className="bubble-preview-pill animate-fade-up"
          onClick=${onOpenFromPreview}
        >
          <p>${previewText}</p>
        </button>
      `}

      <button
        type="button"
        className="messenger-bubble"
        title="Mở cửa sổ chat nhỏ bên phải"
        onClick=${() => onToggle()}
      >
        <span>${partner.avatar}</span>
        ${unreadCount > 0 &&
        html`<span className="unread-badge">${unreadCount > 9 ? '9+' : unreadCount}</span>`}
      </button>
    </div>
  `;
}
