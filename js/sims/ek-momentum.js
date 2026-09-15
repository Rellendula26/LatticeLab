/* E–k momentum / velocity / m* sandbox — visualization & UI
 * ---------------------------------------------------------
 * All band algebra is in js/physics/ek-bands.js (window.EkPhysics).
 * This file maps those numbers onto SVG, sliders, and guided steps.
 *
 * k-space motion (the E–k plot) is a change of crystal-momentum state.
 * Real-space motion (the strip below) is the group-velocity drift of
 * the wave packet. They are intentionally drawn as two different pictures.
 */

const EK_GUIDE = [
  {
    title: 'k is a crystal-momentum state',
    body: 'The horizontal axis is wavevector k, not a hallway inside the silicon. Sliding the electron sideways picks a different allowed (E, k) state. Crystal momentum is p = ħk.',
    tip: 'k is not physical position.',
    setup: function () {
      ekApplyView('electron');
      ekState.k = 0.72;
      ekState.fieldOn = false;
      ekState.showTangent = false;
      ekState.showVelocity = false;
      ekState.showReal = false;
    },
  },
  {
    title: 'Location on the curve sets the slope',
    body: 'The band is a map of allowed energies. Wherever the electron sits, the curve has a local tilt dE/dk. That tilt is a property of the state — the electron is not rolling downhill.',
    tip: 'Electrons do not roll down the E–k diagram.',
    setup: function () {
      ekApplyView('electron');
      ekState.k = 0.85;
      ekState.fieldOn = false;
      ekState.showTangent = true;
      ekState.showVelocity = false;
      ekState.showReal = false;
    },
  },
  {
    title: 'Slope is group velocity',
    body: 'v = (1/ħ) dE/dk. Negative slope → leftward velocity, zero slope → parked, steeper slope → faster. At k = 0 the band is flat: the electron is in the conduction band and still not moving.',
    tip: 'Being in the conduction band does not mean the electron is moving.',
    setup: function () {
      ekApplyView('electron');
      ekState.k = 0;
      ekState.fieldOn = false;
      ekState.showTangent = true;
      ekState.showVelocity = true;
      ekState.showReal = true;
    },
  },
  {
    title: 'An electric field changes k',
    body: 'The acceleration theorem is ħ dk/dt = F = −qE for an electron. The field does not shove the dot through the crystal on this plot — it walks the quantum state across k-space.',
    tip: 'Motion on the E–k graph is a changing k-state, not a walk through silicon.',
    setup: function () {
      ekApplyView('electron');
      ekState.k = 0;
      ekState.xA = 0.5;
      ekState.fieldOn = true;
      ekState.playing = true;
      ekState.showTangent = true;
      ekState.showVelocity = true;
      ekState.showReal = true;
    },
  },
  {
    title: 'New k, new slope, new velocity',
    body: 'Watch the chain: field → force → Δk → the tangent steepens (or flattens) → v changes. Acceleration is this chain, not a ball sliding on a hill.',
    tip: 'Velocity lives in real space. k lives in reciprocal space.',
    setup: function () {
      ekApplyView('electron');
      ekState.fieldOn = true;
      ekState.playing = true;
      ekState.showTangent = true;
      ekState.showVelocity = true;
      ekState.showReal = true;
    },
  },
  {
    title: 'Curvature says how fast velocity can change',
    body: 'Both carriers feel the same force, so k advances at the same rate. The sharper band changes slope more for that same Δk, so velocity runs away faster.',
    tip: 'dk/dt does not know about m*. dv/dt does.',
    setup: function () {
      ekApplyView('compare');
      ekState.k = 0;
      ekState.xA = 0.38;
      ekState.xB = 0.38;
      ekState.fieldOn = true;
      ekState.playing = true;
      ekState.showTangent = true;
      ekState.showVelocity = true;
      ekState.showReal = true;
    },
  },
  {
    title: 'That response is called effective mass',
    body: 'm* = ħ² / (d²E/dk²). High curvature → small m* → easy to accelerate. A flat band → large m*. The electron’s rest mass did not change — the crystal is dressing how it answers a force.',
    tip: 'Effective mass is not a change in the electron’s fundamental mass.',
    setup: function () {
      ekApplyView('compare');
      ekState.fieldOn = true;
      ekState.playing = true;
      ekState.showTangent = true;
      ekState.showVelocity = true;
      ekState.showReal = true;
    },
  },
  {
    title: 'Why momentum matters',
    body: 'A field changes crystal momentum k. Band location sets the slope (velocity) and the curvature (how easily that velocity changes). Band structure is therefore what decides acceleration, mobility, and current.',
    tip: 'Lattice → bands → curvature → m* → motion → current.',
    setup: function () {
      ekApplyView('electron');
      ekState.fieldOn = false;
      ekState.playing = false;
      ekState.showTangent = true;
      ekState.showVelocity = true;
      ekState.showReal = true;
      ekState.chainLit = 0;
      ekState.chainT0 = performance.now();
    },
  },
];

const ekState = {
  playing: true,
  fieldOn: false,
  view: 'electron',
  guided: false,
  step: 0,
  showTangent: true,
  showVelocity: true,
  showReal: true,
  k: 0,
  xA: 0.5,
  xB: 0.5,
  curve: 1,
  Efield: 0.65,
  lastTs: 0,
  raf: 0,
  inited: false,
  dragging: false,
  atEdge: false,
  chainLit: -1,
  chainT0: 0,
  pulse: 0,
};

const EK_XSCALE = 0.22;
/** Teaching-time stretch so ħ dk/dt is watchable. Real-space still uses live v. */
const EK_KTIME = 0.4;
const EK_CHAIN = [
  'Crystal lattice',
  'periodic potential',
  'E–k band structure',
  'band curvature',
  'effective mass',
  'carrier acceleration',
  'mobility / current',
];

function ekP() {
  return window.EkPhysics;
}

function ekCurvature() {
  return Number(ekState.curve);
}

function ekMass() {
  return ekP().massFromCurvature(ekCurvature());
}

function ekLightMass() {
  return ekP().massFromCurvature(ekP().LIGHT_CURVATURE);
}

function ekHeavyMass() {
  return ekP().massFromCurvature(ekP().HEAVY_CURVATURE);
}

function ekChargeSign() {
  return ekState.view === 'holes' ? 1 : -1;
}

function ekAppliedE() {
  return ekState.fieldOn ? Number(ekState.Efield) : 0;
}

function ekFmt(n, d) {
  const v = Number(n);
  if (!isFinite(v)) return '—';
  const s = (v >= 0 ? '+' : '') + v.toFixed(d == null ? 2 : d);
  return s;
}

function ekApplyView(view) {
  ekState.view = view;
  document.querySelectorAll('[data-ek-view]').forEach((b) => {
    const on = b.dataset.ekView === view;
    b.classList.toggle('bg-electron', on);
    b.classList.toggle('text-white', on);
    b.classList.toggle('text-slate-300', !on);
  });
  const single = document.getElementById('ek-view-single');
  const compare = document.getElementById('ek-view-compare');
  const holes = document.getElementById('ek-view-holes');
  if (single) single.classList.toggle('hidden', view !== 'electron');
  if (compare) compare.classList.toggle('hidden', view !== 'compare');
  if (holes) holes.classList.toggle('hidden', view !== 'holes');
  const curveWrap = document.getElementById('ek-curve-wrap');
  if (curveWrap) curveWrap.classList.toggle('opacity-40', view !== 'electron');
  const curveIn = document.getElementById('ek-curve');
  if (curveIn) curveIn.disabled = view !== 'electron';
}

function ekSyncControls() {
  const kIn = document.getElementById('ek-k');
  const eIn = document.getElementById('ek-efield');
  const cIn = document.getElementById('ek-curve');
  if (kIn && document.activeElement !== kIn) kIn.value = String(ekState.k);
  if (eIn && document.activeElement !== eIn) eIn.value = String(ekState.Efield);
  if (cIn && document.activeElement !== cIn) cIn.value = String(ekState.curve);
  const kLab = document.getElementById('ek-k-lab');
  const eLab = document.getElementById('ek-efield-lab');
  const cLab = document.getElementById('ek-curve-lab');
  if (kLab) kLab.textContent = ekFmt(ekState.k, 2);
  if (eLab) eLab.textContent = ekState.Efield.toFixed(2);
  if (cLab) {
    const m = ekMass();
    cLab.textContent = ekCurvature().toFixed(2) + '  ·  m* = ' + m.toFixed(2);
  }
  const fieldBtn = document.getElementById('ek-field-btn');
  if (fieldBtn) {
    fieldBtn.classList.toggle('is-on', ekState.fieldOn);
    fieldBtn.innerHTML = ekState.fieldOn
      ? '<i class="fa-solid fa-bolt mr-2"></i>Field on'
      : '<i class="fa-solid fa-bolt mr-2"></i>Apply Electric Field';
  }
  const playBtn = document.getElementById('ek-play');
  if (playBtn) {
    playBtn.innerHTML = ekState.playing
      ? '<i class="fa-solid fa-pause mr-2"></i>Pause'
      : '<i class="fa-solid fa-play mr-2"></i>Play';
  }
  const tan = document.getElementById('ek-tog-tan');
  const vel = document.getElementById('ek-tog-vel');
  const real = document.getElementById('ek-tog-real');
  if (tan) tan.checked = ekState.showTangent;
  if (vel) vel.checked = ekState.showVelocity;
  if (real) real.checked = ekState.showReal;
  const realWrap = document.getElementById('ek-real-wrap');
  if (realWrap) realWrap.classList.toggle('hidden', !ekState.showReal);
}

/* ---------- SVG geometry ---------- */

function ekMap(w, h, pad) {
  const P = ekP();
  const x0 = pad.l, x1 = w - pad.r, y0 = pad.t, y1 = h - pad.b;
  return {
    x0: x0, x1: x1, y0: y0, y1: y1,
    x: function (k) { return x0 + (k - (-P.K_MAX)) / (2 * P.K_MAX) * (x1 - x0); },
    y: function (E) { return y1 - (E - P.E_MIN) / (P.E_MAX - P.E_MIN) * (y1 - y0); },
    kFromX: function (px) { return -P.K_MAX + (px - x0) / (x1 - x0) * (2 * P.K_MAX); },
  };
}

function ekBandPath(map, energyFn, mStar) {
  const P = ekP();
  const n = 96;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const k = -P.K_MAX + (2 * P.K_MAX) * i / n;
    pts.push((i ? 'L' : 'M') + map.x(k).toFixed(2) + ',' + map.y(energyFn(k, mStar)).toFixed(2));
  }
  return pts.join(' ');
}

function ekArrow(x1, y1, x2, y2, color, label, labelY) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const ah = 7;
  const bx = x2 - ux * ah, by = y2 - uy * ah;
  const px = -uy, py = ux;
  const head = (bx + px * 4.2) + ',' + (by + py * 4.2) + ' ' + x2 + ',' + y2 + ' ' + (bx - px * 4.2) + ',' + (by - py * 4.2);
  let s = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + (x2 - ux * 5) + '" y2="' + (y2 - uy * 5) + '" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round"/>';
  s += '<polygon points="' + head + '" fill="' + color + '"/>';
  if (label) {
    s += '<text x="' + ((x1 + x2) / 2) + '" y="' + (labelY == null ? (y1 - 8) : labelY) + '" fill="' + color + '" font-size="11" text-anchor="middle" font-family="IBM Plex Sans, sans-serif">' + label + '</text>';
  }
  return s;
}

function ekDrawPlot(svg, spec) {
  const P = ekP();
  const w = spec.w, h = spec.h;
  const pad = spec.pad || { l: 62, r: 22, t: 36, b: 52 };
  const map = ekMap(w, h, pad);
  const midX = map.x(0);
  const axisY = map.y0 + (map.y1 - map.y0);

  let html = '';
  if (!spec.title) {
    html += '<text x="16" y="22" fill="#94a3b8" font-size="13" font-family="IBM Plex Serif, serif" font-style="italic">E</text>';
  } else {
    html += '<text x="16" y="22" fill="#94a3b8" font-size="12" font-family="IBM Plex Serif, serif" font-style="italic">E</text>';
  }
  html += '<line x1="' + map.x0 + '" y1="' + map.y0 + '" x2="' + map.x0 + '" y2="' + map.y1 + '" stroke="#334155" stroke-width="1.3"/>';
  html += '<line x1="' + map.x0 + '" y1="' + map.y1 + '" x2="' + map.x1 + '" y2="' + map.y1 + '" stroke="#334155" stroke-width="1.3"/>';
  html += '<line x1="' + midX + '" y1="' + map.y0 + '" x2="' + midX + '" y2="' + map.y1 + '" stroke="rgba(148,163,184,0.2)" stroke-dasharray="3 5"/>';
  html += '<text x="' + (map.x0 + 8) + '" y="' + (map.y1 + 36) + '" fill="#64748b" font-size="11" font-family="IBM Plex Sans, sans-serif">−k</text>';
  html += '<text x="' + (map.x1 - 8) + '" y="' + (map.y1 + 36) + '" fill="#64748b" font-size="11" text-anchor="end" font-family="IBM Plex Sans, sans-serif">+k</text>';
  html += '<text x="' + ((map.x0 + map.x1) / 2) + '" y="' + (h - 8) + '" fill="#94a3b8" font-size="12" text-anchor="middle" font-family="IBM Plex Sans, sans-serif">crystal momentum k  ·  not position</text>';
  html += ekArrow(midX - 88, map.y1 + 18, midX - 18, map.y1 + 18, '#fca5a5', '', map.y1 + 16);
  html += ekArrow(midX + 18, map.y1 + 18, midX + 88, map.y1 + 18, '#7dd3fc', '', map.y1 + 16);
  html += '<text x="' + (midX - 53) + '" y="' + (map.y1 + 10) + '" fill="#fca5a5" font-size="10" text-anchor="middle" font-family="IBM Plex Sans, sans-serif">−p = ħk</text>';
  html += '<text x="' + (midX + 53) + '" y="' + (map.y1 + 10) + '" fill="#7dd3fc" font-size="10" text-anchor="middle" font-family="IBM Plex Sans, sans-serif">+p = ħk</text>';

  if (spec.title) {
    html += '<text x="' + ((map.x0 + map.x1) / 2) + '" y="22" fill="#e2e8f0" font-size="13" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-weight="600">' + spec.title + '</text>';
  }

  (spec.bands || []).forEach((b) => {
    html += '<path d="' + ekBandPath(map, b.energy, b.mStar) + '" fill="none" stroke="' + b.color + '" stroke-width="' + (b.width || 3) + '" opacity="' + (b.opacity == null ? 1 : b.opacity) + '"/>';
    if (b.label) {
      const lk = b.labelK == null ? 1.15 : b.labelK;
      html += '<text x="' + (map.x(lk) + 6) + '" y="' + (map.y(b.energy(lk, b.mStar)) - 8) + '" fill="' + b.color + '" font-size="11" font-family="IBM Plex Sans, sans-serif">' + b.label + '</text>';
    }
  });

  (spec.carriers || []).forEach((c) => {
    const px = map.x(c.k);
    const py = map.y(c.E);
    html += '<line x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + map.y1 + '" stroke="rgba(253,230,138,0.45)" stroke-width="1.4" stroke-dasharray="4 4"/>';
    html += '<text x="' + px + '" y="' + (map.y1 + 34) + '" fill="#fde68a" font-size="11" text-anchor="middle" font-family="IBM Plex Mono, monospace">k = ' + ekFmt(c.k, 2) + '</text>';

    if (ekState.showTangent) {
      const dk = 0.48;
      const k1 = Math.max(-P.K_MAX, c.k - dk);
      const k2 = Math.min(P.K_MAX, c.k + dk);
      const e1 = c.E + c.slope * (k1 - c.k);
      const e2 = c.E + c.slope * (k2 - c.k);
      html += '<line x1="' + map.x(k1) + '" y1="' + map.y(e1) + '" x2="' + map.x(k2) + '" y2="' + map.y(e2) + '" stroke="#fbbf24" stroke-width="1.8" stroke-dasharray="6 4"/>';
      html += '<text x="' + (px + 14) + '" y="' + (py - 16) + '" fill="#fde68a" font-size="11" font-family="IBM Plex Serif, serif" font-style="italic">dE/dk = ' + ekFmt(c.slope, 2) + '</text>';
    }

    if (ekState.showVelocity) {
      if (ekP().atBandExtremum(c.k) && Math.abs(c.v) < 0.06) {
        html += '<text x="' + (px + 16) + '" y="' + (py + 18) + '" fill="#86efac" font-size="11" font-family="IBM Plex Sans, sans-serif">band extremum · v = 0</text>';
      } else {
        const len = Math.max(16, Math.min(92, Math.abs(c.v) * 36));
        const dir = c.v >= 0 ? 1 : -1;
        html += ekArrow(px, py + 22, px + dir * len, py + 22, c.vColor || '#38bdf8', 'v', py + 16);
      }
    }

    if (c.open) {
      html += '<circle cx="' + px + '" cy="' + py + '" r="9" fill="rgba(15,23,42,0.35)" stroke="' + c.color + '" stroke-width="2.4"/>';
      html += '<circle cx="' + px + '" cy="' + py + '" r="3" fill="' + c.color + '"/>';
    } else {
      html += '<circle cx="' + px + '" cy="' + py + '" r="8.5" fill="' + c.color + '" stroke="#e0f2fe" stroke-width="1.7" filter="url(#ek-glow)"/>';
    }
  });

  if (ekState.fieldOn) {
    const yE = map.y0 + 8;
    html += ekArrow(map.x0 + 36, yE, map.x0 + 130, yE, '#fbbf24', 'E field →', yE - 8);
    const fLabel = spec.forceLabel || (ekChargeSign() < 0 ? 'F = −qE ←' : 'F = +qE →');
    const fDir = ekChargeSign() < 0 ? -1 : 1;
    const fx = map.x1 - 90;
    html += ekArrow(fx - fDir * 40, yE, fx + fDir * 40, yE, '#fda4af', fLabel, yE - 8);
    html += '<text x="' + ((map.x0 + map.x1) / 2) + '" y="' + (map.y0 + 14) + '" fill="#fde68a" font-size="11" text-anchor="middle" font-family="IBM Plex Sans, sans-serif">k-state is shifting  ·  this is not motion through the crystal</text>';
  }

  if (ekP().atBandExtremum(ekState.k) && ekState.view !== 'holes') {
    html += '<text x="' + (midX + 10) + '" y="' + (map.y(P.EC0) + 22) + '" fill="#86efac" font-size="11" font-family="IBM Plex Sans, sans-serif">CB min · slope = 0</text>';
  }

  const gid = spec.gid || 'ek-glow';
  svg.innerHTML = '<defs><filter id="' + gid + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' + html.replace('url(#ek-glow)', 'url(#' + gid + ')');
  svg._ekMap = map;
}

function ekCarrierCB(k, mStar, color) {
  const P = ekP();
  const slope = P.conductionSlope(k, mStar);
  return {
    k: k,
    E: P.conductionEnergy(k, mStar),
    slope: slope,
    v: P.velocityFromSlope(slope),
    color: color || '#7dd3fc',
    vColor: '#38bdf8',
    mStar: mStar,
    open: false,
  };
}

function ekCarrierHH(k, mStar, color) {
  const P = ekP();
  return {
    k: k,
    E: P.valenceEnergy(k, mStar),
    slope: P.valenceSlope(k, mStar),
    v: P.carrierVelocity(k, mStar),
    color: color || '#fb7185',
    vColor: '#fda4af',
    mStar: mStar,
    open: true,
  };
}

function ekRenderPlots() {
  const P = ekP();
  const k = ekState.k;
  if (!document.getElementById('ek-svg')) return;
  if (ekState.view === 'electron') {
    const svg = document.getElementById('ek-svg');
    const m = ekMass();
    ekDrawPlot(svg, {
      w: 760, h: 500,
      bands: [
        { energy: P.valenceEnergy, mStar: 1, color: '#ef4444', width: 2.2, opacity: 0.35, label: 'VB', labelK: -1.2 },
        { energy: P.conductionEnergy, mStar: m, color: '#38bdf8', width: 3.1, label: 'CB', labelK: 1.15 },
      ],
      carriers: [ekCarrierCB(k, m)],
      gid: 'ek-glow-e',
    });
  } else if (ekState.view === 'compare') {
    const a = document.getElementById('ek-svg-a');
    const b = document.getElementById('ek-svg-b');
    const mL = ekLightMass();
    const mH = ekHeavyMass();
    const pad = { l: 52, r: 14, t: 40, b: 50 };
    ekDrawPlot(a, {
      w: 380, h: 420, pad: pad,
      title: 'High curvature · light m* = ' + mL.toFixed(2),
      bands: [{ energy: P.conductionEnergy, mStar: mL, color: '#38bdf8', width: 3, label: 'CB' }],
      carriers: [ekCarrierCB(k, mL, '#7dd3fc')],
      gid: 'ek-glow-a',
    });
    ekDrawPlot(b, {
      w: 380, h: 420, pad: pad,
      title: 'Low curvature · heavy m* = ' + mH.toFixed(2),
      bands: [{ energy: P.conductionEnergy, mStar: mH, color: '#94a3b8', width: 3, label: 'CB' }],
      carriers: [ekCarrierCB(k, mH, '#cbd5e1')],
      gid: 'ek-glow-b',
    });
  } else {
    const svg = document.getElementById('ek-svg-h');
    const mL = ekLightMass();
    const mH = ekHeavyMass();
    ekDrawPlot(svg, {
      w: 760, h: 500,
      forceLabel: 'F = +qE →',
      bands: [
        { energy: P.valenceEnergy, mStar: mL, color: '#fb7185', width: 3, label: 'light hole', labelK: 1.05 },
        { energy: P.valenceEnergy, mStar: mH, color: '#f87171', width: 3, opacity: 0.85, label: 'heavy hole', labelK: -1.25 },
      ],
      carriers: [
        ekCarrierHH(k, mL, '#fb7185'),
        ekCarrierHH(k, mH, '#f87171'),
      ],
      gid: 'ek-glow-h',
    });
  }
}

function ekRenderReadout() {
  const P = ekP();
  const k = ekState.k;
  const view = ekState.view;
  const m = view === 'electron' ? ekMass() : ekLightMass();
  const slope = view === 'holes' ? P.valenceSlope(k, m) : P.conductionSlope(k, m);
  const v = view === 'holes' ? P.carrierVelocity(k, m) : P.velocityFromSlope(slope);
  const curv = view === 'electron' ? ekCurvature() : P.LIGHT_CURVATURE;
  const mStar = P.massFromCurvature(curv);

  const set = function (id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };
  set('ek-q-k', ekFmt(k, 2));
  set('ek-q-p', ekFmt(P.crystalMomentum(k), 2) + ' <span class="eq italic text-slate-400">ħ</span>');
  set('ek-q-slope', ekFmt(slope, 2));
  set('ek-q-v', ekFmt(v, 2));
  set('ek-q-curv', curv.toFixed(2));
  set('ek-q-m', mStar.toFixed(2) + ' <span class="text-slate-400">m<sub>0</sub></span>');
  if (view === 'compare' || view === 'holes') {
    const mL = ekLightMass();
    const mH = ekHeavyMass();
    const sL = view === 'holes' ? P.valenceSlope(k, mL) : P.conductionSlope(k, mL);
    const sH = view === 'holes' ? P.valenceSlope(k, mH) : P.conductionSlope(k, mH);
    const vL = P.carrierVelocity(k, mL);
    const vH = P.carrierVelocity(k, mH);
    set('ek-q-slope', ekFmt(sL, 2) + ' / ' + ekFmt(sH, 2));
    set('ek-q-v', ekFmt(vL, 2) + ' / ' + ekFmt(vH, 2));
    set('ek-q-curv', P.LIGHT_CURVATURE.toFixed(2) + ' / ' + P.HEAVY_CURVATURE.toFixed(2));
    set('ek-q-m', mL.toFixed(2) + ' / ' + mH.toFixed(2) + ' <span class="text-slate-400">m<sub>0</sub></span>');
  }

  const vNote = document.getElementById('ek-v-note');
  if (vNote) {
    if (P.atBandExtremum(k)) {
      vNote.textContent = 'k = 0 · slope = 0 · group velocity = 0. Occupying the conduction band is not the same as moving.';
    } else if (v < -0.04) {
      vNote.textContent = 'Negative slope → velocity points left (negative). Steeper tilt → larger |v|.';
    } else if (v > 0.04) {
      vNote.textContent = 'Positive slope → velocity points right (positive). Steeper tilt → larger |v|.';
    } else {
      vNote.textContent = 'v = (1/ħ) dE/dk. The tangent is the whole story.';
    }
  }

  const liveEq = document.getElementById('ek-live-eq');
  if (liveEq) {
    liveEq.innerHTML =
      '<span class="eq italic">p</span> = ħk = ' + ekFmt(P.crystalMomentum(k), 2) +
      '&nbsp;&nbsp;·&nbsp;&nbsp;<span class="eq italic">v</span> = (1/ħ) dE/dk = ' + ekFmt(v, 2) +
      '&nbsp;&nbsp;·&nbsp;&nbsp;<span class="eq italic">m</span>* = ħ² / (d²E/dk²) = ' + mStar.toFixed(2);
  }

  const rest = document.getElementById('ek-rest-mass');
  if (rest) {
    rest.classList.toggle('hidden', view === 'electron' && !ekState.guided);
    if (view === 'compare' || (ekState.guided && ekState.step >= 6)) rest.classList.remove('hidden');
  }

  const edge = document.getElementById('ek-edge');
  if (edge) edge.classList.toggle('hidden', !ekState.atEdge);

  ekRenderChain();
  ekRenderForceChain();
}

function ekRenderForceChain() {
  const on = ekState.fieldOn;
  const phase = on ? Math.floor((ekState.pulse * 1.6) % 5) : -1;
  document.querySelectorAll('#ek-force-chain [data-f]').forEach((el) => {
    const idx = Number(el.dataset.f);
    el.classList.toggle('on', on && idx <= phase);
  });
}

function ekRenderChain() {
  const box = document.getElementById('ek-concept-chain');
  if (!box) return;
  const lit = ekState.chainLit;
  box.innerHTML = EK_CHAIN.map((name, i) => {
    const cls = i <= lit ? 'ek-chain-node on' : 'ek-chain-node';
    const arrow = i < EK_CHAIN.length - 1 ? '<span class="ek-chain-arrow">→</span>' : '';
    return '<span class="' + cls + '">' + name + '</span>' + arrow;
  }).join('');
}

function ekRenderReal() {
  const wrap = document.getElementById('ek-real-wrap');
  if (!wrap || !ekState.showReal) return;
  const view = ekState.view;
  const k = ekState.k;
  const tracks = [];
  if (view === 'electron') {
    const v = ekP().carrierVelocity(k, ekMass());
    tracks.push({ name: 'Electron in a 1-D crystal', x: ekState.xA, v: v, color: '#38bdf8', hole: false });
  } else if (view === 'compare') {
    tracks.push({ name: 'Light m*  ·  same force', x: ekState.xA, v: ekP().carrierVelocity(k, ekLightMass()), color: '#38bdf8', hole: false });
    tracks.push({ name: 'Heavy m*  ·  same force', x: ekState.xB, v: ekP().carrierVelocity(k, ekHeavyMass()), color: '#cbd5e1', hole: false });
  } else {
    tracks.push({ name: 'Light hole', x: ekState.xA, v: ekP().carrierVelocity(k, ekLightMass()), color: '#fb7185', hole: true });
    tracks.push({ name: 'Heavy hole', x: ekState.xB, v: ekP().carrierVelocity(k, ekHeavyMass()), color: '#f87171', hole: true });
  }

  const fieldChev = ekState.fieldOn
    ? '<div class="ek-field-chev" aria-hidden="true"></div>'
    : '';

  document.getElementById('ek-tracks').innerHTML = tracks.map((t) => {
    const left = (8 + t.x * 84).toFixed(2);
    const dir = t.v >= 0 ? 1 : -1;
    const len = Math.min(54, Math.abs(t.v) * 28);
    const hole = t.hole
      ? '<span class="ek-real-dot hole" style="left:' + left + '%;border-color:' + t.color + '"></span>'
      : '<span class="ek-real-dot" style="left:' + left + '%;background:' + t.color + '"></span>';
    const vlab = Math.abs(t.v) < 0.04
      ? 'v = 0'
      : (dir > 0 ? 'v →' : '← v') + '  ' + ekFmt(t.v, 2);
    return (
      '<div class="ek-track-block">' +
        '<div class="mb-1 flex justify-between text-[11px] uppercase tracking-wider text-slate-500"><span>' + t.name + '</span><span class="font-mono normal-case tracking-normal text-slate-300">' + vlab + '</span></div>' +
        '<div class="ek-track">' + fieldChev + hole +
          (Math.abs(t.v) >= 0.04 ? '<span class="ek-real-v" style="left:' + left + '%;width:' + len + 'px;transform:translateY(-50%) ' + (dir < 0 ? 'translateX(-100%) scaleX(-1)' : '') + '"></span>' : '') +
        '</div>' +
      '</div>'
    );
  }).join('');
}

function ekRenderGuide() {
  const panel = document.getElementById('ek-guide');
  const freeHint = document.getElementById('ek-free-hint');
  if (!panel) return;
  panel.classList.toggle('hidden', !ekState.guided);
  if (freeHint) freeHint.classList.toggle('hidden', ekState.guided);
  if (!ekState.guided) return;
  const s = EK_GUIDE[ekState.step];
  document.getElementById('ek-guide-step').textContent = 'Step ' + (ekState.step + 1) + ' of ' + EK_GUIDE.length;
  document.getElementById('ek-guide-title').textContent = s.title;
  document.getElementById('ek-guide-body').textContent = s.body;
  document.getElementById('ek-guide-tip').textContent = s.tip;
  document.getElementById('ek-guide-back').disabled = ekState.step === 0;
  document.getElementById('ek-guide-next').textContent = ekState.step === EK_GUIDE.length - 1 ? 'Finish' : 'Next';
  document.querySelectorAll('#ek-guide-dots span').forEach((d, i) => {
    d.classList.toggle('on', i === ekState.step);
    d.classList.toggle('done', i < ekState.step);
  });
}

function ekSetWhy(text) {
  const el = document.getElementById('ek-why');
  if (el) el.textContent = text;
}

function ekRenderAll() {
  ekSyncControls();
  ekRenderPlots();
  ekRenderReadout();
  ekRenderReal();
  ekRenderGuide();
}

function ekAdvance(dt) {
  if (!ekState.playing) return;
  const P = ekP();
  const E = ekAppliedE();
  const sign = ekChargeSign();
  if (E !== 0) {
    const next = P.stepK(ekState.k, E, sign, dt * EK_KTIME, P.K_MAX);
    ekState.atEdge = next === P.K_MAX || next === -P.K_MAX;
    ekState.k = next;
  } else {
    ekState.atEdge = false;
  }

  const k = ekState.k;
  if (ekState.view === 'electron') {
    ekState.xA = (ekState.xA + P.carrierVelocity(k, ekMass()) * dt * EK_XSCALE) % 1;
    if (ekState.xA < 0) ekState.xA += 1;
  } else if (ekState.view === 'compare') {
    ekState.xA = (ekState.xA + P.carrierVelocity(k, ekLightMass()) * dt * EK_XSCALE) % 1;
    ekState.xB = (ekState.xB + P.carrierVelocity(k, ekHeavyMass()) * dt * EK_XSCALE) % 1;
    if (ekState.xA < 0) ekState.xA += 1;
    if (ekState.xB < 0) ekState.xB += 1;
  } else {
    ekState.xA = (ekState.xA + P.carrierVelocity(k, ekLightMass()) * dt * EK_XSCALE) % 1;
    ekState.xB = (ekState.xB + P.carrierVelocity(k, ekHeavyMass()) * dt * EK_XSCALE) % 1;
    if (ekState.xA < 0) ekState.xA += 1;
    if (ekState.xB < 0) ekState.xB += 1;
  }

  if (ekState.guided && ekState.step === EK_GUIDE.length - 1) {
    const t = (performance.now() - ekState.chainT0) / 700;
    ekState.chainLit = Math.min(EK_CHAIN.length - 1, Math.floor(t));
  }
}

function ekTick(ts) {
  const panel = document.getElementById('panel-ek');
  if (!panel || panel.classList.contains('hidden')) {
    stopEkMomentum();
    return;
  }
  if (ekState.lastTs) {
    const dt = Math.min(0.033, (ts - ekState.lastTs) / 1000);
    ekState.pulse += dt;
    ekAdvance(dt);
  }
  ekState.lastTs = ts;
  ekRenderAll();
  ekState.raf = requestAnimationFrame(ekTick);
}

function ekReset(soft) {
  ekState.k = 0;
  ekState.xA = 0.5;
  ekState.xB = 0.5;
  ekState.atEdge = false;
  ekState.chainLit = -1;
  if (!soft) {
    ekState.fieldOn = false;
    ekState.playing = true;
    ekState.curve = 1;
    ekState.Efield = 0.65;
    if (!ekState.guided) ekApplyView('electron');
  }
  ekSetWhy('k = 0 is the band extremum: slope and group velocity are both zero. Occupying the conduction band is not the same as moving.');
}

function ekGoStep(n) {
  ekState.step = Math.max(0, Math.min(EK_GUIDE.length - 1, n));
  const s = EK_GUIDE[ekState.step];
  s.setup();
  if (ekState.step !== EK_GUIDE.length - 1) ekState.chainLit = -1;
  ekSetWhy(s.tip);
  ekRenderAll();
}

function ekBindSvgDrag(svg) {
  if (!svg || svg._ekBound) return;
  svg._ekBound = true;
  const pick = function (ev) {
    const map = svg._ekMap;
    if (!map) return;
    const r = svg.getBoundingClientRect();
    const pt = ev.touches ? ev.touches[0] : ev;
    const x = (pt.clientX - r.left) / r.width * Number(svg.viewBox.baseVal.width || 760);
    let k = map.kFromX(x);
    const lim = ekP().K_MAX;
    if (k > lim) k = lim;
    if (k < -lim) k = -lim;
    ekState.k = k;
    if (ekState.fieldOn) {
      ekState.fieldOn = false;
      ekSetWhy('Dragging sets a k-state by hand. The field was released so the slider and the force are not fighting.');
    }
  };
  svg.addEventListener('pointerdown', (ev) => {
    ekState.dragging = true;
    svg.setPointerCapture(ev.pointerId);
    pick(ev);
    ekRenderAll();
  });
  svg.addEventListener('pointermove', (ev) => {
    if (!ekState.dragging) return;
    pick(ev);
    ekRenderAll();
  });
  svg.addEventListener('pointerup', () => { ekState.dragging = false; });
  svg.addEventListener('pointercancel', () => { ekState.dragging = false; });
}

function ekSetMode(guided) {
  ekState.guided = guided;
  document.querySelectorAll('[data-ek-mode]').forEach((b) => {
    const on = (b.dataset.ekMode === 'guided') === guided;
    b.classList.toggle('bg-electron', on);
    b.classList.toggle('text-white', on);
    b.classList.toggle('text-slate-300', !on);
  });
  if (guided) {
    ekGoStep(0);
  } else {
    ekState.chainLit = -1;
    ekApplyView(ekState.view);
    ekSetWhy('Free exploration. Drag the electron or use the k slider. Apply a field only when you want k to evolve.');
    ekRenderAll();
  }
}

function stopEkMomentum() {
  cancelAnimationFrame(ekState.raf);
  ekState.raf = 0;
  ekState.lastTs = 0;
}

function initEkMomentum() {
  const root = document.getElementById('panel-ek');
  if (!root) return;
  if (!ekState.inited) {
    document.querySelectorAll('[data-ek-mode]').forEach((b) => {
      b.addEventListener('click', () => ekSetMode(b.dataset.ekMode === 'guided'));
    });
    document.querySelectorAll('[data-ek-view]').forEach((b) => {
      b.addEventListener('click', () => {
        if (ekState.guided) ekSetMode(false);
        ekApplyView(b.dataset.ekView);
        ekState.k = 0;
        ekState.xA = 0.42;
        ekState.xB = 0.42;
        if (b.dataset.ekView === 'compare') {
          ekSetWhy('Same k(t) on both sides — the field does not know m*. The sharper band turns that Δk into a larger Δv.');
        } else if (b.dataset.ekView === 'holes') {
          ekSetWhy('Light-hole band is more curved. Same +qE advances both holes equally in k; the light hole’s velocity grows faster.');
        } else {
          ekSetWhy('One conduction electron. k is its crystal-momentum state. The faded red curve is a valence band for orientation only.');
        }
        ekRenderAll();
      });
    });
    document.getElementById('ek-k').addEventListener('input', (e) => {
      ekState.k = Number(e.target.value);
      if (ekState.fieldOn) ekState.fieldOn = false;
      ekSetWhy('You chose a k-state. Energy, slope, and velocity are read from the band at that k — nothing rolled downhill.');
      ekRenderAll();
    });
    document.getElementById('ek-efield').addEventListener('input', (e) => {
      ekState.Efield = Number(e.target.value);
      ekSetWhy('Larger E → faster ħ dk/dt = −qE (electrons) or +qE (holes). m* is still not in this equation.');
      ekRenderAll();
    });
    document.getElementById('ek-curve').addEventListener('input', (e) => {
      ekState.curve = Number(e.target.value);
      ekSetWhy(ekCurvature() > 1.4
        ? 'Sharper bend: d²E/dk² is large, so m* = ħ² / (d²E/dk²) is small. A light carrier.'
        : ekCurvature() < 0.7
          ? 'Flatter band: curvature is small, m* is large. Same force, stubborn velocity.'
          : 'Band curvature is d²E/dk². It is the only geometric fact that m* is reporting.');
      ekRenderAll();
    });
    document.getElementById('ek-play').addEventListener('click', () => {
      ekState.playing = !ekState.playing;
      ekSetWhy(ekState.playing
        ? 'Time is running. Constant k means constant v (real-space drift). A field is what makes k — and therefore v — change.'
        : 'Paused. k-space and real space are frozen together.');
      ekRenderAll();
    });
    document.getElementById('ek-reset').addEventListener('click', () => {
      if (ekState.guided) ekGoStep(ekState.step);
      else ekReset();
      ekRenderAll();
    });
    document.getElementById('ek-field-btn').addEventListener('click', () => {
      ekState.fieldOn = !ekState.fieldOn;
      if (ekState.fieldOn) ekState.playing = true;
      ekSetWhy(ekState.fieldOn
        ? 'Field on: ħ dk/dt = F. The E–k dot is changing its quantum state. The strip below is the actual drift through the crystal.'
        : 'Field off. k is frozen, so velocity is constant — uniform motion, not acceleration.');
      ekRenderAll();
    });
    document.getElementById('ek-tog-tan').addEventListener('change', (e) => {
      ekState.showTangent = e.target.checked;
      ekRenderAll();
    });
    document.getElementById('ek-tog-vel').addEventListener('change', (e) => {
      ekState.showVelocity = e.target.checked;
      ekRenderAll();
    });
    document.getElementById('ek-tog-real').addEventListener('change', (e) => {
      ekState.showReal = e.target.checked;
      ekRenderAll();
    });
    document.getElementById('ek-guide-next').addEventListener('click', () => {
      if (ekState.step >= EK_GUIDE.length - 1) {
        ekSetMode(false);
        return;
      }
      ekGoStep(ekState.step + 1);
    });
    document.getElementById('ek-guide-back').addEventListener('click', () => ekGoStep(ekState.step - 1));
    ['ek-svg', 'ek-svg-a', 'ek-svg-b', 'ek-svg-h'].forEach((id) => ekBindSvgDrag(document.getElementById(id)));
    ekState.inited = true;
  }
  if (!ekState.guided) {
    ekReset();
    ekApplyView('electron');
  }
  ekSetWhy('k is crystal momentum, not a coordinate in the chip. Drag the electron or press Apply Electric Field.');
  ekRenderAll();
  stopEkMomentum();
  ekState.lastTs = 0;
  ekState.raf = requestAnimationFrame(ekTick);
  requestAnimationFrame(function () { ekRenderAll(); });
}
