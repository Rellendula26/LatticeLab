/**
 * Junction slice + formation timeline. Particle counts are visual, not 10^16 dots.
 */

export const FORM = [
  { t: 'Step 0 · Isolated crystals', c: 'Neutral p-type on the left, n-type on the right. Mobile carriers still screen the ions. No net field.' },
  { t: 'Step 1 · Contact', c: 'The crystals share an interface. A concentration gradient now exists for both electrons and holes.' },
  { t: 'Step 2 · Holes diffuse P → N', c: 'Holes are majority on the p-side. They wander down their gradient into the n-side.' },
  { t: 'Step 3 · Electrons diffuse N → P', c: 'Electrons do the same in the opposite direction. Both populations leave the junction neighborhood.' },
  { t: 'Step 4 · Ions stay behind', c: 'A− on the p-side and D+ on the n-side are fixed in the lattice. They are no longer screened near the junction.' },
  { t: 'Step 5 · Depletion region', c: 'That uncovered strip is empty of mobile charge, not of charge. It is the depletion region.' },
  { t: 'Step 6 · Field N → P', c: 'Positive space charge on N, negative on P. The field points from N toward P.' },
  { t: 'Step 7 · Drift opposes diffusion', c: 'The field drives holes N → P and electrons P → N. That is drift, opposite to diffusion.' },
  { t: 'Step 8 · Equilibrium', c: 'Diffusion current = drift current. Net current = 0. Carriers are still moving.' },
];

export class JunctionView {
  constructor(canvas, tipEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tipEl = tipEl;
    this.mode = 'live';
    this.formStep = 0;
    this.flow = 'both';
    this.showJ = false;
    this.why = false;
    this.state = null;
    this.electrons = [];
    this.holes = [];
    this.ions = [];
    this._dpr = 1;
    this.onPick = null;
    canvas.addEventListener('pointerdown', (e) => this._click(e));
    canvas.addEventListener('pointermove', (e) => this._move(e));
    canvas.addEventListener('pointerleave', () => {
      if (this.tipEl) this.tipEl.classList.add('hidden');
    });
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(r.width * this._dpr));
    this.canvas.height = Math.max(1, Math.floor(r.height * this._dpr));
    if (this.state) this.seed();
  }

  setState(s) {
    const prev = this.state;
    this.state = s;
    if (!prev || prev.NA !== s.NA || prev.ND !== s.ND || Math.abs(prev.W - s.W) > 0.1 * s.W) this.seed();
  }

  seed() {
    const s = this.state;
    if (!s) return;
    const nP = Math.round(8 + 14 * ((Math.log10(s.NA) - 15) / 3));
    const nN = Math.round(8 + 14 * ((Math.log10(s.ND) - 15) / 3));
    this.ions = [];
    this.electrons = [];
    this.holes = [];
    for (let i = 0; i < nP; i++) this.ions.push({ x: -0.95 + Math.random() * 0.9, y: 0.18 + Math.random() * 0.64, sign: -1 });
    for (let i = 0; i < nN; i++) this.ions.push({ x: 0.05 + Math.random() * 0.9, y: 0.18 + Math.random() * 0.64, sign: 1 });
    const inj = s.bias === 'forward' ? Math.round(6 + 10 * Math.min(1, Math.exp(s.Va / Math.max(s.Vt, 0.02)) / 12)) : 0;
    for (let i = 0; i < nN + inj; i++) this.electrons.push({ x: 0.42 + Math.random() * 0.5, y: 0.2 + Math.random() * 0.6 });
    for (let i = 0; i < nP + inj; i++) this.holes.push({ x: -0.92 + Math.random() * 0.5, y: 0.2 + Math.random() * 0.6 });
    if (s.bias !== 'forward') {
      const nMin = 3;
      for (let i = 0; i < nMin; i++) this.electrons.push({ x: -0.8 + Math.random() * 0.3, y: 0.25 + Math.random() * 0.5 });
      for (let i = 0; i < nMin; i++) this.holes.push({ x: 0.5 + Math.random() * 0.3, y: 0.25 + Math.random() * 0.5 });
    }
  }

  tick(dt) {
    const s = this.state;
    if (!s) return;
    const step = this.mode === 'form' ? this.formStep : 8;
    const fwd = s.bias === 'forward' ? 1 + 4 * Math.min(1, s.Va / 0.6) : 1;
    const rev = s.bias === 'reverse' ? 0.12 : 1;
    const diffOn = this.flow !== 'drift' && step >= 2;
    const driftOn = this.flow !== 'diff' && step >= 7;
    const walk = (arr, kind) => {
      arr.forEach((p) => {
        p.x += (Math.random() - 0.5) * 0.35 * dt;
        p.y += (Math.random() - 0.5) * 0.28 * dt;
        if (diffOn) {
          if (kind === 'h') p.x += 0.08 * fwd * rev * dt;
          else p.x -= 0.08 * fwd * rev * dt;
        }
        if (driftOn && p.x > -0.18 && p.x < 0.18) {
          if (kind === 'h') p.x -= 0.12 * dt;
          else p.x += 0.12 * dt;
        }
        if (this.mode === 'form' && step < 1) {
          if (kind === 'h') p.x = Math.min(p.x, -0.08);
          else p.x = Math.max(p.x, 0.08);
        }
        if (p.x < -0.96) p.x = 0.94;
        if (p.x > 0.96) p.x = -0.94;
        if (p.y < 0.16) p.y = 0.16;
        if (p.y > 0.84) p.y = 0.84;
      });
    };
    walk(this.electrons, 'e');
    walk(this.holes, 'h');
  }

  layout() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const d = this._dpr;
    const pad = 16 * d;
    const gap = this.mode === 'form' && this.formStep < 1 ? 28 * d : 0;
    const box = { x: pad, y: 28 * d, w: w - 2 * pad, h: h - 48 * d };
    const mid = box.x + box.w / 2;
    return { w, h, d, box, mid, gap };
  }

  xOf(frac, L) {
    const { box, mid, gap } = L;
    if (frac < 0) return box.x + (mid - gap / 2 - box.x) * (frac + 1);
    return mid + gap / 2 + (box.x + box.w - mid - gap / 2) * frac;
  }

  draw() {
    const ctx = this.ctx;
    const L = this.layout();
    const s = this.state;
    const d = L.d;
    ctx.clearRect(0, 0, L.w, L.h);
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, L.w, L.h);
    if (!s) return;
    this._crystals(ctx, L, s);
    if (this.formStep >= 4 || this.mode === 'live') this._ions(ctx, L);
    this._carriers(ctx, L);
    if (this.formStep >= 5 || this.mode === 'live') this._depletion(ctx, L, s);
    if (this.formStep >= 6 || this.mode === 'live') this._field(ctx, L, s);
    if (this.mode === 'live' || this.formStep >= 2) this._flowArrows(ctx, L, s);
    if (this.showJ && this.mode === 'live') this._conventional(ctx, L, s);
    this._labels(ctx, L, s);
    if (this.mode === 'form' && this.formStep >= 8) this._eqBanner(ctx, L);
  }

  _crystals(ctx, L, s) {
    const { box, mid, gap, d } = L;
    const left = { x: box.x, y: box.y, w: mid - gap / 2 - box.x, h: box.h };
    const right = { x: mid + gap / 2, y: box.y, w: box.x + box.w - mid - gap / 2, h: box.h };
    ctx.fillStyle = 'rgba(248,113,113,0.10)';
    ctx.beginPath();
    ctx.roundRect(left.x, left.y, left.w, left.h, 14 * d);
    ctx.fill();
    ctx.fillStyle = 'rgba(56,189,248,0.10)';
    ctx.beginPath();
    ctx.roundRect(right.x, right.y, right.w, right.h, 14 * d);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.lineWidth = 1.2 * d;
    ctx.stroke();
    ctx.fillStyle = '#fca5a5';
    ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('P-type', left.x + left.w / 2, box.y - 8 * d);
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('N-type', right.x + right.w / 2, box.y - 8 * d);
    this._left = left;
    this._right = right;
  }

  _depletion(ctx, L, s) {
    const { box, d } = L;
    const xpF = s.xp / s.L;
    const xnF = s.xn / s.L;
    const x0 = this.xOf(-xpF, L);
    const x1 = this.xOf(xnF, L);
    ctx.fillStyle = 'rgba(251,191,36,0.12)';
    ctx.fillRect(x0, box.y, Math.max(2, x1 - x0), box.h);
    ctx.strokeStyle = 'rgba(251,191,36,0.45)';
    ctx.setLineDash([4 * d, 3 * d]);
    ctx.strokeRect(x0, box.y, Math.max(2, x1 - x0), box.h);
    ctx.setLineDash([]);
    ctx.fillStyle = '#fde68a';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('depletion', (x0 + x1) / 2, box.y + 14 * d);
  }

  _ions(ctx, L) {
    const { box, d } = L;
    this.ions.forEach((p) => {
      const x = this.xOf(p.x, L);
      const y = box.y + p.y * box.h;
      ctx.fillStyle = p.sign > 0 ? '#67e8f9' : '#fda4af';
      ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(p.sign > 0 ? '+' : '−', x, y);
    });
  }

  _carriers(ctx, L) {
    const { box, d } = L;
    const hideIonsOnly = this.mode === 'form' && this.formStep < 2;
    this.electrons.forEach((p) => {
      if (hideIonsOnly && p.x < 0 && this.formStep < 3) { /* still show bulk */ }
      const x = this.xOf(p.x, L);
      const y = box.y + p.y * box.h;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, y, 3.2 * d, 0, Math.PI * 2);
      ctx.fill();
    });
    this.holes.forEach((p) => {
      const x = this.xOf(p.x, L);
      const y = box.y + p.y * box.h;
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.5 * d;
      ctx.beginPath();
      ctx.arc(x, y, 4 * d, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  _field(ctx, L, s) {
    const { box, d } = L;
    const y = box.y + box.h * 0.5;
    const x0 = this.xOf(s.xn / s.L * 0.85, L);
    const x1 = this.xOf(-s.xp / s.L * 0.85, L);
    ctx.strokeStyle = '#34d399';
    ctx.fillStyle = '#34d399';
    ctx.lineWidth = 1.8 * d;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x1 + 8 * d, y - 5 * d);
    ctx.lineTo(x1 + 8 * d, y + 5 * d);
    ctx.fill();
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('E  N → P', (x0 + x1) / 2, y - 8 * d);
  }

  _flowArrows(ctx, L, s) {
    const { box, d } = L;
    const yD = box.y + box.h * 0.22;
    const yR = box.y + box.h * 0.78;
    const showDiff = this.flow !== 'drift' && (this.mode === 'live' || this.formStep >= 2);
    const showDrift = this.flow !== 'diff' && (this.mode === 'live' || this.formStep >= 7);
    ctx.font = `${9 * d}px "IBM Plex Sans", sans-serif`;
    if (showDiff) {
      ctx.strokeStyle = '#fb923c';
      ctx.fillStyle = '#fb923c';
      this._arrow(ctx, this.xOf(-0.55, L), yD, this.xOf(0.55, L), yD, d);
      ctx.textAlign = 'left';
      ctx.fillText('diffusion  holes P→N, electrons N→P  (gradient)', box.x + 8 * d, yD - 6 * d);
    }
    if (showDrift) {
      ctx.strokeStyle = '#34d399';
      ctx.fillStyle = '#34d399';
      ctx.setLineDash([5 * d, 3 * d]);
      this._arrow(ctx, this.xOf(0.55, L), yR, this.xOf(-0.55, L), yR, d);
      ctx.setLineDash([]);
      ctx.fillText('drift  holes N→P, electrons P→N  (field)', box.x + 8 * d, yR + 12 * d);
    }
  }

  _arrow(ctx, x0, y, x1, y1, d) {
    ctx.lineWidth = 1.5 * d;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    const dir = x1 >= x0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - 8 * d * dir, y1 - 4 * d);
    ctx.lineTo(x1 - 8 * d * dir, y1 + 4 * d);
    ctx.fill();
  }

  _conventional(ctx, L, s) {
    const { box, d } = L;
    const y = box.y + box.h + 14 * d;
    ctx.fillStyle = '#fde68a';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'center';
    const dir = s.bias === 'reverse' ? 'N → P (tiny, minority drift)' : s.bias === 'forward' ? 'P → N (majority diffusion)' : 'net J = 0';
    ctx.fillText(`conventional current: ${dir}`, box.x + box.w / 2, y);
  }

  _labels(ctx, L, s) {
    const { d } = L;
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`x_p = ${(s.xp * 1e4).toFixed(2)} μm    x_n = ${(s.xn * 1e4).toFixed(2)} μm    W = ${(s.W * 1e4).toFixed(2)} μm`, 12 * d, L.h - 6 * d);
  }

  _eqBanner(ctx, L) {
    const { box, d } = L;
    ctx.fillStyle = 'rgba(15,23,42,0.82)';
    ctx.fillRect(box.x + 20 * d, box.y + box.h * 0.38, box.w - 40 * d, 44 * d);
    ctx.fillStyle = '#fde68a';
    ctx.font = `${12 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Diffusion current = drift current.  Net current = 0.  Carriers are still moving.', box.x + box.w / 2, box.y + box.h * 0.38 + 28 * d);
  }

  _frac(clientX) {
    const r = this.canvas.getBoundingClientRect();
    return (clientX - r.left) / r.width;
  }

  _click(e) {
    if (!this.why || !this.onPick) return;
    const f = this._frac(e.clientX);
    if (f < 0.38) this.onPick('p');
    else if (f > 0.62) this.onPick('n');
    else this.onPick('depletion');
  }

  _move(e) {
    if (!this.tipEl || !this.state) return;
    const f = this._frac(e.clientX);
    const r = this.canvas.getBoundingClientRect();
    let text = 'N-type bulk. Electrons majority, holes scarce.';
    if (f < 0.38) text = 'P-type bulk. Holes majority. Ions A− are fixed; holes are not.';
    else if (f < 0.62) text = 'Depletion. Mobile carriers left. Uncovered A− and D+ are the space charge.';
    this.tipEl.textContent = text;
    this.tipEl.classList.remove('hidden');
    this.tipEl.style.left = `${Math.min(r.width - 220, Math.max(8, e.clientX - r.left + 12))}px`;
    this.tipEl.style.top = `${Math.max(8, e.clientY - r.top - 48)}px`;
  }
}

export class BalanceView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = null;
    this._dpr = 1;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(r.width * this._dpr));
    this.canvas.height = Math.max(1, Math.floor(r.height * this._dpr));
  }

  draw(s) {
    this.state = s;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const d = this._dpr;
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, w, h);
    if (!s) return;
    const maxN = Math.max(s.NA, s.ND);
    const maxX = Math.max(s.xp, s.xn);
    const hP = 18 * d + (h - 36 * d) * (s.NA / maxN);
    const hN = 18 * d + (h - 36 * d) * (s.ND / maxN);
    const wP = 40 * d + (w * 0.38) * (s.xp / maxX);
    const wN = 40 * d + (w * 0.38) * (s.xn / maxX);
    const yP = (h - hP) / 2;
    const yN = (h - hN) / 2;
    ctx.fillStyle = 'rgba(248,113,113,0.35)';
    ctx.fillRect(16 * d, yP, wP, hP);
    ctx.fillStyle = 'rgba(56,189,248,0.35)';
    ctx.fillRect(w - 16 * d - wN, yN, wN, hN);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`A−  tall×thin if NA large    area = NA xp`, 16 * d + wP / 2, yP - 4 * d);
    ctx.fillText(`D+  short×wide if ND small    area = ND xn`, w - 16 * d - wN / 2, yN - 4 * d);
    ctx.fillStyle = '#fde68a';
    ctx.fillText('=', w / 2, h / 2 + 4 * d);
  }
}
