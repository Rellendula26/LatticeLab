/**
 * Photodetectors and photovoltaics teaching physics.
 * SI/cgs mix matches the rest of LatticeLab (cm, eV, nm).
 * Exact vs teaching approximations are flagged on returned objects.
 */

export const C = {
  HC_EV_NM: 1240,
  Q: 1.602176634e-19,
  K_EV: 8.617333262145e-5,
  K_J: 1.380649e-23,
  H: 6.62607015e-34,
  C_LIGHT: 2.99792458e8,
  EPS0: 8.854187817e-14,
  WIEN_NM_K: 2.897771955e6,
  VSAT: 1e7,
  SIGMA_SB: 5.670374419e-8,
};

export const MATERIALS = {
  Si: { id: 'Si', name: 'Silicon', Eg: 1.12, ni300: 1e10, mun: 1350, mup: 480, epsR: 11.7, gap: 'indirect' },
  Ge: { id: 'Ge', name: 'Germanium', Eg: 0.66, ni300: 1e13, mun: 3900, mup: 1900, epsR: 16.0, gap: 'indirect' },
  GaAs: { id: 'GaAs', name: 'GaAs', Eg: 1.42, ni300: 1e6, mun: 8500, mup: 400, epsR: 12.9, gap: 'direct' },
  CdS: { id: 'CdS', name: 'CdS', Eg: 2.42, ni300: 1, mun: 340, mup: 50, epsR: 8.9, gap: 'direct' },
  InP: { id: 'InP', name: 'InP', Eg: 1.35, ni300: 1.3e7, mun: 4600, mup: 150, epsR: 12.5, gap: 'direct' },
};

export function material(id) {
  const m = MATERIALS[id];
  if (!m) throw new Error(`unknown material ${id}`);
  return m;
}

export function sci(n, d = 2) {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 0.01 && abs < 1000) return n.toFixed(d);
  const exp = Math.floor(Math.log10(abs));
  return `${(n / 10 ** exp).toFixed(d)}×10^${exp}`;
}

export function vt(T) {
  return C.K_EV * Math.max(T, 1e-6);
}

/** Clamp only the exponential argument. Callers keep the physical V. */
export function safeExp(x) {
  const xx = Math.max(-40, Math.min(80, x));
  return {
    value: Math.exp(xx),
    overflow: x > 80 || x < -40,
    clamped: xx,
  };
}

export function ePhoton(lambdaNm) {
  if (!(lambdaNm > 0)) return { E: Infinity, note: 'λ ≤ 0 is not a wavelength.' };
  return { E: C.HC_EV_NM / lambdaNm, lambdaNm };
}

export function lambdaFromE(eV) {
  if (!(eV > 0)) return { lambdaNm: Infinity, note: 'E ≤ 0 is not a photon energy.' };
  return { lambdaNm: C.HC_EV_NM / eV, eV };
}

export function photonRegime(Eph, Eg) {
  const d = Eph - Eg;
  if (Eph + 1e-12 < Eg) {
    return { id: 'below', label: 'transparent', d, usable: 0, thermal: 0, absorbed: false };
  }
  if (Math.abs(d) < 0.03) {
    return { id: 'edge', label: 'band-edge absorption', d, usable: Eg, thermal: Math.max(0, d), absorbed: true };
  }
  return { id: 'above', label: 'absorption + thermalization', d, usable: Eg, thermal: d, absorbed: true };
}

export function energySplit(Eph, Eg) {
  const r = photonRegime(Eph, Eg);
  return {
    photon: Eph,
    gap: Eg,
    cutoffNm: lambdaFromE(Eg).lambdaNm,
    usable: r.absorbed ? Eg : 0,
    thermal: r.absorbed ? Math.max(0, Eph - Eg) : 0,
    transmitted: r.absorbed ? 0 : Eph,
    regime: r,
  };
}

/** Direct-gap teaching α (1/cm). Sharp onset, α ∝ √(E−Eg). */
export function alphaDirect(lambdaNm, Eg, a0 = 5e4) {
  const E = ePhoton(lambdaNm).E;
  if (!(E >= Eg)) return 0;
  return a0 * Math.sqrt((E - Eg) / Eg);
}

export function beer(I0, alpha, x) {
  return I0 * Math.exp(-Math.max(0, alpha) * Math.max(0, x));
}

export function absorbedFraction(alpha, d, R = 0, trapping = false) {
  const refl = Math.min(Math.max(R, 0), 0.999);
  const a = Math.max(0, alpha);
  const t = Math.max(0, d);
  const onePass = 1 - Math.exp(-a * t);
  if (!trapping) {
    const absorbed = (1 - refl) * onePass;
    return { absorbed, reflected: refl, transmitted: (1 - refl) * Math.exp(-a * t), model: 'single-pass' };
  }
  const trapped = (1 - refl) * (1 - Math.exp(-4 * a * t));
  return {
    absorbed: trapped,
    reflected: refl,
    transmitted: Math.max(0, 1 - refl - trapped),
    model: 'light-trapping teaching (optical path ~4d)',
  };
}

export function generationRate(Phi0, alpha, x) {
  return Math.max(0, alpha) * Phi0 * Math.exp(-Math.max(0, alpha) * Math.max(0, x));
}

export function ni(mat, T) {
  const t = Math.max(T, 1);
  return mat.ni300 * (t / 300) ** 1.5 * Math.exp((mat.Eg / (2 * C.K_EV)) * (1 / 300 - 1 / t));
}

export function vbi(NA, ND, T, mat) {
  const n = ni(mat, T);
  const arg = Math.max(NA * ND / (n * n), 1.0001);
  return vt(T) * Math.log(arg);
}

/**
 * Abrupt PN depletion width (cm). V is the applied bias (forward > 0).
 * Returns flags instead of silently inventing a punch-through width.
 */
export function depletion(NA, ND, V, T, mat) {
  const vb = vbi(NA, ND, T, mat);
  const psi = vb - V;
  const eps = (mat.epsR || 11.7) * C.EPS0;
  if (psi <= 0) {
    return { W: 0, xp: 0, xn: 0, vbi: vb, psi, flat: true, Emax: 0, eps, model: 'barrier flattened (this formula no longer applies)' };
  }
  const W = Math.sqrt((2 * eps / C.Q) * ((NA + ND) / (NA * ND)) * psi);
  const xp = W * ND / (NA + ND);
  const xn = W * NA / (NA + ND);
  const Emax = (C.Q * NA * xp) / eps;
  return { W, xp, xn, vbi: vb, psi, flat: false, Emax, eps, model: 'abrupt one-sided-capable depletion' };
}

export function pinWidth(Wi, NA, ND, V, T, mat) {
  const d = depletion(NA, ND, V, T, mat);
  const W = Math.max(Wi, d.W);
  return { ...d, W, Wi, model: 'PIN teaching: i-layer plus junction depletion, W ≥ Wi' };
}

export function diffusionLength(mu, tau, T) {
  const D = vt(T) * mu;
  return { L: Math.sqrt(Math.max(D * tau, 0)), D };
}

/**
 * Collection probability for a pair born at x.
 * Junction at 0. P is x < 0, N is x > 0. Depletion [−xp, xn].
 */
export function collectionProb(x, xp, xn, Ln, Lp) {
  if (x >= -xp && x <= xn) return { p: 1, how: 'drift in the field' };
  if (x < -xp) {
    const d = -xp - x;
    const p = Math.exp(-d / Math.max(Ln, 1e-12));
    return { p, how: 'electron diffusion in p-neutral' };
  }
  const d = x - xn;
  const p = Math.exp(-d / Math.max(Lp, 1e-12));
  return { p, how: 'hole diffusion in n-neutral' };
}

export function photocurrentApprox(A, gop, Ln, Lp, W) {
  return C.Q * A * gop * (Ln + Lp + W);
}

export function sigmaOf(n, p, mun, mup) {
  const elec = C.Q * n * mun;
  const hole = C.Q * p * mup;
  return { elec, hole, total: elec + hole };
}

export function barResistance(L, area, sigma) {
  if (!(sigma > 0) || !(area > 0)) return Infinity;
  return L / (sigma * area);
}

export function photoconductorI(V, R) {
  if (!Number.isFinite(R) || R === 0) return { I: NaN, note: 'R is not a finite resistor.' };
  return { I: V / R };
}

export function diodeCurrent(V, I0, T, Iph = 0) {
  const ex = safeExp(V / vt(T));
  const I = I0 * (ex.value - 1) - Iph;
  return { I, I0, Iph, overflow: ex.overflow, model: 'I = I0(e^{qV/kT}−1) − Iph' };
}

export function voc(Iph, I0, T) {
  if (!(Iph > 0)) return 0;
  if (!(I0 > 0)) return Infinity;
  return vt(T) * Math.log(1 + Iph / I0);
}

export function iscSigned(Iph) {
  return -Iph;
}

/**
 * Nonideal illuminated diode (passive sign: I into the anode):
 * I = I0(exp((V − I Rs)/Vt) − 1) + (V − I Rs)/Rsh − Iph
 * Newton on I. Rs = 0 and Rsh = ∞ recovers the ideal law.
 */
export function illuminatedI(V, p) {
  const { I0, T, Iph } = p;
  const Rs = Math.max(0, p.Rs || 0);
  const Rsh = p.Rsh == null || p.Rsh === Infinity ? Infinity : Math.max(p.Rsh, 1e-30);
  const Vt = vt(T);
  if (Rs === 0 && !Number.isFinite(Rsh)) return diodeCurrent(V, I0, T, Iph);

  let I = diodeCurrent(V, I0, T, Iph).I;
  for (let n = 0; n < 40; n++) {
    const Vd = V - I * Rs;
    const ex = safeExp(Vd / Vt);
    const shunt = Number.isFinite(Rsh) ? Vd / Rsh : 0;
    const f = I0 * (ex.value - 1) + shunt - Iph - I;
    const dfdI = I0 * ex.value * (-Rs / Vt) + (Number.isFinite(Rsh) ? -Rs / Rsh : 0) - 1;
    const step = f / (dfdI || -1);
    I -= step;
    if (Math.abs(step) < 1e-18) break;
  }
  return { I, V, model: 'single-diode with Rs, Rsh (Newton). Junction sees V − I Rs in the passive sign convention.' };
}

export function ivCurve(p, vMin = -1.2, vMax = 1.1, n = 160) {
  const xs = [];
  const ys = [];
  for (let i = 0; i <= n; i++) {
    const V = vMin + (vMax - vMin) * (i / n);
    xs.push(V);
    ys.push(illuminatedI(V, p).I);
  }
  return { V: xs, I: ys };
}

export function powerPassive(V, I) {
  return V * I;
}

export function regimeOf(V, I) {
  if (V >= 0 && I > 0) return { id: 'led', label: 'forward diode / LED', power: 'consumed' };
  if (V <= 0 && I <= 0) return { id: 'detector', label: 'reverse photodetector', power: 'small reverse dissipation' };
  if (V > 0 && I < 0) return { id: 'pv', label: 'photovoltaic generation', power: 'generated (P=IV < 0 in passive convention)' };
  return { id: 'other', label: 'quadrant IV', power: 'consumed' };
}

export function mpp(p, vMin = 0, vMax = null) {
  const Voc = voc(p.Iph, p.I0, p.T);
  const hi = vMax == null ? Math.max(Voc, 0.05) : vMax;
  let best = { V: 0, I: iscSigned(p.Iph), Pout: 0 };
  const steps = 220;
  for (let i = 0; i <= steps; i++) {
    const V = vMin + (hi - vMin) * (i / steps);
    const I = illuminatedI(V, p).I;
    const Pout = -V * I;
    if (Pout > best.Pout) best = { V, I, Pout };
  }
  const VocI = 0;
  const Isc = iscSigned(p.Iph);
  const FF = (Voc > 0 && Math.abs(Isc) > 0) ? best.Pout / (Voc * Math.abs(Isc)) : 0;
  return { ...best, Voc, Isc, FF, Pin: p.Pin || 0, eta: p.Pin ? best.Pout / p.Pin : null };
}

export function junctionCap(eps, A, W) {
  if (!(W > 0)) return { Cj: Infinity, note: 'W → 0 makes Cj diverge in this parallel-plate model.' };
  return { Cj: eps * A / W };
}

export function rcTime(R, Cj) {
  return R * Cj;
}

export function transitTime(W, mu, E, vsat = C.VSAT) {
  const vd = Math.min(Math.max(mu * Math.abs(E), 0), vsat);
  if (!(vd > 0)) return { t: Infinity, vd, note: 'no drift velocity' };
  return { t: W / vd, vd };
}

export function responsivityFromQE(QE, lambdaNm) {
  return QE * C.Q * lambdaNm / (C.H * C.C_LIGHT) * 1e-9;
}

export function qeFromR(R, lambdaNm) {
  const den = C.Q * lambdaNm / (C.H * C.C_LIGHT) * 1e-9;
  return den ? R / den : 0;
}

/** R (A/W) = QE q λ / hc with hc in eV·nm: QE λ / 1240. */
export function responsivityTeaching(QE, lambdaNm) {
  return QE * lambdaNm / C.HC_EV_NM;
}

export function qeTeaching(R, lambdaNm) {
  return R * C.HC_EV_NM / lambdaNm;
}

export function collectedFromPower(Pin, lambdaNm, QE) {
  const Eph = ePhoton(lambdaNm).E * C.Q;
  const nPh = Eph > 0 ? Pin / Eph : 0;
  const nE = nPh * QE;
  const Iph = nE * C.Q;
  return { nPh, nE, Iph, R: Pin > 0 ? Iph / Pin : 0 };
}

export function planckBlambda(lambdaNm, T) {
  const lam = lambdaNm * 1e-9;
  const t = Math.max(T, 1);
  const hc = C.H * C.C_LIGHT;
  const x = hc / (lam * C.K_J * t);
  const num = 2 * hc * C.C_LIGHT / lam ** 5;
  if (!(x > 0) || x > 700) return 0;
  if (x > 30) return num * Math.exp(-x);
  return num / (Math.exp(x) - 1);
}

export function wienPeakNm(T) {
  return C.WIEN_NM_K / Math.max(T, 1);
}

/** Coarse AM1.5G global tilt, W·m⁻²·nm⁻¹. Teaching table, not ASTM G173 verbatim. */
export const AM15G = [
  [280, 0.02], [300, 0.15], [320, 0.35], [350, 0.55], [380, 0.75],
  [400, 1.05], [450, 1.55], [500, 1.55], [550, 1.50], [600, 1.40],
  [650, 1.28], [700, 1.18], [750, 1.05], [800, 0.95], [900, 0.72],
  [1000, 0.62], [1100, 0.42], [1200, 0.32], [1400, 0.12], [1600, 0.16],
  [1800, 0.08], [2000, 0.05], [2500, 0.02], [4000, 0],
];

export function interpTable(table, x) {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (x <= table[i][0]) {
      const [x0, y0] = table[i - 1];
      const [x1, y1] = table[i];
      const t = (x - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return table[table.length - 1][1];
}

export function am15Irradiance(lambdaNm) {
  return interpTable(AM15G, lambdaNm);
}

export function integrateTable(table) {
  let s = 0;
  for (let i = 1; i < table.length; i++) {
    const dx = table[i][0] - table[i - 1][0];
    s += 0.5 * (table[i][1] + table[i - 1][1]) * dx;
  }
  return s;
}

function blackbodyPhotonFlux(E, T) {
  const q = C.Q;
  const h = C.H;
  const c = C.C_LIGHT;
  const coef = (2 * Math.PI * q ** 3) / (h ** 3 * c ** 2);
  const x = E / vt(T);
  if (!(x > 0) || x > 700) return 0;
  if (x > 30) return coef * E * E * Math.exp(-x);
  return coef * E * E / (Math.exp(x) - 1);
}

function integrateFlux(Eg, T, Emax = 8) {
  const n = 280;
  const lo = Math.max(Eg, 0.02);
  let s = 0;
  for (let i = 0; i < n; i++) {
    const e0 = lo + (Emax - lo) * (i / n);
    const e1 = lo + (Emax - lo) * ((i + 1) / n);
    s += 0.5 * (blackbodyPhotonFlux(e0, T) + blackbodyPhotonFlux(e1, T)) * (e1 - e0);
  }
  return s;
}

function integrateEnergy(T, Emax = 8) {
  const n = 320;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const e0 = 0.02 + (Emax - 0.02) * (i / n);
    const e1 = 0.02 + (Emax - 0.02) * ((i + 1) / n);
    const u0 = e0 * C.Q * blackbodyPhotonFlux(e0, T);
    const u1 = e1 * C.Q * blackbodyPhotonFlux(e1, T);
    s += 0.5 * (u0 + u1) * (e1 - e0);
  }
  return s;
}

/**
 * Simplified detailed-balance (Shockley–Queisser) for a step-absorption
 * single junction. Cell radiates into 2π; sun is a 5800 K disk with
 * etendue f ≈ 2.16e-5, then the spectrum is scaled so Pin = 1000 W/m²
 * (AM1.5-like power, not atmospheric absorption).
 */
export function shockleyQueisser(Eg, opts = {}) {
  const Tcell = opts.Tcell || 300;
  const Tsun = opts.Tsun || 5800;
  const f = opts.f == null ? 2.1646e-5 : opts.f;
  const pinTarget = opts.Pin == null ? 1000 : opts.Pin;
  const sunEnergy = integrateEnergy(Tsun) * f;
  const scale = sunEnergy > 0 ? pinTarget / sunEnergy : 1;
  const fluxSun = integrateFlux(Eg, Tsun) * f * scale;
  const fluxCell = integrateFlux(Eg, Tcell);
  const Jsc = C.Q * fluxSun;
  const J0 = C.Q * fluxCell;
  const Voc = voc(Jsc, J0, Tcell);
  const p = { I0: J0, T: Tcell, Iph: Jsc, Rs: 0, Rsh: Infinity, Pin: pinTarget };
  const mp = mpp(p, 0, Voc);
  return {
    Eg,
    Jsc,
    J0,
    Voc: mp.Voc,
    FF: mp.FF,
    Pmax: mp.Pout,
    eta: mp.Pout / pinTarget,
    Vmp: mp.V,
    Jmp: mp.I,
    Pin: pinTarget,
    model: 'radiative detailed balance, step α, 5800 K sun scaled to Pin, no concentration, no nonradiative loss',
    scale,
  };
}

export function am15Jsc(Eg) {
  const lg = lambdaFromE(Eg).lambdaNm;
  let flux = 0;
  for (let i = 1; i < AM15G.length; i++) {
    const [l0, i0] = AM15G[i - 1];
    const [l1, i1] = AM15G[i];
    const n = 8;
    for (let k = 0; k < n; k++) {
      const lam = l0 + (l1 - l0) * ((k + 0.5) / n);
      if (lam >= lg) continue;
      const irr = interpTable(AM15G, lam);
      const dlam = (l1 - l0) / n;
      const Eph = ePhoton(lam).E * C.Q;
      if (Eph > 0) flux += (irr * dlam) / Eph;
    }
  }
  return C.Q * flux;
}

export function tandemSQ(EgTop, EgBot, opts = {}) {
  const hi = Math.max(EgTop, EgBot);
  const lo = Math.min(EgTop, EgBot);
  const top = shockleyQueisser(hi, opts);
  const botOnly = shockleyQueisser(lo, opts);
  const filtered = shockleyQueisser(lo, opts);
  const Jtop = top.Jsc;
  const Jbot = Math.max(0, botOnly.Jsc - top.Jsc);
  const J = Math.min(Jtop, Jbot);
  const Voc = top.Voc + filtered.Voc * (Jbot > 0 ? 1 : 0);
  const FF = 0.85;
  const Pmax = FF * Voc * J;
  const Pin = top.Pin;
  return {
    EgTop: hi,
    EgBot: lo,
    Jtop,
    Jbot,
    J,
    Voc,
    Pmax,
    eta: Pmax / Pin,
    limited: Jtop < Jbot ? 'top' : 'bottom',
    model: 'series tandem: current is the min of the two subcells; voltages add. Teaching SQ, not a full two-junction detailed balance.',
  };
}

export function wavelengthColor(nm) {
  let r = 0, g = 0, b = 0, name = 'infrared', zone = 'ir';
  if (nm < 380) { r = 90; g = 0; b = 160; name = 'near-UV'; zone = 'uv'; }
  else if (nm < 440) { r = Math.round(255 * (440 - nm) / 60); b = 255; name = nm < 420 ? 'violet' : 'blue-violet'; zone = 'vis'; }
  else if (nm < 490) { g = Math.round(255 * (nm - 440) / 50); b = 255; name = 'blue'; zone = 'vis'; }
  else if (nm < 510) { g = 255; b = Math.round(255 * (510 - nm) / 20); name = 'cyan'; zone = 'vis'; }
  else if (nm < 580) { r = Math.round(255 * (nm - 510) / 70); g = 255; name = nm < 560 ? 'green' : 'yellow-green'; zone = 'vis'; }
  else if (nm < 645) { r = 255; g = Math.round(255 * (645 - nm) / 65); name = nm < 600 ? 'yellow' : (nm < 625 ? 'orange' : 'red-orange'); zone = 'vis'; }
  else if (nm <= 750) { r = 255; g = Math.round(40 * (750 - nm) / 105); name = 'red'; zone = 'vis'; }
  else { r = 90; g = 16; b = 16; name = 'infrared'; zone = 'ir'; }
  return { r, g, b, name, zone, css: `rgb(${r},${g},${b})` };
}
