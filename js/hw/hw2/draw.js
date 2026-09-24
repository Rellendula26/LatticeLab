/** Shared canvas helpers for HW2 visualizers. */

export function sizeCanvas(canvas) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.floor(r.width * dpr));
  const h = Math.max(1, Math.floor(r.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h, dpr, cssW: r.width, cssH: r.height };
}

export function clear(ctx, w, h) {
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, w, h);
}

export function bandLayout(box, Eg) {
  const pad = 18;
  const top = box.y + pad;
  const bot = box.y + box.h - pad;
  const Ev = 0;
  const Ec = Eg;
  const yOf = (E) => bot - ((E - (Ev - 0.12 * Eg)) / (Eg + 0.24 * Eg)) * (bot - top);
  return { top, bot, Ev, Ec, Ei: Eg / 2, yOf, pad };
}

export function drawBands(ctx, L, d, hi) {
  const { box } = L;
  ctx.fillStyle = hi === 'cb' ? 'rgba(34,211,238,0.28)' : 'rgba(2,132,199,0.16)';
  ctx.fillRect(box.x, L.top, box.w, L.yOf(L.Ec) - L.top);
  ctx.fillStyle = hi === 'vb' ? 'rgba(248,113,113,0.32)' : 'rgba(153,27,27,0.16)';
  ctx.fillRect(box.x, L.yOf(L.Ev), box.w, L.bot - L.yOf(L.Ev));
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2 * d;
  ctx.beginPath();
  ctx.moveTo(box.x + 8 * d, L.yOf(L.Ec));
  ctx.lineTo(box.x + box.w - 8 * d, L.yOf(L.Ec));
  ctx.stroke();
  ctx.strokeStyle = '#f87171';
  ctx.beginPath();
  ctx.moveTo(box.x + 8 * d, L.yOf(L.Ev));
  ctx.lineTo(box.x + box.w - 8 * d, L.yOf(L.Ev));
  ctx.stroke();
  if (hi === 'eg') {
    ctx.strokeStyle = '#fbbf24';
    ctx.setLineDash([4 * d, 3 * d]);
    ctx.beginPath();
    ctx.moveTo(box.x + 16 * d, L.yOf(L.Ev));
    ctx.lineTo(box.x + 16 * d, L.yOf(L.Ec));
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function dashLevel(ctx, L, E, color, label, d, glow) {
  ctx.strokeStyle = color;
  ctx.lineWidth = (glow ? 3.2 : 1.6) * d;
  ctx.setLineDash([6 * d, 4 * d]);
  ctx.shadowColor = glow ? color : 'transparent';
  ctx.shadowBlur = glow ? 12 * d : 0;
  ctx.beginPath();
  ctx.moveTo(L.box.x + 8 * d, L.yOf(E));
  ctx.lineTo(L.box.x + L.box.w - 8 * d, L.yOf(E));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(label, L.box.x + L.box.w - 10 * d, L.yOf(E) - 4 * d);
}

export function labelEnergy(ctx, x, y, text, color, d) {
  ctx.fillStyle = color;
  ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

export function drawPhoton(ctx, x, y, color, d, phase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6 * d;
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const px = (t - 0.5) * 28 * d;
    const py = Math.sin(t * Math.PI * 4 + phase) * 5 * d;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawEk(ctx, box, Eg, gap, EF, d, hi) {
  const mid = box.x + box.w * 0.18;
  const y0 = box.y + box.h * 0.72;
  const yScale = box.h * 0.42 / Math.max(Eg, 0.4);
  ctx.strokeStyle = 'rgba(148,163,184,0.35)';
  ctx.lineWidth = 1 * d;
  ctx.beginPath();
  ctx.moveTo(box.x + 8 * d, y0);
  ctx.lineTo(box.x + box.w - 8 * d, y0);
  ctx.moveTo(mid, box.y + 8 * d);
  ctx.lineTo(mid, box.y + box.h - 8 * d);
  ctx.stroke();
  const kOff = gap === 'direct' ? 0 : 0.55 * box.w;
  ctx.strokeStyle = hi === 'vb' ? '#fda4af' : '#f87171';
  ctx.lineWidth = 2 * d;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const k = (i / 40 - 0.5);
    const x = mid + k * box.w * 0.85;
    const y = y0 - (-0.12 * Eg - 0.55 * k * k * Eg) * yScale;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = hi === 'cb' ? '#67e8f9' : '#22d3ee';
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const k = (i / 40 - 0.5);
    const x = mid + k * box.w * 0.85;
    const kk = gap === 'direct' ? k : k - 0.32;
    const y = y0 - (Eg + 0.7 * kk * kk * Eg) * yScale;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  if (EF != null) {
    ctx.strokeStyle = '#fbbf24';
    ctx.setLineDash([4 * d, 3 * d]);
    ctx.beginPath();
    ctx.moveTo(box.x + 10 * d, y0 - EF * yScale);
    ctx.lineTo(box.x + box.w - 10 * d, y0 - EF * yScale);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = '#94a3b8';
  ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(gap === 'direct' ? 'direct · Γ' : 'indirect · min off Γ', box.x + box.w / 2, box.y + box.h - 6 * d);
  ctx.fillText('k', box.x + box.w - 14 * d, y0 + 12 * d);
}

export function spectrumBar(ctx, x, y, w, h, d, markNm, absorbedBelow) {
  for (let i = 0; i < w; i++) {
    const lam = 380 + (i / w) * (750 - 380);
    ctx.fillStyle = wavelengthCss(lam);
    ctx.fillRect(x + i, y, 1.2, h);
  }
  if (markNm != null && markNm >= 380 && markNm <= 750) {
    const mx = x + ((markNm - 380) / 370) * w;
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2 * d;
    ctx.beginPath();
    ctx.moveTo(mx, y - 4 * d);
    ctx.lineTo(mx, y + h + 4 * d);
    ctx.stroke();
  }
  if (absorbedBelow != null) {
    const cut = Math.max(380, Math.min(750, absorbedBelow));
    const cx = x + ((cut - 380) / 370) * w;
    ctx.fillStyle = 'rgba(15,23,42,0.45)';
    ctx.fillRect(x, y, cx - x, h);
  }
}

function wavelengthCss(nm) {
  if (nm < 440) return `rgb(${Math.round(255 * (440 - nm) / 60)},0,255)`;
  if (nm < 490) return `rgb(0,${Math.round(255 * (nm - 440) / 50)},255)`;
  if (nm < 510) return `rgb(0,255,${Math.round(255 * (510 - nm) / 20)})`;
  if (nm < 580) return `rgb(${Math.round(255 * (nm - 510) / 70)},255,0)`;
  if (nm < 645) return `rgb(255,${Math.round(255 * (645 - nm) / 65)},0)`;
  return 'rgb(255,30,0)';
}
