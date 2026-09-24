/**
 * HW2 semiconductor table.
 * ni at 300 K follows the problem set where given.
 * Eg, gap type, and 300 K mobilities are the usual appendix values
 * that make σ and optical colors consistent with that table.
 */

export const HC_EV_NM = 1240;

export const K_EV = 8.617333262145e-5;
export const Q_C = 1.602176634e-19;

export const MATERIALS = {
  Si: {
    id: 'Si', name: 'Silicon', Eg: 1.12, ni300: 1e10, mun: 1350, mup: 480,
    gap: 'indirect', ED: 0.045, EA: 0.045,
  },
  Ge: {
    id: 'Ge', name: 'Germanium', Eg: 0.66, ni300: 1e13, mun: 3900, mup: 1900,
    gap: 'indirect', ED: 0.010, EA: 0.010,
  },
  GaAs: {
    id: 'GaAs', name: 'GaAs', Eg: 1.42, ni300: 1e6, mun: 8500, mup: 400,
    gap: 'direct', ED: 0.006, EA: 0.030,
  },
  InP: {
    id: 'InP', name: 'InP', Eg: 1.35, ni300: 1.3e7, mun: 4600, mup: 150,
    gap: 'direct', ED: 0.007, EA: 0.040,
  },
  InAs: {
    id: 'InAs', name: 'InAs', Eg: 0.36, ni300: 1e15, mun: 30000, mup: 500,
    gap: 'direct', ED: 0.002, EA: 0.020,
  },
  CdS: {
    id: 'CdS', name: 'CdS', Eg: 2.42, ni300: 1, mun: 340, mup: 50,
    gap: 'direct', ED: 0.030, EA: 0.090,
  },
  CdSe: {
    id: 'CdSe', name: 'CdSe', Eg: 1.74, ni300: 1, mun: 650, mup: 50,
    gap: 'direct', ED: 0.020, EA: 0.080,
  },
  Direct19: {
    id: 'Direct19', name: 'direct-gap 1.9 eV', Eg: 1.9, ni300: 1, mun: 200, mup: 50,
    gap: 'direct', ED: 0.04, EA: 0.04,
  },
};

export function material(id) {
  const m = MATERIALS[id];
  if (!m) throw new Error(`unknown material ${id}`);
  return m;
}
