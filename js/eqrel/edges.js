/**
 * Semantic edges. A line is a claim: type, directness, and a one-line why.
 */
export const EDGES = [
  { id: 'eg-lg', source: 'Eg', target: 'e_lg', type: 'inverse', direct: true, explanation: 'Larger gap means a shorter threshold wavelength.' },
  { id: 'lg-abs', source: 'e_lg', target: 'absorption', type: 'threshold', direct: true, explanation: 'Determines the absorption threshold.' },
  { id: 'cfl-hc', source: 'e_cfl', target: 'e_hc', type: 'substitution', direct: true, explanation: 'f = c/λ turns E = hf into E = hc/λ.' },
  { id: 'hf-hc', source: 'e_hf', target: 'e_hc', type: 'substitution', direct: true, explanation: 'Quantum energy plus the wave relation give E = hc/λ.' },
  { id: 'hc-lg', source: 'e_hc', target: 'e_lg', type: 'threshold', direct: true, explanation: 'Set the photon energy equal to Eg.' },
  { id: 'lam-hc', source: 'lambda', target: 'e_hc', type: 'inverse', direct: true, explanation: 'Shorter wavelength raises photon energy.' },

  { id: 'band-eg', source: 'band', target: 'Eg', type: 'defines', direct: true, explanation: 'The gap is a band-structure property of the crystal.' },
  { id: 'eg-ec', source: 'Eg', target: 'EC', type: 'defines', direct: true, explanation: 'Ec sits Eg above Ev.' },
  { id: 'eg-ni', source: 'Eg', target: 'e_ni', type: 'exponential-decrease', direct: true, explanation: 'A larger gap makes thermal pair generation exponentially rarer.' },
  { id: 'eg-optical', source: 'Eg', target: 'e_lg', type: 'optical', direct: true, explanation: 'Same gap sets the optical absorption edge.' },

  { id: 't-kt', source: 'T', target: 'k', type: 'scale', direct: true, explanation: 'kT is the thermal energy yardstick.' },
  { id: 't-ni', source: 'T', target: 'e_ni', type: 'thermal-generation', direct: true, explanation: 'Hotter lattice: more electrons can cross Eg.' },
  { id: 't-f', source: 'T', target: 'e_f', type: 'broadens', direct: true, explanation: 'Temperature smears the occupation step around EF.' },
  { id: 't-ion', source: 'T', target: 'e_n_nd', type: 'ionization', direct: true, explanation: 'Freeze-out lifts as kT reaches the impurity depth.' },
  { id: 'ni-np', source: 'ni', target: 'e_np', type: 'sets-product', direct: true, explanation: 'Sets the equilibrium carrier product.' },
  { id: 'e-ni-ni', source: 'e_ni', target: 'ni', type: 'defines', direct: true, explanation: 'The temperature law produces ni.' },

  { id: 'dop-na', source: 'doping', target: 'NA', type: 'sets', direct: true, explanation: 'Acceptors are the p-type doping knob.' },
  { id: 'dop-nd', source: 'doping', target: 'ND', type: 'sets', direct: true, explanation: 'Donors are the n-type doping knob.' },
  { id: 'na-papprox', source: 'NA', target: 'e_p_na', type: 'approx', direct: true, explanation: 'Strong p-type, ionized, extrinsic: p ≈ NA.' },
  { id: 'nd-napprox', source: 'ND', target: 'e_n_nd', type: 'approx', direct: true, explanation: 'Strong n-type, ionized, extrinsic: n ≈ ND.' },
  { id: 'na-neut', source: 'NA', target: 'e_neut', type: 'charge', direct: true, explanation: 'Acceptors enter charge neutrality as negative ions.' },
  { id: 'nd-neut', source: 'ND', target: 'e_neut', type: 'charge', direct: true, explanation: 'Donors enter charge neutrality as positive ions.' },
  { id: 'neut-n', source: 'e_neut', target: 'n', type: 'solves', direct: true, explanation: 'Neutrality plus mass action fix n and p.' },
  { id: 'neut-p', source: 'e_neut', target: 'p', type: 'solves', direct: true, explanation: 'The same solve produces p.' },
  { id: 'neut-ef', source: 'e_neut', target: 'EF', type: 'places', direct: true, explanation: 'The n that neutrality produces places EF through n = ni exp((EF−Ei)/kT).' },

  { id: 'ef-n', source: 'EF', target: 'e_n_ni', type: 'exponential-increase', direct: true, explanation: 'Higher EF increases electron concentration.' },
  { id: 'ef-p', source: 'EF', target: 'e_p_ni', type: 'exponential-decrease', direct: true, explanation: 'Higher EF decreases hole concentration.' },
  { id: 'ef-f', source: 'EF', target: 'e_f', type: 'shifts', direct: true, explanation: 'f(E) is centered on EF. The curve slides with it.' },
  { id: 'ef-nnc', source: 'EF', target: 'e_n_nc', type: 'exponential-increase', direct: true, explanation: 'Raising EF toward Ec fills more conduction states.' },
  { id: 'ef-pnv', source: 'EF', target: 'e_p_nv', type: 'exponential-decrease', direct: true, explanation: 'Raising EF away from Ev empties fewer valence states as holes.' },

  { id: 'nnc-nni', source: 'e_n_nc', target: 'e_n_ni', type: 'rewrite', direct: true, explanation: 'Same Boltzmann electron count, measured from Ei instead of Ec.' },
  { id: 'pnv-pni', source: 'e_p_nv', target: 'e_p_ni', type: 'rewrite', direct: true, explanation: 'Same Boltzmann hole count, measured from Ei instead of Ev.' },
  { id: 'nni-n', source: 'e_n_ni', target: 'n', type: 'defines', direct: true, explanation: 'This is the working formula for n once EF and ni are known.' },
  { id: 'pni-p', source: 'e_p_ni', target: 'p', type: 'defines', direct: true, explanation: 'This is the working formula for p once EF and ni are known.' },
  { id: 'n-np', source: 'n', target: 'e_np', type: 'product', direct: true, explanation: 'One factor in the mass-action product.' },
  { id: 'p-np', source: 'p', target: 'e_np', type: 'product', direct: true, explanation: 'The other factor. Their product is pinned at ni².' },
  { id: 'nni-np', source: 'e_n_ni', target: 'e_np', type: 'multiply', direct: true, explanation: 'Multiply the two Boltzmann forms. The EF exponentials cancel.' },
  { id: 'pni-np', source: 'e_p_ni', target: 'e_np', type: 'multiply', direct: true, explanation: 'The partner exponential is the inverse of the electron one.' },

  { id: 'n-sigma', source: 'n', target: 'e_sigma', type: 'linear', direct: true, explanation: 'Mobile electrons conduct current.' },
  { id: 'p-sigma', source: 'p', target: 'e_sigma', type: 'linear', direct: true, explanation: 'Mobile holes conduct current.' },
  { id: 'mun-sigma', source: 'mun', target: 'e_sigma', type: 'linear', direct: true, explanation: 'Faster electrons mean more conductivity per electron.' },
  { id: 'mup-sigma', source: 'mup', target: 'e_sigma', type: 'linear', direct: true, explanation: 'Faster holes mean more conductivity per hole.' },
  { id: 'q-sigma', source: 'q', target: 'e_sigma', type: 'linear', direct: true, explanation: 'Each carrier carries charge q.' },
  { id: 'sigma-eq-s', source: 'e_sigma', target: 'sigma', type: 'defines', direct: true, explanation: 'This is the definition of σ.' },
  { id: 'sigma-rho', source: 'sigma', target: 'e_rho', type: 'inverse', direct: true, explanation: 'Resistivity is the inverse language of conductivity.' },
  { id: 'rho-eq', source: 'e_rho', target: 'rho', type: 'defines', direct: true, explanation: 'ρ = 1/σ.' },
  { id: 'sigma-je', source: 'sigma', target: 'e_je', type: 'ohms', direct: true, explanation: 'J = σE turns conductivity into current density.' },
  { id: 'vd-jn', source: 'e_vd', target: 'e_jn', type: 'current', direct: true, explanation: 'Electron current is charge × count × drift speed.' },
  { id: 'jn-sigma', source: 'e_jn', target: 'e_sigma', type: 'family', direct: true, explanation: 'Adding hole current and dividing by E produces σ.' },
  { id: 'jp-sigma', source: 'e_jp', target: 'e_sigma', type: 'family', direct: true, explanation: 'Holes add a parallel conduction channel.' },

  { id: 't-n-ind', source: 'T', target: 'n', type: 'indirect', direct: false, explanation: 'T changes ni and ionization, which then change n.' },
  { id: 't-sigma-ind', source: 'T', target: 'sigma', type: 'indirect', direct: false, explanation: 'T is not in σ = q(nμn+pμp), but it moves n, p, and the mobilities.' },
  { id: 'eg-sigma-ind', source: 'Eg', target: 'sigma', type: 'indirect', direct: false, explanation: 'Eg sets ni, which sets n and p, which set σ.' },
  { id: 'ef-sigma-ind', source: 'EF', target: 'sigma', type: 'indirect', direct: false, explanation: 'EF redistributes n and p. σ follows the majority channel.' },
  { id: 'ni-n', source: 'ni', target: 'e_n_ni', type: 'scale', direct: true, explanation: 'ni is the prefactor when EF is measured from Ei.' },
  { id: 'ni-p', source: 'ni', target: 'e_p_ni', type: 'scale', direct: true, explanation: 'Same prefactor for holes.' },
  { id: 'f-occ', source: 'e_f', target: 'occupancy', type: 'defines', direct: true, explanation: 'f(E) is the occupation probability, not a carrier count.' },
  { id: 'occ-n', source: 'occupancy', target: 'n', type: 'integral', direct: true, explanation: 'n is the integral of DOS(E) × f(E) over the conduction band.' },
  { id: 'gen-ni', source: 'generation', target: 'ni', type: 'thermal', direct: true, explanation: 'Thermal generation across the gap creates the intrinsic pairs.' },
];

export const CONCEPTS = {
  band: {
    id: 'band', name: 'BAND STRUCTURE', kind: 'concept',
    blurb: 'Ec, Ev, and Eg are properties of the crystal, not of doping.',
  },
  absorption: {
    id: 'absorption', name: 'ABSORPTION', kind: 'concept',
    blurb: 'A photon is absorbed only if it can pay at least Eg.',
  },
  occupancy: {
    id: 'occupancy', name: 'OCCUPANCY', kind: 'concept',
    blurb: 'f(E) is a probability for an available state. Multiply by the density of states to count carriers.',
  },
  doping: {
    id: 'doping', name: 'DOPING', kind: 'concept',
    blurb: 'NA and ND shift EF. They do not create carriers independently of mass action.',
  },
  generation: {
    id: 'generation', name: 'CARRIER GENERATION', kind: 'concept',
    blurb: 'Heat promotes electrons across Eg. That is why ni grows so violently with T.',
  },
  transport: {
    id: 'transport', name: 'TRANSPORT', kind: 'concept',
    blurb: 'Current is charge in motion. Count the carriers, then ask how easily each one drifts.',
  },
};

export function edgesFrom(id) {
  return EDGES.filter((e) => e.source === id);
}

export function edgesTo(id) {
  return EDGES.filter((e) => e.target === id);
}

export function neighborhood(id) {
  const ids = new Set([id]);
  for (const e of EDGES) {
    if (e.source === id) ids.add(e.target);
    if (e.target === id) ids.add(e.source);
  }
  return ids;
}
