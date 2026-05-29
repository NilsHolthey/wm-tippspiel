// Hand-rolled confetti — no external dependencies

const COLORS = ["#ceac4d", "#e8c97a", "#ffffff", "#c9a84c", "#f5dfa0"];
const fired = new Set();

function rnd(min, max) { return Math.random() * (max - min) + min; }

function makeParticle(x, y) {
  return {
    x, y,
    vx: rnd(-9, 9),
    vy: rnd(-20, -6),
    gravity: 0.45,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    w: rnd(5, 11),
    h: rnd(3, 7),
    rotation: rnd(0, Math.PI * 2),
    spin: rnd(-0.25, 0.25),
    opacity: 1,
    circle: Math.random() > 0.6,
  };
}

function showOverlay() {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:9998;";
  wrap.innerHTML = `
    <div style="text-align:center;will-change:transform,opacity">
      <div style="font-size:2.2rem;letter-spacing:0.15em;margin-bottom:6px">🎉 ⚽ 🎊</div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:4.5rem;color:#ceac4d;letter-spacing:0.12em;line-height:1;text-shadow:0 0 40px rgba(201,168,76,0.7)">3 PUNKTE!</div>
      <div style="font-size:2rem;margin-top:6px;letter-spacing:0.15em">✨ 🏆 ✨</div>
    </div>`;
  document.body.appendChild(wrap);
  const inner = wrap.firstElementChild;
  inner.animate(
    [
      { transform: "scale(0.2)", opacity: 0 },
      { transform: "scale(1.18)", opacity: 1, offset: 0.25 },
      { transform: "scale(1)",   opacity: 1, offset: 0.45 },
      { transform: "scale(1)",   opacity: 1, offset: 0.65 },
      { transform: "scale(1)",   opacity: 0 },
    ],
    { duration: 2400, easing: "ease-out", fill: "forwards" }
  ).onfinish = () => wrap.remove();
}

export function celebrate(matchId) {
  if (typeof window === "undefined") return;
  if (fired.has(matchId)) return;
  fired.add(matchId);
  showOverlay();

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;
  const cy = canvas.height * 0.38;

  const particles = Array.from({ length: 140 }, () =>
    makeParticle(cx + rnd(-40, 40), cy + rnd(-20, 20))
  );

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of particles) {
      p.vy += p.gravity;
      p.x  += p.vx;
      p.y  += p.vy;
      p.rotation += p.spin;
      p.opacity  -= 0.011;
      if (p.opacity <= 0) continue;
      alive = true;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      if (p.circle) {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }

    if (alive) requestAnimationFrame(tick);
    else canvas.remove();
  }

  requestAnimationFrame(tick);
}
