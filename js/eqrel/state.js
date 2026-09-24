/**
 * One live semiconductor. Every equation and canvas reads this snapshot.
 * Physics comes from the existing HW2 helpers, not a second ni(T).
 */
import { MATERIALS, material } from '../hw/hw2/materials.js';
import {
  niOf, carriers, sigmaOf, lambdaG, ePhoton, kT, efMinusEi, bandEdges,
  occupancy, absorbs, wavelengthColor, majorityWhy, dopingKind, nVsT, sci, sciHtml,
} from '../hw/hw2/physics.js';

export { MATERIALS, material, sci, sciHtml };

export class EqState {
  constructor() {
    this.matId = 'Si';
    this.T = 300;
    this.NA = 1e15;
    this.ND = 1e16;
    this.lambda = 1000;
    this.Efield = 100;
    this.Eprobe = null;
    this.drive = 'doping';
    this.efOverride = null;
    this.lastChanged = null;
    this.pulseAt = 0;
    this._subs = new Set();
  }

  on(fn) { this._subs.add(fn); return () => this._subs.delete(fn); }

  set(patch, changed) {
    Object.assign(this, patch);
    if (changed) {
      this.lastChanged = changed;
      this.pulseAt = performance.now();
    }
    this._subs.forEach((fn) => fn(this.snap()));
  }

  setMaterial(id) {
    this.set({ matId: id, efOverride: this.drive === 'fermi' ? this.efOverride : null }, 'Eg');
  }

  setDrive(drive) {
    if (drive === 'doping') this.set({ drive, efOverride: null }, drive === this.drive ? null : 'NA');
    else this.set({ drive }, 'EF');
  }

  dragEF(EF) {
    this.set({ drive: 'fermi', efOverride: EF }, 'EF');
  }

  snap() {
    const m = material(this.matId);
    const T = Math.max(this.T, 0);
    const kt = kT(T);
    const ni = niOf(m, T);
    const edges = bandEdges(m.Eg);
    const { Ev, Ei, Ec } = edges;

    let n;
    let p;
    let EF;
    let dEF;
    let kind;
    let why;

    if (this.drive === 'fermi' && this.efOverride != null && T > 0.5) {
      EF = Math.min(Ec - 0.02, Math.max(Ev + 0.02, this.efOverride));
      dEF = EF - Ei;
      n = ni * Math.exp(dEF / Math.max(kt, 1e-12));
      p = (ni * ni) / Math.max(n, 1e-300);
      kind = n > 3 * p ? 'n-type (EF set by hand)' : p > 3 * n ? 'p-type (EF set by hand)' : 'near-intrinsic (EF set by hand)';
      why = 'EF is the independent knob. n and p follow Boltzmann. Doping would have to change to actually place this EF.';
    } else {
      const car = carriers(this.NA, this.ND, ni);
      n = car.n;
      p = car.p;
      dEF = efMinusEi(n, ni, T);
      EF = dEF == null ? Ei : Ei + dEF;
      kind = dopingKind(this.NA, this.ND, ni);
      why = majorityWhy(this.NA, this.ND, ni);
    }

    const NC = T > 0.5 ? ni * Math.exp((Ec - Ei) / Math.max(kt, 1e-12)) : 0;
    const NV = T > 0.5 ? ni * Math.exp((Ei - Ev) / Math.max(kt, 1e-12)) : 0;
    const sig = sigmaOf(n, p, m.mun, m.mup);
    const rho = sig.total > 0 ? 1 / sig.total : Infinity;
    const lg = lambdaG(m.Eg);
    const Eph = ePhoton(this.lambda);
    const freq = 2.99792458e17 / this.lambda;
    const vdN = m.mun * this.Efield;
    const vdP = m.mup * this.Efield;
    const Jn = sig.elec * this.Efield;
    const Jp = sig.hole * this.Efield;
    const J = sig.total * this.Efield;
    const Epr = this.Eprobe == null ? (Ei + 0.15 * m.Eg) : this.Eprobe;
    const fE = occupancy(Epr, EF, T);
    const fEc = occupancy(Ec, EF, T);
    const fEv = occupancy(Ev, EF, T);
    const ionN = nVsT(m, Math.max(this.ND, 1), T, m.ED);
    const color = wavelengthColor(this.lambda);
    const abs = absorbs(m.Eg, this.lambda);

    return {
      m, T, kt, ni, n, p, EF, dEF, Ev, Ei, Ec, NC, NV,
      NA: this.NA, ND: this.ND,
      lambda: this.lambda, lg, Eph, freq, abs, color,
      mun: m.mun, mup: m.mup,
      sigma: sig.total, sigE: sig.elec, sigH: sig.hole, rho,
      Efield: this.Efield, vdN, vdP, Jn, Jp, J,
      Epr, fE, fEc, fEv,
      ionN, kind, why, drive: this.drive,
      lastChanged: this.lastChanged, pulseAt: this.pulseAt,
      np: n * p, ni2: ni * ni,
      nApproxOk: this.ND > 10 * this.NA && this.ND > 5 * ni && ionN.regime === 'extrinsic',
      pApproxOk: this.NA > 10 * this.ND && this.NA > 5 * ni,
    };
  }

  value(id, s) {
    const snap = s || this.snap();
    const map = {
      Eg: snap.m.Eg, EC: snap.Ec, EV: snap.Ev, Ei: snap.Ei, EF: snap.EF, E: snap.Epr,
      lambda: snap.lambda, lg: snap.lg, f: snap.fE, T: snap.T, k: snap.kt,
      n: snap.n, p: snap.p, ni: snap.ni, NA: snap.NA, ND: snap.ND,
      mun: snap.mun, mup: snap.mup, sigma: snap.sigma, rho: snap.rho,
      q: 1.602176634e-19, NC: snap.NC, NV: snap.NV, Eph: snap.Eph, freq: snap.freq,
      vd: snap.vdN, Efield: snap.Efield, J: snap.J, alpha: snap.abs ? 1 : 0,
    };
    return map[id];
  }
}
