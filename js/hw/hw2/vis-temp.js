import { material } from './materials.js';
import { niOf, nVsT, findTmax, carriers, majorityError, niLimit10pct, sciHtml } from './physics.js';

const PLOTLY = {
  displayModeBar: false,
  responsive: true,
};

const LAYOUT = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(15,23,42,0.35)',
  font: { family: 'IBM Plex Sans, system-ui, sans-serif', color: '#cbd5e1', size: 12 },
  margin: { t: 36, r: 18, b: 52, l: 62 },
  showlegend: true,
  legend: { font: { size: 11 }, bgcolor: 'rgba(15,23,42,0.4)' },
  hovermode: 'closest',
};

export class TempViz {
  constructor(root, q) {
    this.root = root;
    this.q = q;
    this.hi = null;
    this.mode = 'hw';
    this.compare = false;
    this.mat = q.params.kind === 'tmax' ? 'Ge' : q.params.matId;
    this.T = 300;
    this._build();
  }

  destroy() { this.root.innerHTML = ''; }
  highlight(sym) { this.hi = sym; }
  resize() {
    const el = this.root.querySelector('[data-plot]');
    if (el && window.Plotly) window.Plotly.Plots.resize(el);
  }

  setQuestion(q) {
    this.q = q;
    this.mat = q.params.kind === 'tmax' ? 'Ge' : q.params.matId;
    this.compare = false;
    this._build();
  }

  _build() {
    const k = this.q.params.kind;
    if (k === 'tmax') this.root.innerHTML = this._tmaxHTML();
    else this.root.innerHTML = this._plotHTML();
    this._bind();
    this.redraw();
  }

  _plotHTML() {
    return `
      <div class="mb-3 flex flex-wrap gap-2">
        <button type="button" data-mode="hw" class="hw-chip is-on">Homework plot</button>
        <button type="button" data-mode="int" class="hw-chip">Intuitive n vs T</button>
        ${this.q.params.kind === 'compare' ? '<button type="button" data-cmp class="hw-chip">Compare with Si</button>' : ''}
      </div>
      <div data-plot class="hw-plot"></div>
      <p data-hover class="mt-2 text-sm text-slate-400">Hover a point: T, n, and the dominant mechanism.</p>`;
  }

  _tmaxHTML() {
    return `
      <div class="mb-3 flex flex-wrap gap-2">
        <button type="button" data-xtal="Ge" class="hw-chip is-on">Ge</button>
        <button type="button" data-xtal="Si" class="hw-chip">Si</button>
      </div>
      <label class="block text-sm text-slate-300">Temperature
        <span data-tlab class="float-right font-mono text-amber-200">300 K</span>
        <input data-t type="range" min="200" max="850" step="1" value="300" class="mt-2 w-full" />
      </label>
      <div class="hw2-device mt-4" data-device></div>
      <p data-why class="mt-3 text-sm text-slate-300"></p>`;
  }

  _bind() {
    this.root.querySelectorAll('[data-mode]').forEach((b) => {
      b.addEventListener('click', () => {
        this.mode = b.dataset.mode;
        this.root.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('is-on', x === b));
        this.redraw();
      });
    });
    const cmp = this.root.querySelector('[data-cmp]');
    if (cmp) cmp.addEventListener('click', () => { this.compare = !this.compare; cmp.classList.toggle('is-on', this.compare); this.redraw(); });
    this.root.querySelectorAll('[data-xtal]').forEach((b) => {
      b.addEventListener('click', () => {
        this.mat = b.dataset.xtal;
        this.root.querySelectorAll('[data-xtal]').forEach((x) => x.classList.toggle('is-on', x === b));
        this.redraw();
      });
    });
    const sl = this.root.querySelector('[data-t]');
    if (sl) sl.addEventListener('input', () => { this.T = Number(sl.value); this.redraw(); });
  }

  redraw() {
    if (this.q.params.kind === 'tmax') this._tmax();
    else this._plot();
  }

  _temps() {
    const ts = [];
    for (let T = 40; T <= 900; T += 4) ts.push(T);
    return ts;
  }

  _plot() {
    const el = this.root.querySelector('[data-plot]');
    if (!el || !window.Plotly) return;
    const ids = this.q.params.kind === 'intrinsic'
      ? [this.q.params.matId]
      : this.compare || this.q.params.kind === 'compare'
        ? [this.q.params.matId, this.q.params.otherId || 'Si']
        : [this.q.params.matId];
    const ND = this.q.params.ND || 0;
    const traces = [];
    ids.filter(Boolean).forEach((id, idx) => {
      const xs = [], ys = [], text = [];
      this._temps().forEach((T) => {
        const r = ND ? nVsT(id, ND, T) : { n: niOf(id, T), regime: 'intrinsic', ni: niOf(id, T) };
        if (this.mode === 'hw') {
          xs.push(1000 / T);
          ys.push(Math.log(r.n / Math.pow(T, 1.5)));
        } else {
          xs.push(T);
          ys.push(r.n);
        }
        text.push(`T=${T} K<br>n=${r.n.toExponential(2)} cm−3<br>${r.regime}`);
      });
      traces.push({
        x: xs, y: ys, text, name: id,
        mode: 'lines',
        line: { color: idx ? '#38bdf8' : '#34d399', width: 2.4 },
        hovertemplate: '%{text}<extra></extra>',
      });
    });
    if (ND && this.mode === 'int') {
      traces.push({
        x: [40, 900], y: [ND, ND], mode: 'lines', name: 'ND',
        line: { color: '#fbbf24', dash: 'dash', width: 1.6 },
        hovertemplate: 'ND reference<extra></extra>',
      });
    }
    const shapes = [];
    if (ND && this.mode === 'int') {
      shapes.push(
        { type: 'rect', xref: 'x', yref: 'paper', x0: 40, x1: 140, y0: 0, y1: 1, fillcolor: 'rgba(251,191,36,0.08)', line: { width: 0 } },
        { type: 'rect', xref: 'x', yref: 'paper', x0: 140, x1: 520, y0: 0, y1: 1, fillcolor: 'rgba(56,189,248,0.07)', line: { width: 0 } },
        { type: 'rect', xref: 'x', yref: 'paper', x0: 520, x1: 900, y0: 0, y1: 1, fillcolor: 'rgba(248,113,113,0.08)', line: { width: 0 } },
      );
    }
    const m = material(ids[0]);
    const slope = -m.Eg / (2 * 8.617333262145e-5);
    const layout = {
      ...LAYOUT,
      title: { text: this.mode === 'hw' ? `ln(n / T^{3/2}) vs 1000/T   slope ≈ ${slope.toFixed(0)} K` : 'n(T)', font: { size: 13, color: '#e2e8f0' } },
      xaxis: {
        title: this.mode === 'hw' ? '1000 / T  (1/K)' : 'T (K)',
        color: '#94a3b8', gridcolor: 'rgba(148,163,184,0.12)',
      },
      yaxis: {
        title: this.mode === 'hw' ? 'ln(n / T^{3/2})' : 'n (cm−3)',
        color: '#94a3b8', gridcolor: 'rgba(148,163,184,0.12)',
        type: this.mode === 'int' ? 'log' : 'linear',
      },
      shapes,
      annotations: ND && this.mode === 'int' ? [
        { x: 90, y: 1, yref: 'paper', text: 'freeze-out', showarrow: false, font: { color: '#fde68a', size: 11 } },
        { x: 320, y: 1, yref: 'paper', text: 'extrinsic n≈ND', showarrow: false, font: { color: '#7dd3fc', size: 11 } },
        { x: 720, y: 1, yref: 'paper', text: 'intrinsic', showarrow: false, font: { color: '#fda4af', size: 11 } },
      ] : [],
    };
    window.Plotly.react(el, traces, layout, PLOTLY);
  }

  _tmax() {
    const NA = this.q.params.NA;
    const ND = this.q.params.ND;
    const T = this.T;
    const ni = niOf(this.mat, T);
    const pSide = carriers(NA, 0, ni);
    const nSide = carriers(0, ND, ni);
    const ep = majorityError(NA, pSide.p);
    const en = majorityError(ND, nSide.n);
    const ok = Math.abs(ep) <= 10 && Math.abs(en) <= 10;
    const tmax = findTmax(this.mat, NA);
    const lab = this.root.querySelector('[data-tlab]');
    if (lab) lab.textContent = `${T} K`;
    this.root.querySelector('[data-device]').innerHTML = `
      <div class="hw2-diode">
        <div class="is-p"><p>P</p><p>target ${sciHtml(NA)}</p><p>p = ${sciHtml(pSide.p)}</p><p>error ${ep.toFixed(1)}%</p></div>
        <div class="is-j">junction</div>
        <div class="is-n"><p>N</p><p>target ${sciHtml(ND)}</p><p>n = ${sciHtml(nSide.n)}</p><p>error ${en.toFixed(1)}%</p></div>
      </div>
      <p class="hw2-status ${ok ? 'is-ok' : 'is-bad'}">${ok ? 'Operating within spec' : 'Outside 10% tolerance'}</p>
      <p class="mt-2 font-mono text-sm text-amber-100">Tmax(${this.mat}) = ${tmax.toFixed(0)} K = ${(tmax - 273.15).toFixed(0)} °C</p>
      <p class="text-xs text-slate-500">Fails when ni reaches ${sciHtml(niLimit10pct(NA))} cm<sup>−3</sup> (p = 1.1 NA).</p>`;
    this.root.querySelector('[data-why]').innerHTML =
      `Why it fails: intrinsic pair generation grows as exp(−Eg/2kT). ${this.mat} has Eg = ${material(this.mat).Eg} eV.
      Once ni is no longer ≪ doping, p and n walk off NA and ND even though the dopants are still there.`;
  }
}
