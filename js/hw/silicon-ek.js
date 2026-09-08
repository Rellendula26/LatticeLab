import { SiliconMath, renderKatex } from './crystal-math.js';

const LAYOUT = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(15,23,42,0.35)',
  font: { family: 'IBM Plex Sans, system-ui, sans-serif', color: '#cbd5e1', size: 11 },
  margin: { t: 36, r: 18, b: 42, l: 48 },
  xaxis: {
    title: { text: 'k  (Γ → X)', font: { size: 11 } },
    range: [-0.15, 1.05],
    gridcolor: 'rgba(148,163,184,0.12)',
    zerolinecolor: 'rgba(148,163,184,0.25)',
    color: '#94a3b8',
  },
  yaxis: {
    title: { text: 'E (eV, teaching scale)', font: { size: 11 } },
    gridcolor: 'rgba(148,163,184,0.12)',
    zeroline: false,
    color: '#94a3b8',
  },
  showlegend: false,
  hovermode: 'closest',
};

function siVB(k) {
  return -0.14 * k * k;
}

function siCB(k) {
  const ak = Math.abs(k);
  const gamma = 2.42 + 0.55 * ak * ak;
  const xval = 1.12 + 6.2 * (ak - 0.85) * (ak - 0.85);
  const a = 10;
  return -Math.log(Math.exp(-a * gamma) + Math.exp(-a * xval)) / a;
}

function gaasVB(k) {
  return -0.32 * k * k;
}

function gaasCB(k) {
  return 1.42 + 1.15 * k * k;
}

function bandTraces(kind) {
  const ks = [];
  for (let i = 0; i <= 160; i++) ks.push((i / 160) * 1.0);
  const vb = kind === 'si' ? ks.map(siVB) : ks.map(gaasVB);
  const cb = kind === 'si' ? ks.map(siCB) : ks.map(gaasCB);
  return [
    {
      x: ks, y: vb, mode: 'lines', name: 'Valence',
      line: { color: '#f87171', width: 3 },
      hovertemplate: 'VB · k=%{x:.2f}<br>E=%{y:.2f} eV<extra></extra>',
    },
    {
      x: ks, y: cb, mode: 'lines', name: 'Conduction',
      line: { color: '#22d3ee', width: 3 },
      hovertemplate: 'CB · k=%{x:.2f}<br>E=%{y:.2f} eV<extra></extra>',
    },
    {
      x: [0], y: [kind === 'si' ? siVB(0) : gaasVB(0)],
      mode: 'markers', name: 'electron',
      marker: { size: 12, color: '#38bdf8', line: { color: '#e0f2fe', width: 1.5 } },
      hovertemplate: 'Excited electron<extra></extra>',
    },
    {
      x: [0, 0], y: [0, 0], mode: 'lines', name: 'photon',
      line: { color: '#fbbf24', width: 2, dash: 'dot' },
      hovertemplate: 'Photon ΔE (vertical)<extra></extra>',
      opacity: 0,
    },
    {
      x: [0, 0], y: [0, 0], mode: 'lines', name: 'phonon',
      line: { color: '#a78bfa', width: 2, dash: 'dash' },
      hovertemplate: 'Phonon Δk (horizontal)<extra></extra>',
      opacity: 0,
    },
  ];
}

export class SiliconEkLab {
  constructor(els) {
    this.els = els;
    this.anim = null;
    this._syncDensity(SiliconMath.A_SI);
    this._initPlots();
    els.aInput.addEventListener('input', () => this._syncDensity(Number(els.aInput.value)));
    els.exciteBtn.addEventListener('click', () => this.excite());
    els.resetBtn.addEventListener('click', () => this.resetCarriers());
  }

  _syncDensity(aAng) {
    const a = Number.isFinite(aAng) && aAng > 0 ? aAng : SiliconMath.A_SI;
    const V = SiliconMath.volumeCm3(a);
    const n = SiliconMath.densityCm3(a);
    const aCm = a * 1e-8;
    if (this.els.aLabel) this.els.aLabel.textContent = `${a.toFixed(3)} Å`;
    renderKatex(
      this.els.volEq,
      String.raw`V=a^{3}=\bigl(${a.toFixed(3)}\times 10^{-8}\ \mathrm{cm}\bigr)^{3}=${V.toExponential(3)}\ \mathrm{cm}^{3}`,
      true,
    );
    renderKatex(
      this.els.densEq,
      String.raw`n=\frac{8\ \text{atoms}}{V}=${(n / 1e22).toFixed(2)}\times 10^{22}\ \mathrm{atoms/cm}^{3}`,
      true,
    );
    this.els.volNote.textContent = `a = ${aCm.toExponential(4)} cm. Diamond cubic owns 8 atoms in the conventional cell.`;
    this.els.densNote.textContent = n > 4.7e22 && n < 5.3e22
      ? 'Near the silicon textbook value ≈ 5.0 × 10²² cm⁻³.'
      : 'Density scales as 1/a³ — a 1% stretch in a drops n by about 3%.';
  }

  _initPlots() {
    const siLayout = {
      ...LAYOUT,
      title: { text: 'Si · indirect (Γ → X)', font: { size: 13, color: '#e2e8f0' } },
      yaxis: { ...LAYOUT.yaxis, range: [-0.55, 2.75] },
      annotations: [
        { x: 0, y: -0.42, text: 'Γ', showarrow: false, font: { color: '#94a3b8' } },
        { x: 0.85, y: -0.42, text: '≈X ⟨100⟩', showarrow: false, font: { color: '#94a3b8' } },
        { x: 0.42, y: 0.55, text: 'photon + phonon', showarrow: false, font: { size: 10, color: '#fde68a' }, opacity: 0.7 },
      ],
    };
    const gaLayout = {
      ...LAYOUT,
      title: { text: 'GaAs · direct (Γ)', font: { size: 13, color: '#e2e8f0' } },
      yaxis: { ...LAYOUT.yaxis, range: [-0.55, 2.75] },
      annotations: [
        { x: 0, y: -0.42, text: 'Γ', showarrow: false, font: { color: '#94a3b8' } },
        { x: 0.22, y: 0.72, text: 'photon only', showarrow: false, font: { size: 10, color: '#fde68a' }, opacity: 0.7 },
      ],
    };
    window.Plotly.newPlot(this.els.siPlot, bandTraces('si'), siLayout, { displayModeBar: false, responsive: true });
    window.Plotly.newPlot(this.els.gaPlot, bandTraces('gaas'), gaLayout, { displayModeBar: false, responsive: true });
  }

  resetCarriers() {
    if (this.anim) cancelAnimationFrame(this.anim);
    this.anim = null;
    window.Plotly.restyle(this.els.siPlot, { x: [[0]], y: [[siVB(0)]], 'marker.size': 12 }, [2]);
    window.Plotly.restyle(this.els.siPlot, { x: [[0, 0]], y: [[0, 0]], opacity: 0 }, [3, 4]);
    window.Plotly.restyle(this.els.gaPlot, { x: [[0]], y: [[gaasVB(0)]], 'marker.size': 12 }, [2]);
    window.Plotly.restyle(this.els.gaPlot, { x: [[0, 0]], y: [[0, 0]], opacity: 0 }, [3, 4]);
    this.els.status.textContent = 'Electron sits at the valence-band maximum (k = 0). Press Excite to conserve energy — and, in Si, crystal momentum.';
  }

  excite() {
    if (this.anim) cancelAnimationFrame(this.anim);
    const t0 = performance.now();
    const run = (now) => {
      const t = (now - t0) / 1000;
      this._frameGaAs(Math.min(1, t / 1.15));
      this._frameSi(Math.min(1, t / 2.35));
      if (t < 2.4) this.anim = requestAnimationFrame(run);
      else this.anim = null;
    };
    this.anim = requestAnimationFrame(run);
  }

  _frameGaAs(u) {
    const k = 0;
    const e0 = gaasVB(0);
    const e1 = gaasCB(0);
    const e = e0 + (e1 - e0) * ease(u);
    window.Plotly.restyle(this.els.gaPlot, { x: [[k]], y: [[e]] }, [2]);
    window.Plotly.restyle(this.els.gaPlot, {
      x: [[0, 0]], y: [[e0, e1]], opacity: 0.25 + 0.7 * (1 - u),
    }, [3]);
    if (u < 0.15) this.els.status.textContent = 'GaAs: a photon supplies ΔE at fixed k. The jump is vertical because both extrema sit at Γ.';
  }

  _frameSi(u) {
    const k0 = 0;
    const k1 = 0.85;
    const e0 = siVB(0);
    const e1 = siCB(k1);
    let k = k0;
    let e = e0;
    const photonOn = u < 0.42 ? 0.9 : Math.max(0, 1.15 - 2 * u);
    const phononOn = u < 0.18 ? 0 : u < 0.72 ? 0.95 : Math.max(0, 1.4 - u);
    if (u < 0.38) {
      e = e0 + (e1 - e0) * (u / 0.38) * 0.22;
    } else {
      const v = ease((u - 0.38) / 0.62);
      k = k0 + (k1 - k0) * v;
      e = e0 + 0.22 * (e1 - e0) + 0.78 * (e1 - e0) * v;
    }
    const phx = 0.12 * Math.sin(u * 28);
    window.Plotly.restyle(this.els.siPlot, { x: [[k]], y: [[e]] }, [2]);
    window.Plotly.restyle(this.els.siPlot, { x: [[0, 0]], y: [[e0, e1]], opacity: photonOn }, [3]);
    window.Plotly.restyle(this.els.siPlot, {
      x: [[k0 + phx, k1 + phx]], y: [[e1, e1]], opacity: phononOn,
    }, [4]);
    if (u > 0.2 && u < 0.85) {
      this.els.status.textContent = 'Si: the photon changes energy (vertical). A phonon — a lattice vibration — changes crystal momentum (horizontal) so the electron can land in the X valley.';
    } else if (u >= 0.85) {
      this.els.status.textContent = 'Indirect gap: photon + phonon. Direct gap: photon only. Same conservation laws, different band extrema.';
    }
  }

  resize() {
    window.Plotly.Plots.resize(this.els.siPlot);
    window.Plotly.Plots.resize(this.els.gaPlot);
  }
}

function ease(t) {
  return t * t * (3 - 2 * t);
}
