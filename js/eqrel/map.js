/**
 * Hand-laid equation map. Positions are authored, not force-directed.
 */
import { EQUATIONS } from './equations.js';
import { VARIABLES } from './variables.js';
import { EDGES, CONCEPTS, neighborhood } from './edges.js';
import { REGIONS } from './families.js';

export const VAR_POS = {
  Eg: { x: 200, y: 128 },
  EC: { x: 86, y: 188 },
  EV: { x: 200, y: 188 },
  Ei: { x: 314, y: 188 },
  lambda: { x: 430, y: 188 },
  lg: { x: 860, y: 100 },
  Eph: { x: 780, y: 88 },
  freq: { x: 500, y: 48 },
  f: { x: 1470, y: 108 },
  E: { x: 1080, y: 180 },
  NA: { x: 110, y: 348 },
  ND: { x: 260, y: 348 },
  EF: { x: 186, y: 630 },
  n: { x: 500, y: 568 },
  p: { x: 808, y: 568 },
  ni: { x: 654, y: 378 },
  NC: { x: 420, y: 378 },
  NV: { x: 890, y: 378 },
  T: { x: 1140, y: 348 },
  k: { x: 1140, y: 468 },
  mun: { x: 300, y: 738 },
  mup: { x: 440, y: 738 },
  q: { x: 180, y: 800 },
  sigma: { x: 1000, y: 758 },
  rho: { x: 1320, y: 758 },
  J: { x: 1000, y: 878 },
  vd: { x: 300, y: 898 },
  Efield: { x: 500, y: 898 },
  alpha: { x: 860, y: 48 },
};

export const CONCEPT_POS = {
  band: { x: 120, y: 52 },
  absorption: { x: 860, y: 210 },
  occupancy: { x: 1470, y: 188 },
  doping: { x: 80, y: 298 },
  generation: { x: 1400, y: 510 },
  transport: { x: 220, y: 698 },
};

const SHORT = {
  e_hf: 'E = hf',
  e_cfl: 'c = fλ',
  e_hc: 'E = hc/λ',
  e_lg: 'λg = hc/Eg',
  e_n_nc: 'n = NC exp(…)',
  e_p_nv: 'p = NV exp(…)',
  e_n_ni: 'n = ni exp(…)',
  e_p_ni: 'p = ni exp(…)',
  e_np: 'np = ni²',
  e_f: 'f(E)',
  e_vd: 'vd = μE',
  e_jn: 'Jn = qnμnE',
  e_jp: 'Jp = qpμpE',
  e_je: 'J = σE',
  e_sigma: 'σ = q(nμn+pμp)',
  e_rho: 'ρ = 1/σ',
  e_ni: 'ni(T)',
  e_n_nd: 'n ≈ ND',
  e_p_na: 'p ≈ NA',
  e_neut: 'neutrality',
};

export function allNodes() {
  const nodes = [];
  for (const eq of Object.values(EQUATIONS)) {
    nodes.push({
      id: eq.id, kind: 'eq', label: SHORT[eq.id] || eq.name, title: eq.name,
      x: eq.map.x, y: eq.map.y, family: eq.family,
    });
  }
  for (const [id, pos] of Object.entries(VAR_POS)) {
    const v = VARIABLES[id];
    if (!v) continue;
    nodes.push({
      id, kind: 'var', label: v.symbol.replace(/\\mathrm\{|\}|\\/g, '').replace('_', ''),
      title: v.name, x: pos.x, y: pos.y, family: 'var',
    });
  }
  for (const [id, pos] of Object.entries(CONCEPT_POS)) {
    const c = CONCEPTS[id];
    nodes.push({ id, kind: 'concept', label: c.name, title: c.blurb, x: pos.x, y: pos.y, family: 'concept' });
  }
  return nodes;
}

const NODES = allNodes();
const BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

export function nodeById(id) {
  return BY_ID[id];
}

export class EqMap {
  constructor(svg, onPick) {
    this.svg = svg;
    this.onPick = onPick;
    this.selected = null;
    this.focus = null;
    this.pulse = null;
    this.showIndirect = true;
    this._ns = 'http://www.w3.org/2000/svg';
    this._build();
  }

  _el(name, attrs, text) {
    const n = document.createElementNS(this._ns, name);
    for (const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    return n;
  }

  _build() {
    const svg = this.svg;
    svg.setAttribute('viewBox', '0 0 1680 980');
    svg.innerHTML = '';
    const gReg = this._el('g', { class: 'eq-regions' });
    REGIONS.forEach((r) => {
      gReg.appendChild(this._el('rect', {
        x: r.x, y: r.y, width: r.w, height: r.h, rx: 16, class: 'eq-region',
      }));
      gReg.appendChild(this._el('text', {
        x: r.x + 16, y: r.y + 22, class: 'eq-region-label',
      }, r.name));
    });
    svg.appendChild(gReg);

    this.gEdges = this._el('g', { class: 'eq-edges' });
    svg.appendChild(this.gEdges);
    this.gLabs = this._el('g', { class: 'eq-elabs' });
    svg.appendChild(this.gLabs);
    this.gNodes = this._el('g', { class: 'eq-nodes' });
    svg.appendChild(this.gNodes);

    NODES.forEach((n) => {
      const g = this._el('g', {
        class: `eq-node is-${n.kind}`,
        transform: `translate(${n.x},${n.y})`,
        'data-id': n.id,
        'data-kind': n.kind,
      });
      const w = n.kind === 'eq' ? 158 : n.kind === 'concept' ? 136 : 70;
      const h = n.kind === 'eq' ? 44 : n.kind === 'concept' ? 34 : 32;
      g.appendChild(this._el('rect', {
        x: -w / 2, y: -h / 2, width: w, height: h, rx: n.kind === 'var' ? 13 : 8,
        class: 'eq-nchip',
      }));
      const fs = n.kind === 'eq' ? 13 : n.kind === 'concept' ? 10 : 13;
      g.appendChild(this._el('text', {
        x: 0, y: 4, 'text-anchor': 'middle', class: 'eq-chip-txt', 'font-size': fs,
      }, n.label));
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onPick && this.onPick(n.kind, n.id);
      });
      this.gNodes.appendChild(g);
    });

    svg.addEventListener('click', () => this.onPick && this.onPick('map', null));
    this.paint();
  }

  setSelected(kind, id) {
    this.selected = id;
    this.focus = id;
    this.paint();
  }

  setFocus(id) {
    this.focus = id;
    this.paint();
  }

  setPulse(id) {
    this.pulse = id;
    this.paint();
  }

  paint() {
    const focus = this.focus;
    const near = focus ? neighborhood(focus) : null;
    this.gEdges.innerHTML = '';
    this.gLabs.innerHTML = '';

    for (const e of EDGES) {
      const a = BY_ID[e.source];
      const b = BY_ID[e.target];
      if (!a || !b) continue;
      const hi = !near || near.has(e.source) || near.has(e.target);
      const pulse = this.pulse && (e.source === this.pulse || (near && near.has(e.target) && e.source === this.pulse));
      const cls = [
        'eq-edge',
        e.direct ? 'is-direct' : 'is-indirect',
        hi ? 'is-hot' : 'is-dim',
        pulse ? 'is-pulse' : '',
      ].join(' ');
      if (!e.direct && !this.showIndirect && !hi) continue;
      const path = this._el('path', {
        d: `M ${a.x} ${a.y} L ${b.x} ${b.y}`,
        class: cls,
      });
      this.gEdges.appendChild(path);
      if (hi && focus && (e.source === focus || e.target === focus)) {
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2 - 8;
        const t = this._el('text', { x: mx, y: my, class: 'eq-edge-lab', 'text-anchor': 'middle' }, e.explanation);
        this.gLabs.appendChild(t);
      }
    }

    this.gNodes.querySelectorAll('.eq-node').forEach((g) => {
      const id = g.getAttribute('data-id');
      const on = id === this.selected;
      const dim = near && !near.has(id) && id !== focus;
      g.classList.toggle('is-on', on);
      g.classList.toggle('is-dim', !!dim);
      g.classList.toggle('is-near', !!(near && near.has(id)));
    });
  }
}
