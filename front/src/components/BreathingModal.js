import { html, useEffect, useState } from '../lib/html.js';
import { BREATH_PRESETS } from '../data/constants.js';

export function BreathingModal({ isOpen, onClose, onPhaseCue }) {
  const [presetKey, setPresetKey] = useState('478');
  const [breathState, setBreathState] = useState(() => ({
    status: 'idle',
    stageIdx: 0,
    remSecs: BREATH_PRESETS['478'].stages[0].secs,
    cycles: 0
  }));
  const [soundCueOn, setSoundCueOn] = useState(true);

  const preset = BREATH_PRESETS[presetKey];
  const activeStage = preset.stages[breathState.stageIdx] || preset.stages[0];

  const resetSession = (nextKey = presetKey) => {
    const p = BREATH_PRESETS[nextKey];
    setBreathState({
      status: 'idle',
      stageIdx: 0,
      remSecs: p.stages[0].secs,
      cycles: 0
    });
  };

  useEffect(() => {
    if (!isOpen) {
      resetSession(presetKey);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || breathState.status !== 'running') return;

    const timer = setInterval(() => {
      setBreathState((prev) => {
        if (prev.status !== 'running') return prev;
        if (prev.remSecs > 1) {
          return { ...prev, remSecs: prev.remSecs - 1 };
        }
        const isLastStage = prev.stageIdx >= preset.stages.length - 1;
        const nextIdx = isLastStage ? 0 : prev.stageIdx + 1;
        return {
          ...prev,
          stageIdx: nextIdx,
          remSecs: preset.stages[nextIdx].secs,
          cycles: isLastStage ? prev.cycles + 1 : prev.cycles
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, breathState.status, preset]);

  useEffect(() => {
    if (isOpen && breathState.status === 'running' && soundCueOn) {
      onPhaseCue?.(activeStage.key);
    }
  }, [isOpen, breathState.status, breathState.stageIdx, soundCueOn, activeStage.key, onPhaseCue]);

  if (!isOpen) return null;

  const isRunning = breathState.status === 'running';
  const isIdle = breathState.status === 'idle';
  const orbScale = isIdle ? 1 : activeStage.scale;
  const transitionSecs = isIdle
    ? 0.6
    : activeStage.key === 'hold'
    ? 0.8
    : breathState.remSecs;

  const stageTotal = activeStage.secs;
  const progressRatio = isIdle ? 0 : (stageTotal - breathState.remSecs + 1) / stageTotal;
  const circumference = 2 * Math.PI * 78;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, progressRatio)));

  const handleToggleRun = () => {
    setBreathState((prev) => ({
      ...prev,
      status: prev.status === 'running' ? 'paused' : 'running'
    }));
  };

  const handlePresetSwitch = (key) => {
    setPresetKey(key);
    resetSession(key);
  };

  const guideText = isIdle
    ? preset.subtitle
    : breathState.status === 'paused'
    ? 'Đã tạm dừng — Bấm Tiếp tục khi bạn sẵn sàng nối lại nhịp thở.'
    : activeStage.guide;

  return html`
    <div className="breath-modal-backdrop">
      <div className="breath-card animate-fade-up">
        <div className="breath-top">
          <span className="breath-title">🌬️ Bài tập Thở điều hòa</span>
          <div style=${{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className=${soundCueOn ? 'breath-cue-btn active' : 'breath-cue-btn'}
              title="Bật/tắt tiếng chuông nhỏ chuyển nhịp"
              onClick=${() => setSoundCueOn((v) => !v)}
            >
              ${soundCueOn ? '🔔' : '🔕'}
            </button>
            <button
              type="button"
              className="icon-close-sm"
              aria-label="Đóng bài tập thở"
              onClick=${onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="breath-preset-tabs">
          ${Object.values(BREATH_PRESETS).map(
            (p) => html`
              <button
                key=${p.id}
                type="button"
                className=${presetKey === p.id ? 'breath-preset-btn active' : 'breath-preset-btn'}
                onClick=${() => handlePresetSwitch(p.id)}
              >
                ${p.name}
              </button>
            `
          )}
        </div>

        <div className="breath-cycle-pill">
          <span>✨ Nhịp đã hoàn thành:</span>
          <strong style=${{ color: 'var(--amber-light)' }}>${breathState.cycles}</strong>
        </div>

        <div className="breath-orb-stage">
          <svg className="breath-ring-svg" width="176" height="176" viewBox="0 0 176 176" aria-hidden="true">
            <circle cx="88" cy="88" r="78" stroke="rgba(148, 163, 184, 0.16)" strokeWidth="3" fill="none" />
            <circle
              cx="88"
              cy="88"
              r="78"
              stroke="rgba(251, 191, 36, 0.72)"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              strokeDasharray=${circumference}
              strokeDashoffset=${dashOffset}
              style=${{ transition: 'stroke-dashoffset 0.9s linear', transform: 'rotate(-90deg)', transformOrigin: '88px 88px' }}
            />
          </svg>

          <div
            className=${`breath-orb${!isIdle ? ` phase-${activeStage.key}` : ''}`}
            style=${{
              transform: `scale(${orbScale})`,
              transitionDuration: `${transitionSecs}s`
            }}
          >
            <span className="breath-phase-text">
              ${isIdle ? 'Sẵn sàng' : activeStage.label}
            </span>
            <span className="breath-count-text">
              ${isIdle ? preset.readyBadge : breathState.remSecs}
            </span>
          </div>
        </div>

        <p className="breath-guide">${guideText}</p>

        <div className="breath-actions">
          <button
            type="button"
            className=${isRunning ? 'btn-breath-start is-running' : 'btn-breath-start'}
            onClick=${handleToggleRun}
          >
            ${isRunning ? '⏸ Tạm dừng' : breathState.status === 'paused' ? '▶ Tiếp tục' : '▶ Bắt đầu'}
          </button>

          ${!isIdle &&
          html`
            <button
              type="button"
              className="btn-breath-reset"
              onClick=${() => resetSession(presetKey)}
            >
              ↺ Đặt lại
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}
