import { material } from './materials.js';
import { niOf, carriers, dopingKind, majorityWhy, sigmaOf, efMinusEi, bandEdges, sciHtml } from './physics.js';
import { sizeCanvas, clear, dashLevel, drawEk } from './draw.js';

const PRESETS = [
  { id: 'q3i', lab: 'Q3(i)' },
  { id: 'q3ii', lab: 'Q3(ii)' },
  { id: 'q3iii', lab: 'Q3(iii)' },
  { id: 'q3iv', lab: 'Q3(iv)' },
];

export class CarrierViz {
  constructor(root, q, onPreset) {
    this.root = root;
    this.q = q;
    this.onPreset = onPreset;
    this.hi = null;
    this.step = 1;
    this._build();
  }

  destroy() { this.root.innerHTML = ''; }
  highlight(sym) { this.hi = sym; this.draw(); }
  resize() { this.draw(); }

  setQuestion(q) {
    this.q = q;
    this.step = 1;
    this._fill();
    this.draw();
  }

  _build() {
    this.root.innerHTML = `
      <div class="mb-3 flex flex-wrap gap-2" data-presets></div>
      <div class="hw2-stat-row" data-inputs></div>
      <div class="hw2-viz-grid mt-3">
        <div class="hw2-canvas-wrap"><canvas data-bands></canvas></div>
        <div class="hw2-canvas-wrap"><canvas data-ek></canvas></div>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-step="${n}" class="hw-chip">Step ${n}</button>`).join('')}
      </div>
      <p data-step-copy class="mt-2 text-sm text-slate-300"></p>`;
    this.cvB = this.root.querySelector('[data-bands]');
    this.cvK = this.root.querySelector('[data-ek]');
    const box = this.root.querySelector('[data-presets]');
    PRESETS.forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hw-chip';
      b.textContent = p.lab;
      b.addEventListener('click', () => this.onPreset && this.onPreset(p.id));
      box.appendChild(b);
    });
    this.root.querySelectorAll('[data-step]').forEach((b) => {
      b.addEventListener('click', () => { this.step = Number(b.dataset.step); this._fill(); this.draw(); });
    });
    this._fill();
    this.draw();
  }

  _state() {
    const { matId, NA, ND, T } = this.q.params;
    const m = material(matId);
    const ni = niOf(m, T);
    const { n, p } = carriers(NA, ND, ni);
    const sig = sigmaOf(n, p, m.mun, m.mup);
    const dEi = efMinusEi(n, ni, T);
    const edges = bandEdges(m.Eg);
    return { m, ni, n, p, sig, dEi, edges, NA, ND, T, kind: dopingKind(NA, ND, ni), why: majorityWhy(NA, ND, ni) };
  }

  _fill() {
    const s = this._state();
    this.root.querySelector('[data-presets]').querySelectorAll('.hw-chip').forEach((b) => {
      b.classList.toggle('is-on', b.textContent === this.q.q);
    });
    this.root.querySelectorAll('[data-step]').forEach((b) => b.classList.toggle('is-on', Number(b.dataset.step) === this.step));
    this.root.querySelector('[data-inputs]').innerHTML = `
      <div><span>material</span><strong>${s.m.name}</strong></div>
      <div><span data-sym="NA" class="hw2-sym">NA</span><strong>${sciHtml(s.NA)} cm<sup>−3</sup></strong></div>
      <div><span data-sym="ND" class="hw2-sym">ND</span><strong>${sciHtml(s.ND)} cm<sup>−3</sup></strong></div>
      <div><span data-sym="ni" class="hw2-sym">ni</span><strong>${sciHtml(s.ni)} cm<sup>−3</sup></strong></div>
      <div><span>μn</span><strong>${s.m.mun}</strong></div>
      <div><span>μp</span><strong>${s.m.mup}</strong></div>
      <div><span>T</span><strong>${s.T} K</strong></div>
      <div><span>type</span><strong>${s.kind}</strong></div>`;
    const copy = [
      `Compare NA=${sciHtml(s.NA)}, ND=${sciHtml(s.ND)}, ni=${sciHtml(s.ni)}.`,
      `Majority: ${s.kind}.`,
      s.why,
      `np = ni² gives the minority after the majority is set.`,
      `σ = q(n μn + p μp) = ${sciHtml(s.sig.total)} S/cm. Electrons ${sciHtml(s.sig.elec)}, holes ${sciHtml(s.sig.hole)}.`,
    ];
    this.root.querySelector('[data-step-copy]').innerHTML = copy[this.step - 1];
  }

  draw() {
    if (!this.cvB) return;
    const s = this._state();
    this._bands(s);
    this._ek(s);
  }

  _bands(s) {
    const { w, h, dpr: d } = sizeCanvas(this.cvB);
    const ctx = this.cvB.getContext('2d');
    clear(ctx, w, h);
    const top = 28 * d, bot = h - 20 * d;
    const yOf = (E) => bot - ((E + 0.12 * s.m.Eg) / (s.m.Eg + 0.24 * s.m.Eg)) * (bot - top);
    const EF = s.edges.Ei + s.dEi;
    ctx.fillStyle = 'rgba(2,132,199,0.16)';
    ctx.fillRect(16 * d, top, w * 0.55, yOf(s.edges.Ec) - top);
    ctx.fillStyle = 'rgba(153,27,27,0.16)';
    ctx.fillRect(16 * d, yOf(s.edges.Ev), w * 0.55, bot - yOf(s.edges.Ev));
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2 * d;
    ctx.beginPath(); ctx.moveTo(20 * d, yOf(s.edges.Ec)); ctx.lineTo(w * 0.55, yOf(s.edges.Ec)); ctx.stroke();
    ctx.strokeStyle = '#f87171';
    ctx.beginPath(); ctx.moveTo(20 * d, yOf(s.edges.Ev)); ctx.lineTo(w * 0.55, yOf(s.edges.Ev)); ctx.stroke();
    dashLevel(ctx, { box: { x: 16 * d, w: w * 0.55 - 16 * d }, yOf }, s.edges.Ei, '#c4b5fd', 'Ei', d, this.hi === 'Ei');
    dashLevel(ctx, { box: { x: 16 * d, w: w * 0.55 - 16 * d }, yOf }, EF, '#fbbf24', 'EF', d, this.hi === 'EF');
    ctx.fillStyle = '#7dd3fc';
    ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText('EC', 24 * d, yOf(s.edges.Ec) - 6 * d);
    ctx.fillStyle = '#fda4af';
    ctx.fillText('EV', 24 * d, yOf(s.edges.Ev) + 14 * d);
    const nH = 8 * d + 70 * d * Math.min(1, Math.log10(s.n + 1) / 18);
    const pH = 8 * d + 70 * d * Math.min(1, Math.log10(s.p + 1) / 18);
    ctx.fillStyle = this.hi === 'n' ? '#67e8f9' : '#22d3ee';
    ctx.fillRect(w * 0.68, yOf(s.edges.Ec) - nH, 28 * d, nH);
    ctx.fillStyle = this.hi === 'p' ? '#fb7185' : '#f87171';
    ctx.fillRect(w * 0.82, yOf(s.edges.Ev), 28 * d, pH);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(`n ${sciHtml(s.n).replace(/<[^>]+>/g, '')}`, w * 0.66, 18 * d);
    ctx.fillText(`p ${sciHtml(s.p).replace(/<[^>]+>/g, '')}`, w * 0.66, 32 * d);
  }

  _ek(s) {
    const { w, h, dpr: d } = sizeCanvas(this.cvK);
    const ctx = this.cvK.getContext('2d');
    clear(ctx, w, h);
    drawEk(ctx, { x: 0, y: 0, w, h }, s.m.Eg, s.m.gap, s.edges.Ei + s.dEi, d, this.hi);
  }
}
