import { html, useEffect, useState } from '../lib/html.js';
import { CARO_TURN_SECONDS } from '../data/constants.js';

function MoonPiece() {
  return html`
    <svg className="caro-piece-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="Mặt Trăng">
      <path
        d="M20.2 14.5A8.2 8.2 0 0 1 9.5 3.8a8.2 8.2 0 1 0 10.7 10.7Z"
        fill="#fbbf24"
        stroke="#fde68a"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  `;
}

function StarPiece() {
  return html`
    <svg className="caro-piece-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="Ngôi Sao">
      <path
        d="M12 2.8 14.8 8.5l6.3.9-4.5 4.4 1.1 6.2L12 17l-5.7 3 1.1-6.2-4.5-4.4 6.3-.9L12 2.8Z"
        fill="#38bdf8"
        stroke="#bae6fd"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  `;
}

export function CaroGame({
  caroState,
  caroScore,
  myCaroSymbol,
  partner,
  onStart,
  onReset,
  onCellClick
}) {
  const [remMs, setRemMs] = useState(CARO_TURN_SECONDS * 1000);

  useEffect(() => {
    if (!caroState.started || caroState.winner) {
      setRemMs(CARO_TURN_SECONDS * 1000);
      return;
    }

    const tick = () => {
      setRemMs(Math.max(0, caroState.turnDeadline - Date.now()));
    };
    tick();
    const id = setInterval(tick, 180);
    return () => clearInterval(id);
  }, [caroState.started, caroState.winner, caroState.turnDeadline]);

  const remSec = Math.ceil(remMs / 1000);
  const pct = Math.max(0, Math.min(100, (remMs / (CARO_TURN_SECONDS * 1000)) * 100));
  const isWarn = caroState.started && !caroState.winner && remSec <= 5;

  const myNameSym = myCaroSymbol === 'MOON' ? 'Trăng vàng' : 'Sao xanh';
  const partnerNameSym = myCaroSymbol === 'MOON' ? 'Sao xanh' : 'Trăng vàng';
  const turnNameSym = caroState.turn === 'MOON' ? 'Trăng vàng' : 'Sao xanh';

  let turnLabel = '';
  if (caroState.winner === 'DRAW') {
    turnLabel = 'Ván cờ 6x6 hòa nhau thật êm đềm ✨';
  } else if (caroState.winner) {
    turnLabel =
      caroState.winner === myCaroSymbol
        ? `Bạn (${myNameSym}) đã chiến thắng! 🎉`
        : `${partner.name} đã thắng ván này! 🌟`;
  } else {
    turnLabel =
      caroState.turn === myCaroSymbol
        ? `Lượt của bạn (${myNameSym})`
        : `Lượt đối phương (${turnNameSym})...`;
  }

  return html`
    <div className="game-panel caro-panel-wrap">
      ${!caroState.started &&
      html`
        <div className="caro-start-overlay">
          <div className="caro-start-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20.2 14.5A8.2 8.2 0 0 1 9.5 3.8a8.2 8.2 0 1 0 10.7 10.7Z"
                fill="#fbbf24"
                stroke="#fde68a"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="caro-start-title">Cờ Caro Đêm 6x6</h3>
          <p className="caro-start-desc">
            Nối <strong style=${{ color: 'var(--amber-pale)' }}>4 ô liên tiếp</strong> (ngang, dọc hoặc chéo) để chiến thắng.
            Mỗi lượt có <strong style=${{ color: 'var(--indigo-pale)' }}>15 giây</strong> suy nghĩ nhẹ nhàng.
          </p>
          <button
            type="button"
            className="btn-primary-amber"
            style=${{ width: 'auto', padding: '12px 26px' }}
            onClick=${onStart}
          >
            ▶ Bắt đầu chơi
          </button>
        </div>
      `}

      <div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="caro-header-bar">
          <div style=${{ minWidth: 0 }}>
            <div className="caro-status-row">
              <span className="caro-turn-label">${turnLabel}</span>
              <span className=${isWarn ? 'caro-timer-pill warn pulse-warn' : 'caro-timer-pill'}>
                ⏱ <span>${caroState.started ? `${remSec}s` : `${CARO_TURN_SECONDS}s`}</span>
              </span>
            </div>
            <p className="caro-legend">
              <span>Bạn: <strong style=${{ color: '#fcd34d' }}>${myNameSym}</strong></span>
              <span>•</span>
              <span>Đối phương: <strong style=${{ color: '#7dd3fc' }}>${partnerNameSym}</strong></span>
              <span>•</span>
              <span className="caro-score-pill">Tỉ số ${caroScore.me} - ${caroScore.draw} - ${caroScore.partner}</span>
            </p>
          </div>

          <button type="button" className="btn-subtle" onClick=${onReset}>
            Chơi ván mới
          </button>
        </div>

        <div className="timer-track">
          <div
            className=${isWarn ? 'timer-fill warn' : 'timer-fill'}
            style=${{ width: `${caroState.started ? pct : 100}%` }}
          ></div>
        </div>
      </div>

      <div className="caro-board-center">
        <div className="caro-grid-6x6" role="grid" aria-label="Bàn cờ Caro 6x6">
          ${caroState.board.map((val, idx) => {
            const isWin = caroState.winLine.includes(idx);
            const isLast = caroState.lastMove === idx && !isWin;
            const cls =
              'caro-cell' + (isWin ? ' caro-cell-win' : isLast ? ' caro-cell-last' : '');
            return html`
              <button
                key=${idx}
                type="button"
                className=${cls}
                aria-label=${`Ô ${idx + 1}`}
                onClick=${() => onCellClick(idx)}
              >
                ${val === 'MOON' && html`<${MoonPiece} />`}
                ${val === 'STAR' && html`<${StarPiece} />`}
              </button>
            `;
          })}
        </div>
      </div>
    </div>
  `;
}
