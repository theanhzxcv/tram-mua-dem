import { html, useCallback, useEffect, useRef, useState } from '../lib/html.js';
import { BRUSH_SIZES, FROSTED_COLORS } from '../data/constants.js';

function drawFogLayer(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 48; i++) {
    const rx = ((i * 73) % 97) / 97 * width;
    const ry = ((i * 41) % 89) / 89 * height;
    const rr = 1 + (i % 3) * 0.7;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.14)';
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStroke(ctx, width, height, stroke) {
  const { points, color, size } = stroke;
  if (!points || points.length < 2 || !width || !height) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size || 7;
  ctx.strokeStyle = color || '#fbbf24';
  ctx.shadowBlur = 14;
  ctx.shadowColor = color || '#fbbf24';

  ctx.beginPath();
  ctx.moveTo(points[0].x * width, points[0].y * height);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x * width, points[i].y * height);
  }
  ctx.stroke();
  ctx.restore();
}

export function FrostedGlassGame({
  strokes,
  onCommitStroke,
  onUndoStroke,
  onRefog,
  onExportSuccess
}) {
  const [drawColor, setDrawColor] = useState(FROSTED_COLORS[0].hex);
  const [drawSize, setDrawSize] = useState(7);

  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const activeStrokeRef = useRef([]);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width || !canvas.height) return;
    const ctx = canvas.getContext('2d');
    drawFogLayer(ctx, canvas.width, canvas.height);
    for (let i = 0; i < strokes.length; i++) {
      drawStroke(ctx, canvas.width, canvas.height, strokes[i]);
    }
  }, [strokes]);

  useEffect(() => {
    const syncSize = () => {
      const frame = frameRef.current;
      const canvas = canvasRef.current;
      if (!frame || !canvas || frame.clientWidth === 0) return;
      canvas.width = frame.clientWidth;
      canvas.height = frame.clientHeight;
      redrawAll();
    };

    const timer = setTimeout(syncSize, 30);
    window.addEventListener('resize', syncSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', syncSize);
    };
  }, [redrawAll]);

  useEffect(() => {
    redrawAll();
  }, [strokes, redrawAll]);

  const getNormalizedPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(1, (cx - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (cy - rect.top) / rect.height))
    };
  };

  const handleDown = (e) => {
    drawingRef.current = true;
    activeStrokeRef.current = [getNormalizedPoint(e)];
  };

  const handleMove = (e) => {
    if (!drawingRef.current) return;
    if (e.cancelable) e.preventDefault();
    const pt = getNormalizedPoint(e);
    activeStrokeRef.current.push(pt);
    const canvas = canvasRef.current;
    if (canvas && activeStrokeRef.current.length >= 2) {
      const ctx = canvas.getContext('2d');
      drawStroke(ctx, canvas.width, canvas.height, {
        points: activeStrokeRef.current.slice(-2),
        color: drawColor,
        size: drawSize
      });
    }
  };

  const finishStroke = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const pts = activeStrokeRef.current;
    activeStrokeRef.current = [];
    if (pts.length >= 2) {
      onCommitStroke({ points: pts, color: drawColor, size: drawSize });
    }
  }, [drawColor, drawSize, onCommitStroke]);

  useEffect(() => {
    window.addEventListener('mouseup', finishStroke);
    window.addEventListener('touchend', finishStroke);
    return () => {
      window.removeEventListener('mouseup', finishStroke);
      window.removeEventListener('touchend', finishStroke);
    };
  }, [finishStroke]);

  const handleSaveImage = () => {
    const srcCanvas = canvasRef.current;
    if (!srcCanvas) return;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = srcCanvas.width;
    exportCanvas.height = srcCanvas.height;
    const ctx = exportCanvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, exportCanvas.height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#131d38');
    grad.addColorStop(1, '#090d1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(srcCanvas, 0, 0);

    const link = document.createElement('a');
    link.download = 'tram-mua-dem-kinh-mua.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
    onExportSuccess?.();
  };

  return html`
    <div className="game-panel">
      <div className="draw-toolbar">
        <div className="tool-cluster">
          ${FROSTED_COLORS.map(
            (c) => html`
              <button
                key=${c.hex}
                type="button"
                className=${drawColor === c.hex ? 'color-chip active' : 'color-chip'}
                onClick=${() => setDrawColor(c.hex)}
              >
                <span className="color-swatch" style=${{ backgroundColor: c.hex }}></span>
                <span>${c.label}</span>
              </button>
            `
          )}
        </div>

        <div className="tool-cluster">
          <div className="brush-group">
            ${BRUSH_SIZES.map(
              (b) => html`
                <button
                  key=${b.size}
                  type="button"
                  className=${drawSize === b.size ? 'brush-btn active' : 'brush-btn'}
                  onClick=${() => setDrawSize(b.size)}
                >
                  ${b.label}
                </button>
              `
            )}
          </div>

          <button
            type="button"
            className="btn-subtle"
            disabled=${strokes.length === 0}
            onClick=${onUndoStroke}
            title="Hoàn tác nét vừa vẽ"
          >
            ↩ Hoàn tác
          </button>

          <button
            type="button"
            className="btn-refog"
            onClick=${onRefog}
          >
            💨 Phủ sương
          </button>

          <button
            type="button"
            className="btn-subtle"
            onClick=${handleSaveImage}
            title="Lưu bức vẽ kính mưa"
          >
            💾 Lưu
          </button>
        </div>
      </div>

      <div ref=${frameRef} className="frosted-frame">
        <div className="bokeh-dot" style=${{ top: '24px', left: '36px', width: '96px', height: '96px', background: 'rgba(251,191,36,0.26)' }}></div>
        <div className="bokeh-dot" style=${{ bottom: '28px', right: '42px', width: '112px', height: '112px', background: 'rgba(129,140,248,0.26)' }}></div>
        <div className="bokeh-dot" style=${{ top: '45%', left: '45%', width: '120px', height: '120px', background: 'rgba(56,189,248,0.14)' }}></div>
        <canvas
          ref=${canvasRef}
          id="frostedCanvas"
          onMouseDown=${handleDown}
          onMouseMove=${handleMove}
          onTouchStart=${handleDown}
          onTouchMove=${handleMove}
        ></canvas>
      </div>

      <p className="panel-hint">
        Chạm hoặc kéo trên lớp hơi sương mờ để cùng nhau vẽ nét ánh sáng đêm (nét vẽ được giữ nguyên khi chuyển tab)
      </p>
    </div>
  `;
}
