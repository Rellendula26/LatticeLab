import { AbruptJunction, renderKatex, sci } from '../physics/pn-junction.js';
import { JunctionView, BalanceView, FORM } from './pnj-canvas.js';
import { StackPlots, IVChart, FermiView } from './pnj-plots.js';

const PRESETS = [
  { id: 'eq', lab: 'Equilibrium', NA: 16, ND: 16, Va: 0, T: 300 },
  { id: 'fwd', lab: 'Forward bias', NA: 16, ND: 16, Va: 0.55, T: 300 },
  { id: 'rev', lab: 'Reverse bias', NA: 16, ND: 16, Va: -1.2, T: 300 },
  { id: 'hp', lab: 'Heavily doped P', NA: 18, ND: 15.3, Va: 0, T: 300 },
  { id: 'hn', lab: 'Heavily doped N', NA: 15.3, ND: 18, Va: 0, T: 300 },
  { id: 'sym', lab: 'Symmetric', NA: 16, ND: 16, Va: 0, T: 300 },
];

const CHAINS = {
  depletion: {
    title: 'Depletion region',
    steps: ['carrier diffusion', 'mobile carriers leave the junction', 'fixed dopant ions exposed', 'space charge', 'depletion region'],
    copy: 'The strip is empty of mobile charge, not of charge. A− and D+ are the uncovered ions.',
  },
  field: {
    title: 'Electric field',
    steps: ['fixed space charge', 'electric field N → P', 'carrier drift', 'opposes diffusion'],
    copy: 'Poisson: dE/dx = ρ/ε. A rectangular ρ makes a triangular E. Direction is N toward P.',
  },
  potential: {
    title: 'Electrostatic potential',
    steps: ['electric field', 'E = −dV/dx', 'potential rises P → N', 'area under |E| is the barrier'],
    copy: 'V is higher on the n-side. A positive test charge would be pushed toward P.',
  },
  bands: {
    title: 'Band bending',
    steps: ['space charge', 'electric field', 'electrostatic potential', 'electron energy −qV', 'Ec, Ei, Ev bend'],
    copy: 'Electrons live in a high-energy place on the p-side. That is the built-in barrier q(Vbi − VA). At equilibrium EF is flat because there is no net current of either carrier.',
  },
  current: {
    title: 'Forward current',
    steps: ['forward voltage', 'built-in barrier decreases', 'majority carriers cross more easily', 'diffusion current rises exponentially'],
    copy: 'Forward bias does not magically turn the diode on. It lowers the energy barrier.',
  },
  p: {
    title: 'P-side bulk',
    steps: ['NA sets p ≈ NA', 'EF moves toward Ev', 'hole gradient toward N', 'holes want to diffuse P → N'],
    copy: 'Holes are majority here. The junction’s job is to stop them from dumping forever.',
  },
  n: {
    title: 'N-side bulk',
    steps: ['ND sets n ≈ ND', 'EF moves toward Ec', 'electron gradient toward P', 'electrons want to diffuse N → P'],
    copy: 'Same story, opposite carrier. Charge balance then puts more of W on the lighter-doped side.',
  },
  rho: {
    title: 'Charge density ρ(x)',
    steps: ['depletion approximation', 'ρ = −q NA on −xp < x < 0', 'ρ = +q ND on 0 < x < xn', 'ρ ≈ 0 in the bulk'],
    copy: 'A rectangle is the depletion approximation, not a photo of the junction. It is why E is a triangle.',
  },
};

const EXAM = [
  {
    q: 'ND ≫ NA. Which side contains most of the depletion width?',
    opts: [
      { t: 'The n-side, because it has more donors.', ok: false },
      { t: 'The p-side. W stretches into the lighter-doped side so NA xp = ND xn.', ok: true },
      { t: 'They stay equal. Charge balance means equal widths.', ok: false },
    ],
    why: 'Charge per area must match. If ND is huge, xn can be tiny and still equal NA xp. Most of W sits in the p-side.',
  },
  {
    q: 'What direction does the built-in electric field point?',
    opts: [
      { t: 'P → N, so holes are pulled into the n-side.', ok: false },
      { t: 'N → P. Uncovered D+ on N and A− on P.', ok: true },
      { t: 'There is no field at equilibrium.', ok: false },
    ],
    why: 'Positive space charge on the n-edge, negative on the p-edge. Field runs from N toward P.',
  },
  {
    q: 'An electron is in the depletion region. Which way does the field force it?',
    opts: [
      { t: 'Toward P, with the field.', ok: false },
      { t: 'Toward N, against the field, because it is negative.', ok: true },
      { t: 'It feels no force. Depletion is empty.', ok: false },
    ],
    why: 'F = qE with q < 0. Field N → P, so the electron is pushed N-ward. That is drift opposing diffusion.',
  },
  {
    q: 'Why does diffusion eventually stop producing NET current?',
    opts: [
      { t: 'All mobile carriers recombine and vanish.', ok: false },
      { t: 'The uncovered-ion field drives an equal-and-opposite drift current.', ok: true },
      { t: 'The concentration gradient disappears.', ok: false },
    ],
    why: 'The gradient is still there. Drift cancels diffusion. Net J = 0. Particles keep moving.',
  },
  {
    q: 'Does equilibrium mean electrons and holes stop moving?',
    opts: [
      { t: 'Yes. Net current zero means nothing moves.', ok: false },
      { t: 'No. They still move. Forward and reverse microscopic fluxes cancel.', ok: true },
      { t: 'Only minorities move.', ok: false },
    ],
    why: 'Equilibrium is detailed balance, not a freeze-frame.',
  },
  {
    q: 'Forward bias is increased. Predict barrier, depletion width, diffusion current.',
    opts: [
      { t: 'Barrier up, W up, diffusion down.', ok: false },
      { t: 'Barrier down (Vbi − VA), W down, diffusion up exponentially.', ok: true },
      { t: 'Barrier unchanged. Only the contact potential moves.', ok: false },
    ],
    why: 'VA lowers the electrostatic hill. Many more majority carriers have the energy to climb it.',
  },
  {
    q: 'Reverse bias is increased. Predict the same three quantities.',
    opts: [
      { t: 'Barrier up, W up, majority diffusion suppressed. Current → −I0.', ok: true },
      { t: 'Barrier down, huge reverse current.', ok: false },
      { t: 'W shrinks because the field extracts carriers.', ok: false },
    ],
    why: 'Reverse adds to Vbi. Majority climb almost stops. Leftover current is mostly minority drift, saturating near −I0.',
  },
  {
    q: 'Given rectangular ρ(x), what is the qualitative shape of E(x)?',
    opts: [
      { t: 'Also rectangular. E follows ρ.', ok: false },
      { t: 'Triangular / piecewise linear. dE/dx = ρ/ε.', ok: true },
      { t: 'Parabolic. E is the second integral of ρ.', ok: false },
    ],
    why: 'Poisson is a first derivative from ρ to E. A step in ρ is a slope in E. Peak at the metallurgical junction.',
  },
  {
    q: 'Given triangular E(x), what is the qualitative shape of V(x)?',
    opts: [
      { t: 'Triangular, because V tracks E.', ok: false },
      { t: 'Piecewise parabolic. E = −dV/dx, so V is the integral of −E.', ok: true },
      { t: 'Flat, because EF is flat.', ok: false },
    ],
    why: 'EF is a Fermi level, not the electrostatic potential. V curves. Bands follow −qV, so they curve the same way.',
  },
  {
    q: 'Why must EF be flat at equilibrium?',
    opts: [
      { t: 'Because the bands are flat.', ok: false },
      { t: 'A gradient in EF is a driving force for current. J = 0 everywhere forces EF constant.', ok: true },
      { t: 'EF is defined only in the n-side.', ok: false },
    ],
    why: 'Under bias the quasi-Fermi levels split by about qVA. That split is the applied voltage written in the band diagram.',
  },
];

class PNJunctionStudio {
  constructor() {
    this.physics = new AbruptJunction();
    this.form = new JunctionView(document.getElementById('cv-form'));
    this.junc = new JunctionView(document.getElementById('cv-junc'), document.getElementById('junc-tip'));
    this.form.mode = 'form';
    this.junc.mode = 'live';
    this.bal = new BalanceView(document.getElementById('cv-bal'));
    this.stack = new StackPlots(document.getElementById('cv-stack'));
    this.iv = new IVChart(document.getElementById('cv-iv'));
    this.fermi = new FermiView(document.getElementById('cv-fermi'));
    this.stage = 'form';
    this.formPlaying = false;
    this.formAcc = 0;
    this.examIdx = 0;
    this._presets();
    this._bind();
    this.junc.onPick = (k) => this._why(k);
    this.stack.onPick = (k) => this._why(k);
    this.stack.onCursor = () => {
      document.getElementById('cursor-lab').textContent = this.stack.readout();
    };
    this.sync();
    this._resize();
    this._last = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
    window.addEventListener('resize', () => this._resize());
    this._exam(0);
  }

  _presets() {
    const box = document.getElementById('presets');
    PRESETS.forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pnj-chip rounded-lg border border-white/15 px-2.5 py-1 text-xs font-semibold';
      b.textContent = p.lab;
      b.addEventListener('click', () => {
        document.getElementById('na').value = String(p.NA);
        document.getElementById('nd').value = String(p.ND);
        document.getElementById('va').value = String(p.Va);
        document.getElementById('t').value = String(p.T);
        this.sync();
      });
      box.appendChild(b);
    });
  }

  _bind() {
    ['na', 'nd', 'va', 't'].forEach((id) => {
      document.getElementById(id).addEventListener('input', () => this.sync());
    });
    document.querySelectorAll('[data-stage]').forEach((b) => {
      b.addEventListener('click', () => this.setStage(b.dataset.stage));
    });
    document.querySelectorAll('[data-flow]').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('[data-flow]').forEach((x) => x.classList.toggle('is-on', x === b));
        this.junc.flow = b.dataset.flow;
        this.form.flow = b.dataset.flow;
        const lab = document.getElementById('flow-lab');
        lab.textContent = b.dataset.flow === 'diff'
          ? 'Driven by concentration gradient. Holes P → N, electrons N → P.'
          : b.dataset.flow === 'drift'
            ? 'Driven by electric field. Holes N → P, electrons P → N.'
            : 'Solid arrows: diffusion. Dashed: drift. At equilibrium they cancel: J_diff + J_drift = 0.';
      });
    });
    document.getElementById('show-j').addEventListener('change', (e) => {
      this.junc.showJ = e.target.checked;
    });
    document.getElementById('why-on').addEventListener('change', (e) => {
      this.junc.why = e.target.checked;
      if (!e.target.checked) document.getElementById('why-box').classList.add('hidden');
    });
    document.getElementById('btn-form-play').addEventListener('click', () => {
      this.formPlaying = !this.formPlaying;
      document.getElementById('btn-form-play').textContent = this.formPlaying ? 'Pause' : 'Play';
    });
    document.getElementById('btn-form-step').addEventListener('click', () => this._formNext());
    document.getElementById('btn-form-reset').addEventListener('click', () => {
      this.form.formStep = 0;
      this.formPlaying = false;
      document.getElementById('btn-form-play').textContent = 'Play';
      this._formCopy();
    });
    document.getElementById('btn-exam').addEventListener('click', () => {
      this._exam((this.examIdx + 1) % EXAM.length);
    });
  }

  setStage(id) {
    this.stage = id;
    document.querySelectorAll('[data-stage]').forEach((b) => b.classList.toggle('is-on', b.dataset.stage === id));
    document.querySelectorAll('[data-panel]').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== id));
    this._resize();
    this.sync();
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
    this.form.setState(s);
    this.junc.setState(s);
    const samp = this.physics.sample(s);
    this.stack.update(s, samp);
    const iv = this.iv.update(this.physics, s);
    this.bal.draw(s);
    this.fermi.draw(s, this.physics);
    this._hud(s, iv);
  }

  _hud(s, iv) {
    document.getElementById('na-lab').innerHTML = `10<sup>${Math.log10(s.NA).toFixed(2)}</sup>`;
    document.getElementById('nd-lab').innerHTML = `10<sup>${Math.log10(s.ND).toFixed(2)}</sup>`;
    document.getElementById('va-lab').textContent = `${s.Va.toFixed(2)} V`;
    document.getElementById('t-lab').textContent = `${s.T} K`;
    const badge = document.getElementById('bias-badge');
    badge.textContent = s.flat ? 'Near flatband' : s.bias === 'forward' ? 'Forward bias' : s.bias === 'reverse' ? 'Reverse bias' : 'Equilibrium';
    badge.className = 'bias-badge ' + (s.flat ? 'is-warn' : s.bias);
    document.getElementById('balance-lab').textContent =
      `NA xp = ${(s.NA * s.xp).toExponential(2)} cm-2    ND xn = ${(s.ND * s.xn).toExponential(2)} cm-2`;
    renderKatex(document.getElementById('eq-barrier'), String.raw`\mathrm{barrier}=V_{bi}-V_A=${s.psi.toFixed(3)}\ \mathrm{V}\quad (V_{bi}=${s.vbi.toFixed(3)}\ \mathrm{V})`, false);
    renderKatex(document.getElementById('eq-w'), String.raw`W=x_p+x_n=${(s.W * 1e4).toFixed(3)}\ \mu\mathrm{m}`, false);
    if (iv) {
      document.getElementById('iv-lab').textContent = `I = ${iv.I.toExponential(3)} A    I0 = ${iv.I0.toExponential(3)} A`;
      renderKatex(document.getElementById('eq-i'), String.raw`I=I_0(e^{qV_A/kT}-1)`, true);
    }
    const why = document.getElementById('bias-why');
    if (s.bias === 'forward') {
      why.textContent = 'Forward bias does not magically turn the diode on. It lowers the energy barrier, allowing many more majority carriers to diffuse across the junction.';
    } else if (s.bias === 'reverse') {
      why.textContent = 'Reverse bias suppresses majority-carrier diffusion. The remaining small current comes primarily from minority carriers.';
    } else {
      why.textContent = 'Equilibrium: barrier = Vbi, EF flat, drift current = diffusion current, net current = 0.';
    }
    const nP = (s.ni * s.ni) / s.NA;
    const pN = (s.ni * s.ni) / s.ND;
    renderKatex(document.getElementById('eq-np'), String.raw`np=n_i^2\quad n_i=${sci(s.ni, 2)}\ \mathrm{cm}^{-3}`, true);
    document.getElementById('fermi-p').innerHTML = `P-side: p ≈ N<sub>A</sub> = ${sci(s.NA, 2).replace(/\^{([^}]+)}/g, '<sup>$1</sup>')} cm<sup>−3</sup>, n = n<sub>i</sub><sup>2</sup>/p ≈ ${sci(nP, 2).replace(/\^{([^}]+)}/g, '<sup>$1</sup>')} cm<sup>−3</sup>. E<sub>F</sub> sits near E<sub>v</sub>.`;
    document.getElementById('fermi-n').innerHTML = `N-side: n ≈ N<sub>D</sub> = ${sci(s.ND, 2).replace(/\^{([^}]+)}/g, '<sup>$1</sup>')} cm<sup>−3</sup>, p = n<sub>i</sub><sup>2</sup>/n ≈ ${sci(pN, 2).replace(/\^{([^}]+)}/g, '<sup>$1</sup>')} cm<sup>−3</sup>. E<sub>F</sub> sits near E<sub>c</sub>.`;
    document.getElementById('cursor-lab').textContent = this.stack.readout();
  }

  _why(key) {
    if (!document.getElementById('why-on').checked) return;
    const c = CHAINS[key];
    if (!c) return;
    document.getElementById('why-box').classList.remove('hidden');
    document.getElementById('why-title').textContent = c.title;
    document.getElementById('why-copy').textContent = c.copy;
    document.getElementById('why-chain').innerHTML = c.steps.map((s, i, a) =>
      `<span>${s}</span>${i < a.length - 1 ? '<i class="fa-solid fa-arrow-down"></i>' : ''}`).join('');
  }

  _formNext() {
    this.form.formStep = Math.min(8, this.form.formStep + 1);
    this._formCopy();
    if (this.form.formStep >= 8) {
      this.formPlaying = false;
      document.getElementById('btn-form-play').textContent = 'Play';
    }
  }

  _formCopy() {
    const f = FORM[this.form.formStep];
    document.getElementById('form-step').textContent = f.t;
    document.getElementById('form-copy').textContent = f.c;
  }

  _exam(i) {
    this.examIdx = i;
    const Q = EXAM[i];
    document.getElementById('exam-q').textContent = Q.q;
    document.getElementById('exam-why').classList.add('hidden');
    const box = document.getElementById('exam-opts');
    box.innerHTML = '';
    Q.opts.forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rounded-lg border border-white/15 px-3 py-2 text-left text-sm text-slate-200';
      b.textContent = o.t;
      b.addEventListener('click', () => {
        b.className += o.ok ? ' border-emerald-400/50 text-emerald-100' : ' border-red-400/40 text-red-200';
        const why = document.getElementById('exam-why');
        why.textContent = (o.ok ? '' : 'Not that. ') + Q.why;
        why.classList.remove('hidden');
        if (o.ok && Q.q.includes('ND')) {
          document.getElementById('na').value = '15.3';
          document.getElementById('nd').value = '18';
          this.sync();
        }
        if (o.ok && Q.q.includes('Forward')) {
          document.getElementById('va').value = '0.55';
          this.sync();
        }
        if (o.ok && Q.q.includes('Reverse')) {
          document.getElementById('va').value = '-1.2';
          this.sync();
        }
      });
      box.appendChild(b);
    });
  }

  _resize() {
    this.form.resize();
    this.junc.resize();
    this.bal.resize();
    this.stack.resize();
    this.fermi.resize();
    if (this.iv) this.iv.chart.resize();
    if (this.state) {
      this.stack.draw();
      this.bal.draw(this.state);
      this.fermi.draw(this.state, this.physics);
    }
  }

  _loop(now) {
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    if (this.formPlaying) {
      this.formAcc += dt;
      if (this.formAcc > 1.35) {
        this.formAcc = 0;
        this._formNext();
      }
    }
    const vis = this.stage === 'form' ? this.form : this.junc;
    vis.tick(dt);
    vis.draw();
    requestAnimationFrame(this._loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__pnj = new PNJunctionStudio();
});
