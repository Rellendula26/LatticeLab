import { wavelengthColor } from '../physics/opto.js';

export function fit(canvas) {
  if (!canvas) return { ctx: null, w: 0, h: 0, dpr: 1 };
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.floor(r.width * dpr));
  const h = Math.max(1, Math.floor(r.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { ctx: canvas.getContext('2d'), w, h, dpr };
}

function clear(ctx, w, h) {
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, w, h);
}

function label(ctx, dpr, text, x, y, color = '#94a3b8', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${11 * dpr}px "IBM Plex Sans", sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

export function paintPhoton(canvas, m, parts) {
  const got = fit(canvas);
  if (!got.ctx) return;
  const { ctx, w, h, dpr } = got;
  clear(ctx, w, h);
  const col = wavelengthColor(m.lam);
  const slabX = 0.38 * w;
  const slabW = 0.36 * w;
  const gap = Math.min(0.28 * h, 0.12 * h + 0.16 * h * (m.Eg / 4));
  const mid = 0.52 * h;
  ctx.fillStyle = 'rgba(2,132,199,0.18)';
  ctx.fillRect(slabX, 28 * dpr, slabW, mid - gap / 2 - 28 * dpr);
  ctx.fillStyle = 'rgba(153,27,27,0.22)';
  ctx.fillRect(slabX, mid + gap / 2, slabW, h - 36 * dpr - (mid + gap / 2));
  ctx.strokeStyle = '#38bdf8';
  ctx.strokeRect(slabX, 28 * dpr, slabW, mid - gap / 2 - 28 * dpr);
  ctx.strokeStyle = '#f87171';
  ctx.strokeRect(slabX, mid + gap / 2, slabW, h - 36 * dpr - (mid + gap / 2));
  label(ctx, dpr, 'Ec', slabX + 8 * dpr, 48 * dpr, '#7dd3fc');
  label(ctx, dpr, 'Ev', slabX + 8 * dpr, h - 48 * dpr, '#fca5a5');
  ctx.strokeStyle = '#fbbf24';
  ctx.setLineDash([4 * dpr, 4 * dpr]);
  ctx.beginPath();
  ctx.moveTo(slabX, mid - gap / 2);
  ctx.lineTo(slabX, mid + gap / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, dpr, `Eg = ${m.Eg.toFixed(2)} eV`, slabX + slabW / 2, mid + 4 * dpr, '#fde68a', 'center');

  parts.forEach((p) => {
    ctx.fillStyle = col.css;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = col.css;
    ctx.beginPath();
    ctx.moveTo(p.x * w - 12 * dpr, p.y * h);
    ctx.quadraticCurveTo(p.x * w - 6 * dpr, p.y * h - 6 * dpr, p.x * w, p.y * h);
    ctx.stroke();
    if (p.jump) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(p.ex * w, p.ey * h, 5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(p.hx * w, p.hy * h, 5 * dpr, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.heat) {
      ctx.fillStyle = 'rgba(251,191,36,0.7)';
      ctx.font = `${10 * dpr}px "IBM Plex Sans"`;
      ctx.fillText('heat', p.x * w, p.y * h - 10 * dpr);
    }
  });

  const barX = 0.82 * w;
  const barY = 40 * dpr;
  const barH = h - 80 * dpr;
  const tot = Math.max(m.split.photon, 1e-6);
  const u = (m.split.usable / tot) * barH;
  const th = (m.split.thermal / tot) * barH;
  const tr = (m.split.transmitted / tot) * barH;
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(barX, barY + barH - u, 18 * dpr, u);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(barX, barY + barH - u - th, 18 * dpr, th);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(barX, barY, 18 * dpr, tr);
  label(ctx, dpr, 'usable', barX + 24 * dpr, barY + barH - 4, '#86efac');
  label(ctx, dpr, 'thermal', barX + 24 * dpr, barY + barH * 0.45, '#fde68a');
  label(ctx, dpr, m.regime.id === 'below' ? 'transmits' : col.name, 16 * dpr, 22 * dpr, col.css);
}

export function tickPhoton(parts, m, dt) {
  const absorbed = m.regime.absorbed;
  if (parts.length < 3 + 8 * m.intensity) {
    parts.push({ x: 0.04, y: 0.35 + Math.random() * 0.3, jump: false, heat: false, age: 0 });
  }
  parts.forEach((p) => {
    p.x += dt * (0.18 + 0.25 * m.intensity);
    p.age += dt;
    if (p.x > 0.42 && p.x < 0.7) {
      if (absorbed) {
        p.jump = true;
        p.ex = p.x;
        p.ey = 0.28;
        p.hx = p.x + 0.04;
        p.hy = 0.72;
        p.heat = m.regime.id === 'above';
      }
    }
    if (p.x > 1.05) p.dead = true;
  });
  return parts.filter((p) => !p.dead);
}

export function paintCollect(canvas, m, parts) {
  const got = fit(canvas);
  if (!got.ctx) return;
  const { ctx, w, h, dpr } = got;
  clear(ctx, w, h);
  const y0 = 36 * dpr;
  const yh = h - 70 * dpr;
  ctx.fillStyle = 'rgba(153,27,27,0.35)';
  ctx.fillRect(0, y0, w * 0.5, yh);
  ctx.fillStyle = 'rgba(2,132,199,0.32)';
  ctx.fillRect(w * 0.5, y0, w * 0.5, yh);
  const xL = (0.5 - m.xpFrac) * w;
  const xR = (0.5 + m.xnFrac) * w;
  ctx.fillStyle = 'rgba(251,191,36,0.22)';
  ctx.fillRect(xL, y0, xR - xL, yh);
  ctx.strokeStyle = '#fbbf24';
  ctx.strokeRect(xL, y0, xR - xL, yh);
  label(ctx, dpr, 'P', 16 * dpr, y0 + 18 * dpr, '#fca5a5');
  label(ctx, dpr, 'N', w - 24 * dpr, y0 + 18 * dpr, '#7dd3fc');
  label(ctx, dpr, 'W', (xL + xR) / 2, y0 - 8 * dpr, '#fde68a', 'center');
  const nArr = 5;
  for (let i = 0; i < nArr; i++) {
    const y = y0 + yh * (0.2 + 0.15 * i);
    ctx.strokeStyle = 'rgba(52,211,153,0.7)';
    ctx.beginPath();
    ctx.moveTo(xR - 8 * dpr, y);
    ctx.lineTo(xL + 8 * dpr, y);
    ctx.stroke();
  }
  label(ctx, dpr, 'E points n → p', w / 2, h - 18 * dpr, '#6ee7b7', 'center');
  parts.forEach((p) => {
    ctx.fillStyle = p.kind === 'e' ? '#38bdf8' : 'transparent';
    ctx.strokeStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 4.5 * dpr, 0, Math.PI * 2);
    if (p.kind === 'e') ctx.fill();
    else ctx.stroke();
    if (p.recomb) {
      ctx.strokeStyle = '#f87171';
      ctx.beginPath();
      ctx.moveTo(p.x * w - 5 * dpr, p.y * h - 5 * dpr);
      ctx.lineTo(p.x * w + 5 * dpr, p.y * h + 5 * dpr);
      ctx.stroke();
    }
  });
  label(ctx, dpr, 'Click to generate a pair', 12 * dpr, h - 8 * dpr, '#64748b');
}

export function tickCollect(parts, m, dt) {
  parts.forEach((p) => {
    if (p.recomb || p.done) return;
    const inW = p.x > 0.5 - m.xpFrac && p.x < 0.5 + m.xnFrac;
    if (inW) {
      p.x += (p.kind === 'e' ? 1 : -1) * dt * 0.35;
      if (p.kind === 'e' && p.x > 0.92) p.done = true;
      if (p.kind === 'h' && p.x < 0.08) p.done = true;
    } else {
      p.x += (Math.random() - 0.5) * dt * 0.2;
      p.y += (Math.random() - 0.5) * dt * 0.15;
      p.life -= dt;
      if (p.life < 0) {
        if (Math.random() > p.collectP) p.recomb = true;
        else p.done = true;
      }
    }
  });
  return parts.filter((p) => p.age++ < 400);
}

export function paintCompare(canvas, m) {
  const got = fit(canvas);
  if (!got.ctx) return;
  const { ctx, w, h, dpr } = got;
  clear(ctx, w, h);
  const mid = w / 2;
  ctx.strokeStyle = 'rgba(148,163,184,0.2)';
  ctx.beginPath();
  ctx.moveTo(mid, 10 * dpr);
  ctx.lineTo(mid, h - 10 * dpr);
  ctx.stroke();
  label(ctx, dpr, 'Photoconductor', 16 * dpr, 22 * dpr, '#fde68a');
  label(ctx, dpr, 'Photodiode (reverse)', mid + 16 * dpr, 22 * dpr, '#c4b5fd');
  const n = Math.round(4 + 18 * m.pcFill);
  for (let i = 0; i < n; i++) {
    const x = 20 * dpr + (i % 6) * 22 * dpr;
    const y = 50 * dpr + Math.floor(i / 6) * 22 * dpr + (m.t * 40 + i * 13) % 12;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(x, y, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(251,191,36,0.18)';
  const ww = Math.max(20 * dpr, m.pdWfrac * (w / 2 - 30 * dpr));
  ctx.fillRect(mid + (w / 2 - ww) / 2, 40 * dpr, ww, h - 80 * dpr);
  for (let i = 0; i < 8; i++) {
    const y = 60 * dpr + i * 18 * dpr;
    ctx.strokeStyle = '#34d399';
    ctx.beginPath();
    ctx.moveTo(mid + (w / 2 + ww) / 2, y);
    ctx.lineTo(mid + (w / 2 - ww) / 2, y);
    ctx.stroke();
  }
  label(ctx, dpr, `σ ↑ ⇒ R ↓  I=${m.Ipc.toExponential(2)} A`, 16 * dpr, h - 14 * dpr, '#94a3b8');
  label(ctx, dpr, `I ≈ −Iph`, mid + 16 * dpr, h - 14 * dpr, '#94a3b8');
}

export function paintIV(canvas, m) {
  const got = fit(canvas);
  if (!got.ctx) return;
  const { ctx, w, h, dpr } = got;
  clear(ctx, w, h);
  const gap = 0.18 * h + 0.08 * h * Math.max(0, 1 - m.V);
  const mid = 0.5 * h;
  ctx.fillStyle = 'rgba(2,132,199,0.16)';
  ctx.fillRect(20 * dpr, 24 * dpr, w - 40 * dpr, mid - gap / 2 - 24 * dpr);
  ctx.fillStyle = 'rgba(153,27,27,0.18)';
  ctx.fillRect(20 * dpr, mid + gap / 2, w - 40 * dpr, h - 40 * dpr - (mid + gap / 2));
  ctx.strokeStyle = '#fbbf24';
  ctx.setLineDash([4 * dpr, 3 * dpr]);
  ctx.beginPath();
  ctx.moveTo(30 * dpr, mid);
  ctx.lineTo(w - 30 * dpr, mid);
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, dpr, m.reg.label, w / 2, 20 * dpr, '#fde68a', 'center');
  label(ctx, dpr, `V=${m.V.toFixed(2)} V   I=${m.I.toExponential(2)} A   P=${m.P.toExponential(2)} W`, w / 2, h - 12 * dpr, '#94a3b8', 'center');
}

export function paintSpeed(canvas, m) {
  const got = fit(canvas);
  if (!got.ctx) return;
  const { ctx, w, h, dpr } = got;
  clear(ctx, w, h);
  const y0 = 40 * dpr;
  const yh = h - 80 * dpr;
  ctx.fillStyle = 'rgba(153,27,27,0.3)';
  ctx.fillRect(0, y0, w * 0.5, yh);
  ctx.fillStyle = 'rgba(2,132,199,0.28)';
  ctx.fillRect(w * 0.5, y0, w * 0.5, yh);
  const ww = Math.max(8 * dpr, m.Wfrac * w);
  ctx.fillStyle = m.pin ? 'rgba(16,185,129,0.25)' : 'rgba(251,191,36,0.22)';
  ctx.fillRect((w - ww) / 2, y0, ww, yh);
  ctx.strokeStyle = '#fbbf24';
  ctx.strokeRect((w - ww) / 2, y0, ww, yh);
  label(ctx, dpr, m.pin ? 'PIN i-layer' : 'depletion W', w / 2, y0 - 8 * dpr, '#fde68a', 'center');
  label(ctx, dpr, `Cj=${m.Cj.toExponential(2)} F   τ_RC=${m.tRC.toExponential(2)} s   t_tr=${m.tTr.toExponential(2)} s`, w / 2, h - 14 * dpr, '#94a3b8', 'center');
}

export function paintQE(canvas, m) {
  const got = fit(canvas);
  if (!got.ctx) return;
  const { ctx, w, h, dpr } = got;
  clear(ctx, w, h);
  label(ctx, dpr, 'Incident photons', 20 * dpr, 28 * dpr, '#fde68a');
  label(ctx, dpr, 'Collected electrons', 20 * dpr, 0.55 * h, '#7dd3fc');
  const nPh = Math.min(40, Math.round(m.nPhRel * 40));
  const nE = Math.min(nPh, Math.round(nPh * m.QE));
  for (let i = 0; i < nPh; i++) {
    ctx.fillStyle = wavelengthColor(m.lam).css;
    ctx.beginPath();
    ctx.arc(28 * dpr + (i % 20) * 14 * dpr, 50 * dpr + Math.floor(i / 20) * 16 * dpr, 5 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < nE; i++) {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(28 * dpr + (i % 20) * 14 * dpr, 0.55 * h + 24 * dpr + Math.floor(i / 20) * 16 * dpr, 5 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }
  label(ctx, dpr, m.cut ? 'below-gap: QE → 0' : `R = ${m.R.toFixed(3)} A/W`, w / 2, h - 12 * dpr, m.cut ? '#fda4af' : '#86efac', 'center');
}

export function paintSolar(canvas, m) {
  const got = fit(canvas);
  if (!got.ctx) return;
  const { ctx, w, h, dpr } = got;
  clear(ctx, w, h);
  const x0 = 40 * dpr;
  const y0 = 30 * dpr;
  const bw = w - 60 * dpr;
  const bh = h - 70 * dpr;
  ctx.strokeStyle = 'rgba(148,163,184,0.25)';
  ctx.strokeRect(x0, y0, bw, bh);
  const Voc = Math.max(m.Voc, 1e-6);
  const Isc = Math.max(Math.abs(m.Isc), 1e-12);
  const px = (V) => x0 + (V / Voc) * bw;
  const py = (I) => y0 + bh * (1 - Math.abs(I) / Isc);
  ctx.fillStyle = 'rgba(251,191,36,0.18)';
  const vw = Math.max(0, px(m.Vmp) - x0);
  const ih = Math.max(0, y0 + bh - py(m.Imp));
  ctx.fillRect(x0, py(m.Imp), vw, ih);
  ctx.strokeStyle = '#fbbf24';
  ctx.strokeRect(x0, py(m.Imp), vw, ih);
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(px(m.V), py(m.I), 5 * dpr, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, dpr, 'max-power rectangle', x0, h - 14 * dpr, '#fde68a');
  label(ctx, dpr, `FF=${(m.FF * 100).toFixed(1)}%  η=${(m.eta * 100).toFixed(1)}%`, w - 16 * dpr, h - 14 * dpr, '#94a3b8', 'right');
}

export function paintBandgap(canvas, m) {
  const got = fit(canvas);
  if (!got.ctx) return;
  const { ctx, w, h, dpr } = got;
  clear(ctx, w, h);
  const sun = 40 * dpr;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(36 * dpr, 36 * dpr, 14 * dpr, 0, Math.PI * 2);
  ctx.fill();
  const topH = 0.28 * h;
  const botH = 0.28 * h;
  ctx.fillStyle = 'rgba(56,189,248,0.25)';
  ctx.fillRect(80 * dpr, sun + 20 * dpr, w - 120 * dpr, topH);
  ctx.fillStyle = 'rgba(244,63,94,0.22)';
  ctx.fillRect(80 * dpr, sun + 28 * dpr + topH, w - 120 * dpr, botH);
  label(ctx, dpr, m.tandem ? `top Eg=${m.EgTop.toFixed(2)} eV  (blue photons)` : `Eg=${m.Eg.toFixed(2)} eV`, 90 * dpr, sun + 40 * dpr, '#7dd3fc');
  if (m.tandem) label(ctx, dpr, `bottom Eg=${m.EgBot.toFixed(2)} eV  (leftover red/IR)`, 90 * dpr, sun + 48 * dpr + topH, '#fca5a5');
  label(ctx, dpr, 'small Eg: more photons, more thermalization', 16 * dpr, h - 28 * dpr, '#94a3b8');
  label(ctx, dpr, 'large Eg: fewer photons, larger Voc', 16 * dpr, h - 12 * dpr, '#94a3b8');
}

export function paintSpectrum(canvas, m) {
  const got = fit(canvas);
  if (!got.ctx) return;
  const { ctx, w, h, dpr } = got;
  clear(ctx, w, h);
  const T = m.T;
  const hue = T > 4000 ? 40 : T > 1500 ? 20 : 0;
  ctx.fillStyle = `hsl(${hue}, 90%, ${Math.min(70, T / 80)}%)`;
  ctx.beginPath();
  ctx.arc(w - 48 * dpr, 40 * dpr, 18 * dpr, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, dpr, `${T} K`, w - 48 * dpr, 72 * dpr, '#fde68a', 'center');
  label(ctx, dpr, `Wien peak ${m.peak.toFixed(0)} nm`, 16 * dpr, 24 * dpr, '#fde68a');
  label(ctx, dpr, T > 4000 ? 'visible-heavy (sun-like)' : 'IR-heavy (room objects)', 16 * dpr, h - 12 * dpr, '#94a3b8');
}

export function paintAbsorb(canvas, m) {
  const got = fit(canvas);
  if (!got.ctx) return;
  const { ctx, w, h, dpr } = got;
  clear(ctx, w, h);
  const x0 = 50 * dpr;
  const slab = w - 80 * dpr;
  ctx.fillStyle = 'rgba(2,132,199,0.12)';
  ctx.fillRect(x0, 40 * dpr, slab, h - 80 * dpr);
  for (let i = 0; i < 24; i++) {
    const fx = i / 23;
    const I = Math.exp(-m.alphaD * fx);
    ctx.fillStyle = `rgba(251,191,36,${0.08 + 0.55 * I})`;
    ctx.fillRect(x0 + fx * slab, 40 * dpr, slab / 24 + 1, h - 80 * dpr);
  }
  if (m.trap) {
    ctx.strokeStyle = 'rgba(125,211,252,0.7)';
    ctx.beginPath();
    ctx.moveTo(x0 + slab - 4, 50 * dpr);
    ctx.lineTo(x0 + 8 * dpr, 70 * dpr);
    ctx.lineTo(x0 + slab - 4, 90 * dpr);
    ctx.stroke();
    label(ctx, dpr, 'trapped path ~4d', x0, h - 14 * dpr, '#7dd3fc');
  }
  label(ctx, dpr, `absorbed ${(m.abs * 100).toFixed(1)}%   transmitted ${(m.tr * 100).toFixed(1)}%`, w / 2, 22 * dpr, '#e2e8f0', 'center');
}
