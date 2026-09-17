/**
 * Four-point probe + Irvin-like Si resistivity model.
 * Thin-sheet formula uses t in cm. Particle counts are visual, not 10^16 dots.
 */

export const Q = 1.602176634e-19;
export const NI = 1.5e10;
export const CF = Math.PI / Math.LN2;
export const GAMMA = 72;
export const T_ROOM = 300;

export const WAFERS = {
  A: { id: 'A', rho: 0.053, tMm: 0.500, type: 'n', note: 'heavily doped n-Si' },
  B: { id: 'B', rho: 0.014, tMm: 0.525, type: 'p', note: 'heavily doped p-Si' },
  C: { id: 'C', rho: 221600.749, tMm: 0.525, type: 'i', note: 'near-intrinsic Si' },
  D: { id: 'D', rho: 182.4, tMm: 0.500, type: 'p', note: 'lightly doped p-Si' },
  E: { id: 'E', rho: 0.180, tMm: 0.525, type: 'p', note: 'moderately doped p-Si' },
};

export const PROBE_X = [0.2, 0.4, 0.6, 0.8];

export function tCm(w) {
  return w.tMm / 10;
}

export function sci(n, d = 2) {
  if (!Number.isFinite(n) || n === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const m = n / 10 ** exp;
  return { m: m.toFixed(d), exp, html: `${m.toFixed(d)}×10<sup>${exp}</sup>` };
}

export function muN(N) {
  const n = Math.max(N, 1e12);
  return 92 + 1268 / (1 + (n / 1.3e17) ** 0.91);
}

export function muP(N) {
  const n = Math.max(N, 1e12);
  return 47.7 + 447.3 / (1 + (n / 6.3e16) ** 0.76);
}

export function rhoN(N) {
  return 1 / (Q * N * muN(N));
}

export function rhoP(N) {
  return 1 / (Q * N * muP(N));
}

export function rhoI() {
  return 1 / (Q * NI * (muN(NI) + muP(NI)));
}

export function estimateN(rho, type) {
  if (type === 'i') return { N: NI, kind: 'i', usable: false };
  const fn = type === 'n' ? rhoN : rhoP;
  let lo = 1e12;
  let hi = 2e20;
  const floor = rhoI();
  if (rho > 0.45 * floor) {
    return { N: NI, kind: type, usable: false };
  }
  for (let i = 0; i < 48; i++) {
    const mid = 10 ** ((Math.log10(lo) + Math.log10(hi)) / 2);
    if (fn(mid) > rho) lo = mid;
    else hi = mid;
  }
  return { N: Math.sqrt(lo * hi), kind: type, usable: true };
}

export function senseOhm(w) {
  return w.rho / (CF * tCm(w));
}

export function driveOhm(w, Rc) {
  return 2 * Math.max(Rc, 0) + GAMMA * w.rho;
}

export function measure4pp(w, Vs, Rc, noisy) {
  const Rd = driveOhm(w, Rc);
  const I = Vs / Rd;
  const jitter = noisy ? 1 + (Math.random() - 0.5) * 0.028 : 1;
  const V23 = I * senseOhm(w) * jitter;
  const rho = I > 0 ? CF * tCm(w) * (V23 / I) : Infinity;
  return { I, V23, rho };
}

export function measure2pp(w, Vs, Rc) {
  const R = driveOhm(w, Rc);
  const I = Vs / R;
  return { I, V: Vs, R };
}

export function Tof(x, xIron, Ttip) {
  const w = 0.16;
  return T_ROOM + (Ttip - T_ROOM) * Math.exp(-(((x - xIron) / w) ** 2));
}

export function thermoCurrent(w, TA, TB) {
  const dT = TA - TB;
  const sign = w.type === 'n' ? 1 : w.type === 'p' ? -1 : 0.08;
  const scale = w.type === 'i' ? 0.10 : 1;
  return scale * sign * 3.2e-6 * dT;
}

export function formatI(I) {
  const a = Math.abs(I);
  if (a < 1e-6) return `${(I * 1e9).toFixed(1)} nA`;
  if (a < 1e-3) return `${(I * 1e6).toFixed(2)} μA`;
  if (a < 1) return `${(I * 1e3).toFixed(2)} mA`;
  return `${I.toFixed(3)} A`;
}

export function formatV(V) {
  const a = Math.abs(V);
  if (a < 1e-3) return `${(V * 1e6).toFixed(1)} μV`;
  if (a < 1) return `${(V * 1e3).toFixed(2)} mV`;
  return `${V.toFixed(3)} V`;
}

export function formatRho(r) {
  if (r >= 1000) return `${r.toExponential(3)} Ω·cm`;
  if (r >= 1) return `${r.toFixed(2)} Ω·cm`;
  return `${r.toFixed(4)} Ω·cm`;
}

export function renderKatex(el, tex, display) {
  if (!el) return;
  if (window.katex) {
    window.katex.render(tex, el, { throwOnError: false, displayMode: !!display });
    return;
  }
  el.textContent = tex;
}
