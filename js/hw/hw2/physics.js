/**
 * Shared HW2 teaching physics. Visualizers call these instead of re-deriving.
 */
import { FermiMath } from '../crystal-math.js';
import { HC_EV_NM, K_EV, Q_C, material } from './materials.js';

export { HC_EV_NM, K_EV, Q_C };

export function kT(T) {
  return K_EV * Math.max(T, 0);
}

export function threeKT(T) {
  return 3 * kT(T);
}

export function lambdaG(Eg) {
  return HC_EV_NM / Eg;
}

export function ePhoton(lambdaNm) {
  return HC_EV_NM / lambdaNm;
}

export function absorbs(Eg, lambdaNm) {
  return ePhoton(lambdaNm) + 1e-12 >= Eg;
}

/** Direct-gap teaching α(λ). Sharp onset at λg, α ∝ √(E − Eg). */
export function alphaDirect(lambdaNm, Eg, a0 = 1) {
  const E = ePhoton(lambdaNm);
  if (E < Eg) return 0;
  return a0 * Math.sqrt((E - Eg) / Eg);
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
  if (nm >= 380 && nm < 420) {
    const f = (nm - 380) / 40;
    r = Math.round(r * (0.35 + 0.65 * f));
    g = Math.round(g * (0.35 + 0.65 * f));
    b = Math.round(b * (0.35 + 0.65 * f));
  }
  if (nm > 700 && nm <= 750) {
    const f = (750 - nm) / 50;
    r = Math.round(r * (0.35 + 0.65 * f));
  }
  return { r, g, b, name, zone, css: `rgb(${r},${g},${b})` };
}

export function niOf(matOrId, T) {
  const m = typeof matOrId === 'string' ? material(matOrId) : matOrId;
  const t = Math.max(T, 1);
  return m.ni300 * (t / 300) ** 1.5 * Math.exp((m.Eg / (2 * K_EV)) * (1 / 300 - 1 / t));
}

/**
 * Complete-ionization charge neutrality.
 * n = (ND − NA)/2 + sqrt(((ND − NA)/2)² + ni²)
 */
export function carriers(NA, ND, ni) {
  const net = ND - NA;
  const n = net / 2 + Math.hypot(net / 2, ni);
  const p = (ni * ni) / n;
  return { n, p };
}

export function dopingKind(NA, ND, ni) {
  const net = ND - NA;
  if (Math.max(NA, ND) < 0.2 * ni) return 'intrinsic';
  if (Math.abs(net) < 0.2 * Math.max(NA, ND, ni) && Math.max(NA, ND) > 2 * ni) return 'compensated';
  if (net > 0) return ND > 5 * ni ? 'n-type' : 'n-type (weak)';
  return NA > 5 * ni ? 'p-type' : 'p-type (weak)';
}

export function majorityWhy(NA, ND, ni) {
  if (Math.max(NA, ND) < 0.2 * ni) {
    return `NA and ND are both far below ni. Thermal generation sets n ≈ p ≈ ni. Do not write p = NA or n = ND.`;
  }
  if (ND - NA > 5 * ni && ND > 10 * NA) {
    return `ND ≫ NA and ND ≫ ni, so the extra electrons come from ionized donors. n ≈ ND − NA ≈ ND is legal.`;
  }
  if (NA - ND > 5 * ni && NA > 10 * ND) {
    return `NA ≫ ND and NA ≫ ni, so the extra holes come from ionized acceptors. p ≈ NA − ND ≈ NA is legal.`;
  }
  if (Math.abs(ND - NA) < 2 * ni) {
    return `Net doping is comparable to ni. Use the full quadratic, not n = ND or p = NA.`;
  }
  return `Use n = (ND − NA)/2 + sqrt(((ND − NA)/2)² + ni²), then p = ni²/n.`;
}

export function sigmaOf(n, p, mun, mup) {
  const elec = Q_C * n * mun;
  const hole = Q_C * p * mup;
  return { elec, hole, total: elec + hole };
}

/** EF − Ei = kT ln(n/ni). At T → 0 this formula is not used. */
export function efMinusEi(n, ni, T) {
  if (T <= 0.5) return null;
  const ratio = Math.max(n / Math.max(ni, 1e-300), 1e-300);
  return kT(T) * Math.log(ratio);
}

export function bandEdges(Eg) {
  return { Ev: 0, Ei: Eg / 2, Ec: Eg };
}

export function occupancy(E, EF, T) {
  return FermiMath.occupancy(E, EF, T);
}

export function fermiCurve(EF, T, Ev, Ec, n) {
  const steps = n || 220;
  const lo = Ev - 0.18;
  const hi = Ec + 0.18;
  const E = [];
  const f = [];
  if (T <= 0.05) {
    E.push(lo, EF, EF, hi);
    f.push(1, 1, 0, 0);
    return { E, f };
  }
  for (let i = 0; i <= steps; i++) {
    const e = lo + (hi - lo) * (i / steps);
    E.push(e);
    f.push(occupancy(e, EF, T));
  }
  return { E, f };
}

export function ionizedIf(EI, T) {
  return EI <= threeKT(T) + 1e-9;
}

export function impurityRole(kindNear, EI, T) {
  const on = ionizedIf(EI, T);
  if (!on) return 'trap';
  return kindNear === 'v' ? 'acceptor' : 'donor';
}

/** n-type freeze-out + extrinsic + intrinsic teaching curve. */
export function nVsT(matOrId, ND, T, ED) {
  const m = typeof matOrId === 'string' ? material(matOrId) : matOrId;
  const ni = niOf(m, T);
  const Ed = ED == null ? m.ED : ED;
  const ion = 1 / (1 + Math.exp((Ed - threeKT(T)) / Math.max(kT(T), 1e-6)));
  const NdIon = ND * ion;
  const { n } = carriers(0, NdIon, ni);
  let regime = 'extrinsic';
  if (ion < 0.85) regime = 'freeze-out';
  if (ni > 0.3 * ND) regime = 'intrinsic';
  return { n, ni, ion, NdIon, regime };
}

/**
 * Tmax: majority stays within 10% of the doping.
 * For ND=0, p = NA/2 + sqrt((NA/2)²+ni²) ≥ NA, so the bound is p ≤ 1.1 NA
 * → ni ≤ NA √0.11.
 */
export function niLimit10pct(N) {
  return N * Math.sqrt(0.11);
}

export function findTmax(matOrId, N, Tlo = 200, Thi = 900) {
  const m = typeof matOrId === 'string' ? material(matOrId) : matOrId;
  const target = niLimit10pct(N);
  let lo = Tlo;
  let hi = Thi;
  for (let i = 0; i < 48; i++) {
    const mid = 0.5 * (lo + hi);
    if (niOf(m, mid) > target) hi = mid;
    else lo = mid;
  }
  return 0.5 * (lo + hi);
}

export function majorityError(N, actual) {
  return 100 * (actual - N) / N;
}

export function sci(n, d = 2) {
  if (!Number.isFinite(n) || n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 0.01 && abs < 1000) return Number.isInteger(n) ? String(n) : n.toFixed(d);
  const exp = Math.floor(Math.log10(abs));
  const mant = n / 10 ** exp;
  return `${mant.toFixed(d)}×10^{${exp}}`;
}

export function sciHtml(n, d = 2) {
  return sci(n, d).replace(/\^{([^}]+)}/g, '<sup>$1</sup>');
}

export function colorMixTransmitted(Eg, lo = 380, hi = 750) {
  let r = 0, g = 0, b = 0, w = 0;
  const lg = lambdaG(Eg);
  for (let lam = lo; lam <= hi; lam += 2) {
    if (lam <= lg) continue;
    const c = wavelengthColor(lam);
    r += c.r; g += c.g; b += c.b; w += 1;
  }
  if (!w) return { r: 8, g: 8, b: 10, css: 'rgb(8,8,10)', name: 'none (all visible absorbed)', any: false };
  r = Math.round(r / w); g = Math.round(g / w); b = Math.round(b / w);
  return { r, g, b, css: `rgb(${r},${g},${b})`, name: wavelengthColor(Math.max(lg + 10, lo)).name, any: true };
}
