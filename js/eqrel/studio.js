import { renderKatex } from '../hw/crystal-math.js';
import { VARIABLES } from './variables.js';
import { EQUATIONS, findPath } from './equations.js';
import { EDGES, CONCEPTS, edgesFrom, neighborhood } from './edges.js';
import { FAMILIES } from './families.js';
import { EqState, MATERIALS, sci, sciHtml } from './state.js';
import { EqMap } from './map.js';
import { EqViz, vizForEquation } from './viz.js';

const COMPARES = [
  { a: 'Eg', b: 'lg', rel: 'inverse (hyperbola)', assume: 'E = Eg at threshold', note: 'λg = hc/Eg. Bigger gap, shorter cutoff wavelength.' },
  { a: 'EF', b: 'n', rel: 'exponential increase', assume: 'fixed T, ni, Boltzmann', note: 'n = ni exp((EF−Ei)/kT). Hold T and material.' },
  { a: 'EF', b: 'p', rel: 'exponential decrease', assume: 'fixed T, ni, equilibrium', note: 'p is the inverse Boltzmann factor of n.' },
  { a: 'T', b: 'ni', rel: 'T^{3/2} times a 1/T exponential', assume: 'fixed Eg, table ni(300)', note: 'The exponential owns the plot.' },
  { a: 'n', b: 'sigma', rel: 'linear if p, μ held', assume: 'p, μn, μp constant', note: 'Here p and both mobilities are held. Real T-changes would move them too.' },
  { a: 'mun', b: 'sigma', rel: 'linear if n, p, μp held', assume: 'n, p, μp constant', note: 'Ease of motion scales σ directly in this slice.' },
  { a: 'Eg', b: 'ni', rel: 'exponential decrease', assume: 'fixed T, same NC NV scale', note: 'Same Eg that sets λg also starves thermal generation.' },
  { a: 'T', b: 'f', rel: 'smears, not a simple monotone in f(EF)', assume: 'fixed E and EF', note: 'f(EF) stays 1/2. Away from EF, T fills or empties the tail.' },
  { a: 'T', b: 'sigma', rel: 'indirect, not monotonic forever', assume: 'fixed NA, ND, μ (teaching slice)', note: 'T is not in σ = q(nμn+pμp). It still moves n and p through ni(T). Mobility is held here on purpose.' },
];

function pick(depth, obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[depth] || obj.course || obj.simple || '';
}

function esc(s) {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

export class EqRelStudio {
  constructor() {
    this.state = new EqState();
    this.mode = 'map';
    this.depth = 'course';
    this.view = 'both';
    this.units = false;
    this.sel = { kind: 'eq', id: 'e_np' };
    this.compare = COMPARES[0];
    this.known = new Set(['NA', 'ni']);
    this.find = 'n';
    this.changeVar = 'T';
    this.hi = null;
    this.map = new EqMap(document.getElementById('eq-map'), (kind, id) => this.pick(kind, id));
    this.viz = new EqViz(document.getElementById('eq-viz'), this.state, (EF) => this.state.dragEF(EF));
    this._bind();
    this.state.on(() => this._live());
    this.pick('eq', 'e_np');
    this._live();
  }

  _bind() {
    document.querySelectorAll('[data-eqmode]').forEach((b) => {
      b.addEventListener('click', () => this.setMode(b.dataset.eqmode));
    });
    document.querySelectorAll('[data-depth]').forEach((b) => {
      b.addEventListener('click', () => {
        this.depth = b.dataset.depth;
        document.querySelectorAll('[data-depth]').forEach((x) => x.classList.toggle('is-on', x === b));
        this._explain();
      });
    });
    document.querySelectorAll('[data-view]').forEach((b) => {
      b.addEventListener('click', () => {
        this.view = b.dataset.view;
        document.querySelectorAll('[data-view]').forEach((x) => x.classList.toggle('is-on', x === b));
        document.getElementById('eq-app').dataset.view = this.view;
      });
    });
    document.getElementById('eq-units').addEventListener('click', () => {
      this.units = !this.units;
      document.getElementById('eq-units').classList.toggle('is-on', this.units);
      this._explain();
    });
    const mat = document.getElementById('eq-mat');
    Object.values(MATERIALS).filter((m) => m.id !== 'Direct19').forEach((m) => {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = `${m.id} · Eg ${m.Eg} eV`;
      mat.appendChild(o);
    });
    mat.value = this.state.matId;
    mat.addEventListener('change', () => this.state.setMaterial(mat.value));

    document.getElementById('eq-search').addEventListener('input', (e) => this._browser(e.target.value));
    this._browser('');

    const sliders = [
      ['T', 80, 800, 1, (v) => this.state.set({ T: Number(v) }, 'T')],
      ['NA', 12, 19, 0.05, (v) => { this.state.setDrive('doping'); this.state.set({ NA: 10 ** Number(v) }, 'NA'); }],
      ['ND', 12, 19, 0.05, (v) => { this.state.setDrive('doping'); this.state.set({ ND: 10 ** Number(v) }, 'ND'); }],
      ['lambda', 350, 1800, 1, (v) => this.state.set({ lambda: Number(v) }, 'lambda')],
      ['Efield', 10, 1000, 5, (v) => this.state.set({ Efield: Number(v) }, 'Efield')],
    ];
    sliders.forEach(([id, lo, hi, st, fn]) => {
      const el = document.getElementById(`sl-${id}`);
      el.min = lo; el.max = hi; el.step = st;
      el.addEventListener('input', () => fn(el.value));
    });
    document.getElementById('sl-T').value = this.state.T;
    document.getElementById('sl-NA').value = Math.log10(this.state.NA);
    document.getElementById('sl-ND').value = Math.log10(this.state.ND);
    document.getElementById('sl-lambda').value = this.state.lambda;
    document.getElementById('sl-Efield').value = this.state.Efield;

    document.getElementById('eq-drive-ef').addEventListener('click', () => {
      const s = this.state.snap();
      this.state.dragEF(s.EF);
    });
    document.getElementById('eq-drive-dop').addEventListener('click', () => this.state.setDrive('doping'));
  }

  setMode(mode) {
    this.mode = mode;
    document.querySelectorAll('[data-eqmode]').forEach((b) => b.classList.toggle('is-on', b.dataset.eqmode === mode));
    document.getElementById('eq-app').dataset.mode = mode;
    if (mode === 'compare') {
      this.viz.setMode('compare');
      this.viz.setCompare(this.compare);
    } else if (mode === 'changes') {
      this.pick('var', this.changeVar);
    }
    this._explain();
    this._tools();
  }

  pick(kind, id) {
    if (kind === 'map' && !id) return;
    if (!id) return;
    this.sel = { kind, id };
    this.hi = id;
    this.map.setSelected(kind, id);
    this.viz.highlight(id);
    if (kind === 'eq') this.viz.setMode(vizForEquation(EQUATIONS[id]));
    else if (kind === 'var' && (id === 'EF' || id === 'n' || id === 'p' || id === 'f')) this.viz.setMode('mass-action');
    else if (kind === 'var' && (id === 'lambda' || id === 'lg' || id === 'Eg' || id === 'Eph')) this.viz.setMode('photon');
    else if (kind === 'var' && (id === 'sigma' || id === 'rho' || id === 'mun' || id === 'mup')) this.viz.setMode('conductivity');
    else if (kind === 'var' && (id === 'T' || id === 'ni')) this.viz.setMode('niT');
    else if (kind === 'var' && (id === 'NA' || id === 'ND')) this.viz.setMode('neutrality');
    else if (kind === 'concept' && id === 'occupancy') this.viz.setMode('fermi');
    else if (kind === 'eq') this.viz.setMode(vizForEquation(EQUATIONS[id]));
    if (this.mode === 'compare') {
      this.viz.setMode('compare');
      this.viz.setCompare(this.compare);
    }
    this._browser(document.getElementById('eq-search').value);
    this._explain();
    this._tools();
    document.getElementById('eq-hold').innerHTML = this._holdHTML(this.state.snap());
  }

  _browser(q) {
    const needle = (q || '').toLowerCase();
    const box = document.getElementById('eq-browser');
    const fams = [
      ['photon', 'Photons'],
      ['carrier', 'Carrier statistics'],
      ['fermi', 'Fermi–Dirac'],
      ['transport', 'Transport'],
      ['temperature', 'Temperature'],
      ['doping', 'Doping'],
    ];
    let html = '';
    fams.forEach(([id, title]) => {
      const eqs = Object.values(EQUATIONS).filter((e) => e.family === id && (`${e.name} ${e.latex}`.toLowerCase().includes(needle) || !needle));
      if (!eqs.length) return;
      html += `<p class="eq-nav-h">${title}</p>`;
      eqs.forEach((e) => {
        html += `<button type="button" class="eq-nav ${this.sel.id === e.id ? 'is-on' : ''}" data-kind="eq" data-id="${e.id}">
          <span class="eq-nav-name">${esc(e.name)}</span>
          <span class="eq-nav-tex" data-tex="${esc(e.latex)}"></span>
        </button>`;
      });
    });
    html += `<p class="eq-nav-h">Variables</p>`;
    Object.values(VARIABLES).forEach((v) => {
      const hit = `${v.name} ${v.id} ${v.symbol}`.toLowerCase().includes(needle);
      if (needle && !hit) return;
      html += `<button type="button" class="eq-nav is-var ${this.sel.id === v.id ? 'is-on' : ''}" data-kind="var" data-id="${v.id}">
        <span class="eq-nav-name">${esc(v.id)} · ${esc(v.name)}</span>
      </button>`;
    });
    box.innerHTML = html;
    box.querySelectorAll('[data-tex]').forEach((el) => renderKatex(el, el.dataset.tex, false));
    box.querySelectorAll('[data-id]').forEach((b) => {
      b.addEventListener('click', () => this.pick(b.dataset.kind, b.dataset.id));
    });
  }

  _live() {
    const s = this.state.snap();
    document.getElementById('lv-T').textContent = `${s.T.toFixed(0)} K`;
    document.getElementById('lv-NA').innerHTML = sciHtml(s.NA);
    document.getElementById('lv-ND').innerHTML = sciHtml(s.ND);
    document.getElementById('lv-lam').textContent = `${s.lambda.toFixed(0)} nm`;
    document.getElementById('lv-E').textContent = `${s.Efield.toFixed(0)} V/cm`;
    document.getElementById('eq-readout').innerHTML = `
      <span>n ${sciHtml(s.n)}</span>
      <span>p ${sciHtml(s.p)}</span>
      <span>ni ${sciHtml(s.ni)}</span>
      <span>np/ni² ${(s.np / s.ni2).toFixed(3)}</span>
      <span>σ ${sciHtml(s.sigma)}</span>
      <span>ρ ${sciHtml(s.rho)}</span>
      <span>EF−Ei ${(s.dEF || 0) >= 0 ? '+' : ''}${(s.dEF || 0).toFixed(3)} eV</span>`;
    document.getElementById('eq-drive-ef').classList.toggle('is-on', s.drive === 'fermi');
    document.getElementById('eq-drive-dop').classList.toggle('is-on', s.drive === 'doping');
    document.getElementById('eq-hold').innerHTML = this._holdHTML(s);
    document.getElementById('eq-causal').innerHTML = this._causalHTML(s);
    this.map.setPulse(s.lastChanged);
    this.viz.draw();
    this._jumps(document.getElementById('eq-causal'));
    if (this.sel.kind === 'eq') this._nums(s);
  }

  _holdHTML(s) {
    const eq = EQUATIONS[this.sel.id];
    const h = eq?.hold;
    const changing = s.lastChanged || h?.change || '—';
    const held = (h?.held || ['other knobs on the rail']).filter((x) => x !== changing).join(', ') || 'other knobs on the rail';
    const result = (h && changing === h.change)
      ? h.result
      : (s.lastChanged ? 'See the causal trace. Direct arrows are algebra. Dashed arrows are physical side effects.' : (h?.result || 'Watch the live numbers and the highlighted edges.'));
    return `<div class="eq-hold-grid">
      <div><p class="eq-k">Changing</p><p>${esc(changing)}</p></div>
      <div><p class="eq-k">Held constant</p><p>${esc(held)}</p></div>
      <div><p class="eq-k">Result</p><p>${esc(result)}</p></div>
      <div><p class="eq-k">Drive</p><p>${s.drive === 'fermi' ? 'EF is independent. Doping is a would-have-to-change story.' : 'Doping is independent. EF is calculated.'}</p></div>
    </div>`;
  }

  _causalHTML(s) {
    if (!s.lastChanged) return '<p class="text-slate-500">Move a slider. A pulse should walk the map with a reason on each arrow.</p>';
    const outs = edgesFrom(s.lastChanged);
    if (!outs.length) return `<p>Changed <strong>${esc(s.lastChanged)}</strong>.</p>`;
    return `<p class="eq-k">Causal trace · ${esc(s.lastChanged)}</p>
      <ol class="eq-trace">${outs.map((e) => `<li><button type="button" data-jump="${e.target}">${esc(e.source)} → ${esc(e.target)}</button>
        <span>${esc(e.explanation)}</span>
        <em>${e.direct ? 'direct' : 'indirect'}</em></li>`).join('')}</ol>`;
  }

  _nums(s) {
    const host = document.getElementById('eq-live-eq');
    const eq = EQUATIONS[this.sel.id];
    if (!eq || !host) return;
    const bits = {
      e_hc: `E = 1240/${s.lambda.toFixed(0)} = ${s.Eph.toFixed(3)}\\ \\mathrm{eV}`,
      e_lg: `\\lambda_g = 1240/${s.m.Eg.toFixed(2)} = ${s.lg.toFixed(0)}\\ \\mathrm{nm}`,
      e_np: `np = ${sci(s.np).replace('×', '\\times ')} \\quad n_i^2 = ${sci(s.ni2).replace('×', '\\times ')}`,
      e_n_ni: `n = n_i e^{(E_F-E_i)/kT} = ${sci(s.n).replace('×', '\\times ')}\\ \\mathrm{cm^{-3}}`,
      e_p_ni: `p = ${sci(s.p).replace('×', '\\times ')}\\ \\mathrm{cm^{-3}}`,
      e_sigma: `\\sigma = ${sci(s.sigma).replace('×', '\\times ')}\\ \\mathrm{S/cm}`,
      e_rho: `\\rho = ${sci(s.rho).replace('×', '\\times ')}\\ \\Omega\\cdot\\mathrm{cm}`,
      e_ni: `n_i(${s.T.toFixed(0)}\\,\\mathrm{K}) = ${sci(s.ni).replace('×', '\\times ')}\\ \\mathrm{cm^{-3}}`,
      e_f: `f(E)=${s.fE.toFixed(4)}\\ \\text{ at } E-E_F=${(s.Epr - s.EF).toFixed(3)}\\,\\mathrm{eV}`,
      e_neut: `n=${sci(s.n).replace('×', '\\times ')},\\ p=${sci(s.p).replace('×', '\\times ')}`,
    };
    renderKatex(host, bits[eq.id] || eq.latex, true);
  }

  _tools() {
    const box = document.getElementById('eq-tools');
    if (this.mode === 'compare') {
      box.innerHTML = `<p class="eq-k">Compare variables</p>
        <div class="eq-chip-row">${COMPARES.map((c, i) =>
          `<button type="button" class="eq-chip ${c === this.compare ? 'is-on' : ''}" data-cmp="${i}">${c.a} vs ${c.b}</button>`).join('')}</div>
        <p class="mt-2 text-sm text-slate-400">${esc(this.compare.rel)}. Assumptions: ${esc(this.compare.assume)}</p>`;
      box.querySelectorAll('[data-cmp]').forEach((b) => {
        b.addEventListener('click', () => {
          this.compare = COMPARES[Number(b.dataset.cmp)];
          this.viz.setMode('compare');
          this.viz.setCompare(this.compare);
          this._tools();
          this._explain();
        });
      });
      return;
    }
    if (this.mode === 'path') {
      const vars = ['Eg', 'lambda', 'NA', 'ND', 'ni', 'n', 'p', 'EF', 'T', 'mun', 'mup', 'sigma', 'rho', 'Eph', 'lg'];
      const path = findPath([...this.known], this.find);
      box.innerHTML = `<p class="eq-k">I know this</p>
        <div class="eq-chip-row">${vars.map((v) =>
          `<button type="button" class="eq-chip ${this.known.has(v) ? 'is-on' : ''}" data-kn="${v}">${v}</button>`).join('')}</div>
        <p class="eq-k mt-3">I need this</p>
        <div class="eq-chip-row">${vars.map((v) =>
          `<button type="button" class="eq-chip ${this.find === v ? 'is-on' : ''}" data-fd="${v}">${v}</button>`).join('')}</div>
        <div class="eq-path mt-3">${path
          ? path.steps.map((st, i) => `<button type="button" data-jump="${st.id}" class="eq-path-step">
              <span>${i + 1}</span><strong>${esc(EQUATIONS[st.id]?.name || st.id)}</strong>
              <em>${esc(st.note)}</em></button>`).join('<span class="eq-path-arr">→</span>')
          : '<p class="text-amber-100">No canned path for that pair yet. Try NA+ni→n, Eg→λg, or NA+ND+ni+μ→ρ.</p>'}</div>`;
      box.querySelectorAll('[data-kn]').forEach((b) => {
        b.addEventListener('click', () => {
          if (this.known.has(b.dataset.kn)) this.known.delete(b.dataset.kn);
          else this.known.add(b.dataset.kn);
          this._tools();
        });
      });
      box.querySelectorAll('[data-fd]').forEach((b) => {
        b.addEventListener('click', () => { this.find = b.dataset.fd; this._tools(); });
      });
      this._jumps(box);
      return;
    }
    if (this.mode === 'changes') {
      const keys = ['T', 'Eg', 'EF', 'NA', 'ND', 'n', 'lambda'];
      box.innerHTML = `<p class="eq-k">What changes what?</p>
        <div class="eq-chip-row">${keys.map((v) =>
          `<button type="button" class="eq-chip ${this.changeVar === v ? 'is-on' : ''}" data-ch="${v}">${v}</button>`).join('')}</div>
        <ul class="eq-trace mt-3">${EDGES.filter((e) => e.source === this.changeVar).map((e) =>
          `<li><button type="button" data-jump="${e.target}">${esc(e.source)} → ${esc(e.target)}</button>
           <span>${esc(e.explanation)}</span><em>${e.direct ? 'direct' : 'indirect'}</em></li>`).join('')}</ul>`;
      box.querySelectorAll('[data-ch]').forEach((b) => {
        b.addEventListener('click', () => {
          this.changeVar = b.dataset.ch;
          this.pick('var', this.changeVar);
          this._tools();
        });
      });
      this._jumps(box);
      return;
    }
    if (this.mode === 'variable' && this.sel.kind === 'var') {
      const v = VARIABLES[this.sel.id];
      const near = [...neighborhood(this.sel.id)];
      box.innerHTML = `<p class="eq-k">Orbit of ${esc(v.id)}</p>
        <div class="eq-chip-row">${near.map((id) =>
          `<button type="button" class="eq-chip" data-jump="${id}">${esc(id)}</button>`).join('')}</div>`;
      this._jumps(box);
      return;
    }
    const fam = this.sel.kind === 'eq' ? FAMILIES[EQUATIONS[this.sel.id]?.family] : FAMILIES.carrier;
    box.innerHTML = fam ? `<p class="eq-k">${esc(fam.name)}</p>
      <ol class="eq-fam">${fam.steps.map((st) =>
        `<li><button type="button" data-jump="${st.id}">${esc(EQUATIONS[st.id]?.name || st.id)}</button>
         <span>${esc(st.note)}</span></li>`).join('')}</ol>
      <p class="mt-2 text-sm text-sky-100/90">${esc(fam.punch)}</p>` : '';
    this._jumps(box);
  }

  _jumps(root) {
    (root || document).querySelectorAll('[data-jump]').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset.jump;
        if (EQUATIONS[id]) this.pick('eq', id);
        else if (VARIABLES[id]) this.pick('var', id);
        else if (CONCEPTS[id]) this.pick('concept', id);
      });
    });
  }

  _explain() {
    const root = document.getElementById('eq-explain');
    if (this.mode === 'compare') {
      root.innerHTML = this._compareExplain();
      this._math(root);
      return;
    }
    if (this.sel.kind === 'var') {
      root.innerHTML = this._varExplain(VARIABLES[this.sel.id]);
      this._math(root);
      this._jumps(root);
      return;
    }
    if (this.sel.kind === 'concept') {
      const c = CONCEPTS[this.sel.id];
      root.innerHTML = `<h2>${esc(c.name)}</h2><p class="eq-lead">${esc(c.blurb)}</p>`;
      return;
    }
    const eq = EQUATIONS[this.sel.id];
    if (!eq) return;
    const d = this.depth;
    const exp = eq.latex.includes('e^') || eq.latex.includes('exp');
    root.innerHTML = `
      <p class="eq-k">1 · Equation</p>
      <div class="eq-big" data-tex="${esc(eq.latex)}"></div>
      <div class="eq-var-row">${eq.vars.map((id) =>
        `<button type="button" class="eq-vchip ${this.hi === id ? 'is-on' : ''}" data-jump="${id}">${esc(id)}</button>`).join('')}</div>
      <div id="eq-live-eq" class="eq-live-eq"></div>
      ${this.units && eq.units ? `<p class="eq-units">${eq.units.parts.map(esc).join(' × ')} → ${esc(eq.units.result)}</p>` : ''}

      <p class="eq-k">2 · Physical story</p>
      <p class="eq-lead">${esc(pick(d, eq.story))}</p>
      <ol class="eq-steps">${(eq.components || []).map((c) =>
        `<li><strong>${esc(c.label)}</strong>${c.latex ? ` <span data-tex="${esc(c.latex)}"></span>` : ''}${c.note ? `<span> ${esc(c.note)}</span>` : ''}</li>`).join('')}</ol>

      <p class="eq-k">3 · Variable anatomy</p>
      ${eq.vars.map((id) => this._varCard(VARIABLES[id])).join('')}

      <p class="eq-k">4 · Why this mathematical form?</p>
      <p>${esc(pick(d, eq.why))}</p>
      ${exp ? `<aside class="eq-exp"><strong>Why an exponential?</strong> kT is the thermal energy scale. Differences ≪ kT are thermally accessible. Differences of several kT are exponentially rare. That one sentence is why n, p, ni, ionization, and f(E) all grow or die as e^{±ΔE/kT}.</aside>` : ''}

      <p class="eq-k">5 · Interactive dependency</p>
      <p>Use the sliders. The visualization and the causal trace should move together. ${esc(eq.hold?.result || '')}</p>

      <details class="eq-der" ${d === 'deep' ? 'open' : ''}>
        <summary>6 · Where it comes from</summary>
        <p><strong>Intuition.</strong> ${esc(eq.derivation.intuition)}</p>
        <p><strong>Course-level.</strong> ${esc(eq.derivation.course)}</p>
        ${d !== 'simple' ? `<p><strong>Deeper.</strong> ${esc(eq.derivation.deep)}</p>` : ''}
      </details>

      <p class="eq-k">7 · Connections</p>
      <div class="eq-io">
        <div><p class="eq-k">Upstream · what sets the pieces</p>
          ${(eq.upstream || []).map((u) => `<button type="button" data-jump="${u.id}">${esc(u.id)}</button> <span>${esc(u.note)}</span><br>`).join('') || '—'}
        </div>
        <div><p class="eq-k">Downstream · what this unlocks</p>
          ${(eq.downstream || []).map((u) => `<button type="button" data-jump="${u.id}">${esc(u.id)}</button> <span>${esc(u.note)}</span><br>`).join('') || '—'}
        </div>
      </div>

      <p class="eq-k">8 · When to use it</p>
      <ul>${eq.use.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>

      <p class="eq-k">9 · When not to use it</p>
      <p class="eq-k">Assumptions</p>
      <ul>${eq.not.assumptions.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>
      <p class="eq-k">Breaks down when</p>
      <ul class="is-warn">${eq.not.breaks.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>

      <p class="eq-k">10 · Exam recognition</p>
      <p>${(eq.exam.cues || []).map(esc).join(' · ')}</p>
      <p class="eq-pathline">${(eq.exam.path || []).map((p) => `<button type="button" data-jump="${p}">${esc(p)}</button>`).join('<span> → </span>')}</p>

      <p class="eq-k">11 · Limiting cases</p>
      <ul>${(eq.limits || []).map((L) =>
        `<li><strong>What if ${esc(L.if)}?</strong> ${esc(L.then || '')} ${L.latex ? `<span data-tex="${esc(L.latex)}"></span>` : ''}</li>`).join('')}</ul>

      <p class="eq-k">12 · Common misconceptions</p>
      ${(eq.myths || []).map((m) =>
        `<div class="eq-myth"><p><span>Wrong.</span> ${esc(m.wrong)}</p><p><span class="ok">Better.</span> ${esc(m.better)}</p></div>`).join('')}
    `;
    this._math(root);
    this._jumps(root);
    this._nums(this.state.snap());
    root.querySelectorAll('.eq-vchip').forEach((b) => {
      b.addEventListener('mouseenter', () => this.viz.highlight(b.dataset.jump));
      b.addEventListener('mouseleave', () => this.viz.highlight(this.sel.id));
    });
  }

  _varCard(v) {
    if (!v) return '';
    return `<article class="eq-anat">
      <button type="button" data-jump="${v.id}" class="eq-anat-h">${esc(v.symbol)} · ${esc(v.name)}</button>
      <p>${esc(v.meaning)}</p>
      <p><strong>Units.</strong> ${esc(v.units)} · <strong>Usually</strong> ${esc(v.role)}.</p>
      <p><strong>Set by.</strong> ${v.determinedBy.map(esc).join(', ')}</p>
      <p><strong>Affects.</strong> ${v.affects.map(esc).join(', ')}</p>
      <p><strong>If it increases.</strong> ${esc(v.ifUp)}</p>
      <p><strong>If it decreases.</strong> ${esc(v.ifDown)}</p>
    </article>`;
  }

  _varExplain(v) {
    if (!v) return '';
    const outs = edgesFrom(v.id);
    return `<h2>${esc(v.name)}</h2>
      <div class="eq-big" data-tex="${esc(v.symbol)}"></div>
      ${this._varCard(v)}
      <p class="eq-k">What it moves</p>
      <ul class="eq-trace">${outs.map((e) =>
        `<li><button type="button" data-jump="${e.target}">${esc(e.target)}</button>
         <span>${esc(e.explanation)}</span><em>${e.direct ? 'direct' : 'indirect'}</em></li>`).join('')}</ul>
      <p class="text-slate-400">Click a connected node to walk the network. The map should dim everything else.</p>`;
  }

  _compareExplain() {
    const c = this.compare;
    return `<h2>${esc(c.a)} vs ${esc(c.b)}</h2>
      <p class="eq-lead">${esc(c.note)}</p>
      <ol class="eq-steps">
        <li><strong>Relation type.</strong> ${esc(c.rel)}</li>
        <li><strong>Assumptions that produce that plot.</strong> ${esc(c.assume)}</li>
        <li><strong>Hold-constant reminder.</strong> If you also let other knobs move, the curve on the screen is no longer this slice.</li>
      </ol>`;
  }

  _math(root) {
    root.querySelectorAll('[data-tex]').forEach((el) => renderKatex(el, el.dataset.tex, el.classList.contains('eq-big')));
  }
}

new EqRelStudio();
