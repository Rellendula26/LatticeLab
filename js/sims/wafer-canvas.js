import { PROBE_X, Tof, T_ROOM } from '../physics/wafer-lab.js';

export class WaferCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = 'four';
    this.wafer = null;
    this.Vs = 2;
    this.I = 0;
    this.V23 = 0;
    this.Rc = 18;
    this.probeMode = '4';
    this.contactLesson = false;
    this.showE = true;
    this.showH = true;
    this.showJ = true;
    this.showF = false;
    this.xIron = 0.22;
    this.Ttip = 620;
    this.pair = [0, 3];
    this.electrons = [];
    this.holes = [];
    this._dpr = 1;
    this._drag = false;
    canvas.addEventListener('pointerdown', (e) => this._ptr(e, 'down'));
    canvas.addEventListener('pointermove', (e) => this._ptr(e, 'move'));
    canvas.addEventListener('pointerup', () => { this._drag = false; });
    canvas.addEventListener('pointerleave', () => { this._drag = false; });
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(r.width * this._dpr));
    this.canvas.height = Math.max(1, Math.floor(r.height * this._dpr));
    if (this.wafer) this.seedCarriers();
  }

  setWafer(w) {
    this.wafer = w;
    this.seedCarriers();
  }

  seedCarriers() {
    const w = this.wafer;
    if (!w) return;
    const nMaj = w.type === 'i' ? 9 : 26;
    const nMin = w.type === 'i' ? 9 : 4;
    this.electrons = [];
    this.holes = [];
    const add = (arr, n) => {
      for (let i = 0; i < n; i++) {
        arr.push({ x: 0.12 + Math.random() * 0.76, y: 0.22 + Math.random() * 0.46 });
      }
    };
    if (w.type === 'n') { add(this.electrons, nMaj); add(this.holes, nMin); }
    else if (w.type === 'p') { add(this.holes, nMaj); add(this.electrons, nMin); }
    else { add(this.electrons, nMaj); add(this.holes, nMin); }
  }

  tick(dt) {
    const I = this.mode === 'four' ? this.I : 0;
    const sign = I >= 0 ? 1 : -1;
    const speed = Math.min(0.22, 0.04 + 0.35 * Math.abs(I) * (this.wafer && this.wafer.rho < 1 ? 8 : 400));
    const driftE = this.mode === 'four' ? -sign * speed : 0;
    const driftH = this.mode === 'four' ? sign * speed : 0;
    const walk = (p, drift) => {
      p.x += drift * dt + (Math.random() - 0.5) * 0.18 * dt;
      p.y += (Math.random() - 0.5) * 0.16 * dt;
      if (this.mode === 'hot' && this.wafer) {
        const T = Tof(p.x, this.xIron, this.Ttip);
        const away = p.x >= this.xIron ? 1 : -1;
        p.x += away * 0.012 * ((T - T_ROOM) / 280) * dt;
      }
      if (p.x < 0.1) p.x = 0.88;
      if (p.x > 0.9) p.x = 0.12;
      if (p.y < 0.2) p.y = 0.2;
      if (p.y > 0.7) p.y = 0.7;
    };
    this.electrons.forEach((p) => walk(p, driftE));
    this.holes.forEach((p) => walk(p, driftH));
  }

  layout() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const pad = 18 * this._dpr;
    const wafer = { x: pad, y: h * 0.2, w: w - 2 * pad, h: h * 0.52 };
    const px = PROBE_X.map((f) => wafer.x + f * wafer.w);
    return { w, h, wafer, px, tipY: wafer.y - 8 * this._dpr };
  }

  _ptr(e, kind) {
    if (this.mode !== 'hot') return;
    const r = this.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (kind === 'down') {
      this._drag = Math.abs(x - this.xIron) < 0.12;
      if (!this._drag) { this.xIron = Math.min(0.88, Math.max(0.12, x)); this._drag = true; }
      if (this.onIron) this.onIron(this.xIron);
    }
    if (kind === 'move' && this._drag) {
      this.xIron = Math.min(0.88, Math.max(0.12, x));
      if (this.onIron) this.onIron(this.xIron);
    }
  }

  draw() {
    const ctx = this.ctx;
    const L = this.layout();
    const d = this._dpr;
    ctx.clearRect(0, 0, L.w, L.h);
    this._wafer(ctx, L, d);
    if (this.mode === 'hot') this._heat(ctx, L, d);
    if (this.showE) this.electrons.forEach((p) => this._dot(ctx, L, p, '#38bdf8', true));
    if (this.showH) this.holes.forEach((p) => this._dot(ctx, L, p, '#f87171', false));
    this._probes(ctx, L, d);
    if (this.mode === 'four')     this._circuit(ctx, L, d);
    else this._iron(ctx, L, d);
    if (this.contactLesson && this.probeMode === '2') this._equiv(ctx, L, d);
    if (this.contactLesson && this.probeMode === '4') this._senseNote(ctx, L, d);
    if (this.showJ && this.mode === 'four') this._arrows(ctx, L, d, true);
    if (this.showF && this.mode === 'four') this._arrows(ctx, L, d, false);
    if (this.mode === 'hot' && this.showJ) this._thermoArrow(ctx, L, d);
    this._labels(ctx, L, d);
  }

  _wafer(ctx, L, d) {
    const { wafer } = L;
    const g = ctx.createLinearGradient(wafer.x, 0, wafer.x + wafer.w, 0);
    g.addColorStop(0, 'rgba(56,189,248,0.08)');
    g.addColorStop(0.5, 'rgba(148,163,184,0.10)');
    g.addColorStop(1, 'rgba(248,113,113,0.08)');
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, L.w, L.h);
    ctx.beginPath();
    ctx.roundRect(wafer.x, wafer.y, wafer.w, wafer.h, 18 * d);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(125,211,252,0.35)';
    ctx.lineWidth = 1.4 * d;
    ctx.stroke();
    ctx.fillStyle = '#7dd3fc';
    ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText('Si wafer  (carrier counts are a visualization)', wafer.x + 10 * d, wafer.y + wafer.h + 16 * d);
  }

  _heat(ctx, L, d) {
    const { wafer } = L;
    for (let i = 0; i < 48; i++) {
      const f = i / 47;
      const x = wafer.x + f * wafer.w;
      const T = Tof(f, this.xIron, this.Ttip);
      const u = Math.max(0, (T - T_ROOM) / (this.Ttip - T_ROOM));
      ctx.fillStyle = `rgba(251,146,60,${0.08 + 0.38 * u})`;
      ctx.fillRect(x, wafer.y, wafer.w / 48 + 1, wafer.h);
    }
  }

  _dot(ctx, L, p, color, filled) {
    const x = L.wafer.x + p.x * L.wafer.w;
    const y = L.wafer.y + p.y * L.wafer.h;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 6 * this._dpr;
    ctx.beginPath();
    ctx.arc(x, y, (filled ? 3.4 : 4.1) * this._dpr, 0, Math.PI * 2);
    if (filled) { ctx.fillStyle = color; ctx.fill(); }
    else { ctx.strokeStyle = color; ctx.lineWidth = 1.6 * this._dpr; ctx.stroke(); }
    ctx.restore();
  }

  _probes(ctx, L, d) {
    L.px.forEach((x, i) => {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2 * d;
      ctx.beginPath();
      ctx.moveTo(x, L.tipY - 22 * d);
      ctx.lineTo(x, L.wafer.y + 6 * d);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 5 * d, L.wafer.y + 6 * d);
      ctx.lineTo(x + 5 * d, L.wafer.y + 6 * d);
      ctx.lineTo(x, L.wafer.y + 14 * d);
      ctx.closePath();
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), x, L.tipY - 28 * d);
    });
  }

  _circuit(ctx, L, d) {
    const yI = 22 * d;
    const x1 = L.px[0];
    const x4 = L.px[3];
    const x2 = L.px[1];
    const x3 = L.px[2];
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.6 * d;
    ctx.beginPath();
    ctx.moveTo(x1, L.tipY - 22 * d);
    ctx.lineTo(x1, yI);
    ctx.lineTo(x4, yI);
    ctx.lineTo(x4, L.tipY - 22 * d);
    ctx.stroke();
    ctx.fillStyle = '#7dd3fc';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(this.probeMode === '4' ? 'current source  I14' : 'V source + ammeter (2-probe)', (x1 + x4) / 2, yI - 6 * d);

    if (this.probeMode === '4') {
      const yM = L.tipY - 8 * d;
      ctx.strokeStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x2, L.tipY - 22 * d);
      ctx.lineTo(x2, yM);
      ctx.lineTo(x3, yM);
      ctx.lineTo(x3, L.tipY - 22 * d);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc((x2 + x3) / 2, yM, 11 * d, 0, Math.PI * 2);
      ctx.fillStyle = '#0b1220';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.fillText('V23', (x2 + x3) / 2, yM + 3 * d);
      ctx.fillText('high-Z  I_sense ≈ 0', (x2 + x3) / 2, yM + 22 * d);
    }
  }

  _box(ctx, x, y, w, h, stroke, fill, label, d) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.2 * d;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4 * d);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `${9 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 3 * d);
  }

  _equiv(ctx, L, d) {
    const y = L.wafer.y + L.wafer.h + 28 * d;
    const x0 = L.wafer.x + 8 * d;
    const span = L.wafer.w - 16 * d;
    const bw = span * 0.22;
    const gap = span * 0.08;
    const h = 22 * d;
    const rc = `Rc = ${this.Rc.toFixed(0)} Ω`;
    this._box(ctx, x0, y, bw, h, '#fb923c', 'rgba(251,146,60,0.16)', rc, d);
    this._box(ctx, x0 + bw + gap, y, bw * 1.4, h, '#38bdf8', 'rgba(56,189,248,0.12)', 'Rwafer', d);
    this._box(ctx, x0 + bw + gap + bw * 1.4 + gap, y, bw, h, '#fb923c', 'rgba(251,146,60,0.16)', rc, d);
    ctx.fillStyle = '#fca5a5';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('R_meas = Rcontact,left + Rwafer + Rcontact,right', x0, y + h + 14 * d);
  }

  _senseNote(ctx, L, d) {
    const y = L.wafer.y + 18 * d;
    [1, 2].forEach((i) => {
      const x = L.px[i];
      ctx.fillStyle = 'rgba(251,191,36,0.14)';
      ctx.strokeStyle = 'rgba(251,191,36,0.45)';
      ctx.lineWidth = 1 * d;
      ctx.beginPath();
      ctx.roundRect(x - 28 * d, y, 56 * d, 28 * d, 4 * d);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.font = `${8 * d}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('I_sense ≈ 0', x, y + 12 * d);
      ctx.fillText('Vc = I Rc ≈ 0', x, y + 22 * d);
    });
  }

  _thermoArrow(ctx, L, d) {
    if (!this.I) return;
    const y = L.wafer.y + L.wafer.h * 0.72;
    const dir = this.I >= 0 ? 1 : -1;
    ctx.strokeStyle = '#fde68a';
    ctx.fillStyle = '#fde68a';
    ctx.lineWidth = 1.5 * d;
    const x0 = L.px[0] + 12 * d;
    const x1 = L.px[3] - 12 * d;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    const tip = dir > 0 ? x1 : x0;
    ctx.beginPath();
    ctx.moveTo(tip, y);
    ctx.lineTo(tip - 8 * d * dir, y - 5 * d);
    ctx.lineTo(tip - 8 * d * dir, y + 5 * d);
    ctx.fill();
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(dir > 0 ? 'I_thermo > 0  (out of + probe 1)' : 'I_thermo < 0  (into + probe 1)', (x0 + x1) / 2, y + 16 * d);
  }

  _arrows(ctx, L, d, conventional) {
    const y = L.wafer.y + L.wafer.h * 0.5;
    const color = conventional ? '#fde68a' : '#a5f3fc';
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4 * d;
    const dir = this.I >= 0 ? 1 : -1;
    const x0 = L.px[0] + 16 * d;
    const x1 = L.px[3] - 16 * d;
    for (let i = 0; i < 5; i++) {
      const t = (i + 0.5) / 5;
      const x = x0 + (x1 - x0) * t;
      ctx.beginPath();
      if (conventional) {
        ctx.moveTo(x - 10 * d * dir, y);
        ctx.lineTo(x + 10 * d * dir, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 10 * d * dir, y);
        ctx.lineTo(x + 4 * d * dir, y - 4 * d);
        ctx.lineTo(x + 4 * d * dir, y + 4 * d);
        ctx.fill();
      } else {
        ctx.moveTo(x + 10 * d * dir, y - 10 * d);
        ctx.lineTo(x - 10 * d * dir, y - 10 * d);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 10 * d * dir, y - 10 * d);
        ctx.lineTo(x - 4 * d * dir, y - 14 * d);
        ctx.lineTo(x - 4 * d * dir, y - 6 * d);
        ctx.fill();
      }
    }
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(conventional ? 'J conventional (probe 1 → 4)' : 'E in wafer (same sense as J)', L.wafer.x + 8 * d, y + 22 * d);
  }

  _iron(ctx, L, d) {
    const x = L.wafer.x + this.xIron * L.wafer.w;
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.moveTo(x, L.wafer.y - 4 * d);
    ctx.lineTo(x - 7 * d, L.tipY - 36 * d);
    ctx.lineTo(x + 7 * d, L.tipY - 36 * d);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x - 4 * d, L.tipY - 70 * d, 8 * d, 34 * d);
    ctx.fillStyle = '#fdba74';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('drag iron', x, L.tipY - 76 * d);

    const yA = 26 * d;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.6 * d;
    ctx.beginPath();
    ctx.moveTo(L.px[0], L.tipY - 22 * d);
    ctx.lineTo(L.px[0], yA);
    ctx.lineTo(L.px[3], yA);
    ctx.lineTo(L.px[3], L.tipY - 22 * d);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc((L.px[0] + L.px[3]) / 2, yA, 11 * d, 0, Math.PI * 2);
    ctx.fillStyle = '#0b1220';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.fillText('A', (L.px[0] + L.px[3]) / 2, yA + 4 * d);
    ctx.fillStyle = '#86efac';
    ctx.fillText('+ probe 1', L.px[0], yA - 8 * d);
    ctx.fillStyle = '#fca5a5';
    ctx.fillText('− probe 4', L.px[3], yA - 8 * d);

    this.pair.forEach((idx) => {
      const T = Tof(PROBE_X[idx], this.xIron, this.Ttip);
      ctx.fillStyle = '#fdba74';
      ctx.fillText(`${T.toFixed(0)} K`, L.px[idx], L.wafer.y + L.wafer.h - 8 * d);
    });
  }

  _labels(ctx, L, d) {
    ctx.textAlign = 'left';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    if (this.mode === 'four' && this.probeMode === '4') {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Separate current injection (1,4) from voltage sensing (2,3).', L.wafer.x, 16 * d);
    }
    if (this.mode === 'four' && this.probeMode === '2') {
      ctx.fillStyle = '#fca5a5';
      ctx.fillText('2-probe path: Rcontact,1 + Rwafer + Rcontact,4. Rc changes the reading.', L.wafer.x, 16 * d);
    }
    if (this.mode === 'hot') {
      ctx.fillStyle = '#fdba74';
      ctx.fillText('Ammeter + is probe 1. I > 0 means conventional current out of probe 1 into the meter from the + lead.', 10 * d, 16 * d);
    }
  }
}
