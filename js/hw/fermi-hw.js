import { FermiMath, renderKatex } from './crystal-math.js';

export class FermiDiracViz {
  constructor(els) {
    this.els = els;
    this.T = 300;
    this.doping = 'i';
    this._init();
    els.tSlider.addEventListener('input', () => {
      this.T = Number(els.tSlider.value);
      this.redraw();
    });
    els.dopWrap.querySelectorAll('[data-dop]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.doping = btn.dataset.dop;
        els.dopWrap.querySelectorAll('[data-dop]').forEach((b) => b.classList.toggle('is-on', b === btn));
        this.redraw();
      });
    });
    this.redraw();
  }

  _init() {
    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15,23,42,0.35)',
      font: { family: 'IBM Plex Sans, system-ui, sans-serif', color: '#cbd5e1', size: 12 },
      margin: { t: 28, r: 20, b: 48, l: 54 },
      xaxis: {
        title: 'f(E)  ·  occupancy',
        range: [-0.04, 1.04],
        gridcolor: 'rgba(148,163,184,0.12)',
        color: '#94a3b8',
      },
      yaxis: {
        title: 'Energy  (eV)',
        range: [FermiMath.EV - 0.2, FermiMath.EC + 0.22],
        gridcolor: 'rgba(148,163,184,0.12)',
        color: '#94a3b8',
      },
      showlegend: false,
      hovermode: 'closest',
    };
    window.Plotly.newPlot(this.els.plot, [{ x: [0], y: [0], mode: 'lines' }], layout, {
      displayModeBar: false,
      responsive: true,
    });
  }

  redraw() {
    const EF = FermiMath.efFor(this.doping);
    const { E, f } = FermiMath.curve(EF, this.T);
    const kT = FermiMath.kT(this.T);
    const traces = [
      {
        x: f, y: E, mode: 'lines', name: 'f(E)',
        line: { color: '#fbbf24', width: 3.2, shape: this.T <= 0.05 ? 'hv' : 'linear' },
        hovertemplate: 'f=%{x:.3f}<br>E=%{y:.3f} eV<extra></extra>',
      },
      {
        x: [0, 1], y: [EF, EF], mode: 'lines', name: 'EF',
        line: { color: '#fde68a', width: 2, dash: 'dash' },
        hovertemplate: `E<sub>F</sub> = ${EF.toFixed(2)} eV · f = ½<extra></extra>`,
      },
      {
        x: [0.5], y: [EF], mode: 'markers',
        marker: { size: 11, color: '#fbbf24', line: { color: '#fff7ed', width: 1 } },
        hovertemplate: 'The pivot: f(E<sub>F</sub>) = ½ at every T<extra></extra>',
      },
      {
        x: [0, 1, 1, 0], y: [FermiMath.EC, FermiMath.EC, FermiMath.EC + 0.2, FermiMath.EC + 0.2],
        fill: 'toself', fillcolor: 'rgba(34,211,238,0.10)',
        line: { width: 0 }, hoverinfo: 'skip',
      },
      {
        x: [0, 1, 1, 0], y: [FermiMath.EV - 0.2, FermiMath.EV - 0.2, FermiMath.EV, FermiMath.EV],
        fill: 'toself', fillcolor: 'rgba(248,113,113,0.12)',
        line: { width: 0 }, hoverinfo: 'skip',
      },
    ];
    window.Plotly.react(this.els.plot, traces, this.els.plot.layout, { displayModeBar: false, responsive: true });

    this.els.tLabel.textContent = `${this.T} K`;
    renderKatex(
      this.els.eq,
      this.T <= 0.05
        ? String.raw`T=0:\quad f(E)=\begin{cases}1&E<E_F\\1/2&E=E_F\\0&E>E_F\end{cases}`
        : String.raw`f(E)=\dfrac{1}{1+\exp\bigl((E-E_F)/kT\bigr)}\quad kT=${(kT * 1000).toFixed(1)}\ \mathrm{meV}`,
      true,
    );

    const nShade = FermiMath.occupancy(FermiMath.EC - 0.02, EF, Math.max(this.T, 1));
    const pShade = 1 - FermiMath.occupancy(FermiMath.EV + 0.02, EF, Math.max(this.T, 1));
    this._bandBar(EF, nShade, pShade);

    const dopName = this.doping === 'n' ? 'n-type (donors pull E<sub>F</sub> toward E<sub>c</sub>)'
      : this.doping === 'p' ? 'p-type (acceptors pull E<sub>F</sub> toward E<sub>v</sub>)'
        : 'intrinsic (E<sub>F</sub> sits at midgap E<sub>i</sub>)';
    this.els.story.innerHTML = this.T <= 0.05
      ? `Absolute zero: a perfect step. ${dopName}. Thermal tails are gone, so almost no carriers occupy the band edges.`
      : `Warming smears the step <em>symmetrically</em> about E<sub>F</sub> — f(E<sub>F</sub>) stays ½. ${dopName}.`;
  }

  _bandBar(EF, nShade, pShade) {
    const lo = FermiMath.EV - 0.2;
    const hi = FermiMath.EC + 0.22;
    const pct = (e) => `${((hi - e) / (hi - lo)) * 100}%`;
    this.els.efTick.style.top = pct(EF);
    this.els.nCloud.style.opacity = String(0.15 + 0.75 * Math.min(1, nShade * 8));
    this.els.pCloud.style.opacity = String(0.15 + 0.75 * Math.min(1, pShade * 8));
    this.els.efRead.textContent = `E_F = ${EF.toFixed(2)} eV`;
    this.els.nRead.textContent = this.T <= 0.05 ? 'n ≈ 0 (frozen)' : 'electrons near E_c';
    this.els.pRead.textContent = this.T <= 0.05 ? 'p ≈ 0 (frozen)' : 'holes near E_v';
  }

  resize() {
    window.Plotly.Plots.resize(this.els.plot);
  }
}
