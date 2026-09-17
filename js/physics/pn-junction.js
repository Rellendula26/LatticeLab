/**
 * Abrupt p–n junction (Si-like teaching model).
 * One-dimensional, fully depleted, non-degenerate. Not high-injection or punch-through.
 */

export const PN = {
  EG: 1.12,
  EPS_R: 11.7,
  EPS0: 8.854187817e-14,
  Q: 1.602176634e-19,
  K: 8.617333262145e-5,
  NI300: 1.5e10,
  LN: 8e-5,
  LP: 8e-5,
};

export function sci(n, d = 2) {
  if (!Number.isFinite(n) || n === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const m = n / 10 ** exp;
  return `${m.toFixed(d)}×10^{${exp}}`;
}

export class AbruptJunction {
  ni(T) {
    const { NI300, EG, K } = PN;
    const t = Math.max(T, 1);
    return NI300 * (t / 300) ** 1.5 * Math.exp((EG / (2 * K)) * (1 / 300 - 1 / t));
  }

  solve(NA, ND, Va, T) {
    const ni = this.ni(T);
    const Vt = PN.K * T;
    const arg = Math.max(NA * ND / (ni * ni), 1.0001);
    const vbi = Vt * Math.log(arg);
    const flat = Va >= vbi - 0.002;
    const psi = flat ? 0.002 : vbi - Va;
    const eps = PN.EPS_R * PN.EPS0;
    const W = Math.sqrt((2 * eps / PN.Q) * ((NA + ND) / (NA * ND)) * psi);
    const xp = W * ND / (NA + ND);
    const xn = W * NA / (NA + ND);
    const Emax = (PN.Q * NA * xp) / eps;
    const L = Math.max(2.2e-4, 3.2 * W);
    const bias = Va > 0.015 ? 'forward' : Va < -0.015 ? 'reverse' : 'eq';
    return {
      NA, ND, Va, T, ni, Vt, vbi, psi, W, xp, xn, Emax, L, eps, flat, bias,
      EFn: Vt * Math.log(ND / ni),
      qVa: Va,
      I0: 1.2e-14 * (ni / PN.NI300) ** 2,
    };
  }

  /** Signed Ex (kV/cm). P is −x, N is +x, so Ex < 0: field points N → P. */
  fieldX(x, s) {
    return -this.field(x, s);
  }

  shockley(s) {
    const arg = Math.max(-40, Math.min(40, s.Va / s.Vt));
    return { I0: s.I0, I: s.I0 * (Math.exp(arg) - 1) };
  }

  region(x, s) {
    if (x < -s.xp) return 'p';
    if (x > s.xn) return 'n';
    return 'dep';
  }

  phi(x, s) {
    const { xp, xn, psi, NA, ND, eps } = s;
    if (x <= -xp) return 0;
    if (x >= xn) return psi;
    if (x < 0) return (PN.Q * NA / (2 * eps)) * (x + xp) ** 2;
    return psi - (PN.Q * ND / (2 * eps)) * (xn - x) ** 2;
  }

  field(x, s) {
    const { xp, xn, NA, ND, eps } = s;
    if (x <= -xp || x >= xn) return 0;
    if (x < 0) return (PN.Q * NA / eps) * (x + xp);
    return (PN.Q * ND / eps) * (xn - x);
  }

  rhoOverQ(x, s) {
    if (x >= -s.xp && x < 0) return -s.NA;
    if (x > 0 && x <= s.xn) return s.ND;
    return 0;
  }

  bands(x, s) {
    const Ei = s.psi - this.phi(x, s);
    return { Ei, Ec: Ei + PN.EG / 2, Ev: Ei - PN.EG / 2 };
  }

  carriers(x, s) {
    const { Ei } = this.bands(x, s);
    const EFn = s.EFn;
    const EFp = s.EFn - s.Va;
    const nEq = s.ni * Math.exp((EFn - Ei) / s.Vt);
    const pEq = s.ni * Math.exp((Ei - EFp) / s.Vt);
    let n = nEq;
    let p = pEq;
    if (x < -s.xp) {
      const dx = -s.xp - x;
      const nInj = (s.ni * s.ni / s.NA) * Math.exp(s.Va / s.Vt);
      n = s.ni * s.ni / s.NA + (nInj - s.ni * s.ni / s.NA) * Math.exp(-dx / PN.LN);
      p = s.NA;
    } else if (x > s.xn) {
      const dx = x - s.xn;
      const pInj = (s.ni * s.ni / s.ND) * Math.exp(s.Va / s.Vt);
      p = s.ni * s.ni / s.ND + (pInj - s.ni * s.ni / s.ND) * Math.exp(-dx / PN.LP);
      n = s.ND;
    }
    return {
      n: Math.max(n, 1),
      p: Math.max(p, 1),
    };
  }

  sample(s, n = 220) {
    const xs = [];
    const Ec = [];
    const Ev = [];
    const Ei = [];
    const rho = [];
    const E = [];
    const Ex = [];
    const V = [];
    const nC = [];
    const pC = [];
    for (let i = 0; i < n; i++) {
      const x = -s.L + (2 * s.L * i) / (n - 1);
      const b = this.bands(x, s);
      const c = this.carriers(x, s);
      xs.push(x * 1e4);
      Ec.push(b.Ec);
      Ev.push(b.Ev);
      Ei.push(b.Ei);
      rho.push(this.rhoOverQ(x, s));
      E.push(this.field(x, s) / 1000);
      Ex.push(this.fieldX(x, s) / 1000);
      V.push(this.phi(x, s));
      nC.push(c.n);
      pC.push(c.p);
    }
    return { xs, Ec, Ev, Ei, rho, E, Ex, V, nC, pC };
  }
}

export function renderKatex(el, tex, display) {
  if (!el) return;
  if (window.katex) {
    window.katex.render(tex, el, { throwOnError: false, displayMode: !!display });
    return;
  }
  el.textContent = tex;
}
