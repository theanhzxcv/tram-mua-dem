import { html } from '../lib/html.js';
import { FrostedGlassGame } from './FrostedGlassGame.js';
import { CaroGame } from './CaroGame.js';

export function GameModal({
  activeGame,
  badges,
  onSelectTab,
  onClose,
  glassStrokes,
  onCommitStroke,
  onUndoStroke,
  onRefog,
  onExportSuccess,
  caroState,
  caroScore,
  myCaroSymbol,
  partner,
  onStartCaro,
  onResetCaro,
  onCaroCellClick
}) {
  if (!activeGame) return null;

  return html`
    <div className="modal-backdrop">
      <div className="game-modal-card animate-fade-up">
        <div className="game-modal-head">
          <div className="game-tabs">
            <div className="badge-anchor">
              <button
                type="button"
                className=${activeGame === 'draw' ? 'game-tab-btn active' : 'game-tab-btn'}
                onClick=${() => onSelectTab('draw')}
              >
                🪟 Vẽ kính
              </button>
              ${badges.draw && html`<span className="red-notify-dot"></span>`}
            </div>

            <div className="badge-anchor">
              <button
                type="button"
                className=${activeGame === 'caro' ? 'game-tab-btn active' : 'game-tab-btn'}
                onClick=${() => onSelectTab('caro')}
              >
                🌙 Cờ Caro 6x6
              </button>
              ${badges.caro && html`<span className="red-notify-dot"></span>`}
            </div>
          </div>

          <button type="button" className="btn-subtle" onClick=${onClose}>
            ✕ Quay lại chat
          </button>
        </div>

        ${activeGame === 'draw'
          ? html`
              <${FrostedGlassGame}
                strokes=${glassStrokes}
                onCommitStroke=${onCommitStroke}
                onUndoStroke=${onUndoStroke}
                onRefog=${onRefog}
                onExportSuccess=${onExportSuccess}
              />
            `
          : html`
              <${CaroGame}
                caroState=${caroState}
                caroScore=${caroScore}
                myCaroSymbol=${myCaroSymbol}
                partner=${partner}
                onStart=${onStartCaro}
                onReset=${onResetCaro}
                onCellClick=${onCaroCellClick}
              />
            `}
      </div>
    </div>
  `;
}
