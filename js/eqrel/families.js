/**
 * Equation families. These are one story told at different stages, not a pile of formulas.
 */
export const FAMILIES = {
  photon: {
    id: 'photon',
    name: 'Photon family',
    region: 'PHOTONS & BANDGAP',
    steps: [
      { id: 'e_cfl', note: 'A wave: crests per second times crest spacing is the speed of light.' },
      { id: 'e_hf', note: 'A photon is one quantum. Energy is proportional to frequency.' },
      { id: 'e_hc', note: 'Substitute f = c/λ. Energy is inverse to wavelength.' },
      { id: 'e_lg', note: 'The cheapest optical jump is Eg, so the longest absorbing λ is hc/Eg.' },
    ],
    punch: 'Color and absorption are the same energy-matching problem as the electrical gap.',
  },
  carrier: {
    id: 'carrier',
    name: 'Carrier statistics family',
    region: 'CARRIER STATISTICS',
    steps: [
      { id: 'e_n_nc', note: 'Electrons: effective DOS at Ec times the Boltzmann tail of f(E).' },
      { id: 'e_p_nv', note: 'Holes: effective DOS at Ev times the empty-state tail.' },
      { id: 'e_n_ni', note: 'Rewrite the electron count from the intrinsic reference Ei.' },
      { id: 'e_p_ni', note: 'The hole partner. Notice the exponent flipped sign.' },
      { id: 'e_np', note: 'Multiply. The EF pieces cancel. The product is only ni².' },
    ],
    punch: 'Four equations, one occupation story. Mass action is the leftover after the exponentials cancel.',
  },
  transport: {
    id: 'transport',
    name: 'Transport family',
    region: 'CONDUCTIVITY',
    steps: [
      { id: 'e_vd', note: 'A field adds a drift velocity vd = μE.' },
      { id: 'e_jn', note: 'Electron current: each of n electrons carries q at speed vd.' },
      { id: 'e_jp', note: 'Holes do the same with p and μp.' },
      { id: 'e_sigma', note: 'Add the two channels and divide by E. That ratio is σ.' },
      { id: 'e_je', note: 'Ohm’s local form: J = σE.' },
      { id: 'e_rho', note: 'The inverse sentence: E = ρJ, so ρ = 1/σ.' },
    ],
    punch: 'σ multiplies charge, population, and ease of motion, then adds the two carrier types.',
  },
  temperature: {
    id: 'temperature',
    name: 'Temperature family',
    region: 'TEMPERATURE',
    steps: [
      { id: 'T', note: 'T sets the energy scale kT.' },
      { id: 'e_f', note: 'kT smears Fermi–Dirac occupation around EF.' },
      { id: 'e_ni', note: 'The same kT controls how often a pair can cross Eg.' },
      { id: 'e_n_nd', note: 'Separately, T decides whether a dopant is ionized or frozen out.' },
      { id: 'e_sigma', note: 'Indirect: n, p, and mobilities all move, so σ moves even though T is not written in σ.' },
    ],
    punch: 'Temperature is one knob with three different jobs: occupation smear, pair generation, and ionization.',
  },
  bandgap: {
    id: 'bandgap',
    name: 'Bandgap family',
    region: 'BAND STRUCTURE',
    steps: [
      { id: 'Eg', note: 'One number, two lives.' },
      { id: 'e_lg', note: 'Optical: minimum photon energy, absorption edge, λg.' },
      { id: 'e_ni', note: 'Electrical: difficulty of thermal excitation, ni(T).' },
      { id: 'e_np', note: 'ni² then pins the equilibrium product np.' },
      { id: 'e_sigma', note: 'Those carriers, plus mobility, set how well the crystal conducts.' },
    ],
    punch: 'The same Eg paints the optical color story and the electrical carrier story.',
  },
  fermi: {
    id: 'fermi',
    name: 'Fermi-level family',
    region: 'DOPING & FERMI LEVEL',
    steps: [
      { id: 'doping', note: 'NA and ND shift the charge balance.' },
      { id: 'e_neut', note: 'Neutrality plus mass action place n and p.' },
      { id: 'EF', note: 'Those concentrations place EF relative to Ei.' },
      { id: 'e_f', note: 'The occupancy curve is centered on that EF.' },
      { id: 'e_n_ni', note: 'n grows exponentially as EF rises.' },
      { id: 'e_p_ni', note: 'p falls by the inverse exponential.' },
      { id: 'e_np', note: 'Watch n × p. At fixed T and material it does not move.' },
    ],
    punch: 'Drag EF and the bookkeeping becomes obvious: one carrier explodes, the other collapses, the product stays put.',
  },
};

export const REGIONS = [
  { id: 'photons', name: 'PHOTONS & BANDGAP', x: 400, y: 24, w: 540, h: 230 },
  { id: 'bands', name: 'BAND STRUCTURE', x: 24, y: 24, w: 360, h: 230 },
  { id: 'fermi', name: 'FERMI–DIRAC STATISTICS', x: 960, y: 24, w: 696, h: 230 },
  { id: 'doping', name: 'DOPING & FERMI LEVEL', x: 24, y: 270, w: 360, h: 390 },
  { id: 'carriers', name: 'CARRIER STATISTICS', x: 400, y: 270, w: 610, h: 390 },
  { id: 'temp', name: 'TEMPERATURE', x: 1026, y: 270, w: 630, h: 280 },
  { id: 'transport', name: 'CONDUCTIVITY', x: 200, y: 676, w: 1280, h: 280 },
];
