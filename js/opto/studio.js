import {
  MATERIALS, material, ePhoton, lambdaFromE, photonRegime, energySplit,
  alphaDirect, absorbedFraction, beer, generationRate, depletion, pinWidth,
  diffusionLength, collectionProb, photocurrentApprox, sigmaOf, barResistance,
  photoconductorI, diodeCurrent, voc, iscSigned, illuminatedI, ivCurve, mpp,
  powerPassive, regimeOf, junctionCap, rcTime, transitTime, responsivityTeaching,
  qeTeaching, collectedFromPower, planckBlambda, wienPeakNm, am15Irradiance,
  shockleyQueisser, tandemSQ, am15Jsc, wavelengthColor, C, sci, vt,
} from '../physics/opto.js';
import { makeLineChart, setXY, scatter } from './charts.js';
import {
  paintPhoton, tickPhoton, paintCollect, tickCollect, paintCompare, paintIV,
  paintSpeed, paintQE, paintSolar, paintBandgap, paintSpectrum, paintAbsorb,
} from './draw.js';

const SIMS = [
  { id: 'photon', title: 'Photon vs Eg', hint: 'Why a wide-gap crystal transmits red' },
  { id: 'collect', title: 'Generation & collection', hint: 'Drift in W vs diffusion outside' },
  { id: 'compare', title: 'Photoconductor vs diode', hint: 'LDR vs illuminated junction' },
  { id: 'iv', title: 'Illuminated I–V', hint: 'One junction, three jobs' },
  { id: 'speed', title: 'W vs speed', hint: 'Collection, Cj, and transit compete' },
  { id: 'qe', title: 'Responsivity & QE', hint: 'R can rise with λ at fixed QE' },
  { id: 'solar', title: 'Solar cell & FF', hint: 'MPP is not Voc or Isc' },
  { id: 'bandgap', title: 'Eg vs efficiency', hint: 'Current–voltage tradeoff' },
  { id: 'spectrum', title: 'Planck & the Sun', hint: 'Wien: hot peaks short' },
  { id: 'absorb', title: 'Absorption depth', hint: 'Optical ≠ electrical collection' },
];

function params() {
  return new URLSearchParams(location.search);
}
function go(q) {
  const u = new URL(location.href);
  u.search = q.startsWith('?') ? q : `?${q}`;
  history.pushState({}, '', u);
  boot();
}
function root() { return document.getElementById('pd-root'); }
function tex(el, s, display) {
  if (!el) return;
  if (window.katex && s) window.katex.render(s, el, { throwOnError: false, displayMode: !!display });
  else if (s) el.textContent = s;
}

function nav(active) {
  const host = document.getElementById('pd-nav');
  host.innerHTML = `<a href="photodetectors.html" data-id="hub" class="pd-chip ${active === 'hub' ? 'is-on' : ''}">Lab home</a>`
    + SIMS.map((s) => `<a href="photodetectors.html?sim=${s.id}" data-id="${s.id}" class="pd-chip ${active === s.id ? 'is-on' : ''}">${s.title}</a>`).join('');
  host.querySelectorAll('a').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    go(a.dataset.id === 'hub' ? '' : `sim=${a.dataset.id}`);
  }));
}

function slider(id, label, min, max, step, val) {
  return `<label class="pd-lab">${label}<span data-v="${id}"></span>
    <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}" /></label>`;
}

function stopLoop() {
  if (window._pdRaf) {
    cancelAnimationFrame(window._pdRaf);
    window._pdRaf = 0;
  }
  if (window._pdChart) {
    try { window._pdChart.destroy(); } catch (_) { /* already gone */ }
    window._pdChart = null;
  }
}

export function boot() {
  stopLoop();
  const id = params().get('sim') || 'hub';
  nav(id);
  if (id === 'hub') return renderHub();
  renderSim(id);
}

function renderHub() {
  root().innerHTML = `
    <section class="glass rounded-2xl p-5 sm:p-6">
      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/90">Lecture 6 · optoelectronics</p>
      <h2 class="mt-1 text-2xl font-bold text-white">Photodetectors and photovoltaics</h2>
      <p class="mt-2 max-w-3xl text-sm text-slate-400">Move a slider. Watch the microscopic picture, the equation, and the measurable I, V, or η move together. Models are labeled. None of this is a foundry PDK.</p>
    </section>
    <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${SIMS.map((s) => `<article class="glass-card flex flex-col rounded-2xl p-5">
        <h3 class="text-lg font-semibold text-white">${s.title}</h3>
        <p class="mt-2 flex-1 text-sm text-slate-400">${s.hint}</p>
        <button type="button" data-go="${s.id}" class="launch-btn mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-white">Open</button>
      </article>`).join('')}
    </div>`;
  root().querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(`sim=${b.dataset.go}`)));
}

function layout(spec) {
  root().innerHTML = `
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-white">${spec.title}</h2>
        <p class="mt-1 max-w-3xl text-sm text-slate-400">${spec.lede}</p>
      </div>
      <button type="button" id="pd-reset" class="pd-chip">Reset to lecture baseline</button>
    </div>
    <section class="glass mt-4 rounded-2xl p-4">
      <div id="pd-ctrl" class="grid gap-3 md:grid-cols-2 xl:grid-cols-4"></div>
      <div id="pd-presets" class="mt-3 flex flex-wrap gap-1.5"></div>
    </section>
    <div class="mt-4 grid gap-4 xl:grid-cols-2">
      <div>
        <div class="pd-view"><canvas id="cv-viz"></canvas></div>
        <p id="pd-read" class="pd-read mt-2"></p>
      </div>
      <div>
        <div class="pd-plot"><canvas id="cv-plot"></canvas></div>
      </div>
    </div>
    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <article class="glass rounded-2xl p-4">
        <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Live model</p>
        <div id="pd-eq" class="eq mt-2 text-sky-100"></div>
        <p id="pd-vals" class="pd-read mt-2"></p>
        <p id="pd-model" class="pd-model mt-2"></p>
      </article>
      <article class="glass pd-why rounded-2xl p-4">
        <p class="text-xs uppercase tracking-[0.16em] text-amber-200/80">What just changed</p>
        <p id="pd-why" class="mt-2 text-sm text-slate-200"></p>
      </article>
    </div>
    <article class="glass mt-4 rounded-2xl p-4">
      <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Concept check</p>
      <p id="pd-q" class="mt-2 text-sm font-semibold text-amber-100"></p>
      <div id="pd-opts" class="mt-3 space-y-2"></div>
      <p id="pd-explain" class="mt-3 hidden text-sm text-slate-300"></p>
    </article>`;
}

function esc(s) {
  return String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function bindConcept(q) {
  document.getElementById('pd-q').textContent = q.prompt;
  document.getElementById('pd-opts').innerHTML = q.choices.map((c, i) =>
    `<label class="pd-choice"><input type="radio" name="pdq" value="${i}"/> ${esc(c)}</label>`).join('');
  const box = document.getElementById('pd-explain');
  box.classList.add('hidden');
  document.getElementById('pd-opts').querySelectorAll('input').forEach((inp) => {
    inp.addEventListener('change', () => {
      const ok = Number(inp.value) === q.answer;
      box.classList.remove('hidden');
      box.innerHTML = `<span class="${ok ? 'pd-ok' : 'pd-bad'}">${ok ? 'Yes.' : 'Not that.'}</span> ${esc(q.why)}`;
    });
  });
}

function renderSim(id) {
  const spec = SPECS[id];
  if (!spec) return renderHub();
  layout(spec);
  document.getElementById('pd-ctrl').innerHTML = spec.controls();
  document.getElementById('pd-presets').innerHTML = spec.presets ? spec.presets() : '';
  bindConcept(spec.question);
  const chart = makeLineChart(document.getElementById('cv-plot'), '');
  window._pdChart = chart;
  const st = { parts: [], tally: { gen: 0, col: 0, rec: 0 }, t: 0 };
  const read = () => spec.read();
  const paintAll = () => {
    try {
      const s = read();
      spec.labels(s);
      const m = spec.model(s, st);
      st.m = m;
      spec.draw(document.getElementById('cv-viz'), m, st);
      spec.chart(chart, m);
      tex(document.getElementById('pd-eq'), spec.tex);
      document.getElementById('pd-vals').innerHTML = spec.vals(m);
      document.getElementById('pd-why').textContent = spec.why(m);
      document.getElementById('pd-model').textContent = m.modelNote || spec.modelNote;
      document.getElementById('pd-read').innerHTML = spec.readout ? spec.readout(m, st) : '';
    } catch (err) {
      console.error(err);
      const why = document.getElementById('pd-why');
      if (why) why.textContent = String(err.message || err);
    }
  };
  root().querySelectorAll('input, select').forEach((el) => el.addEventListener('input', paintAll));
  document.getElementById('pd-presets').querySelectorAll('[data-pre]').forEach((b) => {
    b.addEventListener('click', () => { spec.applyPreset(b.dataset.pre); paintAll(); });
  });
  document.getElementById('pd-reset').addEventListener('click', () => { spec.reset(); paintAll(); });
  if (spec.click) {
    document.getElementById('cv-viz').addEventListener('pointerdown', (e) => {
      const r = e.target.getBoundingClientRect();
      spec.click((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, st, read());
      paintAll();
    });
  }
  if (spec.onChart) {
    document.getElementById('cv-plot').onclick = (ev) => spec.onChart(chart, ev, paintAll);
  }
  let last = performance.now();
  const loop = (now) => {
    const cv = document.getElementById('cv-viz');
    if (!cv || !spec.animate) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    st.t += dt;
    if (spec.tick) spec.tick(st, dt, read());
    try {
      const s = read();
      const m = spec.model(s, st);
      spec.draw(cv, m, st);
    } catch (err) {
      console.error(err);
      return;
    }
    window._pdRaf = requestAnimationFrame(loop);
  };
  paintAll();
  if (spec.animate) window._pdRaf = requestAnimationFrame(loop);
}

function val(id) { return Number(document.getElementById(id).value); }
function setv(id, v) { const el = document.getElementById(id); if (el) el.value = v; }
function lab(id, text) { const el = document.querySelector(`[data-v="${id}"]`); if (el) el.textContent = text; }

const SPECS = {
  photon: {
    animate: true,
    title: 'Photon energy vs bandgap',
    lede: 'A photon is a ticket. Eg is the price of a band-to-band jump. Extra energy is not extra photocurrent. It is heat.',
    tex: 'E_{\\mathrm{ph}}=hc/\\lambda\\approx 1240/\\lambda(\\mathrm{nm})\\,\\mathrm{eV}',
    modelNote: 'Ideal crystal: no sub-gap absorption from defects. Thermalization dumps Eph−Eg to phonons.',
    controls: () => slider('lam', 'Wavelength λ (nm)', 200, 2500, 1, 700)
      + slider('Eg', 'Bandgap Eg (eV)', 0.2, 4, 0.01, 1.12)
      + slider('I0', 'Relative intensity', 0.1, 1, 0.05, 0.7),
    presets: () => Object.keys(MATERIALS).map((k) => `<button type="button" class="pd-chip" data-pre="${k}">${k}</button>`).join(''),
    applyPreset: (k) => { setv('Eg', MATERIALS[k].Eg); },
    reset: () => { setv('lam', 700); setv('Eg', 1.12); setv('I0', 0.7); },
    read: () => ({ lam: val('lam'), Eg: val('Eg'), intensity: val('I0') }),
    labels: (s) => { lab('lam', `${s.lam} nm`); lab('Eg', `${s.Eg.toFixed(2)} eV`); lab('I0', s.intensity.toFixed(2)); },
    model: (s) => {
      const Eph = ePhoton(s.lam).E;
      const split = energySplit(Eph, s.Eg);
      return { ...s, Eph, split, regime: split.regime, cutoff: lambdaFromE(s.Eg).lambdaNm, color: wavelengthColor(s.lam) };
    },
    draw: (cv, m, st) => { st.parts = tickPhoton(st.parts, m, 0.016); paintPhoton(cv, m, st.parts); },
    tick: () => {},
    chart: (ch, m) => {
      const xs = []; const eg = []; const ep = [];
      for (let L = 200; L <= 2500; L += 20) {
        xs.push(L); eg.push(m.Eg); ep.push(ePhoton(L).E);
      }
      setXY(ch, 'λ (nm)', 'E (eV)', [
        scatter(xs, ep, '#fbbf24', 'Eph(λ)'),
        scatter(xs, eg, '#38bdf8', 'Eg'),
        scatter([m.cutoff], [m.Eg], '#f43f5e', 'cutoff', { pointRadius: 5, showLine: false }),
      ]);
    },
    vals: (m) => `Eph = ${m.Eph.toFixed(3)} eV · λg = ${m.cutoff.toFixed(0)} nm · usable ${m.split.usable.toFixed(3)} eV · heat ${m.split.thermal.toFixed(3)} eV`,
    why: (m) => {
      if (m.regime.id === 'below') return `Eph < Eg. No final CB state at this k. The slab is transparent to ${m.color.name}. A larger Eg makes more of the red/IR side a free pass.`;
      if (m.regime.id === 'edge') return `Eph ≈ Eg. The photon just pays the gap. Almost no leftover heat.`;
      return `Eph > Eg. The electron is created hot and dumps ${m.split.thermal.toFixed(2)} eV as phonons before it sits at Ec. Intensity scales how many tickets arrive, not the ticket price.`;
    },
    question: {
      prompt: 'Why does a large-bandgap semiconductor transmit more low-energy photons?',
      choices: [
        'Large Eg means electrons are heavier, so they cannot absorb light.',
        'A larger Eg raises the minimum photon energy that can make a band-to-band pair, so more of the red/IR spectrum is below cutoff.',
        'Large Eg crystals are always thinner.',
        'Large Eg converts leftover energy into extra photocurrent.',
      ],
      answer: 1,
      why: 'λg = 1240/Eg. Bigger gap, shorter cutoff. Photons with Eph < Eg do not buy a VB→CB jump in this model.',
    },
  },

  collect: {
    animate: true,
    title: 'Generation, recombination, collection',
    lede: 'A pair born in the field is swept apart. A pair born in the quasi-neutral region must diffuse. Collection is a race against recombination, with length L = √(Dτ).',
    tex: 'L=\\sqrt{D\\tau},\\quad D=(kT/q)\\mu',
    modelNote: 'Teaching collection: p=1 inside W (drift). Outside, p=exp(−d/L). Not a full continuity-equation solver.',
    controls: () => slider('Wsc', 'Depletion scale (relative)', 0.04, 0.28, 0.01, 0.12)
      + slider('tau', 'Lifetime τ (µs)', 0.05, 20, 0.05, 1)
      + slider('Va', 'Bias VA (V)', -2, 0.5, 0.01, -1)
      + slider('Phi', 'Light intensity (rel.)', 0, 1, 0.05, 0.5),
    reset: () => { setv('Wsc', 0.12); setv('tau', 1); setv('Va', -1); setv('Phi', 0.5); },
    read: () => ({ Wsc: val('Wsc'), tau: val('tau') * 1e-6, Va: val('Va'), Phi: val('Phi') }),
    labels: (s) => { lab('Wsc', s.Wsc.toFixed(2)); lab('tau', `${(s.tau * 1e6).toFixed(2)} µs`); lab('Va', `${s.Va.toFixed(2)} V`); lab('Phi', s.Phi.toFixed(2)); },
    model: (s, st) => {
      const mat = material('Si');
      const mu = 1350;
      const { L } = diffusionLength(mu, s.tau, 300);
      const dep = depletion(1e16, 1e16, s.Va, 300, mat);
      const xpFrac = Math.min(0.45, s.Wsc * dep.xp / Math.max(dep.W, 1e-7));
      const xnFrac = Math.min(0.45, s.Wsc * dep.xn / Math.max(dep.W, 1e-7));
      const eta = st.tally.gen ? st.tally.col / st.tally.gen : 0;
      return { ...s, L, dep, xpFrac, xnFrac, eta, Iph: eta * s.Phi * 1e-3, modelNote: dep.model };
    },
    click: (x, y, st, s) => {
      const m = SPECS.collect.model(s, st);
      const xcm = (x - 0.5) * 4e-4;
      const pr = collectionProb(xcm, m.dep.xp, m.dep.xn, m.L, m.L);
      st.tally.gen += 1;
      st.parts.push({ x, y: Math.min(0.75, Math.max(0.25, y)), kind: 'e', collectP: pr.p, life: 0.35, age: 0 });
      st.parts.push({ x, y: Math.min(0.75, Math.max(0.25, y)), kind: 'h', collectP: pr.p, life: 0.35, age: 0 });
      if (Math.random() < pr.p) st.tally.col += 1;
      else st.tally.rec += 1;
    },
    draw: (cv, m, st) => { st.parts = tickCollect(st.parts, m, 0.016); paintCollect(cv, m, st.parts); },
    chart: (ch, m) => {
      const xs = []; const ps = [];
      for (let i = 0; i <= 80; i++) {
        const x = -2e-4 + 4e-4 * (i / 80);
        xs.push(x * 1e4);
        ps.push(collectionProb(x, m.dep.xp, m.dep.xn, m.L, m.L).p);
      }
      setXY(ch, 'x (µm), junction at 0', 'collection probability', [scatter(xs, ps, '#34d399', 'p_coll(x)')]);
    },
    vals: (m) => `W = ${sci(m.dep.W)} cm · L = ${sci(m.L)} cm · VA = ${m.Va.toFixed(2)} V (${m.Va < 0 ? 'reverse, W up' : m.Va > 0 ? 'forward, W down' : 'eq'})`,
    why: (m) => m.Va < 0
      ? 'Reverse bias widens W. More of the crystal is a drift region, so a random birth is more likely to be swept than to recombine.'
      : 'Outside W the carrier random-walks. If the remaining distance is several L, recombination wins. Drift and diffusion are different movies.',
    readout: (_m, st) => `generated ${st.tally.gen} · collected ${st.tally.col} · recombined ${st.tally.rec} · η_coll = ${st.tally.gen ? (100 * st.tally.col / st.tally.gen).toFixed(0) : '—'}%`,
    question: {
      prompt: 'A pair is born several diffusion lengths from the depletion edge. Why is it unlikely to contribute current?',
      choices: [
        'Photons cannot be absorbed outside W.',
        'It must diffuse to the field. The chance of surviving without recombining falls as exp(−d/L).',
        'The electric field points the wrong way in the bulk.',
        'Holes cannot exist in n-type material.',
      ],
      answer: 1,
      why: 'Neutral regions have no net field (teaching model). Collection is diffusion vs lifetime. L is that race’s length scale.',
    },
  },

  compare: {
    animate: true,
    title: 'Photoconductor vs photodiode',
    lede: 'A photoconductor is a light-dependent resistor: extra carriers raise σ. A reverse photodiode is a current source sitting near −Iph. Same photons, different circuit element.',
    tex: '\\sigma=q(\\mu_n n+\\mu_p p),\\quad I=I_0(e^{qV/kT}-1)-I_{\\mathrm{ph}}',
    modelNote: 'Photoconductor: uniform generation, ohmic contacts, no gain. Photodiode: reverse-biased abrupt Si junction.',
    controls: () => slider('Phi', 'Light (rel. excess n)', 0, 5, 0.05, 1)
      + slider('V', 'Applied |V| (V)', 0.1, 5, 0.05, 2)
      + slider('mu', 'μn (cm²/V·s)', 200, 8000, 50, 1350)
      + slider('T', 'T (K)', 250, 400, 1, 300),
    reset: () => { setv('Phi', 1); setv('V', 2); setv('mu', 1350); setv('T', 300); },
    read: () => ({ Phi: val('Phi'), V: val('V'), mu: val('mu'), T: val('T') }),
    labels: (s) => { lab('Phi', s.Phi.toFixed(2)); lab('V', `${s.V.toFixed(2)} V`); lab('mu', `${s.mu}`); lab('T', `${s.T} K`); },
    model: (s) => {
      const n0 = 1e10;
      const n = n0 + s.Phi * 5e15;
      const p = n0;
      const sig = sigmaOf(n, p, s.mu, 480);
      const R = barResistance(0.1, 1e-4, sig.total);
      const Ipc = photoconductorI(s.V, R).I;
      const Iph = s.Phi * 2e-4;
      const Ipd = diodeCurrent(-s.V, 1e-12, s.T, Iph);
      return {
        ...s, n, sig, R, Ipc, Iph, Ipd: Ipd.I, pcFill: Math.min(1, n / 6e15),
        pdWfrac: 0.2 + 0.15 * Math.sqrt(s.V), t: performance.now() / 1000,
        modelNote: 'PC response time ~ lifetime. PD response time ~ RC and transit (see the W vs speed pane).',
      };
    },
    draw: (cv, m) => paintCompare(cv, m),
    chart: (ch, m) => {
      const xs = []; const ipc = []; const ipd = [];
      for (let ph = 0; ph <= 5; ph += 0.1) {
        xs.push(ph);
        const n = 1e10 + ph * 5e15;
        const sig = sigmaOf(n, 1e10, m.mu, 480);
        ipc.push(photoconductorI(m.V, barResistance(0.1, 1e-4, sig.total)).I);
        ipd.push(Math.abs(diodeCurrent(-m.V, 1e-12, m.T, ph * 2e-4).I));
      }
      setXY(ch, 'relative light', '|I| (A)', [
        scatter(xs, ipc, '#fbbf24', 'photoconductor'),
        scatter(xs, ipd, '#c4b5fd', 'photodiode |I|'),
      ]);
    },
    vals: (m) => `PC: σ=${sci(m.sig.total)} S/cm, R=${sci(m.R)} Ω, I=${sci(m.Ipc)} A · PD: I=${sci(m.Ipd)} A ≈ −Iph`,
    why: (m) => `Photoconductor current scales with how many carriers are present (and with μ). Photodiode reverse current saturates near Iph=${sci(m.Iph)} A: extra reverse volts do not mint extra pairs, they only help collection.`,
    question: {
      prompt: 'Why is a photoconductor approximately an LDR, while a reverse photodiode is not?',
      choices: [
        'Both are resistors. The names are marketing.',
        'Illumination changes the photoconductor’s σ and therefore R=L/(σA). A reverse diode’s small-signal resistance is huge; light adds a current −Iph, not a conductance to the contacts.',
        'Photodiodes cannot absorb light.',
        'LDRs require a PN junction.',
      ],
      answer: 1,
      why: 'Circuit role is the point. σ(light) vs Iph(light). Sensitivity can be high for a photoconductor (photoconductive gain exists in real devices; this sim has gain = 1). Speed is usually worse because the sea of carriers must recombine.',
    },
  },

  iv: {
    title: 'Illuminated diode I–V',
    lede: 'Light shifts the entire Shockley curve down by Iph. The same piece of silicon is an LED, a photodetector, or a solar cell depending on the (V,I) point. Passive sign: P = IV.',
    tex: 'I(V)=I_0\\big(e^{qV/kT}-1\\big)-I_{\\mathrm{ph}}',
    modelNote: 'Ideal Shockley plus photocurrent. No Rs, Rsh, or breakdown.',
    controls: () => slider('V', 'Voltage V (V)', -1.2, 0.9, 0.01, -0.5)
      + slider('Iph', 'Iph (mA)', 0, 40, 0.5, 10)
      + slider('T', 'T (K)', 250, 400, 1, 300)
      + slider('I0d', 'log10 I0 (A)', -14, -8, 0.1, -12),
    reset: () => { setv('V', -0.5); setv('Iph', 10); setv('T', 300); setv('I0d', -12); },
    read: () => ({ V: val('V'), Iph: val('Iph') * 1e-3, T: val('T'), I0: 10 ** val('I0d') }),
    labels: (s) => { lab('V', `${s.V.toFixed(2)} V`); lab('Iph', `${(s.Iph * 1e3).toFixed(1)} mA`); lab('T', `${s.T} K`); lab('I0d', sci(s.I0)); },
    model: (s) => {
      const d = diodeCurrent(s.V, s.I0, s.T, s.Iph);
      const P = powerPassive(s.V, d.I);
      const reg = regimeOf(s.V, d.I);
      const Voc = voc(s.Iph, s.I0, s.T);
      return { ...s, I: d.I, P, reg, Voc, Isc: iscSigned(s.Iph), overflow: d.overflow };
    },
    draw: (cv, m) => paintIV(cv, m),
    onChart: (chart, ev, paintAll) => {
      const x = chart.scales.x.getValueForPixel(ev.offsetX);
      if (Number.isFinite(x)) { setv('V', Math.max(-1.2, Math.min(0.9, x))); paintAll(); }
    },
    chart: (ch, m) => {
      const vHi = Math.max(m.Voc + 0.08, 0.2);
      const dark = ivCurve({ I0: m.I0, T: m.T, Iph: 0, Rs: 0, Rsh: Infinity }, -1.2, vHi, 160);
      const lit = ivCurve({ I0: m.I0, T: m.T, Iph: m.Iph, Rs: 0, Rsh: Infinity }, -1.2, vHi, 160);
      const yAbs = Math.max(1.5 * Math.max(m.Iph, 1e-4), 0.005);
      setXY(ch, 'V (V)', 'I (A)', [
        scatter(dark.V, dark.I, '#64748b', 'dark'),
        scatter(lit.V, lit.I, '#38bdf8', 'illuminated'),
        scatter([m.V], [m.I], '#fbbf24', 'operating point', { pointRadius: 6, showLine: false }),
      ], { yMin: -yAbs, yMax: 0.35 * yAbs });
    },
    vals: (m) => `<span class="pd-quad ${m.reg.id}">${m.reg.label}</span>  I=${sci(m.I)} A · P=IV=${sci(m.P)} W · Voc=${m.Voc.toFixed(3)} V · Isc=${sci(m.Isc)} A${m.overflow ? ' · exp overflow flagged' : ''}`,
    why: (m) => {
      if (m.reg.id === 'pv') return 'Quadrant IV: V>0, I<0. The junction is forward of 0 but still below Voc, so light-generated current wins. P=IV is negative: the device delivers power.';
      if (m.reg.id === 'detector') return 'Reverse: the exponential is dead. I sits near −Iph. More reverse V does not increase Iph in this ideal law; it can help collection in a real diode (see W vs speed).';
      return 'Forward of Voc: the usual diode exponential overwhelms Iph. Current is positive. This is LED / diode-lamp territory, not a solar cell.';
    },
    question: {
      prompt: 'Illumination shifts the I–V curve downward. Why can the same PN junction be a detector or a solar cell?',
      choices: [
        'Detectors use holes; solar cells use electrons.',
        'The curve is the same physics. Reverse V, I≈−Iph is a photodetector. 0<V<Voc with I<0 is photovoltaic generation.',
        'Solar cells require a different semiconductor than photodiodes.',
        'The shift is an artifact of plotting −Iph.',
      ],
      answer: 1,
      why: 'Operating point, not a different device. Passive P=IV tells you who is supplying power.',
    },
  },

  speed: {
    title: 'Depletion width vs sensitivity and speed',
    lede: 'Reverse bias and lighter doping widen W. That can collect more generation, shrinks Cj, and lengthens the drift distance. Fastest is a compromise, not max W.',
    tex: 'W=\\sqrt{\\frac{2\\varepsilon_s}{q}\\Big(\\frac{1}{N_A}+\\frac{1}{N_D}\\Big)(V_{bi}-V)},\\quad C_j=\\varepsilon_s A/W',
    modelNote: 'Abrupt PN, or PIN with W ≥ Wi. Transit uses vd = min(μE, vsat). RC uses a 50 Ω load. Not a full small-signal model.',
    controls: () => slider('Vr', 'Reverse |V| (V)', 0, 20, 0.1, 5)
      + slider('NAlog', 'log10 NA (cm⁻³)', 15, 18, 0.01, 16)
      + slider('NDlog', 'log10 ND (cm⁻³)', 15, 18, 0.01, 16)
      + slider('Wi', 'PIN i-layer (µm)', 0, 50, 0.5, 0),
    presets: () => '<button type="button" class="pd-chip" data-pre="pn">PN</button><button type="button" class="pd-chip" data-pre="pin">PIN 20 µm</button>',
    applyPreset: (k) => { if (k === 'pn') setv('Wi', 0); if (k === 'pin') setv('Wi', 20); },
    reset: () => { setv('Vr', 5); setv('NAlog', 16); setv('NDlog', 16); setv('Wi', 0); },
    read: () => ({ Vr: val('Vr'), NA: 10 ** val('NAlog'), ND: 10 ** val('NDlog'), Wi: val('Wi') * 1e-4 }),
    labels: (s) => { lab('Vr', `${s.Vr.toFixed(1)} V`); lab('NAlog', sci(s.NA)); lab('NDlog', sci(s.ND)); lab('Wi', `${(s.Wi * 1e4).toFixed(1)} µm`); },
    model: (s) => {
      const mat = material('Si');
      const pin = s.Wi > 0;
      const dep = pin ? pinWidth(s.Wi, s.NA, s.ND, -s.Vr, 300, mat) : depletion(s.NA, s.ND, -s.Vr, 300, mat);
      const A = 1e-2;
      const Cj = junctionCap(dep.eps || mat.epsR * C.EPS0, A, Math.max(dep.W, 1e-7)).Cj;
      const tRC = rcTime(50, Cj);
      const E = dep.W > 0 ? dep.psi / dep.W : 0;
      const tr = transitTime(dep.W, 1350, E);
      const Iph = photocurrentApprox(A, 1e19, 8e-5, 8e-5, dep.W);
      const Wfrac = Math.min(0.9, dep.W / 5e-3);
      return {
        ...s, dep, Cj, tRC, tTr: tr.t, vd: tr.vd, Iph, Wfrac, pin, E,
        tau: Math.sqrt(tRC * tRC + tr.t * tr.t),
        modelNote: dep.model,
      };
    },
    draw: (cv, m) => paintSpeed(cv, m),
    chart: (ch, m) => {
      const xs = []; const rc = []; const tr = [];
      const mat = material('Si');
      for (let v = 0; v <= 20; v += 0.4) {
        const dep = m.pin ? pinWidth(m.Wi, m.NA, m.ND, -v, 300, mat) : depletion(m.NA, m.ND, -v, 300, mat);
        const W = Math.max(dep.W, 1e-7);
        xs.push(W * 1e4);
        rc.push(rcTime(50, junctionCap(mat.epsR * C.EPS0, 1e-2, W).Cj) * 1e9);
        tr.push(transitTime(W, 1350, dep.psi / W).t * 1e9);
      }
      setXY(ch, 'W (µm)', 'time (ns)', [
        scatter(xs, rc, '#38bdf8', 'τ_RC (50 Ω)'),
        scatter(xs, tr, '#f43f5e', 't_transit'),
      ]);
    },
    vals: (m) => `W=${sci(m.dep.W)} cm · Cj=${sci(m.Cj)} F · τ_RC=${sci(m.tRC)} s · t_tr=${sci(m.tTr)} s · Iph~${sci(m.Iph)} A`,
    why: (m) => m.tTr > m.tRC
      ? 'Transit already dominates. Growing W further makes the carrier’s commute longer. That is not “faster.” PIN is useful when you want a thick absorber without needing huge reverse voltage, but you still pay t_tr ≈ W/vd.'
      : 'RC still dominates: shrinking Cj by widening W helps. Keep watching the red transit curve. The fastest bias is near where the two times meet, not at infinite W.',
    question: {
      prompt: 'Why is the fastest photodiode not necessarily the one with the largest depletion width?',
      choices: [
        'Larger W always increases both RC and transit time.',
        'Larger W lowers Cj (helps RC) but lengthens the drift path (hurts transit). Those compete. Sensitivity also depends on where light is absorbed, not only on W.',
        'Large W forbids photocurrent.',
        'PIN diodes cannot be fast.',
      ],
      answer: 1,
      why: 'Two clocks. τ_RC = R εA/W falls with W. t_tr = W/vd rises with W. Collection Iph ≈ qA g (Ln+Lp+W) rises, but only the generation that actually sits in Ln, Lp, or W.',
    },
  },

  qe: {
    title: 'Responsivity and quantum efficiency',
    lede: 'QE counts electrons per photon. Responsivity counts amperes per watt. At fixed QE, longer λ means each watt is more photons, so R rises — until the gap cuts you off.',
    tex: 'R=I_{\\mathrm{ph}}/P_{\\mathrm{in}}=\\mathrm{QE}\\,q\\lambda/hc',
    modelNote: 'QE = η_coll × (1 if Eph≥Eg else 0) × (1−R_opt) teaching step. No interference, no EQE ripple.',
    controls: () => slider('lam', 'λ (nm)', 300, 1800, 1, 850)
      + slider('QE0', 'Internal QE (above gap)', 0.05, 1, 0.01, 0.8)
      + slider('Pin', 'Pin (mW)', 0.01, 5, 0.01, 1)
      + slider('Eg', 'Eg (eV)', 0.4, 2.5, 0.01, 1.12),
    reset: () => { setv('lam', 850); setv('QE0', 0.8); setv('Pin', 1); setv('Eg', 1.12); },
    read: () => ({ lam: val('lam'), QE0: val('QE0'), Pin: val('Pin') * 1e-3, Eg: val('Eg') }),
    labels: (s) => { lab('lam', `${s.lam} nm`); lab('QE0', s.QE0.toFixed(2)); lab('Pin', `${(s.Pin * 1e3).toFixed(2)} mW`); lab('Eg', `${s.Eg.toFixed(2)} eV`); },
    model: (s) => {
      const cut = ePhoton(s.lam).E < s.Eg;
      const QE = cut ? 0 : s.QE0;
      const R = responsivityTeaching(QE, s.lam);
      const col = collectedFromPower(s.Pin, s.lam, QE);
      return { ...s, cut, QE, R, ...col, nPhRel: Math.min(1, s.Pin / 5e-3), cutoff: lambdaFromE(s.Eg).lambdaNm };
    },
    draw: (cv, m) => paintQE(cv, m),
    chart: (ch, m) => {
      const xs = []; const r = []; const q = [];
      for (let L = 300; L <= 1800; L += 10) {
        xs.push(L);
        const QE = ePhoton(L).E < m.Eg ? 0 : m.QE0;
        q.push(QE);
        r.push(responsivityTeaching(QE, L));
      }
      setXY(ch, 'λ (nm)', 'R (A/W) and QE', [
        scatter(xs, r, '#fbbf24', 'R (A/W)'),
        scatter(xs, q, '#38bdf8', 'QE'),
      ]);
    },
    vals: (m) => `QE=${m.QE.toFixed(2)} · R=${m.R.toFixed(3)} A/W · Iph=${sci(m.Iph)} A · photons/s=${sci(m.nPh)} · e/s=${sci(m.nE)}`,
    why: (m) => m.cut
      ? `This λ is longer than λg=${m.cutoff.toFixed(0)} nm. QE is zero in the step model, so R is zero. No amount of Pin invents a band-to-band pair.`
      : `QE is ${m.QE0.toFixed(2)} electrons per photon. R = QE·λ/1240 = ${m.R.toFixed(3)} A/W. Stretch λ at fixed QE: each watt is more (weaker) photons, so amperes per watt rise until cutoff.`,
    question: {
      prompt: 'At constant QE, why can responsivity increase with wavelength?',
      choices: [
        'Longer-λ photons carry more energy.',
        'Pin is a watt. Longer λ means more photons per watt (Eph=hc/λ is smaller), so the same QE yields more electrons per watt.',
        'QE and R are the same quantity.',
        'The gap shrinks when λ increases.',
      ],
      answer: 1,
      why: 'R = QE qλ/hc. λ in the numerator. Then the gap slams R to 0 past λg. Those are different stories.',
    },
  },

  solar: {
    title: 'Solar cell: I–V, MPP, fill factor',
    lede: 'Short circuit: max current, zero voltage, zero power. Open circuit: max voltage, zero current, zero power. The useful rectangle lives between them.',
    tex: 'V_{oc}=\\frac{kT}{q}\\ln\\big(1+I_{\\mathrm{ph}}/I_0\\big),\\quad \\mathrm{FF}=P_{\\max}/(V_{oc}|I_{sc}|)',
    modelNote: 'Ideal diode plus optional Rs, Rsh. Newton solve. Pin is a user optical watt, not a spectrum integral.',
    controls: () => slider('Iph', 'Iph (mA)', 0.5, 80, 0.5, 30)
      + slider('T', 'T (K)', 250, 400, 1, 300)
      + slider('I0d', 'log10 I0 (A)', -14, -8, 0.1, -12)
      + slider('V', 'Operating V (V)', 0, 0.85, 0.005, 0.5)
      + slider('Rs', 'Rs (Ω) advanced', 0, 20, 0.1, 0)
      + slider('Rsh', 'Rsh (Ω) advanced', 50, 20000, 50, 20000),
    reset: () => { setv('Iph', 30); setv('T', 300); setv('I0d', -12); setv('V', 0.5); setv('Rs', 0); setv('Rsh', 20000); },
    read: () => ({ Iph: val('Iph') * 1e-3, T: val('T'), I0: 10 ** val('I0d'), V: val('V'), Rs: val('Rs'), Rsh: val('Rsh') }),
    labels: (s) => { lab('Iph', `${(s.Iph * 1e3).toFixed(1)} mA`); lab('T', `${s.T} K`); lab('I0d', sci(s.I0)); lab('V', `${s.V.toFixed(3)} V`); lab('Rs', `${s.Rs.toFixed(1)} Ω`); lab('Rsh', `${s.Rsh.toFixed(0)} Ω`); },
    model: (s) => {
      const Pin = 0.1;
      const p = { I0: s.I0, T: s.T, Iph: s.Iph, Rs: s.Rs, Rsh: s.Rsh, Pin };
      const mp = mpp(p);
      const I = illuminatedI(s.V, p).I;
      const Pout = -s.V * I;
      return {
        ...s, I, Pout, Voc: mp.Voc, Isc: mp.Isc, Vmp: mp.V, Imp: mp.I,
        Pmax: mp.Pout, FF: mp.FF, eta: mp.Pout / Pin, Pin,
        modelNote: (s.Rs > 0 || s.Rsh < 19900) ? 'nonideal Rs, Rsh (Newton)' : 'ideal illuminated diode',
      };
    },
    draw: (cv, m) => paintSolar(cv, m),
    onChart: (chart, ev, paintAll) => {
      const x = chart.scales.x.getValueForPixel(ev.offsetX);
      if (Number.isFinite(x)) { setv('V', Math.max(0, x)); paintAll(); }
    },
    chart: (ch, m) => {
      const p = { I0: m.I0, T: m.T, Iph: m.Iph, Rs: m.Rs, Rsh: m.Rsh };
      const cur = ivCurve(p, 0, Math.max(m.Voc, 0.2), 140);
      const P = cur.V.map((V, i) => -V * cur.I[i]);
      setXY(ch, 'V (V)', 'I (A) and P (W)', [
        scatter(cur.V, cur.I.map((x) => -x), '#38bdf8', 'I_out = −I'),
        scatter(cur.V, P, '#fbbf24', 'Pout = −VI'),
        scatter([m.Vmp], [m.Pmax], '#f43f5e', 'MPP', { pointRadius: 6, showLine: false }),
      ]);
    },
    vals: (m) => `Voc=${m.Voc.toFixed(3)} V · |Isc|=${sci(Math.abs(m.Isc))} A · Vmp=${m.Vmp.toFixed(3)} V · Pmax=${sci(m.Pmax)} W · FF=${(m.FF * 100).toFixed(1)}% · η=${(m.eta * 100).toFixed(1)}% (Pin=${m.Pin} W)`,
    why: (m) => `Power is the rectangle V×|I|. It is zero on both axes. The gold box is the largest rectangle under the I–V curve. Raising Iph lifts |Isc| and, logarithmically, Voc. Rs slices the knee (FF down). Small Rsh leaks current around the junction.`,
    question: {
      prompt: 'Why is the maximum-power point not at open circuit or short circuit?',
      choices: [
        'Because Voc is imaginary.',
        'P=VI. At Isc, V=0 so P=0. At Voc, I=0 so P=0. The product peaks in between, near the knee.',
        'The fill factor is defined only at V=0.',
        'Maximum power is always at V=Eg/q.',
      ],
      answer: 1,
      why: 'FF measures how square that knee is. Ideal cells look boxy. Rs and Rsh round or tilt them.',
    },
  },

  bandgap: {
    title: 'Bandgap vs solar-cell efficiency',
    lede: 'Small Eg drinks the spectrum and thermalizes a lot. Large Eg is picky and high-voltage. The radiative detailed-balance peak sits in the middle. Tandem cells split the job by color.',
    tex: '\\eta=P_{\\max}/P_{\\mathrm{in}}',
    modelNote: 'Shockley–Queisser: step absorption, radiative only, 5800 K sun scaled to 1000 W/m². Not AM1.5 atmosphere, not a real cell.',
    controls: () => slider('Eg', 'Eg (eV)', 0.4, 2.6, 0.01, 1.12)
      + slider('Eg2', 'Tandem bottom Eg (eV)', 0.4, 2.0, 0.01, 0.66),
    presets: () => Object.keys(MATERIALS).map((k) => `<button type="button" class="pd-chip" data-pre="${k}">${k}</button>`).join('')
      + '<button type="button" class="pd-chip" data-pre="tan">tandem on</button>',
    applyPreset: (k) => {
      if (k === 'tan') { document.getElementById('pd-root').dataset.tan = '1'; return; }
      setv('Eg', MATERIALS[k].Eg);
    },
    reset: () => { setv('Eg', 1.12); setv('Eg2', 0.66); document.getElementById('pd-root').dataset.tan = ''; },
    read: () => ({ Eg: val('Eg'), Eg2: val('Eg2'), tandem: document.getElementById('pd-root').dataset.tan === '1' }),
    labels: (s) => { lab('Eg', `${s.Eg.toFixed(2)} eV`); lab('Eg2', `${s.Eg2.toFixed(2)} eV`); },
    model: (s) => {
      const sq = shockleyQueisser(s.Eg);
      const tan = tandemSQ(s.Eg, s.Eg2);
      const am = am15Jsc(s.Eg);
      return { ...s, sq, tan, am, EgTop: Math.max(s.Eg, s.Eg2), EgBot: Math.min(s.Eg, s.Eg2), modelNote: s.tandem ? tan.model : sq.model };
    },
    draw: (cv, m) => paintBandgap(cv, m),
    chart: (ch, m) => {
      if (!SPECS.bandgap._sq) {
        const xs = []; const et = []; const jscs = [];
        for (let E = 0.4; E <= 2.6; E += 0.08) {
          const s = shockleyQueisser(E);
          xs.push(E); et.push(s.eta * 100); jscs.push(s.Jsc / 10);
        }
        SPECS.bandgap._sq = { xs, et, jscs };
      }
      const c = SPECS.bandgap._sq;
      setXY(ch, 'Eg (eV)', 'η (%)  and  Jsc/10 (A/m²)', [
        scatter(c.xs, c.et, '#fbbf24', 'SQ η %'),
        scatter(c.xs, c.jscs, '#38bdf8', 'Jsc / 10'),
        scatter([m.Eg], [m.sq.eta * 100], '#f43f5e', 'this Eg', { pointRadius: 6, showLine: false }),
      ]);
    },
    vals: (m) => m.tandem
      ? `tandem teaching η=${(m.tan.eta * 100).toFixed(1)}% · Voc sum=${m.tan.Voc.toFixed(2)} V · J=${sci(m.tan.J)} A/m² · limited by ${m.tan.limited} cell`
      : `SQ η=${(m.sq.eta * 100).toFixed(1)}% · Voc=${m.sq.Voc.toFixed(3)} V · Jsc=${sci(m.sq.Jsc)} A/m² · AM1.5-table Jsc=${sci(m.am)} A/m² (optical only)`,
    why: (m) => m.tandem
      ? 'Blue photons stop in the large-gap top cell (less thermalization). Red leftovers reach the small-gap bottom cell. Series connection: the smaller photocurrent wins. This tandem model is a sketch, not a full two-junction SQ.'
      : `At ${m.Eg.toFixed(2)} eV the radiative limit is ${(m.sq.eta * 100).toFixed(0)}%. Real Si modules are ~20% because of nonradiative recombination, optics, and resistance — the SQ curve is an upper bound, not a datasheet.`,
    question: {
      prompt: 'Why is the largest-bandgap semiconductor not automatically the best single-junction solar cell?',
      choices: [
        'Large Eg always has the highest efficiency in SQ.',
        'Large Eg raises voltage but refuses photons with Eph < Eg. Past ~1.3 eV the lost current hurts more than the extra Voc. Small Eg does the opposite (thermalization).',
        'Large Eg cells cannot have a Voc.',
        'The Sun has no IR photons.',
      ],
      answer: 1,
      why: 'Two losses slide in opposite directions with Eg. The peak is a compromise. Tandems try to collect both sides of that compromise.',
    },
  },

  spectrum: {
    title: 'Solar spectrum and blackbody radiation',
    lede: 'Planck’s law is the shape. Wien’s law is the peak. The Sun looks white-yellow because 5800 K peaks in the visible. Your desk does not glow visibly because 300 K peaks near 10 µm.',
    tex: 'B_\\lambda(T)=\\dfrac{2hc^2}{\\lambda^5}\\dfrac{1}{e^{hc/\\lambda kT}-1},\\quad \\lambda_{\\max}T=2.90\\times10^6\\,\\mathrm{nm\\,K}',
    modelNote: 'Ideal blackbody. AM1.5G here is a coarse teaching table (~964 W/m²), not ASTM G173. Atmosphere carves holes a blackbody does not have.',
    controls: () => slider('T', 'Blackbody T (K)', 300, 7000, 10, 5800)
      + slider('T2', 'Compare T (K)', 300, 7000, 10, 300),
    reset: () => { setv('T', 5800); setv('T2', 300); },
    read: () => ({ T: val('T'), T2: val('T2'), log: false }),
    labels: (s) => { lab('T', `${s.T} K`); lab('T2', `${s.T2} K`); },
    model: (s) => ({ ...s, peak: wienPeakNm(s.T), peak2: wienPeakNm(s.T2) }),
    draw: (cv, m) => paintSpectrum(cv, m),
    chart: (ch, m) => {
      const xs = []; const y1 = []; const y2 = []; const am = [];
      for (let L = 200; L <= 3000; L += 15) {
        xs.push(L);
        y1.push(planckBlambda(L, m.T));
        y2.push(planckBlambda(L, m.T2));
        am.push(am15Irradiance(L));
      }
      const n1 = Math.max(...y1, 1e-30);
      setXY(ch, 'λ (nm)', 'relative spectral density', [
        scatter(xs, y1.map((v) => v / n1), '#fbbf24', `${m.T} K (norm.)`),
        scatter(xs, y2.map((v) => v / n1), '#f87171', `${m.T2} K (same scale)`),
        scatter(xs, am.map((v) => v / 1.6), '#38bdf8', 'AM1.5G table / 1.6'),
      ]);
    },
    vals: (m) => `Wien ${m.T} K → ${m.peak.toFixed(0)} nm (${wavelengthColor(m.peak).name}) · ${m.T2} K → ${m.peak2.toFixed(0)} nm`,
    why: (m) => m.T > 4500
      ? 'A sun-like disk dumps most of its blackbody power where silicon can still drink some of it. AM1.5 (blue) is not that smooth: ozone, water, and CO2 bite chunks. Do not treat the gold curve as “the solar spectrum at Penn.”'
      : 'Room-temperature objects radiate in the thermal IR. Your eye is the wrong detector. A photodiode with Eg ~ 1 eV is also the wrong detector for 10 µm photons.',
    question: {
      prompt: 'Why does the Sun emit strongly in the visible while a room-temperature object does not?',
      choices: [
        'The Sun is made of silicon.',
        'Wien’s law: λmax T is constant. 5800 K peaks near 500 nm. 300 K peaks near 10 µm, far into the IR.',
        'Room-temperature objects emit no radiation.',
        'Visible light cannot come from a blackbody.',
      ],
      answer: 1,
      why: 'Same Planck formula, different T. The visible window is a coincidence of solar temperature and human (and silicon) bandgaps.',
    },
  },

  absorb: {
    title: 'Absorption depth and light trapping',
    lede: 'Each slice eats a fraction of what remains. That is exponential, not linear. Where the pair is born still has to match where you can collect it.',
    tex: 'I(x)=I_0 e^{-\\alpha x},\\quad \\mathrm{absorbed}=1-e^{-\\alpha d}\\quad\\text{(single pass, R=0)}',
    modelNote: 'Beer–Lambert. Light trapping uses an optical path ~4d (Lambertian teaching bound), not a full raytracer.',
    controls: () => slider('alpha', 'α (1/cm)', 10, 1e5, 10, 1000)
      + slider('d', 'Thickness d (µm)', 0.5, 300, 0.5, 50)
      + slider('R', 'Front R', 0, 0.9, 0.01, 0.1)
      + slider('lam', 'λ (nm) (sets a direct-gap α if slaved)', 400, 1100, 1, 600),
    presets: () => '<button type="button" class="pd-chip" data-pre="single">single pass</button><button type="button" class="pd-chip" data-pre="trap">light trapping</button>',
    applyPreset: (k) => { document.getElementById('pd-root').dataset.trap = k === 'trap' ? '1' : ''; },
    reset: () => { setv('alpha', 1000); setv('d', 50); setv('R', 0.1); setv('lam', 600); document.getElementById('pd-root').dataset.trap = ''; },
    read: () => ({ alpha: val('alpha'), d: val('d') * 1e-4, R: val('R'), lam: val('lam'), trap: document.getElementById('pd-root').dataset.trap === '1' }),
    labels: (s) => { lab('alpha', sci(s.alpha)); lab('d', `${(s.d * 1e4).toFixed(1)} µm`); lab('R', s.R.toFixed(2)); lab('lam', `${s.lam} nm`); },
    model: (s) => {
      const aDirect = alphaDirect(s.lam, 1.12, 5e4);
      const fr = absorbedFraction(s.alpha, s.d, s.R, s.trap);
      const xs = []; const Ix = []; const G = [];
      for (let i = 0; i <= 80; i++) {
        const x = s.d * (i / 80);
        xs.push(x * 1e4);
        Ix.push(beer(1, s.alpha, x));
        G.push(generationRate(1, s.alpha, x));
      }
      return { ...s, ...fr, abs: fr.absorbed, tr: fr.transmitted, alphaD: s.alpha * s.d, aDirect, xs, Ix, G, modelNote: fr.model };
    },
    draw: (cv, m) => paintAbsorb(cv, m),
    chart: (ch, m) => {
      setXY(ch, 'depth x (µm)', 'I/I0 and G (rel.)', [
        scatter(m.xs, m.Ix, '#fbbf24', 'I(x)/I0'),
        scatter(m.xs, m.G.map((g) => g / Math.max(...m.G, 1e-30)), '#38bdf8', 'G(x) normalized'),
      ]);
    },
    vals: (m) => `αd=${m.alphaD.toFixed(2)} · absorbed=${(m.abs * 100).toFixed(1)}% · transmitted=${(m.tr * 100).toFixed(1)}% · reflected=${(m.R * 100).toFixed(0)}% · direct-Si α(λ) teaching=${sci(m.aDirect)} cm⁻¹`,
    why: (m) => m.trap
      ? 'Trapping folds the path. Weak α (indirect Si in the red) can still be eaten if the photon rattles. That is optics. You still need a junction or a long L where those pairs are born — often throughout a thick wafer, which is why Si PV is not a 1 µm film.'
      : m.alphaD < 0.3
        ? 'Most of the beam walks out the back. Increase α or d, or trap. Generation is almost uniform — collection, not optics, will decide the current.'
        : 'Generation piles up near the front. If that surface is a recombination dump, you lose the best-absorbed photons electrically even though they disappeared optically.',
    question: {
      prompt: 'If α doubles at fixed thickness, does the absorbed fraction double?',
      choices: [
        'Always, because absorption is linear.',
        'No. Single-pass absorbed fraction is 1−e^{−αd}. Doubling α squares the remaining transmission, which is not doubling except in the optically thin limit αd ≪ 1.',
        'Absorption becomes zero.',
        'Only if the device is a solar cell.',
      ],
      answer: 1,
      why: 'Beer’s law is the same exponential the Exam 1 sheet already used. Thin limit: 1−e^{−αd} ≈ αd, so then it does approximately double.',
    },
  },
};

window.addEventListener('popstate', boot);
window.addEventListener('DOMContentLoaded', boot);
