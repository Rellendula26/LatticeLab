/* ESE 2180 Core Concepts Lab — five live tabs, one shared state. */

const LAB_NA = 6.02214076e23;
const LAB_HC = 1239.84193;
let labInited = false;
let labTab = 'crystal';
let labRaf = 0;
let labPhase = 0;
let labWhy = 'Move a control. This line names the cause, then the effect.';

function labWhySet(s) {
  labWhy = s;
  const el = document.getElementById('lab-why');
  if (el) el.textContent = s;
}

function labSyncStrip() {
  const S = LabState;
  const g = document.getElementById('lab-strip-eg');
  const t = document.getElementById('lab-strip-t');
  const gap = document.getElementById('lab-strip-gap');
  if (!g) return;
  g.textContent = S.Eg.toFixed(2) + ' eV';
  t.textContent = S.T + ' K';
  gap.textContent = S.gap === 'direct' ? 'direct (GaAs-like)' : 'indirect (Si-like)';
  const ts = document.getElementById('lab-strip-t-in');
  const es = document.getElementById('lab-strip-eg-in');
  if (ts && document.activeElement !== ts) ts.value = String(S.T);
  if (es && document.activeElement !== es) es.value = String(S.Eg);
}

function parseMiller(raw) {
  const s = String(raw || '').trim();
  const compact = s.match(/^[(\[]?\s*(-?\d)(-?\d)(-?\d)\s*[)\]]?$/);
  if (compact) return [Number(compact[1]), Number(compact[2]), Number(compact[3])];
  const m = s.match(/^\s*[(\[]?\s*(-?\d+)\s*[,\s]+(-?\d+)\s*[,\s]+(-?\d+)\s*[)\]]?\s*$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

const LAB_CUBE = [
  [0,0,0,1,0,0],[1,0,0,1,1,0],[1,1,0,0,1,0],[0,1,0,0,0,0],
  [0,0,1,1,0,1],[1,0,1,1,1,1],[1,1,1,0,1,1],[0,1,1,0,0,1],
  [0,0,0,0,0,1],[1,0,0,1,0,1],[1,1,0,1,1,1],[0,1,0,0,1,1],
];
const LAB_BONDS = [
  [[0.25,0.25,0.25],[0,0,0]],[[0.25,0.25,0.25],[0.5,0.5,0]],[[0.25,0.25,0.25],[0.5,0,0.5]],[[0.25,0.25,0.25],[0,0.5,0.5]],
  [[0.75,0.75,0.25],[0.5,0.5,0]],[[0.75,0.75,0.25],[1,1,0]],[[0.75,0.75,0.25],[1,0.5,0.5]],[[0.75,0.75,0.25],[0.5,1,0.5]],
  [[0.75,0.25,0.75],[0.5,0,0.5]],[[0.75,0.25,0.75],[1,0,1]],[[0.75,0.25,0.75],[1,0.5,0.5]],[[0.75,0.25,0.75],[0.5,0.5,1]],
  [[0.25,0.75,0.75],[0,0.5,0.5]],[[0.25,0.75,0.75],[0.5,1,0.5]],[[0.25,0.75,0.75],[0,1,1]],[[0.25,0.75,0.75],[0.5,0.5,1]],
];

function labWire(a, ox, oy, oz, color, width) {
  const x = [], y = [], z = [];
  LAB_CUBE.forEach((e) => {
    x.push(ox + e[0] * a, ox + e[3] * a, null);
    y.push(oy + e[1] * a, oy + e[4] * a, null);
    z.push(oz + e[2] * a, oz + e[5] * a, null);
  });
  return { type: 'scatter3d', mode: 'lines', x: x, y: y, z: z, line: { color: color, width: width || 3 }, hoverinfo: 'skip', showlegend: false };
}

function millerPlanePoints(hkl, a, n) {
  const [h, k, l] = hkl;
  if (!h && !k && !l) return { x: [], y: [], z: [] };
  const pts = [];
  const N = n || 18;
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const u = i / N, v = j / N;
      let x, y, z;
      if (l !== 0) {
        x = u * a; y = v * a;
        z = a * (1 - h * (x / a) - k * (y / a)) / l;
      } else if (k !== 0) {
        x = u * a; z = v * a;
        y = a * (1 - h * (x / a) - l * (z / a)) / k;
      } else {
        y = u * a; z = v * a;
        x = a * (1 - k * (y / a) - l * (z / a)) / h;
      }
      if (x >= -0.02 * a && y >= -0.02 * a && z >= -0.02 * a && x <= 1.02 * a && y <= 1.02 * a && z <= 1.02 * a) {
        pts.push([x, y, z]);
      }
    }
  }
  return { x: pts.map((p) => p[0]), y: pts.map((p) => p[1]), z: pts.map((p) => p[2]) };
}

function labCrystalTraces() {
  const type = document.getElementById('lab-lat-type').value;
  const a = Number(document.getElementById('lab-lat-a').value);
  LabState.set({ a: a, lattice: type }, 'crystal');
  const share = document.getElementById('lab-lat-share').checked;
  const Nmap = { sc: 1, bcc: 2, fcc: 4, diamond: 8 };
  const N = Nmap[type];
  const aCm = a * 1e-8;
  const dens = N / Math.pow(aCm, 3);
  document.getElementById('lab-lat-neff').textContent = String(N);
  document.getElementById('lab-lat-dens').innerHTML = (dens / 1e22).toFixed(2) + ' × 10<sup>22</sup> cm<sup>−3</sup>';

  const traces = [];
  function add(pts, color, name, size, opacity) {
    traces.push({
      type: 'scatter3d', mode: 'markers', name: name,
      x: pts.map((p) => p[0]), y: pts.map((p) => p[1]), z: pts.map((p) => p[2]),
      marker: { size: size || 8, color: color, opacity: opacity == null ? 0.95 : opacity },
    });
  }
  traces.push(labWire(a, 0, 0, 0, 'rgba(148,163,184,0.7)', 4));
  const corners = [[0,0,0],[a,0,0],[a,a,0],[0,a,0],[0,0,a],[a,0,a],[a,a,a],[0,a,a]];
  const faces = [[a/2,a/2,0],[a/2,a/2,a],[a/2,0,a/2],[a/2,a,a/2],[0,a/2,a/2],[a,a/2,a/2]];
  add(corners, '#f8fafc', 'corners (×⅛ each)', 8);
  if (type === 'bcc') add([[a/2,a/2,a/2]], '#38bdf8', 'body center (owned wholly)', 12);
  if (type === 'fcc' || type === 'diamond') add(faces, '#7dd3fc', 'face centers (×½ each)', 10);
  if (type === 'diamond') {
    add([[0.25,0.25,0.25],[0.75,0.75,0.25],[0.75,0.25,0.75],[0.25,0.75,0.75]].map((p) => [p[0]*a,p[1]*a,p[2]*a]), '#e11d48', 'internal (owned wholly)', 8);
    const bx = [], by = [], bz = [];
    LAB_BONDS.forEach(([p, q]) => {
      bx.push(p[0]*a, q[0]*a, null);
      by.push(p[1]*a, q[1]*a, null);
      bz.push(p[2]*a, q[2]*a, null);
    });
    traces.push({ type: 'scatter3d', mode: 'lines', name: 'tetrahedral bonds', x: bx, y: by, z: bz, line: { color: 'rgba(251,191,36,0.55)', width: 3 }, hoverinfo: 'skip' });
  }
  if (share) {
    /* Eight cells meet at the origin: that corner is 1/8. Adjacent cells share each face 1/2. */
    const neigh = [];
    for (const ox of [-a, 0]) for (const oy of [-a, 0]) for (const oz of [-a, 0]) {
      if (!ox && !oy && !oz) continue;
      traces.push(labWire(a, ox, oy, oz, 'rgba(100,116,139,0.28)', 2));
      neigh.push([ox, oy, oz], [ox + a, oy, oz], [ox, oy + a, oz], [ox, oy, oz + a]);
    }
    add(neigh, '#64748b', 'neighbor-cell corners', 5, 0.28);
    add([[0, 0, 0]], '#fbbf24', 'this corner is 8-way shared', 13, 0.95);
  }

  const miller = parseMiller(document.getElementById('lab-miller').value);
  const kind = document.getElementById('lab-miller-kind').value;
  if (miller) {
    if (kind === 'plane') {
      const P = millerPlanePoints(miller, a, 16);
      if (P.x.length) {
        traces.push({
          type: 'scatter3d', mode: 'markers', name: '(' + miller.join('') + ') plane',
          x: P.x, y: P.y, z: P.z,
          marker: { size: 2.4, color: '#fbbf24', opacity: 0.55 },
        });
      }
    } else {
      const len = Math.hypot(miller[0], miller[1], miller[2]) || 1;
      const s = a * 1.15 / len;
      traces.push({
        type: 'scatter3d', mode: 'lines+markers', name: '[' + miller.join(' ') + ']',
        x: [0, miller[0] * s], y: [0, miller[1] * s], z: [0, miller[2] * s],
        line: { color: '#fbbf24', width: 8 },
        marker: { size: 5, color: '#fde68a' },
      });
    }
  }
  return traces;
}

function renderLabCrystal() {
  const a = Number(document.getElementById('lab-lat-a').value);
  document.getElementById('lab-lat-a-lab').textContent = a.toFixed(3) + ' Å';
  const traces = labCrystalTraces();
  Plotly.react('plot-lab-crystal', traces, baseLayout({
    margin: { l: 0, r: 0, t: 8, b: 0 },
    showlegend: true,
    legend: { orientation: 'h', y: -0.02, font: { size: 11 } },
    scene: {
      bgcolor: 'rgba(15,23,42,0.2)', aspectmode: 'cube',
      xaxis: { range: [-a * 1.15, a * 1.35], title: 'x (Å)', gridcolor: '#1e293b', color: '#94a3b8' },
      yaxis: { range: [-a * 1.15, a * 1.35], title: 'y (Å)', gridcolor: '#1e293b', color: '#94a3b8' },
      zaxis: { range: [-a * 1.15, a * 1.35], title: 'z (Å)', gridcolor: '#1e293b', color: '#94a3b8' },
      camera: { eye: { x: 1.75, y: 1.45, z: 1.15 } },
    },
  }), { responsive: true, displaylogo: false });
}

function labEkCurves() {
  const S = LabState;
  const koff = S.gap === 'direct' ? 0 : 1.45;
  const c = S.curve;
  const Ev0 = 0, Ec0 = S.Eg;
  const k = linspace(-2.2, 2.7, 280);
  return {
    k, koff, Ev0, Ec0,
    Ev: k.map((x) => Ev0 - c * x * x * 0.22),
    Ec: k.map((x) => Ec0 + c * Math.pow(x - koff, 2) * 0.22),
  };
}

function renderLabEk() {
  const S = LabState;
  const C = labEkCurves();
  const mstar = (1 / S.curve).toFixed(2);
  document.getElementById('lab-ek-m').textContent = mstar + ' m₀ (rel.)';
  document.getElementById('lab-ek-eg-lab').textContent = S.Eg.toFixed(2) + ' eV';
  const eK = C.koff, eE = C.Ec0 - (0.5 + 0.5 * Math.sin(labPhase)) * S.Eg;
  const traces = [
    { x: C.k, y: C.Ev, name: 'Ev(k)  valence', line: { color: '#ef4444', width: 3 } },
    { x: C.k, y: C.Ec, name: 'Ec(k)  conduction', line: { color: '#38bdf8', width: 3 } },
    { x: [0], y: [0], name: 'VB max', mode: 'markers', marker: { size: 10, color: '#fca5a5' } },
    { x: [C.koff], y: [C.Ec0], name: 'CB min', mode: 'markers', marker: { size: 10, color: '#7dd3fc' } },
    { x: [eK], y: [Math.max(0.02, eE)], name: 'electron', mode: 'markers', marker: { size: 12, color: '#e0f2fe' } },
  ];
  const ann = [
    { x: 0, y: -0.25, text: 'k = 0  ·  crystal momentum', showarrow: false, font: { color: '#64748b', size: 11 } },
  ];
  if (S.gap === 'direct') {
    ann.push({ x: 0, y: S.Eg * 0.55, text: 'ħω  (energy only)', ax: 0.7, ay: S.Eg * 0.55, axref: 'x', ayref: 'y', arrowcolor: '#fbbf24' });
  } else {
    ann.push({ x: 0, y: S.Eg * 0.55, text: 'ħω energy', ax: 0, ay: 0.05, axref: 'x', ayref: 'y', arrowcolor: '#fbbf24' });
    ann.push({ x: C.koff, y: S.Eg, text: 'phonon Δk', ax: 0.05, ay: S.Eg, axref: 'x', ayref: 'y', arrowcolor: '#fb7185' });
  }
  Plotly.react('plot-lab-ek', traces, baseLayout({
    margin: { l: 54, r: 16, t: 20, b: 46 },
    legend: { orientation: 'h', y: 1.12, font: { size: 11 } },
    annotations: ann,
    xaxis: { title: 'k  (momentum — not energy)', gridcolor: '#1e293b', range: [-2.3, 2.8] },
    yaxis: { title: 'E (eV)  ·  conceptual', gridcolor: '#1e293b', range: [-1.8, S.Eg + 1.6] },
  }), { responsive: true, displaylogo: false });
}

function fermiF(E, Ef, T) {
  if (T < 0.8) return E < Ef - 1e-9 ? 1 : (E > Ef + 1e-9 ? 0 : 0.5);
  const x = (E - Ef) / (kB * T);
  if (x > 40) return 0;
  if (x < -40) return 1;
  return 1 / (1 + Math.exp(x));
}

function renderLabFermi() {
  const T = LabState.T;
  const Ef = Number(document.getElementById('lab-fd-ef').value);
  document.getElementById('lab-fd-ef-lab').textContent = Ef.toFixed(2) + ' eV';
  document.getElementById('lab-fd-t-lab').textContent = T + ' K';
  const E = linspace(-1.6, 1.6, 360);
  const f = E.map((e) => fermiF(e, Ef, T));
  const fEf = fermiF(Ef, Ef, T);
  Plotly.react('plot-lab-fd', [
    { x: E, y: f, name: 'f(E)', line: { color: '#fbbf24', width: 3 } },
    { x: [Ef, Ef], y: [0, 1], name: 'Ef', line: { color: '#38bdf8', width: 1.5, dash: 'dash' } },
    { x: [Ef], y: [fEf], mode: 'markers+text', text: [' f(Ef)=' + fEf.toFixed(2)], textposition: 'top right', marker: { size: 11, color: '#fde68a' }, name: 'f(Ef)' },
  ], baseLayout({
    margin: { l: 50, r: 14, t: 16, b: 44 },
    showlegend: false,
    xaxis: { title: 'E (eV)', gridcolor: '#1e293b' },
    yaxis: { title: 'f(E)  occupation', range: [-0.05, 1.08], gridcolor: '#1e293b' },
  }), { responsive: true, displaylogo: false });

  const rungs = document.getElementById('lab-fd-rungs');
  const levels = 16;
  let html = '';
  for (let i = levels - 1; i >= 0; i--) {
    const e = -1.4 + (2.8 * i) / (levels - 1);
    const p = fermiF(e, Ef, T);
    const filled = Math.round(6 * p);
    const holes = e < Ef ? Math.round(6 * (1 - p)) : 0;
    let seats = '';
    for (let s = 0; s < 6; s++) {
      const cls = s < filled ? 'seat on' : (e < Ef && s >= 6 - holes ? 'seat hole' : 'seat');
      seats += '<span class="' + cls + '"></span>';
    }
    html += '<div class="state-rung"><span class="w-12 font-mono text-[10px] text-slate-500">' + e.toFixed(2) + '</span>' + seats + '</div>';
  }
  rungs.innerHTML = html;
}

function labNi(T, Eg) {
  const vt = kB * Math.max(T, 1);
  const ni300 = 1.0e10;
  const scale = Math.pow(Math.max(T, 1) / 300, 1.5) * Math.exp(-Eg / (2 * vt)) / Math.exp(-1.12 / (2 * kB * 300));
  return ni300 * scale;
}

function renderLabCarriers() {
  const S = LabState;
  const mode = document.getElementById('lab-car-mode').value;
  S.doping = mode;
  const T = S.T, Eg = S.Eg;
  const Nd = Math.pow(10, Number(document.getElementById('lab-nd').value));
  const Na = Math.pow(10, Number(document.getElementById('lab-na').value));
  S.Nd = Nd; S.Na = Na;
  document.getElementById('lab-nd-lab').textContent = Nd.toExponential(1);
  document.getElementById('lab-na-lab').textContent = Na.toExponential(1);
  const ni = labNi(T, Eg);
  const Ei = Eg / 2;
  let Ef = Ei;
  if (mode === 'n') Ef = Ei + kB * T * Math.log(Math.max(Nd, ni) / ni);
  if (mode === 'p') Ef = Ei - kB * T * Math.log(Math.max(Na, ni) / ni);
  if (mode === 'both') {
    const net = Nd - Na;
    if (Math.abs(net) < ni) Ef = Ei;
    else if (net > 0) Ef = Ei + kB * T * Math.log(net / ni);
    else Ef = Ei - kB * T * Math.log(-net / ni);
  }
  Ef = Math.min(Eg - 0.04, Math.max(0.04, Ef));
  const n = ni * Math.exp((Ef - Ei) / (kB * Math.max(T, 1)));
  const p = (ni * ni) / Math.max(n, 1e-6);
  document.getElementById('lab-car-ef').textContent = Ef.toFixed(3) + ' eV';
  document.getElementById('lab-car-n').textContent = n.toExponential(2);
  document.getElementById('lab-car-p').textContent = p.toExponential(2);
  document.getElementById('lab-car-np').textContent = (n * p).toExponential(2);
  document.getElementById('lab-car-ni2').textContent = (ni * ni).toExponential(2);

  const svg = document.getElementById('lab-car-bands');
  const yEc = 40, yEv = 200, yEf = 200 - (Ef / Eg) * 160, yEi = 120;
  let dots = '';
  const nE = Math.min(18, 2 + Math.round(Math.log10(Math.max(n, 10)) - 8));
  const nH = Math.min(18, 2 + Math.round(Math.log10(Math.max(p, 10)) - 8));
  for (let i = 0; i < nE; i++) dots += '<circle cx="' + (40 + (i * 47) % 300) + '" cy="' + (28 + (i % 3) * 8) + '" r="4" fill="#38bdf8"/>';
  for (let i = 0; i < nH; i++) dots += '<circle cx="' + (50 + (i * 53) % 300) + '" cy="' + (210 + (i % 3) * 8) + '" r="4" fill="none" stroke="#e11d48" stroke-width="2"/>';
  svg.innerHTML = [
    '<rect x="20" y="20" width="340" height="36" fill="rgba(2,132,199,0.18)" stroke="rgba(56,189,248,0.4)"/>',
    '<rect x="20" y="204" width="340" height="36" fill="rgba(153,27,27,0.22)" stroke="rgba(248,113,113,0.4)"/>',
    '<line x1="20" y1="' + yEf + '" x2="360" y2="' + yEf + '" stroke="#fbbf24" stroke-width="2"/>',
    '<line x1="20" y1="' + yEi + '" x2="360" y2="' + yEi + '" stroke="#94a3b8" stroke-dasharray="4 4"/>',
    '<text x="368" y="42" fill="#7dd3fc" font-size="12">Ec</text>',
    '<text x="368" y="226" fill="#fca5a5" font-size="12">Ev</text>',
    '<text x="368" y="' + (yEf + 4) + '" fill="#fde68a" font-size="12">Ef</text>',
    '<text x="368" y="' + (yEi + 4) + '" fill="#94a3b8" font-size="12">Ei</text>',
    dots,
  ].join('');
}

let labLastPhy = null;
let labLastQp = null;
let labLastBias = { T: 300, Vs: 5 };

function labIsFromSlider(v) {
  return Math.pow(10, -14 + (Number(v) / 100) * 5);
}

function drawLabJunction(phy, qp, T) {
  const svg = document.getElementById('lab-c-junc');
  if (!svg) return;
  const W = 56 + 150 * phy.Wrel;
  const x0 = 160 - W / 2;
  const fwd = qp.Vd > 0.12;
  const rev = qp.Vd < -0.05;
  const dots = [];
  const nH = fwd ? 10 : (rev ? 4 : 7);
  const nE = fwd ? 10 : (rev ? 4 : 7);
  for (let i = 0; i < nH; i++) {
    const x = 18 + ((i * 13 + labPhase * 18) % Math.max(12, x0 - 8));
    const y = 22 + (i % 4) * 14;
    dots.push('<circle cx="' + x.toFixed(1) + '" cy="' + y + '" r="4" fill="none" stroke="#e11d48" stroke-width="1.6"/>');
  }
  for (let i = 0; i < nE; i++) {
    const x = 320 - ((i * 13 + labPhase * 18) % Math.max(12, 320 - (x0 + W)));
    const y = 22 + (i % 4) * 14;
    dots.push('<circle cx="' + x.toFixed(1) + '" cy="' + y + '" r="3.4" fill="#38bdf8"/>');
  }
  if (fwd) {
    for (let i = 0; i < 4; i++) {
      const t = (labPhase * 0.35 + i * 0.22) % 1;
      dots.push('<circle cx="' + (x0 + W * t).toFixed(1) + '" cy="' + (30 + i * 12) + '" r="3.2" fill="#e0f2fe" opacity="0.9"/>');
      dots.push('<circle cx="' + (x0 + W * (1 - t)).toFixed(1) + '" cy="' + (36 + i * 12) + '" r="3.6" fill="none" stroke="#fb7185" stroke-width="1.5"/>');
    }
  }
  const mid = 160;
  const field = [
    '<line x1="' + (mid + 22) + '" y1="44" x2="' + (mid - 22) + '" y2="44" stroke="#fbbf24" stroke-width="2" marker-end="url(#lab-arr)"/>',
    '<text x="' + mid + '" y="18" text-anchor="middle" fill="#fde68a" font-size="10">ℰ built-in  N → P</text>',
  ];
  const bias = fwd ? 'FORWARD · barrier down · injection up' : (rev ? 'REVERSE · barrier up · current tiny' : 'near equilibrium');
  svg.innerHTML = [
    '<defs><marker id="lab-arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#fbbf24"/></marker></defs>',
    '<rect x="0" y="8" width="160" height="72" fill="rgba(153,27,27,0.32)"/>',
    '<rect x="160" y="8" width="160" height="72" fill="rgba(2,132,199,0.26)"/>',
    '<rect x="' + x0 + '" y="8" width="' + W + '" height="72" fill="rgba(15,23,42,0.72)" stroke="#fbbf24"/>',
    '<text x="28" y="78" fill="#fca5a5" font-size="12">P  holes</text>',
    '<text x="232" y="78" fill="#7dd3fc" font-size="12">N  electrons</text>',
    field.join(''),
    dots.join(''),
    '<text x="160" y="98" text-anchor="middle" fill="#fde68a" font-size="11">' + bias + ' · T=' + T + ' K · W ' + (fwd ? 'narrows' : (rev ? 'widens' : '')) + '</text>',
  ].join('');
}

function renderLabCircuit() {
  const S = LabState;
  const Vs = Number(document.getElementById('lab-vs').value);
  const R = Number(document.getElementById('lab-r').value);
  const n = Number(document.getElementById('lab-nfact').value);
  const Is = labIsFromSlider(document.getElementById('lab-is').value);
  S.Vs = Vs; S.R = R;
  document.getElementById('lab-vs-lab').textContent = Vs.toFixed(2) + ' V';
  document.getElementById('lab-r-lab').textContent = R >= 1000 ? (R / 1000).toFixed(2) + ' kΩ' : R.toFixed(0) + ' Ω';
  document.getElementById('lab-nfact-lab').textContent = n.toFixed(2);
  document.getElementById('lab-is-lab').textContent = Is.toExponential(1) + ' A';
  const T = Math.max(S.T, 1), vt = kB * T;
  const p = { Vs: Vs, R: R, Is: Is, n: n, vt: vt, ledMode: false, Eg: S.Eg };
  const qp = solveQpoint(p);
  const phy = diodePhysics(p, qp);
  labLastPhy = phy; labLastQp = qp; labLastBias = { T: T, Vs: Vs };
  const Vr = Vs - qp.Vd;
  document.getElementById('lab-c-vd').textContent = qp.Vd.toFixed(3) + ' V';
  document.getElementById('lab-c-vr').textContent = Vr.toFixed(3) + ' V';
  document.getElementById('lab-c-i').textContent = (qp.I * 1000).toFixed(2) + ' mA';
  document.getElementById('lab-c-kvl').textContent = 'Vs ' + Vs.toFixed(3) + ' = Vd ' + qp.Vd.toFixed(3) + ' + Vr ' + Vr.toFixed(3);
  document.getElementById('lab-c-ohm').textContent = 'Vr = I R → ' + Vr.toFixed(3) + ' = ' + (qp.I * 1000).toFixed(2) + ' mA × ' + R.toFixed(0) + ' Ω';
  const Rstat = Math.abs(qp.I) > 2e-9 ? (qp.Vd / qp.I) : NaN;
  const rd = Math.abs(qp.I) > 2e-9 ? (n * vt / Math.abs(qp.I)) : NaN;
  document.getElementById('lab-c-rs').textContent = isFinite(Rstat) ? Rstat.toFixed(0) + ' Ω' : '—';
  document.getElementById('lab-c-rd').textContent = isFinite(rd) ? rd.toFixed(1) + ' Ω' : '—';

  const vd = linspace(-1.2, 1.05, 220);
  const id = vd.map((v) => shockley(v, Is, n, vt) * 1000);
  const il = vd.map((v) => (Vs - v) / R * 1000);
  const Imax = Math.max(6, Math.abs(Vs) / R * 1100);
  Plotly.react('plot-lab-iv', [
    { x: vd, y: id, name: 'Shockley I = Is[e^{Vd/nVt}−1]', line: { color: '#38bdf8', width: 3 } },
    { x: vd, y: il, name: 'load line I = (Vs−Vd)/R', line: { color: '#f87171', width: 2, dash: 'dash' } },
    { x: [qp.Vd], y: [qp.I * 1000], name: 'operating point', mode: 'markers+text', text: [' Q'], textposition: 'top right', marker: { size: 13, color: '#fbbf24' } },
  ], baseLayout({
    margin: { l: 50, r: 12, t: 24, b: 44 },
    legend: { orientation: 'h', y: 1.14, font: { size: 10 } },
    xaxis: { title: 'Vd (V)', range: [-1.25, 1.1], gridcolor: '#1e293b' },
    yaxis: { title: 'I (mA)', range: [-0.6, Imax], gridcolor: '#1e293b' },
  }), { responsive: true, displaylogo: false });

  drawLabJunction(phy, qp, T);
}

function renderLabActive() {
  labSyncStrip();
  if (labTab === 'crystal') renderLabCrystal();
  if (labTab === 'ek') renderLabEk();
  if (labTab === 'fermi') renderLabFermi();
  if (labTab === 'carriers') renderLabCarriers();
  if (labTab === 'circuit') renderLabCircuit();
  const el = document.getElementById('lab-why');
  if (el) el.textContent = labWhy;
}

function showLabTab(id) {
  labTab = id;
  document.querySelectorAll('.lab-pane').forEach((p) => p.classList.add('hidden'));
  document.getElementById('lab-pane-' + id).classList.remove('hidden');
  document.querySelectorAll('.lab-tab').forEach((b) => b.classList.toggle('active', b.dataset.labTab === id));
  renderLabActive();
  requestAnimationFrame(resizeVisible);
}

function tickLab() {
  if (typeof activeSim !== 'undefined' && activeSim !== 'lab') return;
  labPhase += 0.04;
  if (labTab === 'ek') renderLabEk();
  if (labTab === 'circuit' && labLastPhy && labLastQp) drawLabJunction(labLastPhy, labLastQp, labLastBias.T);
  labRaf = requestAnimationFrame(tickLab);
}

function stopLab() {
  cancelAnimationFrame(labRaf);
  labRaf = 0;
}

function initLab() {
  if (!labInited) {
    document.querySelectorAll('.lab-tab').forEach((b) => {
      b.addEventListener('click', () => showLabTab(b.dataset.labTab));
    });
    document.getElementById('lab-lat-type').addEventListener('change', () => {
      labWhySet('Lattice type changed → N_atoms/cell jumped (1 / 2 / 4 / 8) → n = N/a³ moved even though a is the same.');
      renderLabCrystal();
    });
    document.getElementById('lab-lat-a').addEventListener('input', () => {
      labWhySet('You stretched a → cell volume a³ grew as a cube → atomic density fell as 1/a³. Silicon sits at 5.431 Å.');
      renderLabCrystal();
    });
    document.getElementById('lab-lat-share').addEventListener('change', () => {
      labWhySet('Ghost atoms are the same corners/faces belonging to neighbor cells. That is why a corner counts ⅛, a face ½.');
      renderLabCrystal();
    });
    document.getElementById('lab-si').addEventListener('click', () => {
      document.getElementById('lab-lat-type').value = 'diamond';
      document.getElementById('lab-lat-a').value = '5.431';
      LabState.set({ lattice: 'diamond', a: 5.431 }, 'crystal');
      labWhySet('Silicon preset: diamond cubic, a = 5.431 Å, 8 atoms/cell → n ≈ 5.0×10²² cm⁻³.');
      renderLabCrystal();
    });
    document.getElementById('lab-miller').addEventListener('input', () => {
      labWhySet('Miller indices are intercept reciprocals. (210) cuts a at ½ and b at 1. [uvw] is a real-space arrow, not a plane.');
      renderLabCrystal();
    });
    document.getElementById('lab-miller-kind').addEventListener('change', renderLabCrystal);
    document.querySelectorAll('[data-miller]').forEach((b) => {
      b.addEventListener('click', () => {
        document.getElementById('lab-miller').value = b.dataset.miller;
        document.getElementById('lab-miller-kind').value = b.dataset.kind;
        labWhySet('Loaded ' + b.dataset.miller + '. Planes are (hkl). Directions are [uvw]. A minus is a bar index.');
        renderLabCrystal();
      });
    });

    document.getElementById('lab-ek-curve').addEventListener('input', (e) => {
      LabState.set({ curve: Number(e.target.value) }, 'ek');
      document.getElementById('lab-ek-curve-lab').textContent = Number(e.target.value).toFixed(2);
      labWhySet('More curvature (sharper parabola) → d²E/dk² larger → m* smaller → the same electric field accelerates the carrier harder. Mobility likes light m*.');
      renderLabEk();
    });
    document.getElementById('lab-ek-eg').addEventListener('input', (e) => {
      LabState.set({ Eg: Number(e.target.value) }, 'ek');
      labWhySet('You opened the gap. Later tabs inherit this Eg: fewer intrinsic carriers, and an LED photon would get more energetic.');
      renderLabActive();
    });
    document.querySelectorAll('[data-lab-gap]').forEach((b) => {
      b.addEventListener('click', () => {
        const direct = b.dataset.labGap === 'direct';
        LabState.set({ gap: direct ? 'direct' : 'indirect', Eg: direct ? 1.42 : 1.12 }, 'ek');
        document.getElementById('lab-ek-eg').value = String(LabState.Eg);
        labWhySet(direct
          ? 'GaAs-like: CB min and VB max share k. A photon can carry the energy; momentum is already conserved.'
          : 'Si-like: CB min is elsewhere in k. A photon has almost no momentum — a phonon must finish the Δk.');
        renderLabActive();
      });
    });

    document.getElementById('lab-fd-t').addEventListener('input', (e) => {
      LabState.set({ T: Number(e.target.value) }, 'fermi');
      labWhySet(LabState.T < 1
        ? 'T → 0: f(E) becomes a step. Every state below Ef is full; every state above is empty. f(Ef) is drawn as ½ by convention.'
        : 'Raised T. kT is now ' + (kB * LabState.T * 1000).toFixed(0) + ' meV. The step smears over ~few kT. f(Ef) stays 0.5. The diode tab will feel this too.');
      renderLabActive();
    });
    document.getElementById('lab-fd-ef').addEventListener('input', () => {
      labWhySet('Sliding Ef does not create electrons from nothing. It decides which rungs are likely occupied. Tab 4 turns that into n and p.');
      renderLabFermi();
    });
    document.querySelectorAll('[data-lab-t]').forEach((b) => {
      b.addEventListener('click', () => {
        document.getElementById('lab-fd-t').value = b.dataset.labT;
        LabState.set({ T: Number(b.dataset.labT) }, 'fermi');
        labWhySet('Temperature preset ' + b.dataset.labT + ' K. Watch the rung occupancy and, on the circuit tab, Vt = kT/q.');
        renderLabActive();
      });
    });

    document.getElementById('lab-car-mode').addEventListener('change', () => {
      labWhySet('Doping type moved Ef. N-type: Ef climbs toward Ec → n explodes, p = ni²/n collapses. P-type is the mirror.');
      renderLabCarriers();
    });
    document.getElementById('lab-nd').addEventListener('input', () => {
      labWhySet('More donors → more electrons donated to the CB → Ef is pulled toward Ec to make n ≈ Nd (if Nd >> ni).');
      renderLabCarriers();
    });
    document.getElementById('lab-na').addEventListener('input', () => {
      labWhySet('More acceptors → holes in the VB → Ef drops toward Ev. The product n·p stays ni².');
      renderLabCarriers();
    });

    document.getElementById('lab-vs').addEventListener('input', () => {
      labWhySet('Vs moved the load-line intercept. Q slides along the Shockley curve — Vd barely budges (exponential), I changes a lot. That is why R_static is not a part number.');
      renderLabCircuit();
    });
    document.getElementById('lab-r').addEventListener('input', () => {
      labWhySet('Larger R flattens the load line (smaller I intercept). The junction width uses this new Vd. Temperature from the shared strip is already in Vt = kT/q.');
      renderLabCircuit();
    });
    document.getElementById('lab-is').addEventListener('input', () => {
      labWhySet('Is is the reverse saturation scale. Larger Is shifts the exponential left — more current at the same Vd. Q-point and R_static both move.');
      renderLabCircuit();
    });
    document.getElementById('lab-nfact').addEventListener('input', () => {
      labWhySet('Ideality n stretches the exponent: I = Is[exp(Vd/(n Vt)) − 1]. Larger n → softer turn-on. This is a model knob, not a new physics particle.');
      renderLabCircuit();
    });
    document.getElementById('lab-strip-t-in').addEventListener('input', (e) => {
      LabState.set({ T: Number(e.target.value) }, 'strip');
      document.getElementById('lab-fd-t').value = String(LabState.T);
      labWhySet('Shared T → Fermi smear, ni(T), and diode Vt = kT/q all move together. This is the same temperature, not three copies.');
      renderLabActive();
    });
    document.getElementById('lab-strip-eg-in').addEventListener('input', (e) => {
      LabState.set({ Eg: Number(e.target.value) }, 'strip');
      document.getElementById('lab-ek-eg').value = String(LabState.Eg);
      labWhySet('Shared Eg → E–k gap, intrinsic ni, and (if you were in LED mode) photon energy all inherit this one number.');
      renderLabActive();
    });

    LabState.on(function (_s, src) {
      if (src === 'crystal') return;
      labSyncStrip();
    });
    labInited = true;
  }
  document.getElementById('lab-ek-eg').value = String(LabState.Eg);
  document.getElementById('lab-ek-curve').value = String(LabState.curve);
  document.getElementById('lab-fd-t').value = String(LabState.T);
  document.getElementById('lab-lat-a').value = String(LabState.a);
  document.getElementById('lab-lat-type').value = LabState.lattice;
  showLabTab(labTab);
  stopLab();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    labRaf = requestAnimationFrame(tickLab);
  }
}
