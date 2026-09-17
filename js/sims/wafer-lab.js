import {
  WAFERS, NI, Q, PROBE_X, Tof,
  measure4pp, measure2pp, thermoCurrent, estimateN,
  formatI, formatV, formatRho, sci, renderKatex,
} from '../physics/wafer-lab.js';
import { WaferCanvas } from './wafer-canvas.js';
import { drawTx, IrvinChart, mobilityOf } from './wafer-charts.js';

const QUESTIONS = {
  sense: {
    q: 'Why do probes 2 and 3 draw almost no current?',
    opts: [
      { t: 'They are disconnected from the wafer.', ok: false },
      { t: 'The voltmeter input impedance is huge, so I_sense ≈ 0.', ok: true },
      { t: 'Silicon shorts those two probes together.', ok: false },
    ],
    why: 'V_contact = I_sense R_c. If I_sense ≈ 0, the contact drops on 2 and 3 vanish. That is the whole point of four-point sensing.',
  },
  two: {
    q: 'What happens to the measured resistance if contact resistance increases in a 2-probe measurement?',
    opts: [
      { t: 'It stays at the wafer value. Contacts cancel.', ok: false },
      { t: 'It rises. You measure 2 R_c + R_wafer.', ok: true },
      { t: 'It falls. Extra resistance steals voltage.', ok: false },
    ],
    why: 'Current and voltage share the same pair. Every ohm of R_c is counted as if it were silicon.',
  },
  intrinsic: {
    q: 'Why does wafer C need much more applied voltage to produce a measurable current?',
    opts: [
      { t: 'The probes are broken.', ok: false },
      { t: 'n ≈ p ≈ n_i, so σ = q n_i (μ_n + μ_p) is tiny and ρ is huge.', ok: true },
      { t: 'Intrinsic wafers are thicker.', ok: false },
    ],
    why: 'Fewer mobile carriers. Same V_s, much smaller I. That is Ohm’s law with a very large ρ, not a different circuit.',
  },
  sign: {
    q: 'What does the sign of the hot-probe current tell us?',
    opts: [
      { t: 'Which probe is hotter, only.', ok: false },
      { t: 'Which carrier dominates. With + on probe 1, I > 0 when heating probe 1 means n-type.', ok: true },
      { t: 'The exact doping density.', ok: false },
    ],
    why: 'Majority carriers diffuse away from the heat. Electrons leave the hot end positive (n-type). Holes leave it negative (p-type). The ammeter polarity is drawn on the wafer so the sign is not arbitrary.',
  },
  center: {
    q: 'Why does heating near the center weaken the measured thermoelectric signal?',
    opts: [
      { t: 'The center has no temperature gradient.', ok: false },
      { t: 'T at the two sensing probes becomes closer, so ΔT drops. Signal tracks ΔT, not dT/dx at mid-wafer.', ok: true },
      { t: 'Carriers cannot diffuse from the center.', ok: false },
    ],
    why: 'There is still a local gradient under the iron. The ammeter only sees the temperature difference between the chosen probe pair.',
  },
};

class WaferLab {
  constructor() {
    this.id = 'A';
    this.guided = true;
    this.stage = 'probe';
    this.trials = [];
    this.hotLocked = false;
    this.Ith = 0;
    this.asked = {};
    this.views = {
      probe: new WaferCanvas(document.getElementById('cv-probe')),
      contact: new WaferCanvas(document.getElementById('cv-contact')),
      hot: new WaferCanvas(document.getElementById('cv-hot')),
    };
    this.views.probe.mode = 'four';
    this.views.contact.mode = 'four';
    this.views.contact.contactLesson = true;
    this.views.hot.mode = 'hot';
    this.views.hot.onIron = () => this._hotLive();
    this.chart = null;
    this.visited = { id: false, np: false, mu: false };
    this._picks();
    this._bind();
    const ids = Object.keys(WAFERS);
    this.setWafer(ids[Math.floor(Math.random() * ids.length)]);
    this._resize();
    this._last = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
    window.addEventListener('resize', () => this._resize());
  }

  wafer() { return WAFERS[this.id]; }

  _picks() {
    const box = document.getElementById('wafer-picks');
    box.innerHTML = '';
    Object.keys(WAFERS).forEach((id) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wl-chip rounded-lg border border-white/15 px-2.5 py-1 text-xs font-semibold';
      b.textContent = id;
      b.addEventListener('click', () => this.setWafer(id, { keepTrials: false }));
      box.appendChild(b);
    });
  }

  _bind() {
    document.getElementById('guided').addEventListener('change', (e) => {
      this.guided = e.target.checked;
      this._gates();
    });
    document.getElementById('btn-random').addEventListener('click', () => {
      const ids = Object.keys(WAFERS);
      this.setWafer(ids[Math.floor(Math.random() * ids.length)]);
    });
    document.getElementById('vs').addEventListener('input', () => this._live());
    document.getElementById('rc').addEventListener('input', () => this._live());
    ['sh-e', 'sh-h', 'sh-j', 'sh-f'].forEach((id) => {
      document.getElementById(id).addEventListener('change', () => this._vizFlags());
    });
    document.getElementById('btn-calc').addEventListener('click', () => this._record());
    document.querySelectorAll('[data-stage]').forEach((b) => {
      b.addEventListener('click', () => {
        if (b.disabled) return;
        this.setStage(b.dataset.stage);
      });
    });
    document.querySelectorAll('[data-pm]').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('[data-pm]').forEach((x) => x.classList.toggle('is-on', x === b));
        this.views.contact.probeMode = b.dataset.pm;
        this._live();
        if (b.dataset.pm === '2') this._ask('two');
      });
    });
    document.querySelectorAll('[data-pair]').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('[data-pair]').forEach((x) => x.classList.toggle('is-on', x === b));
        this.views.hot.pair = b.dataset.pair === '23' ? [1, 2] : [0, 3];
        this._hotLive();
      });
    });
    document.getElementById('btn-hotlock').addEventListener('click', () => {
      this._ask('sign', () => {
        this._ask('center', () => {
          this.hotLocked = true;
          this._gates();
          if (!this.guided || this.trials.length >= 3) this.setStage('id');
        });
      });
    });
  }

  setWafer(id) {
    this.id = id;
    this.trials = [];
    this.hotLocked = false;
    this.asked = {};
    this.visited = { id: false, np: false, mu: false };
    this.est = null;
    this.n = null;
    this.p = null;
    this.mu = null;
    document.querySelectorAll('#wafer-picks .wl-chip').forEach((b) => b.classList.toggle('is-on', b.textContent === id));
    Object.values(this.views).forEach((v) => v.setWafer(this.wafer()));
    document.getElementById('t-lab').textContent = `${this.wafer().tMm.toFixed(3)} mm`;
    document.getElementById('trials').innerHTML = '';
    document.getElementById('rho-avg').textContent = 'need 3 trials';
    document.getElementById('trial-n').textContent = '0 / 3';
    document.getElementById('btn-calc').disabled = false;
    document.getElementById('ask').classList.add('hidden');
    renderKatex(document.getElementById('eq-rho'), String.raw`\rho=\dfrac{\pi}{\ln 2}\,t\,\dfrac{V_{23}}{I_{14}}\quad t\ \mathrm{in\ cm}`, true);
    this._gates();
    this._live();
    this.setStage('probe');
  }

  setStage(id) {
    this.stage = id;
    document.querySelectorAll('[data-stage]').forEach((b) => b.classList.toggle('is-on', b.dataset.stage === id));
    document.querySelectorAll('[data-panel]').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== id));
    this._resize();
    if (id === 'contact') this._ask('sense');
    if (id === 'hot') this.views.hot.mode = 'hot';
    if (id === 'id') this._identify();
    if (id === 'np') this._np();
    if (id === 'mu') this._mu();
    if (id === 'card') this._card();
  }

  _vizFlags() {
    const e = document.getElementById('sh-e').checked;
    const h = document.getElementById('sh-h').checked;
    const j = document.getElementById('sh-j').checked;
    const f = document.getElementById('sh-f').checked;
    Object.values(this.views).forEach((v) => {
      v.showE = e; v.showH = h; v.showJ = j; v.showF = f;
    });
  }

  _live() {
    const Vs = Number(document.getElementById('vs').value);
    const Rc = Number(document.getElementById('rc').value);
    document.getElementById('vs-lab').textContent = `${Vs.toFixed(2)} V`;
    document.getElementById('rc-lab').textContent = `${Rc.toFixed(0)} Ω`;
    const m = measure4pp(this.wafer(), Vs, Rc, false);
    document.getElementById('i14').textContent = formatI(m.I);
    document.getElementById('v23').textContent = formatV(m.V23);
    this.views.probe.Vs = Vs;
    this.views.probe.I = m.I;
    this.views.probe.V23 = m.V23;
    this.views.probe.Rc = Rc;
    this.views.probe.probeMode = '4';
    const two = measure2pp(this.wafer(), Vs, Rc);
    const fourR = m.V23 / m.I;
    this.views.contact.Vs = Vs;
    this.views.contact.I = this.views.contact.probeMode === '2' ? two.I : m.I;
    this.views.contact.Rc = Rc;
    const read = document.getElementById('contact-read');
    if (this.views.contact.probeMode === '2') {
      read.textContent = `2-probe R_meas = V/I = ${two.R.toFixed(1)} Ω. Raise R_c and watch this climb.`;
    } else {
      read.textContent = `4-probe V23/I = ${fourR.toFixed(4)} Ω. Sense R_c does not enter. Drive R_c changes I, not V/I.`;
    }
    if (this.wafer().type === 'i' && m.I < 5e-6) this._ask('intrinsic');
    this._hotLive();
  }

  _record() {
    if (this.trials.length >= 3) return;
    const Vs = Number(document.getElementById('vs').value);
    const Rc = Number(document.getElementById('rc').value);
    const m = measure4pp(this.wafer(), Vs, Rc, true);
    this.trials.push(m);
    const tr = document.getElementById('trials');
    const row = document.createElement('tr');
    row.innerHTML = `<td>${this.trials.length}</td><td>${formatV(m.V23)}</td><td>${formatI(m.I)}</td><td>${formatRho(m.rho)}</td>`;
    tr.appendChild(row);
    document.getElementById('trial-n').textContent = `${this.trials.length} / 3`;
    if (this.trials.length === 3) {
      const avg = this.trials.reduce((s, t) => s + t.rho, 0) / 3;
      document.getElementById('rho-avg').textContent = formatRho(avg);
      document.getElementById('btn-calc').disabled = true;
      this._gates();
    }
  }

  _hotLive() {
    const v = this.views.hot;
    const pair = v.pair;
    const TA = Tof(PROBE_X[pair[0]], v.xIron, v.Ttip);
    const TB = Tof(PROBE_X[pair[1]], v.xIron, v.Ttip);
    const I = thermoCurrent(this.wafer(), TA, TB);
    this.Ith = I;
    v.I = I;
    const Thot = Math.max(TA, TB);
    const Tcold = Math.min(TA, TB);
    document.getElementById('hot-temps').innerHTML =
      `T${pair[0] + 1} = ${TA.toFixed(0)} K · T${pair[1] + 1} = ${TB.toFixed(0)} K<br>` +
      `T<sub>hot</sub> = ${Thot.toFixed(0)} K · T<sub>cold</sub> = ${Tcold.toFixed(0)} K<br>` +
      `ΔT = T<sub>hot</sub> - T<sub>cold</sub> = ${(Thot - Tcold).toFixed(1)} K<br>` +
      `T${pair[0] + 1} - T${pair[1] + 1} = ${(TA - TB).toFixed(1)} K (signed pair difference, not dT/dx)`;
    document.getElementById('ith').textContent = formatI(I);
    const w = this.wafer();
    let msg = 'Move the iron. Signal tracks ΔT between the selected probes.';
    if (w.type === 'i') msg = 'Near-intrinsic: both carriers move. The thermoelectric sign is weak and easy to misread.';
    else if (Math.abs(TA - TB) > 25) {
      msg = I > 0
        ? 'I > 0 with + on probe 1 while the iron is nearer probe 1: hot end went positive. Majority carriers are electrons (n-type).'
        : 'I < 0 with + on probe 1 while the iron is nearer probe 1: hot end went negative. Majority carriers are holes (p-type).';
    }
    document.getElementById('hot-sign').textContent = msg;
    const tx = document.getElementById('cv-tx');
    if (!tx.closest('.hidden')) drawTx(tx, v.xIron, v.Ttip, pair);
  }

  rhoAvg() {
    if (this.trials.length < 3) return this.wafer().rho;
    return this.trials.reduce((s, t) => s + t.rho, 0) / 3;
  }

  _identify() {
    const rho = this.rhoAvg();
    const type = this.wafer().type;
    const est = estimateN(rho, type);
    this.est = est;
    if (!this.chart) this.chart = new IrvinChart(document.getElementById('cv-irvin'));
    this.chart.update(rho, type, est.usable ? est.N : null);
    const label = type === 'n' ? 'N_D' : type === 'p' ? 'N_A' : 'n_i';
    document.getElementById('id-out').innerHTML = est.usable
      ? `ρ = ${formatRho(rho)} intersects the ${type}-branch at ${label} ≈ ${sci(est.N).html} cm<sup>−3</sup>`
      : `ρ = ${formatRho(rho)} sits at the intrinsic floor. A doping number from the Irvin curves would be fake precision.`;
    document.getElementById('id-note').textContent = type === 'i'
      ? 'Wafer C is not “a little n” or “a little p.” n ≈ p ≈ n_i, so ρ ≈ 1 / [q n_i (μ_n+μ_p)].'
      : 'The other branch has a different N for the same ρ. That is why the hot-probe sign is required.';
    this.visited.id = true;
    this._gates();
  }

  _np() {
    this._ensure();
    const w = this.wafer();
    const est = this.est;
    let n; let p;
    if (w.type === 'n') { n = est.N; p = (NI * NI) / n; }
    else if (w.type === 'p') { p = est.N; n = (NI * NI) / p; }
    else { n = NI; p = NI; }
    this.n = n; this.p = p;
    const tex = w.type === 'n'
      ? String.raw`n\approx N_D,\quad p=n_i^2/n`
      : w.type === 'p'
        ? String.raw`p\approx N_A,\quad n=n_i^2/p`
        : String.raw`n\approx p\approx n_i`;
    renderKatex(document.getElementById('eq-np'), tex, true);
    const logw = (c) => `${Math.max(4, ((Math.log10(c) - 4) / 16) * 100)}%`;
    document.getElementById('bar-n').style.width = logw(n);
    document.getElementById('bar-p').style.width = logw(p);
    const nTag = n > p ? '(majority)' : n < p ? '(minority)' : '(n ≈ p)';
    const pTag = p > n ? '(majority)' : p < n ? '(minority)' : '(n ≈ p)';
    document.getElementById('n-read').innerHTML = `${sci(n).html} cm<sup>−3</sup> ${nTag}`;
    document.getElementById('p-read').innerHTML = `${sci(p).html} cm<sup>−3</sup> ${pTag}`;
    this.visited.np = true;
    this._gates();
  }

  _mu() {
    this._ensure();
    const w = this.wafer();
    const rho = this.rhoAvg();
    const n = this.n; const p = this.p;
    const sig = 1 / rho;
    renderKatex(document.getElementById('eq-sig'), String.raw`\sigma=q(n\mu_n+p\mu_p)=1/\rho=${sig.toExponential(3)}\ \mathrm{S/cm}`, true);
    let mu; let tex;
    if (w.type === 'n') {
      mu = 1 / (Q * n * rho);
      tex = String.raw`\mu_n\approx 1/(q n \rho)=${mu.toFixed(0)}\ \mathrm{cm}^2/\mathrm{V\cdot s}`;
    } else if (w.type === 'p') {
      mu = 1 / (Q * p * rho);
      tex = String.raw`\mu_p\approx 1/(q p \rho)=${mu.toFixed(0)}\ \mathrm{cm}^2/\mathrm{V\cdot s}`;
    } else {
      mu = null;
      tex = String.raw`\mathrm{intrinsic\ mixed.}\ \sigma\approx q n_i(\mu_n+\mu_p)`;
    }
    this.mu = mu;
    renderKatex(document.getElementById('eq-mu'), tex, true);
    document.getElementById('mu-note').textContent = w.type === 'i'
      ? 'Do not extract a single majority mobility here. Both carriers contribute.'
      : `Majority term dominates. A Caughey-Thomas sketch at this N is ${mobilityOf(w.type, w.type === 'n' ? n : p).toFixed(0)} cm²/V·s.`;
    this.visited.mu = true;
    this._gates();
  }

  _ensure() {
    if (!this.est) this.est = estimateN(this.rhoAvg(), this.wafer().type);
    if (this.n == null || this.p == null) {
      const w = this.wafer();
      if (w.type === 'n') { this.n = this.est.N; this.p = (NI * NI) / this.n; }
      else if (w.type === 'p') { this.p = this.est.N; this.n = (NI * NI) / this.p; }
      else { this.n = NI; this.p = NI; }
    }
    if (this.mu == null && this.wafer().type !== 'i') {
      const maj = this.wafer().type === 'n' ? this.n : this.p;
      this.mu = 1 / (Q * maj * this.rhoAvg());
    }
  }

  _card() {
    this._ensure();
    const w = this.wafer();
    const rho = this.rhoAvg();
    const typeName = w.type === 'n' ? 'n-type' : w.type === 'p' ? 'p-type' : 'intrinsic';
    const maj = w.type === 'n' ? 'electrons' : w.type === 'p' ? 'holes' : 'neither dominates';
    const min = w.type === 'n' ? 'holes' : w.type === 'p' ? 'electrons' : 'both ≈ n_i';
    const nHtml = `${sci(this.n).html} cm<sup>−3</sup>`;
    const pHtml = `${sci(this.p).html} cm<sup>−3</sup>`;
    document.getElementById('card-title').textContent = `Mystery Wafer ${w.id}`;
    const rows = [
      ['Type', typeName],
      ['Measured resistivity', formatRho(rho)],
      ['Estimated dopant concentration', w.type === 'i' ? 'not a useful N from Irvin' : `${sci(this.est.N).html} cm<sup>−3</sup>`],
      ['Majority carrier', maj],
      ['Majority concentration', w.type === 'n' ? nHtml : w.type === 'p' ? pHtml : nHtml],
      ['Minority carrier', min],
      ['Minority concentration', w.type === 'n' ? pHtml : w.type === 'p' ? nHtml : pHtml],
      ['Estimated mobility', w.type === 'i' || this.mu == null ? 'mixed, not extracted' : `${this.mu.toFixed(0)} cm²/V·s`],
    ];
    document.getElementById('card-dl').innerHTML = rows.map(([k, v]) =>
      `<div><dt class="text-slate-500">${k}</dt><dd class="text-slate-100">${v}</dd></div>`).join('');
    document.getElementById('card-chain').innerHTML = [
      'V and I', 'ρ', 'hot-probe sign', 'n / p / i', 'N_D or N_A', 'n and p', 'μ',
    ].map((s, i, a) => `<span>${s}</span>${i < a.length - 1 ? '<i class="fa-solid fa-arrow-right"></i>' : ''}`).join('');
  }

  _gates() {
    const free = !this.guided;
    const idOk = free || (this.trials.length >= 3 && this.hotLocked);
    document.getElementById('btn-id').disabled = !idOk;
    document.getElementById('btn-np').disabled = !(free || this.visited.id);
    document.getElementById('btn-mu').disabled = !(free || this.visited.np);
    document.getElementById('btn-card').disabled = !(free || this.visited.mu);
  }

  _ask(key, after) {
    if (!this.guided || this.asked[key]) { if (after) after(); return; }
    this.asked[key] = true;
    const Qs = QUESTIONS[key];
    const box = document.getElementById('ask');
    box.classList.remove('hidden');
    document.getElementById('ask-q').textContent = Qs.q;
    document.getElementById('ask-why').classList.add('hidden');
    const opts = document.getElementById('ask-opts');
    opts.innerHTML = '';
    const oldGo = document.getElementById('ask-go');
    if (oldGo) oldGo.remove();
    const finish = () => { box.classList.add('hidden'); if (after) after(); };
    Qs.opts.forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rounded-lg border border-white/15 px-3 py-2 text-left text-sm text-slate-200';
      b.textContent = o.t;
      b.addEventListener('click', () => {
        b.className += o.ok ? ' border-emerald-400/50 text-emerald-100' : ' border-red-400/40 text-red-200';
        const why = document.getElementById('ask-why');
        why.textContent = (o.ok ? '' : 'Not that. ') + Qs.why;
        why.classList.remove('hidden');
        if (o.ok) setTimeout(finish, 700);
        else if (!document.getElementById('ask-go')) {
          const go = document.createElement('button');
          go.id = 'ask-go';
          go.type = 'button';
          go.className = 'mt-3 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200';
          go.textContent = 'Continue';
          go.addEventListener('click', finish);
          box.appendChild(go);
        }
      });
      opts.appendChild(b);
    });
  }

  _resize() {
    Object.values(this.views).forEach((v) => v.resize());
    if (this.chart) this.chart.chart.resize();
    this._hotLive();
  }

  _loop(now) {
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    const vis = this.views[this.stage === 'contact' ? 'contact' : this.stage === 'hot' ? 'hot' : 'probe'];
    if (vis) { vis.tick(dt); vis.draw(); }
    requestAnimationFrame(this._loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__waferLab = new WaferLab();
});
