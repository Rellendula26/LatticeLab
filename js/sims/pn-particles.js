import { PN } from '../physics/pn-junction.js';

const TIPS = [
  { id: 'p-bulk', test: (x, y, s, map) => map.xToCm(x) < -s.xp && y > 18, text: 'Diffusion gradient — holes are majority here. They wander toward the n-side where they are scarce.' },
  { id: 'n-bulk', test: (x, y, s, map) => map.xToCm(x) > s.xn && y > 18, text: 'Diffusion gradient — electrons are majority here. They wander toward the p-side until the built-in field turns them around.' },
  { id: 'dep', test: (x, y, s, map) => { const xc = map.xToCm(x); return xc >= -s.xp && xc <= s.xn; }, text: 'Uncovered ion — this strip is empty of mobile charge, not of charge. The ionized donors (+) and acceptors (−) are the space charge that builds E.' },
  { id: 'field', test: (x, y, s, map) => { const xc = map.xToCm(x); return y < 36 && xc >= -s.xp && xc <= s.xn; }, text: 'Drift force — E points from N to P. Electrons (negative) are pushed toward N; holes toward P. Drift cancels diffusion at equilibrium.' },
  { id: 'recomb', test: (x, y, s, map, sim) => sim.flashes.some((f) => (f.x - x) ** 2 + (f.y - y) ** 2 < 400), text: 'Recombination — an electron fills a hole. Both mobile charges vanish. The ions they had screened stay uncovered, widening the depletion zone.' },
];

export class ParticleViewport {
  constructor(canvas, tipEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tipEl = tipEl;
    this.playing = true;
    this.tutorial = -1;
    this.ions = [];
    this.electrons = [];
    this.holes = [];
    this.flashes = [];
    this.state = null;
    this._dpr = 1;
    this._hover = null;
    canvas.addEventListener('pointermove', (e) => this._onMove(e));
    canvas.addEventListener('pointerleave', () => this._hideTip());
  }

  setState(s) {
    const prev = this.state;
    this.state = s;
    if (!prev || prev.NA !== s.NA || prev.ND !== s.ND || Math.abs(prev.W - s.W) > 0.08 * s.W) {
      this._seedIons();
      this._seedCarriers(true);
    } else if (prev.Va !== s.Va || prev.T !== s.T) {
      this._seedCarriers(false);
    }
  }

  reset() {
    this.tutorial = -1;
    this.playing = true;
    this.flashes = [];
    if (this.state) {
      this._seedIons();
      this._seedCarriers(true);
    }
  }

  togglePlay() {
    if (this.tutorial >= 0) this.tutorial = -1;
    this.playing = !this.playing;
    return this.playing;
  }

  stepTutorial() {
    this.playing = false;
    this.tutorial = Math.min(this.tutorial + 1, 4);
    this._seedIons();
    this._seedCarriers(true);
    if (this.tutorial >= 3) this.playing = true;
    return this.tutorial;
  }

  stepFrame() {
    this.playing = false;
    this.tick(1 / 30);
    this.draw();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(rect.width * this._dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * this._dpr));
  }

  map() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const L = this.state.L;
    return {
      w, h,
      xOf: (cm) => ((cm + L) / (2 * L)) * w,
      xToCm: (px) => (px / w) * 2 * L - L,
      yRand: () => 28 * this._dpr + Math.random() * (h - 48 * this._dpr),
    };
  }

  _count(logN) {
    return Math.round(10 + 18 * (logN - 14) / 4);
  }

  _seedIons() {
    const s = this.state;
    const m = this.map();
    const nP = this._count(Math.log10(s.NA));
    const nN = this._count(Math.log10(s.ND));
    this.ions = [];
    for (let i = 0; i < nP; i++) {
      const x = -s.L + Math.random() * s.L;
      this.ions.push({ x, y: m.yRand(), sign: -1 });
    }
    for (let i = 0; i < nN; i++) {
      const x = Math.random() * s.L;
      this.ions.push({ x, y: m.yRand(), sign: 1 });
    }
  }

  _seedCarriers(full) {
    const s = this.state;
    const m = this.map();
    const nE = this._count(Math.log10(s.ND));
    const nH = this._count(Math.log10(s.NA));
    const inj = Math.max(0, Math.min(18, Math.round(6 * Math.exp(Math.min(s.Va, 0.7) / Math.max(s.Vt, 0.01)) / 8)));
    const mk = (side) => ({
      x: side === 'n' ? s.xn + Math.random() * (s.L - s.xn) : -s.L + Math.random() * (s.L - s.xp),
      y: m.yRand(),
      vx: (Math.random() - 0.5) * 2.4e-4,
      vy: (Math.random() - 0.5) * 1.6e-4,
    });
    if (full || this.electrons.length === 0) {
      this.electrons = [];
      for (let i = 0; i < nE; i++) this.electrons.push(mk('n'));
      const nMin = 2 + (s.bias === 'forward' ? inj : 0);
      for (let i = 0; i < nMin; i++) this.electrons.push(mk('p'));
    }
    if (full || this.holes.length === 0) {
      this.holes = [];
      for (let i = 0; i < nH; i++) this.holes.push(mk('p'));
      const pMin = 2 + (s.bias === 'forward' ? inj : 0);
      for (let i = 0; i < pMin; i++) this.holes.push(mk('n'));
    }
  }

  tick(dt) {
    const s = this.state;
    if (!s) return;
    const m = this.map();
    const tutorial = this.tutorial;
    const driftOn = tutorial < 0 || tutorial >= 3;
    const diffuseOn = tutorial !== 0;
    const recombOn = tutorial < 0 || tutorial >= 2;

    const move = (p, charge) => {
      if (diffuseOn) {
        p.x += (Math.random() - 0.5) * 0.28 * s.L * dt;
        p.y += (Math.random() - 0.5) * 55 * this._dpr * dt;
      }
      const Emag = driftOn ? this._fieldAt(p.x, s) : 0;
      const Enorm = s.Emax > 0 ? Emag / s.Emax : 0;
      p.x += (-charge) * Enorm * 0.7 * s.L * dt;
      if (p.x < -s.L) p.x = -s.L + 1e-9;
      if (p.x > s.L) p.x = s.L - 1e-9;
      const y0 = 22 * this._dpr;
      const y1 = m.h - 14 * this._dpr;
      if (p.y < y0) p.y = y0;
      if (p.y > y1) p.y = y1;
    };

    this.electrons.forEach((p) => move(p, -1));
    this.holes.forEach((p) => move(p, 1));

    if (recombOn) this._recombine(m);

    this.flashes = this.flashes.filter((f) => {
      f.life -= dt;
      return f.life > 0;
    });
  }

  _fieldAt(x, s) {
    if (x <= -s.xp || x >= s.xn) return 0;
    if (x < 0) return (PN.Q * s.NA / s.eps) * (x + s.xp);
    return (PN.Q * s.ND / s.eps) * (s.xn - x);
  }

  _recombine(m) {
    const r2 = (9 * this._dpr) ** 2;
    for (let i = this.electrons.length - 1; i >= 0; i--) {
      const e = this.electrons[i];
      for (let j = this.holes.length - 1; j >= 0; j--) {
        const h = this.holes[j];
        const dx = m.xOf(e.x) - m.xOf(h.x);
        const dy = e.y - h.y;
        if (dx * dx + dy * dy < r2) {
          this.flashes.push({ x: m.xOf(e.x), y: e.y, life: 0.35 });
          this.electrons.splice(i, 1);
          this.holes.splice(j, 1);
          this.electrons.push({
            x: this.state.xn + Math.random() * (this.state.L - this.state.xn),
            y: m.yRand(), vx: 0, vy: 0,
          });
          this.holes.push({
            x: -this.state.L + Math.random() * (this.state.L - this.state.xp),
            y: m.yRand(), vx: 0, vy: 0,
          });
          return;
        }
      }
    }
  }

  draw() {
    const s = this.state;
    const ctx = this.ctx;
    const { w, h, xOf } = this.map();
    ctx.clearRect(0, 0, w, h);

    const xj = xOf(0);
    const xp = xOf(-s.xp);
    const xn = xOf(s.xn);

    const pGrad = ctx.createLinearGradient(0, 0, xj, 0);
    pGrad.addColorStop(0, 'rgba(153,27,27,0.28)');
    pGrad.addColorStop(1, 'rgba(153,27,27,0.08)');
    ctx.fillStyle = pGrad;
    ctx.fillRect(0, 0, xj, h);

    const nGrad = ctx.createLinearGradient(xj, 0, w, 0);
    nGrad.addColorStop(0, 'rgba(2,132,199,0.10)');
    nGrad.addColorStop(1, 'rgba(2,132,199,0.30)');
    ctx.fillStyle = nGrad;
    ctx.fillRect(xj, 0, w - xj, h);

    ctx.fillStyle = 'rgba(15,23,42,0.55)';
    ctx.fillRect(xp, 0, Math.max(2, xn - xp), h);

    ctx.fillStyle = 'rgba(251,191,36,0.12)';
    ctx.fillRect(xp, 0, 2 * this._dpr, h);
    ctx.fillRect(xn, 0, 2 * this._dpr, h);

    this._label(ctx, 'p-type', 16 * this._dpr, 18 * this._dpr, '#fca5a5');
    this._label(ctx, 'n-type', w - 16 * this._dpr, 18 * this._dpr, '#7dd3fc', true);
    this._label(ctx, 'depletion', (xp + xn) / 2, 18 * this._dpr, '#fde68a', true);

    const showField = this.tutorial < 0 || this.tutorial >= 3;
    if (showField) this._arrows(ctx, xp, xn, h, s);

    this.ions.forEach((ion) => {
      const px = xOf(ion.x);
      const uncovered = ion.x >= -s.xp && ion.x <= s.xn && this.tutorial !== 0 && this.tutorial !== 1;
      const a = uncovered ? 0.85 : 0.22;
      this._ion(ctx, px, ion.y, ion.sign, a);
    });

    this.electrons.forEach((p) => this._electron(ctx, xOf(p.x), p.y));
    this.holes.forEach((p) => this._hole(ctx, xOf(p.x), p.y));

    this.flashes.forEach((f) => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, 10 * this._dpr * (0.3 + f.life), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(251,191,36,${Math.max(0, f.life * 2)})`;
      ctx.fill();
    });
  }

  _arrows(ctx, xp, xn, h, s) {
    const n = 5;
    const midY = h * 0.52;
    const scale = 18 * this._dpr * Math.min(1.6, 0.35 + s.Emax / 8e4);
    for (let i = 1; i < n; i++) {
      const x = xp + (xn - xp) * (i / n);
      ctx.strokeStyle = 'rgba(251,191,36,0.85)';
      ctx.fillStyle = 'rgba(251,191,36,0.85)';
      ctx.lineWidth = 1.6 * this._dpr;
      ctx.beginPath();
      ctx.moveTo(x + scale * 0.55, midY);
      ctx.lineTo(x - scale * 0.55, midY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - scale * 0.55, midY);
      ctx.lineTo(x - scale * 0.25, midY - 5 * this._dpr);
      ctx.lineTo(x - scale * 0.25, midY + 5 * this._dpr);
      ctx.closePath();
      ctx.fill();
    }
  }

  _ion(ctx, x, y, sign, a) {
    const r = 7 * this._dpr;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = sign > 0 ? `rgba(125,211,252,${a})` : `rgba(252,165,165,${a})`;
    ctx.lineWidth = 1.2 * this._dpr;
    ctx.stroke();
    ctx.fillStyle = sign > 0 ? `rgba(125,211,252,${a})` : `rgba(252,165,165,${a})`;
    ctx.font = `${10 * this._dpr}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sign > 0 ? '+' : '−', x, y + 0.5);
  }

  _electron(ctx, x, y) {
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8 * this._dpr;
    ctx.beginPath();
    ctx.arc(x, y, 4.6 * this._dpr, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.restore();
  }

  _hole(ctx, x, y) {
    ctx.save();
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 8 * this._dpr;
    ctx.beginPath();
    ctx.arc(x, y, 4.2 * this._dpr, 0, Math.PI * 2);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.8 * this._dpr;
    ctx.stroke();
    ctx.restore();
  }

  _label(ctx, text, x, y, color, center) {
    ctx.fillStyle = color;
    ctx.font = `${11 * this._dpr}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = center ? 'center' : 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  _onMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * this._dpr;
    const y = (e.clientY - rect.top) * this._dpr;
    const s = this.state;
    const map = this.map();
    const hit = TIPS.find((t) => t.test(x, y, s, map, this));
    if (!hit) {
      this._hideTip();
      return;
    }
    this.tipEl.textContent = hit.text;
    this.tipEl.classList.remove('hidden');
    this.tipEl.style.left = `${Math.min(rect.width - 260, Math.max(8, e.clientX - rect.left + 12))}px`;
    this.tipEl.style.top = `${Math.min(rect.height - 90, Math.max(8, e.clientY - rect.top + 12))}px`;
  }

  _hideTip() {
    this.tipEl.classList.add('hidden');
  }
}

export const TUTORIAL_COPY = [
  'Step 1 · Neutral crystals. Majority carriers fill each side. The junction has not yet been allowed to mix.',
  'Step 2 · Diffusion. Electrons wander left, holes wander right — down their concentration gradients.',
  'Step 3 · Recombination. Carriers that meet annihilate and uncover the dopant ions they were screening.',
  'Step 4 · Space charge. Uncovered N⁺ and P⁻ build a field from N toward P. Drift now fights diffusion.',
  'Step 5 · Equilibrium. Diffusion current = drift current. E_F is one flat line. Play to keep watching thermal motion.',
];
