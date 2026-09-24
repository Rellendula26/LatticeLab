import { material } from './materials.js';
import { bandEdges, threeKT, kT, ionizedIf, impurityRole } from './physics.js';
import { sizeCanvas, clear, dashLevel, labelEnergy } from './draw.js';

export class DopantViz {
  constructor(root, q) {
    this.root = root;
    this.q = q;
    this.hi = null;
    this.EI = q.params.EI != null ? q.params.EI : 0.045;
    this.dragging = false;
    this.phase = 0;
    this._build();
    this._loop = this._loop.bind(this);
    this.raf = requestAnimationFrame(this._loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.root.innerHTML = '';
  }

  highlight(sym) { this.hi = sym; this.draw(); }
  resize() { this.draw(); }

  _build() {
    const m = material(this.q.params.matId);
    this.root.innerHTML = `
      <div class="hw2-viz-grid">
        <div class="hw2-canvas-wrap hw2-canvas-tall"><canvas></canvas></div>
        <aside class="glass rounded-2xl p-4 space-y-3 text-sm text-slate-300">
          <p>Drag the impurity dash in the gap. Homework rule: ionized if EI ≤ 3kT.</p>
          <p data-read></p>
          <div class="hw2-misconception rounded-xl p-3">p-type doping does not add mobile positive particles. It creates holes in the valence band.</div>
          ${this.q.params.kind !== 'inp' ? `<button type="button" data-snap class="hw-chip">Homework placement · EI = 90 meV</button>` : ''}
        </aside>
      </div>`;
    this.cv = this.root.querySelector('canvas');
    this.cv.addEventListener('pointerdown', (e) => { this.dragging = true; this._drag(e); });
    window.addEventListener('pointerup', () => { this.dragging = false; });
    this.cv.addEventListener('pointermove', (e) => { if (this.dragging) this._drag(e); });
    const snap = this.root.querySelector('[data-snap]');
    if (snap) snap.addEventListener('click', () => { this.EI = 0.090; this.draw(); this._read(); });
    this.m = m;
    this.draw();
    this._read();
  }

  _drag(e) {
    const r = this.cv.getBoundingClientRect();
    const y = (e.clientY - r.top) / r.height;
    const Eg = this.m.Eg;
    const E = (1 - y) * (Eg + 0.24 * Eg) - 0.12 * Eg;
    this.EI = Math.min(Eg * 0.92, Math.max(0.008, E));
    this.draw();
    this._read();
  }

  _loop(now) {
    this.phase = now / 200;
    this.draw();
    this.raf = requestAnimationFrame(this._loop);
  }

  _read() {
    const el = this.root.querySelector('[data-read]');
    if (!el) return;
    const T0 = this.q.params.T || this.q.params.Tlo || 300;
    const T1 = this.q.params.Thi;
    const r0 = impurityRole('v', this.EI, T0);
    let html = `EI = ${(this.EI * 1000).toFixed(0)} meV above EV.<br>At ${T0} K, 3kT = ${(threeKT(T0) * 1000).toFixed(0)} meV → <strong>${r0}</strong>.`;
    if (T1) {
      const r1 = impurityRole('v', this.EI, T1);
      html += `<br>At ${T1} K, 3kT = ${(threeKT(T1) * 1000).toFixed(0)} meV → <strong>${r1}</strong>.`;
    }
    el.innerHTML = html;
  }

  draw() {
    if (!this.cv) return;
    const { w, h, dpr: d } = sizeCanvas(this.cv);
    const ctx = this.cv.getContext('2d');
    clear(ctx, w, h);
    if (this.q.params.kind === 'inp') this._one(ctx, w, h, d, 300, 'InP 300 K');
    else {
      this._one(ctx, w * 0.5 - 8 * d, h, d, 300, '300 K', 0);
      this._one(ctx, w * 0.5 - 8 * d, h, d, 400, '400 K', w * 0.5 + 8 * d);
    }
  }

  _one(ctx, W, H, d, T, title, x0 = 0) {
    const Eg = this.m.Eg;
    const edges = bandEdges(Eg);
    const top = 36 * d;
    const bot = H - 24 * d;
    const yOf = (E) => bot - ((E + 0.12 * Eg) / (Eg + 0.24 * Eg)) * (bot - top);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `${12 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(title, x0 + 12 * d, 22 * d);
    ctx.fillStyle = 'rgba(2,132,199,0.16)';
    ctx.fillRect(x0 + 10 * d, top, W - 20 * d, yOf(edges.Ec) - top);
    ctx.fillStyle = 'rgba(153,27,27,0.16)';
    ctx.fillRect(x0 + 10 * d, yOf(edges.Ev), W - 20 * d, bot - yOf(edges.Ev));
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2 * d;
    ctx.beginPath(); ctx.moveTo(x0 + 16 * d, yOf(edges.Ec)); ctx.lineTo(x0 + W - 16 * d, yOf(edges.Ec)); ctx.stroke();
    ctx.strokeStyle = '#f87171';
    ctx.beginPath(); ctx.moveTo(x0 + 16 * d, yOf(edges.Ev)); ctx.lineTo(x0 + W - 16 * d, yOf(edges.Ev)); ctx.stroke();
    const win = threeKT(T);
    ctx.fillStyle = ionizedIf(this.EI, T) ? 'rgba(52,211,153,0.18)' : 'rgba(251,191,36,0.12)';
    ctx.fillRect(x0 + 18 * d, yOf(win), W - 36 * d, yOf(0) - yOf(win));
    ctx.strokeStyle = this.hi === '3kT' ? '#fde68a' : '#34d399';
    ctx.lineWidth = 1.4 * d;
    ctx.strokeRect(x0 + 18 * d, yOf(win), 10 * d, yOf(0) - yOf(win));
    ctx.fillStyle = this.hi === '3kT' ? '#fde68a' : '#6ee7b7';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText('3kT', x0 + 32 * d, yOf(win) - 4 * d);
    dashLevel(ctx, { box: { x: x0 + 10 * d, w: W - 20 * d }, yOf }, edges.Ei, '#a78bfa', 'Ei', d, this.hi === 'Ei');
    const Eimp = this.EI;
    dashLevel(ctx, { box: { x: x0 + 10 * d, w: W - 20 * d }, yOf }, Eimp, '#fbbf24', 'impurity', d, this.hi === 'EI' || this.hi === 'imp');
    const ionized = ionizedIf(this.EI, T);
    ctx.fillStyle = '#fde68a';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(`EI = ${(this.EI * 1000).toFixed(0)} meV`, x0 + 24 * d, yOf(Eimp / 2) );
    const role = impurityRole('v', this.EI, T);
    ctx.fillStyle = role === 'acceptor' ? '#86efac' : role === 'trap' ? '#fcd34d' : '#7dd3fc';
    ctx.font = `${12 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(role, x0 + 20 * d, bot + 16 * d);
    const EF = ionized ? edges.Ei - 0.22 * Eg : edges.Ei;
    ctx.strokeStyle = this.hi === 'EF' ? '#fff7ed' : '#fbbf24';
    ctx.setLineDash([5 * d, 4 * d]);
    ctx.beginPath(); ctx.moveTo(x0 + 16 * d, yOf(EF)); ctx.lineTo(x0 + W - 16 * d, yOf(EF)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fde68a';
    ctx.fillText('EF', x0 + W - 40 * d, yOf(EF) - 4 * d);
    if (ionized) {
      const wob = Math.sin(this.phase) * 6 * d;
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.6 * d;
      ctx.beginPath();
      ctx.arc(x0 + W * 0.45 + wob, yOf(0) + 14 * d, 5 * d, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fda4af';
      ctx.fillText('hole in VB', x0 + W * 0.45 + 10 * d, yOf(0) + 18 * d);
      if (this.q.params.kind === 'cds-bright') {
        ctx.fillStyle = '#fde68a';
        ctx.beginPath(); ctx.arc(x0 + W * 0.72, (yOf(edges.Ec) + yOf(edges.Ev)) / 2, 7 * d, 0, Math.PI * 2); ctx.fill();
        ctx.fillText('emission', x0 + W * 0.72 - 10 * d, (yOf(edges.Ec) + yOf(edges.Ev)) / 2 - 12 * d);
      }
    } else {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(x0 + W * 0.5, yOf(Eimp), 4 * d, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('charge parked', x0 + W * 0.5 + 10 * d, yOf(Eimp) + 4 * d);
    }
    labelEnergy(ctx, x0 + 16 * d, yOf(edges.Ec) - 6 * d, 'EC', '#7dd3fc', d);
    labelEnergy(ctx, x0 + 16 * d, yOf(edges.Ev) + 14 * d, 'EV', '#fda4af', d);
  }
}
