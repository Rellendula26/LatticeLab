/* PN junction → Shockley I–V → circuit Q-point */

const HC_NM = 1239.84193;
let diodeInited = false;
let diodeRaf = 0;
let diodeT = 0;
let diodeLastStatic = null;

function diodeVt(T) {
  return 8.617333262145e-5 * T;
}

function shockley(Vd, Is, n, vt) {
  const x = Vd / (n * vt);
  if (x < -35) return -Is;
  if (x > 4) {
    const lnI = Math.log(Math.max(Is, 1e-300)) + x;
    if (lnI > 2.5) return Math.exp(2.5);
    return Math.exp(lnI);
  }
  return Is * (Math.exp(x) - 1);
}

function wavelengthToRGB(nm) {
  let r = 0, g = 0, b = 0, name = 'infrared';
  if (nm < 380) { r = 90; g = 0; b = 160; name = 'near-UV'; }
  else if (nm < 450) { r = Math.round(180 * (450 - nm) / 70); b = 255; name = 'violet'; }
  else if (nm < 495) { g = Math.round(255 * (nm - 450) / 45); b = 255; name = 'blue'; }
  else if (nm < 570) { r = Math.round(180 * (nm - 495) / 75); g = 255; name = 'green'; }
  else if (nm < 590) { r = 255; g = 255; name = 'yellow'; }
  else if (nm < 630) { r = 255; g = Math.round(180 * (630 - nm) / 40); name = 'orange'; }
  else if (nm <= 750) { r = 255; name = 'red'; }
  else { r = 80; g = 12; b = 12; name = 'infrared'; }
  return { r, g, b, name, css: 'rgb(' + r + ',' + g + ',' + b + ')' };
}

function diodeInputs() {
  const Vs = Number(document.getElementById('diode-vs').value);
  const R = Number(document.getElementById('diode-r').value);
  const n = Number(document.getElementById('diode-n').value);
  const T = Number(document.getElementById('diode-t').value);
  const ledMode = document.getElementById('diode-led-mode').checked;
  const Eg = Number(document.getElementById('diode-eg').value);
  const vt = diodeVt(T);
  const isSlide = Number(document.getElementById('diode-is').value);
  let Is = Math.pow(10, -14 + (isSlide / 100) * 5);
  if (ledMode) {
    const targetI = 0.008;
    const Vf = Math.max(1.4, Eg - 0.15);
    Is = targetI / (Math.exp(Vf / (n * vt)) - 1);
  }
  return { Vs, R, n, T, vt, Is, ledMode, Eg };
}

function solveQpoint(p) {
  const { Vs, R, Is, n, vt } = p;
  let lo = Math.min(Vs, -2.2);
  let hi = Math.max(Vs, 0.05);
  if (Vs >= 0) {
    lo = -0.15;
    hi = Math.min(Math.max(Vs, 0.2), p.ledMode ? p.Eg + 0.4 : 1.35);
  } else {
    lo = Vs - 0.05;
    hi = 0.15;
  }
  for (let i = 0; i < 72; i++) {
    const mid = (lo + hi) / 2;
    const f = shockley(mid, Is, n, vt) - (Vs - mid) / R;
    if (f > 0) hi = mid;
    else lo = mid;
  }
  const Vd = (lo + hi) / 2;
  const I = shockley(Vd, Is, n, vt);
  return { Vd, I };
}

function diodePhysics(p, qp) {
  const Vbi = p.ledMode ? Math.max(1.15, 0.72 * p.Eg + 0.35) : 0.74;
  const barrier = Vbi - qp.Vd;
  const Wrel = Math.sqrt(Math.max(barrier, 0.03) / Vbi);
  return { Vbi, barrier, Wrel };
}

function setDiodeLabels(p) {
  document.getElementById('diode-vs-lab').textContent = p.Vs.toFixed(2) + ' V';
  document.getElementById('diode-r-lab').textContent = p.R >= 1000 ? (p.R / 1000).toFixed(2) + ' kΩ' : p.R.toFixed(0) + ' Ω';
  document.getElementById('diode-is-lab').textContent = p.ledMode ? 'set by Eg' : p.Is.toExponential(1) + ' A';
  document.getElementById('diode-n-lab').textContent = p.n.toFixed(2);
  document.getElementById('diode-t-lab').textContent = p.T.toFixed(0) + ' K';
  document.getElementById('diode-eg-lab').textContent = p.Eg.toFixed(2) + ' eV';
  document.getElementById('diode-eg-wrap').classList.toggle('hidden', !p.ledMode);
}

function drawJunction(p, qp, phy) {
  const svg = document.getElementById('diode-junction');
  const W = 80 + 200 * phy.Wrel;
  const x0 = 280 - W / 2;
  const x1 = 280 + W / 2;
  const forward = qp.Vd > 0.08 && qp.I > 1e-6;
  const reverse = qp.Vd < -0.05;
  const flow = forward ? Math.min(1, qp.I / 0.012) : 0;
  const nCross = forward ? 2 + Math.round(8 * flow) : 0;

  let carriers = '';
  for (let i = 0; i < 14; i++) {
    const y = 28 + (i * 11) % 130;
    const px = 18 + ((i * 37 + diodeT * 40) % Math.max(20, x0 - 28));
    carriers += '<circle class="carrier-dot" cx="' + px + '" cy="' + y + '" r="4" fill="#e11d48"/>';
    const nx = 540 - ((i * 41 + diodeT * 40) % Math.max(20, 540 - x1 - 12));
    carriers += '<circle class="carrier-dot" cx="' + nx + '" cy="' + (y + 6) + '" r="4" fill="#38bdf8"/>';
  }
  for (let i = 0; i < nCross; i++) {
    const t = (diodeT * 0.55 + i / nCross) % 1;
    const x = x0 + t * (x1 - x0 + 50) - 20;
    const y = 50 + (i % 5) * 22;
    carriers += '<circle cx="' + x + '" cy="' + y + '" r="4.5" fill="#7dd3fc" opacity="0.95"/>';
    carriers += '<circle cx="' + (x1 - t * (x1 - x0 + 40)) + '" cy="' + (y + 10) + '" r="4.5" fill="#fb7185"/>';
  }

  let ions = '';
  const nIons = 3 + Math.round(6 * phy.Wrel);
  for (let i = 0; i < nIons; i++) {
    const yp = 36 + i * (128 / nIons);
    ions += '<text x="' + (x0 + 10 + (i % 2) * 16) + '" y="' + yp + '" fill="#fda4af" font-size="13" font-family="IBM Plex Sans, sans-serif">−</text>';
    ions += '<text x="' + (x1 - 26 - (i % 2) * 16) + '" y="' + yp + '" fill="#7dd3fc" font-size="13" font-family="IBM Plex Sans, sans-serif">+</text>';
  }

  let photon = '';
  if (p.ledMode && forward && qp.I > 0.001) {
    const col = wavelengthToRGB(HC_NM / p.Eg);
    const px = 280 + 18 * Math.sin(diodeT * 2);
    const py = 36 + 10 * Math.cos(diodeT * 2.4);
    photon = '<circle cx="' + px + '" cy="' + py + '" r="7" fill="' + col.css + '" stroke="#fff7ed" stroke-width="1"/><text x="' + (px + 12) + '" y="' + (py - 6) + '" fill="' + col.css + '" font-size="11" font-family="IBM Plex Serif, serif" font-style="italic">ħω</text>';
  }

  const fieldOp = reverse ? 0.95 : (forward ? 0.35 : 0.7);
  svg.innerHTML = [
    '<rect x="0" y="16" width="280" height="154" fill="rgba(153,27,27,0.28)"/>',
    '<rect x="280" y="16" width="280" height="154" fill="rgba(2,132,199,0.22)"/>',
    '<rect x="' + x0 + '" y="16" width="' + W + '" height="154" fill="rgba(15,23,42,0.72)" stroke="rgba(251,191,36,0.35)"/>',
    '<text x="90" y="36" fill="#fca5a5" font-size="13" font-family="IBM Plex Sans, sans-serif">P-type · holes</text>',
    '<text x="400" y="36" fill="#7dd3fc" font-size="13" font-family="IBM Plex Sans, sans-serif">N-type · electrons</text>',
    '<text x="280" y="12" text-anchor="middle" fill="#fde68a" font-size="11" font-family="IBM Plex Sans, sans-serif">depletion  W ∝ √(Vbi − Vd)</text>',
    ions,
    carriers,
    '<line x1="' + (x0 + 20) + '" y1="188" x2="' + (x1 - 20) + '" y2="188" stroke="#fbbf24" stroke-width="2" marker-end="url(#dj-arr)" opacity="' + fieldOp + '"/>',
    '<text x="280" y="206" text-anchor="middle" fill="#fde68a" font-size="11" opacity="' + fieldOp + '" font-family="IBM Plex Sans, sans-serif">E-field  P ← N</text>',
    photon,
    '<defs><marker id="dj-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#fbbf24"/></marker></defs>',
  ].join('');
}

function drawBands(p, qp, phy) {
  const svg = document.getElementById('diode-bands');
  const Eg = p.ledMode ? p.Eg : 1.12;
  const step = phy.barrier;
  const pts = 80;
  function yOf(E) {
    const Emin = -0.4, Emax = step + Eg + 0.6;
    return 200 - (E - Emin) / (Emax - Emin) * 170;
  }
  function bend(i) {
    const u = i / (pts - 1);
    return step * (1 / (1 + Math.exp((u - 0.5) * 14)));
  }
  let ec = '', ev = '';
  for (let i = 0; i < pts; i++) {
    const x = 20 + i * (520 / (pts - 1));
    const b = bend(i);
    const cmd = i ? 'L' : 'M';
    ec += cmd + x.toFixed(1) + ',' + yOf(b + Eg).toFixed(1) + ' ';
    ev += cmd + x.toFixed(1) + ',' + yOf(b).toFixed(1) + ' ';
  }
  const yTopN = yOf(Eg);
  const yTopP = yOf(step + Eg);
  const barrierX = 268;
  let dots = '';
  const forward = qp.I > 2e-6 && qp.Vd > 0;
  const nDots = forward ? 5 + Math.min(10, Math.round(qp.I / 0.0015)) : 2;
  for (let i = 0; i < nDots; i++) {
    const t = (diodeT * 0.35 + i / nDots) % 1;
    const x = forward ? 500 - t * 360 : 430;
    const E = Eg + 0.08 + bend(Math.round((x - 20) / 520 * (pts - 1)));
    dots += '<circle cx="' + x + '" cy="' + yOf(E) + '" r="4" fill="#38bdf8"/>';
    if (forward) {
      const xh = 40 + t * 320;
      dots += '<circle cx="' + xh + '" cy="' + (yOf(bend(Math.round((xh - 20) / 520 * (pts - 1)))) + 6) + '" r="4" fill="#e11d48"/>';
    }
  }
  svg.innerHTML = [
    '<text x="36" y="18" fill="#fca5a5" font-size="11" font-family="IBM Plex Sans, sans-serif">P</text>',
    '<text x="500" y="18" fill="#7dd3fc" font-size="11" font-family="IBM Plex Sans, sans-serif">N</text>',
    '<path d="' + ec + '" fill="none" stroke="#38bdf8" stroke-width="2.6"/>',
    '<path d="' + ev + '" fill="none" stroke="#ef4444" stroke-width="2.6"/>',
    '<text x="500" y="' + (yTopN - 6) + '" fill="#7dd3fc" font-size="11" text-anchor="end" font-family="IBM Plex Serif, serif" font-style="italic">Ec</text>',
    '<text x="500" y="' + (yOf(0) + 14) + '" fill="#fca5a5" font-size="11" text-anchor="end" font-family="IBM Plex Serif, serif" font-style="italic">Ev</text>',
    '<line x1="' + barrierX + '" y1="' + yTopN + '" x2="' + barrierX + '" y2="' + yTopP + '" stroke="#fbbf24" stroke-width="2" stroke-dasharray="4 3"/>',
    '<text x="' + (barrierX + 8) + '" y="' + ((yTopN + yTopP) / 2) + '" fill="#fde68a" font-size="12" font-family="IBM Plex Serif, serif" font-style="italic">q(Vbi − Vd)</text>',
    dots,
  ].join('');
}

function renderDiodeCircuit(p, qp) {
  const Vr = p.Vs - qp.Vd;
  document.getElementById('diode-schem-vs').textContent = p.Vs.toFixed(2) + ' V';
  document.getElementById('diode-schem-r').textContent = (p.R >= 1000 ? (p.R / 1000).toFixed(1) + ' kΩ' : p.R.toFixed(0) + ' Ω');
  document.getElementById('diode-schem-vd').textContent = qp.Vd.toFixed(3) + ' V';
}

function renderDiodePlot(p, qp) {
  const vmax = p.ledMode ? Math.max(p.Eg + 0.15, 1.2) : 1.05;
  const vmin = -2.05;
  const N = 220;
  const vd = [], id = [], iload = [];
  for (let i = 0; i < N; i++) {
    const v = vmin + (vmax - vmin) * i / (N - 1);
    vd.push(v);
    id.push(shockley(v, p.Is, p.n, p.vt) * 1000);
    iload.push((p.Vs - v) / p.R * 1000);
  }
  const Imax = Math.max(8, Math.abs(p.Vs) / p.R * 1000 * 1.15, qp.I * 1000 * 1.4);
  const Imin = p.Vs < 0 ? -Math.max(2, Imax * 0.15) : -0.8;

  const traces = [
    { x: vd, y: id, name: 'diode  I = Is(e^{Vd/nVt}−1)', line: { color: '#38bdf8', width: 3 } },
    { x: vd, y: iload, name: 'load line  I = (Vs−Vd)/R', line: { color: '#f87171', width: 2.4, dash: 'dash' } },
    {
      x: [qp.Vd], y: [qp.I * 1000], name: 'Q-point',
      mode: 'markers+text',
      text: ['  Q'],
      textposition: 'top right',
      marker: { size: 14, color: '#fbbf24', line: { color: '#fff7ed', width: 1.5 } },
    },
  ];
  const layout = baseLayout({
    margin: { l: 58, r: 16, t: 28, b: 48 },
    legend: { orientation: 'h', y: 1.14, font: { size: 11 } },
    annotations: [{
      x: qp.Vd, y: qp.I * 1000, ax: qp.Vd + 0.35, ay: qp.I * 1000 + Imax * 0.18,
      text: 'only point that satisfies both',
      font: { color: '#fde68a', size: 11 },
      arrowcolor: '#fbbf24', arrowwidth: 1.4,
    }],
    xaxis: { title: 'Vd (V)', range: [vmin, vmax], gridcolor: '#1e293b', zeroline: true, zerolinecolor: '#334155' },
    yaxis: { title: 'I (mA)', range: [Imin, Imax], gridcolor: '#1e293b', zeroline: true, zerolinecolor: '#334155' },
  });
  Plotly.react('plot-diode-iv', traces, layout, { responsive: true, displaylogo: false });
}

function renderDiodeReadout(p, qp, phy) {
  const Vr = p.Vs - qp.Vd;
  const ImA = qp.I * 1000;
  const kcl = Math.abs(p.Vs - (Vr + qp.Vd));
  document.getElementById('diode-vd').textContent = qp.Vd.toFixed(3) + ' V';
  document.getElementById('diode-vr').textContent = Vr.toFixed(3) + ' V';
  document.getElementById('diode-i').textContent = Math.abs(ImA) >= 0.01 ? ImA.toFixed(2) + ' mA' : (qp.I * 1e6).toFixed(2) + ' µA';
  document.getElementById('diode-kvl').textContent = 'Vs = Vr + Vd  →  ' + p.Vs.toFixed(3) + ' = ' + Vr.toFixed(3) + ' + ' + qp.Vd.toFixed(3) + '   (Δ = ' + kcl.toExponential(1) + ' V)';
  document.getElementById('diode-ohm').textContent = 'Vr = I·R  →  ' + Vr.toFixed(3) + ' V';

  const Iabs = Math.abs(qp.I);
  let Rstat = '—';
  if (Iabs > 2e-9) Rstat = (qp.Vd / qp.I).toFixed(0) + ' Ω';
  const rd = Iabs > 2e-9 ? (p.n * p.vt / Iabs) : Infinity;
  document.getElementById('diode-rstat').textContent = Rstat;
  document.getElementById('diode-rd').textContent = isFinite(rd) ? rd.toFixed(1) + ' Ω' : '—';

  const altVs = p.Vs >= 0 ? p.Vs + 2 : p.Vs - 0.5;
  const alt = solveQpoint(Object.assign({}, p, { Vs: altVs }));
  const altR = Math.abs(alt.I) > 2e-9 ? (alt.Vd / alt.I) : NaN;
  document.getElementById('diode-rstat-note').textContent = isFinite(altR) && Iabs > 2e-9
    ? 'If Vs were ' + altVs.toFixed(1) + ' V, R_static would be ' + altR.toFixed(0) + ' Ω — not a component you can stock.'
    : 'R_static = Vd/I is just the slope from the origin to Q. It is not the diode.';

  const bias = qp.Vd > 0.12 ? 'Forward — barrier down, W shrinks, current explodes exponentially.'
    : (qp.Vd < -0.05 ? 'Reverse — barrier up, W widens, majority carriers stay home. I ≈ −Is.'
      : 'Near equilibrium. Almost no net current.');
  document.getElementById('diode-bias-note').textContent = bias;

  const ledBox = document.getElementById('diode-led-out');
  if (p.ledMode) {
    const lam = HC_NM / p.Eg;
    const col = wavelengthToRGB(lam);
    ledBox.classList.remove('hidden');
    document.getElementById('diode-led-lam').textContent = lam.toFixed(0) + ' nm · ' + col.name;
    const glow = document.getElementById('diode-led-glow');
    glow.style.background = col.css;
    const on = qp.I > 0.001;
    glow.style.opacity = on ? '1' : '0.18';
    glow.style.boxShadow = on ? '0 0 28px ' + col.css : 'none';
  } else {
    ledBox.classList.add('hidden');
  }
}

function renderDiode() {
  const p = diodeInputs();
  setDiodeLabels(p);
  const qp = solveQpoint(p);
  const phy = diodePhysics(p, qp);
  drawJunction(p, qp, phy);
  drawBands(p, qp, phy);
  renderDiodeCircuit(p, qp);
  renderDiodePlot(p, qp);
  renderDiodeReadout(p, qp, phy);
}

function tickDiode() {
  if (typeof activeSim !== 'undefined' && activeSim !== 'diode') return;
  diodeT += 0.035;
  const p = diodeInputs();
  const qp = solveQpoint(p);
  const phy = diodePhysics(p, qp);
  drawJunction(p, qp, phy);
  drawBands(p, qp, phy);
  diodeRaf = requestAnimationFrame(tickDiode);
}

function stopDiode() {
  cancelAnimationFrame(diodeRaf);
  diodeRaf = 0;
}

function applyDiodePreset(name) {
  const map = {
    small: { vs: 0.55, r: 1000 },
    normal: { vs: 5, r: 330 },
    reverse: { vs: -1.8, r: 1000 },
    resist: { vs: 5, r: 8000 },
    supply: { vs: 9, r: 330 },
  };
  const m = map[name];
  if (!m) return;
  document.getElementById('diode-vs').value = m.vs;
  document.getElementById('diode-r').value = m.r;
  renderDiode();
}

function initDiode() {
  if (!diodeInited) {
    ['diode-vs', 'diode-r', 'diode-is', 'diode-n', 'diode-t', 'diode-eg'].forEach((id) => {
      document.getElementById(id).addEventListener('input', renderDiode);
    });
    document.getElementById('diode-led-mode').addEventListener('change', renderDiode);
    document.querySelectorAll('[data-diode-preset]').forEach((b) => {
      b.addEventListener('click', () => applyDiodePreset(b.dataset.diodePreset));
    });
    diodeInited = true;
  }
  renderDiode();
  stopDiode();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    diodeRaf = requestAnimationFrame(tickDiode);
  }
}
