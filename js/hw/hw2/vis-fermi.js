import { material } from './materials.js';
import { niOf, carriers, dopingKind, efMinusEi, bandEdges, fermiCurve } from './physics.js';
import { sizeCanvas, clear, dashLevel } from './draw.js';

const PRESETS = ['q4i', 'q4ii', 'q4iii', 'q4iv', 'q4v'];

export class FermiViz {
  constructor(root, q, onPreset) {
    this.root = root;
    this.q = q;
    this.onPreset = onPreset;
    this.hi = null;
    this.hide = false;
    this.guess = null;
    this.Tplay = null;
    this._build();
  }

  destroy() { this.root.innerHTML = ''; }
  highlight(sym) { this.hi = sym; this.draw(); }
  resize() { this.draw(); }

  setQuestion(q) {
    this.q = q;
    this.hide = false;
    this.guess = null;
    this.Tplay = null;
    this._syncBtns();
    this.draw();
    this._copy();
  }

  _build() {
    this.root.innerHTML = `
      <div class="mb-3 flex flex-wrap gap-2" data-presets></div>
      <div class="mb-3 flex flex-wrap gap-2">
        <button type="button" data-hide class="hw-chip">Hide labels and let me try</button>
        <button type="button" data-check class="hw-chip">Check my diagram</button>
        <button type="button" data-tanim class="hw-chip">0 K → 300 K → 450 K</button>
      </div>
      <p data-check-msg class="mb-2 hidden text-sm text-amber-100"></p>
      <div class="hw2-canvas-wrap hw2-canvas-tall"><canvas></canvas></div>
      <p data-story class="mt-3 text-sm text-slate-300"></p>`;
    this.cv = this.root.querySelector('canvas');
    const box = this.root.querySelector('[data-presets]');
    PRESETS.forEach((id) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hw-chip';
      b.textContent = id.replace('q4', 'Q4 ').replace('i', '(i)').replace('v', '(v)');
      if (id === 'q4ii') b.textContent = 'Q4(ii)';
      if (id === 'q4iii') b.textContent = 'Q4(iii)';
      if (id === 'q4iv') b.textContent = 'Q4(iv)';
      if (id === 'q4i') b.textContent = 'Q4(i)';
      if (id === 'q4v') b.textContent = 'Q4(v)';
      b.addEventListener('click', () => this.onPreset && this.onPreset(id));
      box.appendChild(b);
    });
    this.root.querySelector('[data-hide]').addEventListener('click', () => {
      this.hide = true;
      this.guess = this._truth().EF;
      this.draw();
    });
    this.root.querySelector('[data-check]').addEventListener('click', () => {
      const t = this._truth();
      const msg = this.root.querySelector('[data-check-msg]');
      msg.classList.remove('hidden');
      if (this.guess == null) {
        msg.textContent = 'Drag EF on the left plot first.';
        return;
      }
      const d = this.guess - t.EF;
      msg.textContent = Math.abs(d) < 0.08 * t.m.Eg
        ? `Close. EF should sit at ${t.EF.toFixed(3)} eV because ${t.kind}.`
        : `Move EF ${d > 0 ? 'down' : 'up'}. ${t.kind}. Doping shifts EF; T smears f(E), it does not redefine f(EF)=1/2.`;
      this.hide = false;
      this.draw();
    });
    this.root.querySelector('[data-tanim]').addEventListener('click', () => this._animateT());
    this.cv.addEventListener('pointerdown', (e) => this._drag(e, true));
    this.cv.addEventListener('pointermove', (e) => { if (e.buttons) this._drag(e, false); });
    this._syncBtns();
    this.draw();
    this._copy();
  }

  _syncBtns() {
    this.root.querySelector('[data-presets]').querySelectorAll('.hw-chip').forEach((b, i) => {
      b.classList.toggle('is-on', PRESETS[i] === this.q.id);
    });
  }

  _truth() {
    const { matId, NA, ND, T } = this.q.params;
    const m = material(matId);
    const edges = bandEdges(m.Eg);
    const Tuse = this.Tplay != null ? this.Tplay : T;
    if (Tuse <= 0.5) {
      const EF = ND > NA ? edges.Ec - m.ED : NA > ND ? edges.Ev + m.EA : edges.Ei;
      return { m, edges, T: Tuse, n: 0, p: 0, EF, kind: 'frozen · EF at the impurity', ni: 0 };
    }
    const ni = niOf(m, Tuse);
    const { n, p } = carriers(NA, ND, ni);
    const EF = edges.Ei + efMinusEi(n, ni, Tuse);
    return { m, edges, T: Tuse, n, p, ni, EF, kind: dopingKind(NA, ND, ni) };
  }

  _drag(e) {
    const r = this.cv.getBoundingClientRect();
    if ((e.clientX - r.left) / r.width > 0.5) return;
    const y = (e.clientY - r.top) / r.height;
    const t = this._truth();
    const Eg = t.m.Eg;
    this.guess = (1 - y) * (Eg + 0.24 * Eg) - 0.12 * Eg;
    this.draw();
  }

  _animateT() {
    const seq = [0, 300, 450];
    let i = 0;
    const tick = () => {
      this.Tplay = seq[i];
      this.draw();
      this._copy();
      i += 1;
      if (i < seq.length) setTimeout(tick, 900);
      else setTimeout(() => { this.Tplay = null; this.draw(); this._copy(); }, 900);
    };
    tick();
  }

  _copy() {
    const t = this._truth();
    this.root.querySelector('[data-story]').innerHTML =
      `f(E) is the chance an <em>available state</em> at E is occupied. It is not n(E).
      EF is not “where all the electrons sit.” At T &gt; 0, f(EF)=1/2 always.
      This case: <strong>${t.kind}</strong> at ${t.T} K. ${t.T <= 0.5 ? 'Do not use n = ND. Bands are empty. The step is at the donor.' : `EF is ${t.EF >= t.edges.Ei ? 'above' : 'below'} Ei.`}`;
  }

  draw() {
    if (!this.cv) return;
    const { w, h, dpr: d } = sizeCanvas(this.cv);
    const ctx = this.cv.getContext('2d');
    clear(ctx, w, h);
    const t = this._truth();
    const EF = this.hide && this.guess != null ? this.guess : t.EF;
    const mid = w * 0.5;
    const top = 28 * d, bot = h - 22 * d;
    const yOf = (E) => bot - ((E + 0.12 * t.m.Eg) / (t.m.Eg + 0.24 * t.m.Eg)) * (bot - top);
    ctx.fillStyle = 'rgba(2,132,199,0.16)';
    ctx.fillRect(16 * d, top, mid - 28 * d, yOf(t.edges.Ec) - top);
    ctx.fillStyle = 'rgba(153,27,27,0.16)';
    ctx.fillRect(16 * d, yOf(t.edges.Ev), mid - 28 * d, bot - yOf(t.edges.Ev));
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2 * d;
    ctx.beginPath(); ctx.moveTo(20 * d, yOf(t.edges.Ec)); ctx.lineTo(mid - 16 * d, yOf(t.edges.Ec)); ctx.stroke();
    ctx.strokeStyle = '#f87171';
    ctx.beginPath(); ctx.moveTo(20 * d, yOf(t.edges.Ev)); ctx.lineTo(mid - 16 * d, yOf(t.edges.Ev)); ctx.stroke();
    if (!this.hide) {
      dashLevel(ctx, { box: { x: 16 * d, w: mid - 32 * d }, yOf }, t.edges.Ei, '#c4b5fd', 'Ei', d, this.hi === 'Ei');
      dashLevel(ctx, { box: { x: 16 * d, w: mid - 32 * d }, yOf }, EF, '#fbbf24', 'EF', d, this.hi === 'EF');
      ctx.fillStyle = '#7dd3fc';
      ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
      ctx.fillText('EC', 24 * d, yOf(t.edges.Ec) - 6 * d);
      ctx.fillStyle = '#fda4af';
      ctx.fillText('EV', 24 * d, yOf(t.edges.Ev) + 14 * d);
    } else {
      ctx.strokeStyle = '#fbbf24';
      ctx.setLineDash([5 * d, 4 * d]);
      ctx.beginPath(); ctx.moveTo(20 * d, yOf(EF)); ctx.lineTo(mid - 16 * d, yOf(EF)); ctx.stroke();
      ctx.setLineDash([]);
    }
    const { E, f } = fermiCurve(t.EF, t.T, t.edges.Ev, t.edges.Ec);
    const x0 = mid + 36 * d;
    const xw = w - x0 - 16 * d;
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x0, bot); ctx.lineTo(x0 + xw, bot); ctx.stroke();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.2 * d;
    ctx.beginPath();
    E.forEach((e, i) => {
      const x = x0 + f[i] * xw;
      const y = yOf(e);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.strokeStyle = '#fde68a';
    ctx.setLineDash([4 * d, 3 * d]);
    ctx.beginPath();
    ctx.moveTo(20 * d, yOf(t.EF));
    ctx.lineTo(x0 + 0.5 * xw, yOf(t.EF));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(x0 + 0.5 * xw, yOf(t.EF), 5 * d, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText('f(E)', x0 + xw - 24 * d, bot + 14 * d);
    ctx.fillText('f(EF)=1/2', x0 + 0.5 * xw - 10 * d, yOf(t.EF) - 8 * d);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `${12 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(`${t.m.name} · ${t.T} K`, 16 * d, 16 * d);
    ctx.fillText('same energy scale →', mid - 20 * d, 16 * d);
  }
}
