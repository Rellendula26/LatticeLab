import { AbruptJunction, renderKatex, sci } from '../physics/pn-junction.js';
import { ParticleViewport, TUTORIAL_COPY } from './pn-particles.js';
import { JunctionPlots } from './pn-plots.js';

class PNJunctionLab {
  constructor() {
    this.physics = new AbruptJunction();
    this.view = new ParticleViewport(
      document.getElementById('pn-canvas'),
      document.getElementById('pn-tip'),
    );
    this.plots = new JunctionPlots({
      bands: document.getElementById('plot-bands'),
      field: document.getElementById('plot-field'),
      carriers: document.getElementById('plot-carriers'),
    });
    this._bind();
    this.view.resize();
    this.sync(true);
    this._last = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
    window.addEventListener('resize', () => {
      this.view.resize();
      this.plots.resize();
    });
  }

  _bind() {
    ['na', 'nd', 'va', 't'].forEach((id) => {
      document.getElementById(id).addEventListener('input', () => this.sync(false));
    });
    document.getElementById('btn-play').addEventListener('click', () => {
      const on = this.view.togglePlay();
      this._playLabel(on);
      document.getElementById('pn-story').textContent = on
        ? 'Thermal motion is live. Diffusion runs down the gradient; drift runs the other way in the depletion strip.'
        : 'Paused. Step through diffusion, or play again.';
    });
    document.getElementById('btn-step').addEventListener('click', () => {
      const n = this.view.stepTutorial();
      this._playLabel(this.view.playing);
      document.getElementById('pn-story').textContent = TUTORIAL_COPY[n];
      this.view.draw();
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      document.getElementById('na').value = '16';
      document.getElementById('nd').value = '16';
      document.getElementById('va').value = '0';
      document.getElementById('t').value = '300';
      this.view.reset();
      this._playLabel(true);
      this.sync(true);
      document.getElementById('pn-story').textContent = 'Reset to equilibrium (V_a = 0). One Fermi level, diffusion = drift.';
    });
  }

  _playLabel(on) {
    const btn = document.getElementById('btn-play');
    btn.innerHTML = on
      ? '<i class="fa-solid fa-pause"></i> Pause particle physics'
      : '<i class="fa-solid fa-play"></i> Play particle physics';
  }

  inputs() {
    return {
      NA: 10 ** Number(document.getElementById('na').value),
      ND: 10 ** Number(document.getElementById('nd').value),
      Va: Number(document.getElementById('va').value),
      T: Number(document.getElementById('t').value),
    };
  }

  sync() {
    const { NA, ND, Va, T } = this.inputs();
    const s = this.physics.solve(NA, ND, Va, T);
    this.state = s;
    this.view.setState(s);
    this.plots.update(s, this.physics.sample(s));
    this._math(s);
    this._hud(s);
  }

  _hud(s) {
    document.getElementById('na-lab').innerHTML = `10<sup>${Math.log10(s.NA).toFixed(2)}</sup>`;
    document.getElementById('nd-lab').innerHTML = `10<sup>${Math.log10(s.ND).toFixed(2)}</sup>`;
    document.getElementById('va-lab').textContent = `${s.Va.toFixed(2)} V`;
    document.getElementById('t-lab').textContent = `${s.T} K`;
    const badge = document.getElementById('bias-badge');
    badge.textContent = s.flat ? 'Near flatband' : s.bias === 'forward' ? 'Forward bias' : s.bias === 'reverse' ? 'Reverse bias' : 'Equilibrium';
    badge.className = 'bias-badge ' + (s.flat ? 'is-warn' : s.bias);
  }

  _math(s) {
    renderKatex(
      document.getElementById('eq-vbi'),
      String.raw`V_{bi}=\dfrac{kT}{q}\ln\!\left(\dfrac{N_A N_D}{n_i^2}\right)=${s.vbi.toFixed(3)}\ \mathrm{V}`,
      true,
    );
    renderKatex(
      document.getElementById('eq-w'),
      String.raw`W=\sqrt{\dfrac{2\varepsilon_s}{q}\left(\dfrac{N_A+N_D}{N_A N_D}\right)(V_{bi}-V_a)}=${(s.W * 1e4).toFixed(3)}\ \mu\mathrm{m}`,
      true,
    );
    renderKatex(
      document.getElementById('eq-xp'),
      String.raw`x_p=W\dfrac{N_D}{N_A+N_D}=${(s.xp * 1e4).toFixed(3)}\ \mu\mathrm{m}`,
      true,
    );
    renderKatex(
      document.getElementById('eq-xn'),
      String.raw`x_n=W\dfrac{N_A}{N_A+N_D}=${(s.xn * 1e4).toFixed(3)}\ \mu\mathrm{m}`,
      true,
    );
    renderKatex(
      document.getElementById('eq-neut'),
      String.raw`N_A x_p = N_D x_n = ${sci(s.NA * s.xp, 2)}\ \mathrm{cm}^{-2}`,
      true,
    );
    const niTex = String.raw`n_i(${s.T}\,\mathrm{K})=${sci(s.ni, 2)}\ \mathrm{cm}^{-3}\quad kT/q=${(s.Vt * 1000).toFixed(1)}\ \mathrm{mV}`;
    renderKatex(document.getElementById('eq-ni'), niTex, false);
    document.getElementById('math-note').textContent = s.flat
      ? 'V_a is at or above V_bi. The abrupt-depletion formulas are collapsing toward flatband / high injection — treat W as a floor, not a measurement.'
      : s.bias === 'forward'
        ? 'Forward: barrier is V_bi − V_a. Minorities flood the edges (law of the junction) and decay over a diffusion length.'
        : s.bias === 'reverse'
          ? 'Reverse: barrier grows, W widens as √(V_bi − V_a), and minorities are extracted below equilibrium at the edges.'
          : 'Equilibrium: one flat E_F. The uncovered charge N_A x_p on the p-side equals N_D x_n on the n-side.';
  }

  _loop(now) {
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    if (this.view.playing) this.view.tick(dt);
    this.view.draw();
    requestAnimationFrame(this._loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__pnLab = new PNJunctionLab();
});
