/**
 * E–k band physics — teaching model (normalized units)
 * ----------------------------------------------------
 * Visualization code must call these helpers rather than re-deriving
 * slopes and masses. That keeps the algebra in one place and lets
 * realistic Si/GaAs constants be swapped in later without touching SVG.
 *
 * Normalized convention (conceptual sandbox):
 *   ħ  = HBAR = 1
 *   |q| = Q    = 1
 *   k  in units of a reference wavevector k0
 *   E  in units of ħ² k0² / m0
 *   m* in units of a reference mass m0 (not automatically m_e)
 *
 * Parabolic conduction band (electron near a Γ-like minimum):
 *   E_c(k)     = E_c0 + (ħ² k²) / (2 m*)
 *   dE/dk      = ħ² k / m*
 *   d²E/dk²    = ħ² / m*
 *   v          = (1/ħ) dE/dk = ħ k / m*
 *   m*         = ħ² / (d²E/dk²)
 *   p_crystal  = ħ k
 *
 * Parabolic valence band (hole near a maximum):
 *   E_v(k)     = E_v0 − (ħ² k²) / (2 m*_h)
 *   curvature  = |d²E/dk²| = ħ² / m*_h
 *
 * Acceleration theorem (crystal momentum, not Newton's F = m a in real space):
 *   ħ dk/dt = F = q_carrier · E_field
 *   electron: q = −Q  →  dk/dt = −(Q/ħ) E
 *   hole:     q = +Q  →  dk/dt = +(Q/ħ) E
 *
 * Important: dk/dt does not depend on m*. The same field advances k at the
 * same rate for light and heavy carriers. Effective mass appears when that
 * Δk is turned into Δv through v = ħk / m*.
 *
 * To later use SI values, set HBAR (J·s), Q (C), express k in 1/m,
 * E in joules (or convert eV), and E_field in V/m. The function shapes
 * stay the same.
 */
(function (global) {
  const HBAR = 1;
  const Q = 1;

  /** Band-edge placeholders in normalized energy units. */
  const EC0 = 1.05;
  const EV0 = -0.12;

  /**
   * Curvature of a parabola E = E0 ± k² / (2 m*)
   * equals ħ² / m* (always positive here).
   */
  function curvatureFromMass(mStar) {
    return (HBAR * HBAR) / mStar;
  }

  function massFromCurvature(curvature) {
    return (HBAR * HBAR) / curvature;
  }

  /** Conduction-band energy. */
  function conductionEnergy(k, mStar, Ec) {
    const edge = Ec == null ? EC0 : Ec;
    return edge + (HBAR * HBAR * k * k) / (2 * mStar);
  }

  /** dE/dk on the conduction band. */
  function conductionSlope(k, mStar) {
    return (HBAR * HBAR * k) / mStar;
  }

  /** Valence-band energy (inverted parabola). */
  function valenceEnergy(k, mStar, Ev) {
    const edge = Ev == null ? EV0 : Ev;
    return edge - (HBAR * HBAR * k * k) / (2 * mStar);
  }

  /** dE/dk on the valence band (electron-state slope). */
  function valenceSlope(k, mStar) {
    return -(HBAR * HBAR * k) / mStar;
  }

  /**
   * Group velocity of a conduction electron, or of a hole treated as
   * a +q particle with its own m*: v = ħ k / m*.
   */
  function carrierVelocity(k, mStar) {
    return (HBAR * k) / mStar;
  }

  /** v = (1/ħ) dE/dk — used on the conduction band. */
  function velocityFromSlope(dEdk) {
    return dEdk / HBAR;
  }

  function crystalMomentum(k) {
    return HBAR * k;
  }

  /**
   * ħ dk/dt = q E  →  dk/dt = q E / ħ
   * chargeSign: −1 electron, +1 hole
   */
  function dkdt(Efield, chargeSign) {
    return (chargeSign * Q * Efield) / HBAR;
  }

  /**
   * Advance k by dt seconds of teaching-time. Clamp to the plotted
   * “zone” so the parabola stays on screen. A real Brillouin-zone edge
   * would Bragg-scatter; we do not fake that here.
   */
  function stepK(k, Efield, chargeSign, dt, kMax) {
    const next = k + dkdt(Efield, chargeSign) * dt;
    const lim = kMax == null ? 1.65 : kMax;
    if (next > lim) return lim;
    if (next < -lim) return -lim;
    return next;
  }

  function atBandExtremum(k, eps) {
    return Math.abs(k) < (eps == null ? 0.045 : eps);
  }

  global.EkPhysics = {
    HBAR: HBAR,
    Q: Q,
    EC0: EC0,
    EV0: EV0,
    K_MAX: 1.65,
    E_MIN: -3.05,
    E_MAX: 3.55,
    LIGHT_CURVATURE: 2.25,
    HEAVY_CURVATURE: 0.42,
    curvatureFromMass: curvatureFromMass,
    massFromCurvature: massFromCurvature,
    conductionEnergy: conductionEnergy,
    conductionSlope: conductionSlope,
    valenceEnergy: valenceEnergy,
    valenceSlope: valenceSlope,
    carrierVelocity: carrierVelocity,
    velocityFromSlope: velocityFromSlope,
    crystalMomentum: crystalMomentum,
    dkdt: dkdt,
    stepK: stepK,
    atBandExtremum: atBandExtremum,
  };
})(window);
