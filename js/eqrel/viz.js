/**
 * Physical / mathematical canvases. They read EqState.snap() and a highlight id.
 */
import { sizeCanvas, clear, drawPhoton, spectrumBar, dashLevel, drawEk } from '../hw/hw2/draw.js';
import { fermiCurve, wavelengthColor, lambdaG } from '../hw/hw2/physics.js';
import { sci } from './state.js';

function yOfFactory(top, bot, Ev, Ec) {
  const lo = Ev - 0.12 * (Ec - Ev);
  const hi = Ec + 0.12 * (Ec - Ev);
  return (E) => bot - ((E - lo) / (hi - lo)) * (bot - top);
}

function bands(ctx, x, y, w, h, s, d, hi) {
  const top = y + 18 * d;
  const bot = y + h - 16 * d;
  const yOf = yOfFactory(top, bot, s.Ev, s.Ec);
  ctx.fillStyle = hi === 'n' || hi === 'EC' ? 'rgba(34,211,238,0.28)' : 'rgba(2,132,199,0.16)';
  ctx.fillRect(x, top, w, Math.max(4, yOf(s.Ec) - top));
  ctx.fillStyle = hi === 'p' || hi === 'EV' ? 'rgba(248,113,113,0.30)' : 'rgba(153,27,27,0.16)';
  ctx.fillRect(x, yOf(s.Ev), w, Math.max(4, bot - yOf(s.Ev)));
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2 * d;
  ctx.beginPath();
  ctx.moveTo(x + 6 * d, yOf(s.Ec));
  ctx.lineTo(x + w - 6 * d, yOf(s.Ec));
  ctx.stroke();
  ctx.strokeStyle = '#f87171';
  ctx.beginPath();
  ctx.moveTo(x + 6 * d, yOf(s.Ev));
  ctx.lineTo(x + w - 6 * d, yOf(s.Ev));
  ctx.stroke();
  dashLevel(ctx, { box: { x, w }, yOf }, s.Ei, '#c4b5fd', 'Ei', d, hi === 'Ei');
  dashLevel(ctx, { box: { x, w }, yOf }, s.EF, '#fbbf24', 'EF', d, hi === 'EF');
  if (hi === 'Eg') {
    ctx.strokeStyle = '#fbbf24';
    ctx.setLineDash([4 * d, 3 * d]);
    ctx.beginPath();
    ctx.moveTo(x + 14 * d, yOf(s.Ev));
    ctx.lineTo(x + 14 * d, yOf(s.Ec));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = '#94a3b8';
  ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Ec', x + 8 * d, yOf(s.Ec) - 4 * d);
  ctx.fillText('Ev', x + 8 * d, yOf(s.Ev) + 14 * d);
  return { yOf, top, bot };
}

function bar(ctx, x, y, w, h, frac, color, label, value, d) {
  ctx.fillStyle = 'rgba(15,23,42,0.65)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(2, w * Math.min(1, frac)), h);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(`${label}  ${value}`, x, y - 6 * d);
}

function logFrac(v, lo, hi) {
  const a = Math.log10(Math.max(v, lo));
  return (a - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo));
}

export class EqViz {
  constructor(root, state, onDragEF) {
    this.root = root;
    this.state = state;
    this.onDragEF = onDragEF;
    this.mode = 'fermi';
    this.hi = null;
    this.compare = null;
    this.phase = 0;
    this.root.innerHTML = '<canvas class="eq-viz-cv"></canvas><p class="eq-viz-cap" data-cap></p>';
    this.cv = this.root.querySelector('canvas');
    this.cap = this.root.querySelector('[data-cap]');
    this.cv.addEventListener('pointerdown', (e) => this._ptr(e, true));
    this.cv.addEventListener('pointermove', (e) => { if (e.buttons) this._ptr(e, false); });
    this._loop = this._loop.bind(this);
    this.raf = requestAnimationFrame(this._loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.root.innerHTML = '';
  }

  setMode(mode) { this.mode = mode; this.draw(); }
  highlight(id) { this.hi = id; this.draw(); }
  setCompare(pair) { this.compare = pair; this.draw(); }

  _loop(t) {
    this.phase = t / 400;
    if (this.mode === 'photon' || this.mode === 'drift') this.draw();
    this.raf = requestAnimationFrame(this._loop);
  }

  _ptr(e, down) {
    if (this.mode !== 'fermi' && this.mode !== 'mass-action' && this.mode !== 'boltzmann') return;
    const r = this.cv.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (x > 0.52) return;
    const s = this.state.snap();
    const y = (e.clientY - r.top) / r.height;
    const EF = (1 - y) * (s.m.Eg + 0.24 * s.m.Eg) - 0.12 * s.m.Eg;
    this.onDragEF && this.onDragEF(EF);
    if (down) this.cv.setPointerCapture(e.pointerId);
  }

  draw() {
    if (!this.cv) return;
    const { w, h, dpr: d } = sizeCanvas(this.cv);
    const ctx = this.cv.getContext('2d');
    clear(ctx, w, h);
    const s = this.state.snap();
    const fn = this[`_draw_${this.mode.replace(/-/g, '_')}`] || this._draw_fermi;
    fn.call(this, ctx, w, h, d, s);
  }

  _draw_photon(ctx, w, h, d, s) {
    const col = s.color.css;
    const peaks = Math.max(2, Math.min(18, 900 / s.lambda));
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.2 * d;
    ctx.beginPath();
    const y0 = h * 0.32;
    for (let i = 0; i <= 200; i++) {
      const x = (i / 200) * (w - 40 * d) + 20 * d;
      const y = y0 + Math.sin(i / 200 * peaks * Math.PI * 2 + this.phase) * 28 * d;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    drawPhoton(ctx, w * 0.18, h * 0.58, col, d, this.phase);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `${13 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`λ = ${s.lambda.toFixed(0)} nm · ${s.color.name}`, 20 * d, h * 0.62);
    ctx.fillText(`f = c/λ  →  more peaks/sec when λ shrinks`, 20 * d, h * 0.70);
    ctx.fillText(`E = hc/λ = ${s.Eph.toFixed(3)} eV`, 20 * d, h * 0.78);
    ctx.fillText(`Eg = ${s.m.Eg.toFixed(2)} eV · λg = ${s.lg.toFixed(0)} nm · ${s.abs ? 'absorbed' : 'too cheap to absorb'}`, 20 * d, h * 0.86);
    const eMax = 4;
    ctx.fillStyle = 'rgba(251,191,36,0.15)';
    ctx.fillRect(w * 0.55, h * 0.52, w * 0.4, 18 * d);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(w * 0.55, h * 0.52, w * 0.4 * Math.min(1, s.Eph / eMax), 18 * d);
    spectrumBar(ctx, 20 * d, h - 28 * d, w - 40 * d, 14 * d, d, s.lambda, s.lg);
    this.cap.textContent = 'Shorter λ packs more oscillations into the same speed, so each photon is more energetic. λ belongs in the denominator.';
  }

  _draw_mass_action(ctx, w, h, d, s) {
    const L = bands(ctx, 16 * d, 8 * d, w * 0.46, h - 16 * d, s, d, this.hi);
    const nDots = Math.min(28, 2 + Math.round(6 * Math.log10(Math.max(s.n, 1))));
    const pDots = Math.min(28, 2 + Math.round(6 * Math.log10(Math.max(s.p, 1))));
    for (let i = 0; i < nDots; i++) {
      ctx.fillStyle = this.hi === 'n' ? '#67e8f9' : '#22d3ee';
      ctx.beginPath();
      ctx.arc(40 * d + (i % 7) * 14 * d, L.yOf(s.Ec) - 10 * d - Math.floor(i / 7) * 12 * d, 3.2 * d, 0, 6.3);
      ctx.fill();
    }
    for (let i = 0; i < pDots; i++) {
      ctx.strokeStyle = this.hi === 'p' ? '#fda4af' : '#fb7185';
      ctx.lineWidth = 2 * d;
      ctx.beginPath();
      ctx.arc(40 * d + (i % 7) * 14 * d, L.yOf(s.Ev) + 14 * d + Math.floor(i / 7) * 12 * d, 3.2 * d, 0, 6.3);
      ctx.stroke();
    }
    const x0 = w * 0.54;
    bar(ctx, x0, 48 * d, w * 0.4, 22 * d, logFrac(s.n, 1e6, 1e20), '#22d3ee', 'n', sci(s.n) + ' cm⁻³', d);
    bar(ctx, x0, 110 * d, w * 0.4, 22 * d, logFrac(s.p, 1e6, 1e20), '#fb7185', 'p', sci(s.p) + ' cm⁻³', d);
    const ratio = s.np / Math.max(s.ni2, 1e-30);
    bar(ctx, x0, 172 * d, w * 0.4, 22 * d, Math.min(1, 0.5 + 0.5 * Math.log10(Math.max(ratio, 1e-6))), '#fbbf24', 'n × p  vs  ni²', `${sci(s.np)}  /  ${sci(s.ni2)}`, d);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `${12 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(`EF − Ei = ${(s.dEF || 0) >= 0 ? '+' : ''}${(s.dEF || 0).toFixed(3)} eV`, x0, 230 * d);
    ctx.fillText('Drag EF on the band diagram.', x0, 250 * d);
    ctx.fillText('Exponents cancel. The product should sit still.', x0, 270 * d);
    this.cap.textContent = 'Raise EF: n explodes, p collapses. Their product stays ni² at this T and material.';
  }

  _draw_boltzmann(ctx, w, h, d, s) {
    bands(ctx, 16 * d, 8 * d, w * 0.4, h - 16 * d, s, d, this.hi);
    const x0 = w * 0.48;
    const plotW = w * 0.48;
    const plotH = h - 50 * d;
    const y0 = 24 * d;
    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.strokeRect(x0, y0, plotW, plotH);
    const dEF0 = s.dEF || 0;
    ctx.beginPath();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2 * d;
    for (let i = 0; i <= 80; i++) {
      const u = (i / 80) * 0.7 * s.m.Eg - 0.35 * s.m.Eg;
      const n = s.ni * Math.exp(u / Math.max(s.kt, 1e-12));
      const x = x0 + (i / 80) * plotW;
      const y = y0 + plotH - logFrac(n, s.ni / 1e6, s.ni * 1e6) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#fb7185';
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const u = (i / 80) * 0.7 * s.m.Eg - 0.35 * s.m.Eg;
      const p = s.ni * Math.exp(-u / Math.max(s.kt, 1e-12));
      const x = x0 + (i / 80) * plotW;
      const y = y0 + plotH - logFrac(p, s.ni / 1e6, s.ni * 1e6) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const ix = x0 + ((dEF0 + 0.35 * s.m.Eg) / (0.7 * s.m.Eg)) * plotW;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(ix, y0 + plotH - logFrac(s.n, s.ni / 1e6, s.ni * 1e6) * plotH, 4 * d, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('log n (cyan) and log p (crimson) vs EF−Ei', x0, h - 10 * d);
    this.cap.textContent = 'Same Boltzmann tail, two references: Ec versus Ei. They are rewrites, not two physics stories.';
  }

  _draw_fermi(ctx, w, h, d, s) {
    const mid = w * 0.5;
    bands(ctx, 12 * d, 8 * d, mid - 24 * d, h - 16 * d, s, d, this.hi);
    const curve = fermiCurve(s.EF, s.T, s.Ev, s.Ec, 220);
    const x0 = mid + 10 * d;
    const pw = w - x0 - 16 * d;
    const top = 20 * d;
    const bot = h - 20 * d;
    const yOf = yOfFactory(top, bot, s.Ev, s.Ec);
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.strokeRect(x0, top, pw, bot - top);
    ctx.beginPath();
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2.2 * d;
    curve.E.forEach((E, i) => {
      const x = x0 + curve.f[i] * pw;
      const y = yOf(E);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x0 + 0.5 * pw - 1, top, 2, bot - top);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`f(EF)=0.5 · T=${s.T.toFixed(0)} K · kT=${(s.kt * 1000).toFixed(1)} meV`, x0, 16 * d);
    ctx.fillText(`f(Ec)=${s.fEc.toExponential(2)}   f(probe)=${s.fE.toFixed(3)}`, x0, bot + 14 * d);
    this.cap.textContent = 'f is a probability. n still needs the density of states. Drag EF and watch the curve slide.';
  }

  _draw_conductivity(ctx, w, h, d, s) {
    const tot = Math.max(s.sigma, 1e-20);
    bar(ctx, 40 * d, 50 * d, w - 80 * d, 26 * d, s.sigE / tot, '#22d3ee', 'electron channel q n μn', sci(s.sigE), d);
    bar(ctx, 40 * d, 120 * d, w - 80 * d, 26 * d, s.sigH / tot, '#fb7185', 'hole channel q p μp', sci(s.sigH), d);
    bar(ctx, 40 * d, 190 * d, w - 80 * d, 26 * d, 1, '#34d399', 'σ = sum', sci(s.sigma) + ' S/cm', d);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `${12 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(`n=${sci(s.n)}   μn=${s.mun}    p=${sci(s.p)}   μp=${s.mup}`, 40 * d, 250 * d);
    ctx.fillText('T is not in the formula. It still moves n, p, and μ. That is an indirect path.', 40 * d, 274 * d);
    ctx.fillText(s.n > 10 * s.p ? 'Limit in view: n ≫ p so σ ≈ q n μn.' : s.p > 10 * s.n ? 'Limit in view: p ≫ n so σ ≈ q p μp.' : 'Both channels matter.', 40 * d, 298 * d);
    this.cap.textContent = 'Charge × population × mobility, then add the two fluids. Multiplication is scaling. Addition is two parallel currents.';
  }

  _draw_resistivity(ctx, w, h, d, s) {
    const x0 = 50 * d;
    const y0 = 30 * d;
    const pw = (w - 80 * d) / 2 - 16 * d;
    const ph = h - 70 * d;
    const Emax = 400;
    const Jmax = s.sigma * Emax * 1.05 || 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${12 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText('J = σE', x0, 22 * d);
    ctx.fillText('E = ρJ', x0 + pw + 32 * d, 22 * d);
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.strokeRect(x0, y0, pw, ph);
    ctx.strokeRect(x0 + pw + 32 * d, y0, pw, ph);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2 * d;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + ph);
    ctx.lineTo(x0 + pw, y0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0 + pw + 32 * d, y0 + ph);
    ctx.lineTo(x0 + 2 * pw + 32 * d, y0);
    ctx.stroke();
    const J = s.J;
    const E = s.Efield;
    const px = x0 + (E / Emax) * pw;
    const py = y0 + ph - (J / Jmax) * ph;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(px, py, 4 * d, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`σ = ${sci(s.sigma)} S/cm`, x0, h - 12 * d);
    ctx.fillText(`ρ = ${sci(s.rho)} Ω·cm`, x0 + pw + 32 * d, h - 12 * d);
    this.cap.textContent = 'Same material, two sentences. Steep J–E means large σ and therefore small ρ.';
  }

  _draw_niT(ctx, w, h, d, s) {
    const x0 = 50 * d;
    const y0 = 24 * d;
    const pw = w - 70 * d;
    const ph = h - 60 * d;
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.strokeRect(x0, y0, pw, ph);
    const Ts = [];
    const nis = [];
    for (let T = 200; T <= 800; T += 8) {
      Ts.push(T);
      const t = Math.max(T, 1);
      nis.push(s.m.ni300 * (t / 300) ** 1.5 * Math.exp((s.m.Eg / (2 * 8.617333262145e-5)) * (1 / 300 - 1 / t)));
    }
    const lo = Math.min(...nis);
    const hi = Math.max(...nis);
    ctx.beginPath();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2 * d;
    Ts.forEach((T, i) => {
      const x = x0 + ((T - 200) / 600) * pw;
      const y = y0 + ph - logFrac(nis[i], lo / 10, hi * 4) * ph;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    const xNow = x0 + ((s.T - 200) / 600) * pw;
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(xNow, y0 + ph - logFrac(s.ni, lo / 10, hi * 4) * ph, 4 * d, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `${12 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(`ni(${s.T.toFixed(0)} K) = ${sci(s.ni)} cm⁻³   Eg = ${s.m.Eg} eV`, 50 * d, h - 14 * d);
    this.cap.textContent = 'T^{3/2} is a gentle slope. exp(−Eg/2kT) is the cliff. That is why ni is not “linear in T.”';
  }

  _draw_neutrality(ctx, w, h, d, s) {
    bands(ctx, 12 * d, 8 * d, w * 0.42, h - 16 * d, s, d, this.hi);
    const x0 = w * 0.5;
    bar(ctx, x0, 40 * d, w * 0.44, 20 * d, logFrac(s.n, 1e8, 1e20), '#22d3ee', 'n', sci(s.n), d);
    bar(ctx, x0, 90 * d, w * 0.44, 20 * d, logFrac(s.p, 1e8, 1e20), '#fb7185', 'p', sci(s.p), d);
    bar(ctx, x0, 140 * d, w * 0.44, 20 * d, logFrac(Math.max(s.ND, 1), 1e12, 1e20), '#67e8f9', 'ND', sci(s.ND), d);
    bar(ctx, x0, 190 * d, w * 0.44, 20 * d, logFrac(Math.max(s.NA, 1), 1e12, 1e20), '#fda4af', 'NA', sci(s.NA), d);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `${12 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(s.kind, x0, 250 * d);
    ctx.fillStyle = s.nApproxOk || s.pApproxOk ? '#86efac' : '#fde68a';
    ctx.fillText(s.nApproxOk ? 'n ≈ ND is legal here.' : s.pApproxOk ? 'p ≈ NA is legal here.' : 'Use the quadratic. The shortcut is lying.', x0, 272 * d);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
    const lines = s.why.split('. ');
    lines.slice(0, 3).forEach((ln, i) => ctx.fillText(ln + (ln.endsWith('.') ? '' : '.'), x0, 296 * d + i * 16 * d));
    this.cap.textContent = 'Neutrality plus mass action. n = ND is a limit of that pair, not a starting axiom.';
  }

  _draw_drift(ctx, w, h, d, s) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `${13 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(`E = ${s.Efield.toFixed(0)} V/cm`, 24 * d, 28 * d);
    ctx.fillText(`vd,n = μn E = ${sci(s.vdN)} cm/s`, 24 * d, 50 * d);
    ctx.fillText(`Jn = q n vd = ${sci(s.Jn)} A/cm²`, 24 * d, 72 * d);
    const y = h * 0.45;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2 * d;
    ctx.beginPath();
    ctx.moveTo(40 * d, y);
    ctx.lineTo(w - 40 * d, y);
    ctx.stroke();
    const shift = (this.phase * 12 * d) % (40 * d);
    for (let i = 0; i < 8; i++) {
      const x = 60 * d + i * 40 * d + shift;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(x, y - 18 * d, 4 * d, 0, 6.3);
      ctx.fill();
      ctx.strokeStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(x - 10 * d, y + 18 * d, 4 * d, 0, 6.3);
      ctx.stroke();
    }
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Electrons drift against E. Holes drift with E. Conventional J adds.', 24 * d, h - 20 * d);
    this.cap.textContent = 'Current is charge × count × speed. Mobility is the leftover speed per field after scattering.';
  }

  _draw_compare(ctx, w, h, d, s) {
    const pair = this.compare || { a: 'Eg', b: 'lg' };
    const pts = this._pairPoints(pair, s);
    const x0 = 48 * d;
    const y0 = 20 * d;
    const pw = w - 70 * d;
    const ph = h - 50 * d;
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.strokeRect(x0, y0, pw, ph);
    if (!pts.length) {
      this.cap.textContent = 'Pick two variables.';
      return;
    }
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);
    const ymin = Math.min(...ys);
    const ymax = Math.max(...ys);
    const logY = ymax / Math.max(ymin, 1e-30) > 50;
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * d;
    pts.forEach((p, i) => {
      const x = x0 + ((p.x - xmin) / (xmax - xmin || 1)) * pw;
      const y = logY
        ? y0 + ph - logFrac(p.y, Math.max(ymin, 1e-30), ymax) * ph
        : y0 + ph - ((p.y - ymin) / (ymax - ymin || 1)) * ph;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(`${pair.a} →`, x0, h - 10 * d);
    ctx.textAlign = 'right';
    ctx.fillText(pair.b, w - 16 * d, y0 + 12 * d);
    this.cap.textContent = pair.note || '';
  }

  _pairPoints(pair, s) {
    const a = pair.a;
    const b = pair.b;
    const pts = [];
    if (a === 'Eg' && b === 'lg') {
      for (let Eg = 0.3; Eg <= 2.6; Eg += 0.05) pts.push({ x: Eg, y: lambdaG(Eg) });
    } else if (a === 'EF' && (b === 'n' || b === 'p')) {
      for (let u = -0.35 * s.m.Eg; u <= 0.35 * s.m.Eg; u += 0.01 * s.m.Eg) {
        const n = s.ni * Math.exp(u / Math.max(s.kt, 1e-12));
        pts.push({ x: u, y: b === 'n' ? n : (s.ni * s.ni) / n });
      }
    } else if (a === 'T' && b === 'ni') {
      for (let T = 200; T <= 700; T += 8) {
        const t = Math.max(T, 1);
        const ni = s.m.ni300 * (t / 300) ** 1.5 * Math.exp((s.m.Eg / (2 * 8.617333262145e-5)) * (1 / 300 - 1 / t));
        pts.push({ x: T, y: ni });
      }
    } else if (a === 'n' && b === 'sigma') {
      for (let k = 0; k <= 40; k++) {
        const n = s.n * (0.2 + 2.5 * k / 40);
        const sig = 1.602176634e-19 * (n * s.mun + s.p * s.mup);
        pts.push({ x: n, y: sig });
      }
    } else if (a === 'mun' && b === 'sigma') {
      for (let k = 0; k <= 40; k++) {
        const mu = 50 + k * 200;
        pts.push({ x: mu, y: 1.602176634e-19 * (s.n * mu + s.p * s.mup) });
      }
    } else if (a === 'Eg' && b === 'ni') {
      for (let Eg = 0.3; Eg <= 2.4; Eg += 0.05) {
        const ni = s.m.ni300 * Math.exp((s.m.Eg / (2 * s.kt) - Eg / (2 * s.kt)));
        pts.push({ x: Eg, y: Math.max(ni, 1e-6) });
      }
    } else if (a === 'T' && b === 'sigma') {
      for (let T = 200; T <= 700; T += 10) {
        const t = Math.max(T, 1);
        const ni = s.m.ni300 * (t / 300) ** 1.5 * Math.exp((s.m.Eg / (2 * 8.617333262145e-5)) * (1 / 300 - 1 / t));
        const net = s.ND - s.NA;
        const n = net / 2 + Math.hypot(net / 2, ni);
        const p = (ni * ni) / n;
        pts.push({ x: T, y: 1.602176634e-19 * (n * s.mun + p * s.mup) });
      }
    } else if (a === 'T' && b === 'f') {
      for (let T = 20; T <= 600; T += 10) {
        const x = (s.Epr - s.EF) / Math.max(8.617333262145e-5 * T, 1e-12);
        const f = x > 40 ? 0 : x < -40 ? 1 : 1 / (1 + Math.exp(x));
        pts.push({ x: T, y: f });
      }
    }
    return pts;
  }

  _draw_exp(ctx, w, h, d) {
    const x0 = 50 * d;
    const y0 = 24 * d;
    const pw = w - 80 * d;
    const ph = h - 70 * d;
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.strokeRect(x0, y0, pw, ph);
    ctx.beginPath();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2 * d;
    for (let i = 0; i <= 80; i++) {
      const u = (i / 80) * 8;
      const x = x0 + (i / 80) * pw;
      const y = y0 + ph - Math.exp(-u) * ph * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `${12 * d}px "IBM Plex Sans", sans-serif`;
    [0, 1, 2, 3, 5].forEach((k, i) => {
      ctx.fillText(`ΔE = ${k} kT  →  e^{−ΔE/kT} = ${Math.exp(-k).toFixed(3)}`, x0, y0 + 20 * d + i * 18 * d);
    });
    this.cap.textContent = 'kT is the thermal yardstick. Gaps of several kT are exponentially shut.';
  }
}

export function vizForEquation(eq) {
  return eq?.viz || 'fermi';
}

export { wavelengthColor };
