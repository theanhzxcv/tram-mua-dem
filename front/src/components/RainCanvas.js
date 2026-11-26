import { html, React, useEffect, useRef } from '../lib/html.js';

export function RainCanvas({ density }) {
  const canvasRef = useRef(null);
  const densityRef = useRef(density);
  const dropsRef = useRef([]);

  const rebuildDrops = (width, height, nextDensity) => {
    if (nextDensity <= 0) {
      dropsRef.current = [];
      return;
    }
    const factor = nextDensity / 100;
    const count = Math.floor(factor * 255) + 14;
    const drops = [];
    for (let i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * (width + 60),
        y: Math.random() * height,
        length: 9 + factor * 18 + Math.random() * 10,
        speed: 3.6 + factor * 9.2 + Math.random() * 3.4,
        thickness: 0.7 + factor * 1.1,
        alpha: 0.11 + factor * 0.24 + Math.random() * 0.12
      });
    }
    dropsRef.current = drops;
  };

  useEffect(() => {
    densityRef.current = density;
    const canvas = canvasRef.current;
    if (canvas) {
      rebuildDrops(canvas.width, canvas.height, density);
    }
  }, [density]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rafId = null;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      rebuildDrops(canvas.width, canvas.height, densityRef.current);
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const windDrift = 0.55 + (densityRef.current / 100) * 1.15;
      const drops = dropsRef.current;

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.lineWidth = d.thickness;
        ctx.strokeStyle = `rgba(176, 208, 255, ${d.alpha})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - windDrift * 2, d.y + d.length);
        ctx.stroke();

        d.y += d.speed;
        d.x -= windDrift;

        if (d.y > canvas.height) {
          d.y = -d.length;
          d.x = Math.random() * (canvas.width + 80);
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return html`
    <${React.Fragment}>
      <canvas id="rainCanvas" ref=${canvasRef} aria-hidden="true"></canvas>
      <div className="night-vignette" aria-hidden="true"></div>
    <//>
  `;
}
