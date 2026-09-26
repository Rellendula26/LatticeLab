/**
 * Exam 1 coverage matrix.
 * COMPLETE requires learn + visualize + conceptual practice, not just a displayed formula.
 */

export const STATUS = { complete: 'COMPLETE', partial: 'PARTIAL', missing: 'MISSING' };

export const COVERAGE = [
  // —— HW1 ——
  {
    id: 'hw1-q1-sc', source: 'HW1 Q1 · simple cubic',
    status: 'COMPLETE', existing: 'Homework unit-cell lab (SC + fractional cuts).',
    need: 'Ownership story is live. Missing: “more atoms/cell ≠ always denser” contrast and a conceptual check.',
    learn: 'latticelab_homeworks.html?hw=hw1#cell', viz: 'latticelab_homeworks.html?hw=hw1#cell', practice: 'exam1.html?mode=mastery&concept=crystal',
  },
  {
    id: 'hw1-q1-bcc', source: 'HW1 Q1 · BCC',
    status: 'COMPLETE', existing: 'Unit-cell lab, body atom owned 1.',
    need: 'Same density misconception; practice ranking N vs a.',
    learn: 'latticelab_homeworks.html?hw=hw1#cell', viz: 'latticelab_homeworks.html?hw=hw1#cell', practice: 'exam1.html?mode=mastery&concept=crystal',
  },
  {
    id: 'hw1-q1-fcc', source: 'HW1 Q1 · FCC',
    status: 'COMPLETE', existing: 'Unit-cell lab, face atoms 1/2.',
    need: 'Conceptual check that 6×½ + 8×⅛ = 4.',
    learn: 'latticelab_homeworks.html?hw=hw1#cell', viz: 'latticelab_homeworks.html?hw=hw1#cell', practice: 'exam1.html?mode=mastery&concept=crystal',
  },
  {
    id: 'hw1-q1-diamond', source: 'HW1 Q1 · diamond cubic',
    status: 'COMPLETE', existing: 'Two FCC + 4 internals = 8. Bonds drawn.',
    need: 'Why Si density uses N=8 and a, not “diamond looks packed.”',
    learn: 'latticelab_homeworks.html?hw=hw1#cell', viz: 'latticelab_homeworks.html?hw=hw1#cell', practice: 'exam1.html?mode=mastery&concept=crystal',
  },
  {
    id: 'hw1-q1-share', source: 'HW1 Q1 · fractional ownership',
    status: 'COMPLETE', existing: 'Fractional-cut mode + hover tips.',
    need: 'Predict-before-reveal: guess N before toggling cuts.',
    learn: 'latticelab_homeworks.html?hw=hw1#cell', viz: 'latticelab_homeworks.html?hw=hw1#cell', practice: 'exam1.html?mode=mastery&concept=crystal',
  },
  {
    id: 'hw1-q1-n-a', source: 'HW1 Q1 · N, a, Vcell, atomic density',
    status: 'COMPLETE', existing: 'Si calculator: n = N/a³ with live a.',
    need: 'Explicit “N↑ does not imply ρ↑ if a also grew.”',
    learn: 'latticelab_homeworks.html?hw=hw1#ek', viz: 'latticelab_homeworks.html?hw=hw1#ek', practice: 'exam1.html?mode=mastery&concept=crystal',
  },
  {
    id: 'hw1-q2-planes', source: 'HW1 Q2 · planes (hkl)',
    status: 'COMPLETE', existing: '3D Miller sketcher, reciprocal intercepts.',
    need: 'Negative-index plane presets and “0 means parallel.”',
    learn: 'latticelab_homeworks.html?hw=hw1#miller', viz: 'latticelab_homeworks.html?hw=hw1#miller', practice: 'exam1.html?mode=mastery&concept=miller',
  },
  {
    id: 'hw1-q2-dirs', source: 'HW1 Q2 · directions [uvw]',
    status: 'COMPLETE', existing: 'Sketcher shifts negative tails; [01-2] preset.',
    need: 'Barred-index language and drawing practice.',
    learn: 'latticelab_homeworks.html?hw=hw1#miller', viz: 'latticelab_homeworks.html?hw=hw1#miller', practice: 'exam1.html?mode=mastery&concept=miller',
  },
  {
    id: 'hw1-q2-zero-neg', source: 'HW1 Q2 · zero and negative indices',
    status: 'COMPLETE', existing: 'Notes in MillerMath.planeInCell / directionInCell.',
    need: 'Forced conceptual questions before the picture.',
    learn: 'latticelab_homeworks.html?hw=hw1#miller', viz: 'latticelab_homeworks.html?hw=hw1#miller', practice: 'exam1.html?mode=mastery&concept=miller',
  },
  {
    id: 'hw1-q3-density', source: 'HW1 Q3 · Si atomic density',
    status: 'COMPLETE', existing: 'Live a → Vcell → n.',
    need: 'Mass-density trap (N vs molar mass vs a).',
    learn: 'latticelab_homeworks.html?hw=hw1#ek', viz: 'latticelab_homeworks.html?hw=hw1#ek', practice: 'exam1.html?mode=mastery&concept=crystal',
  },
  {
    id: 'hw1-q4-ek', source: 'HW1 Q4 · Si vs GaAs, photon/phonon',
    status: 'COMPLETE', existing: 'Split E–k, Excite button, conservation copy.',
    need: 'Predict vertical vs phonon-assisted before animation.',
    learn: 'latticelab_homeworks.html?hw=hw1#ek', viz: 'latticelab_homeworks.html?hw=hw1#ek', practice: 'exam1.html?mode=mastery&concept=band',
  },
  {
    id: 'hw1-q5-fd', source: 'HW1 Q5 · Fermi–Dirac',
    status: 'COMPLETE', existing: 'f(E) vs E, T slider 0–800 K, doping EF slide.',
    need: 'Labeled 0 K / 300 K / 500 K compare and “f is not a count.”',
    learn: 'latticelab_homeworks.html?hw=hw1#fermi', viz: 'latticelab_homeworks.html?hw=hw1#fermi', practice: 'exam1.html?mode=mastery&concept=fermi',
  },

  // —— HW2 ——
  {
    id: 'hw2-q1a', source: 'HW2 Q1a · α(λ), Eg = 1.9 eV',
    status: 'COMPLETE', existing: 'Optical viz + λg = 1240/Eg.',
    need: 'Predict edge move before the curve draws.',
    learn: 'latticelab_homeworks.html?hw=hw2&q=q1a', viz: 'latticelab_homeworks.html?hw=hw2&q=q1a', practice: 'exam1.html?mode=mastery&concept=photon',
  },
  {
    id: 'hw2-q1b', source: 'HW2 Q1b · white light, 1.9 eV vs InAs',
    status: 'COMPLETE', existing: 'Transmitted leftover color model.',
    need: 'You-see-the-unabsorbed conceptual check.',
    learn: 'latticelab_homeworks.html?hw=hw2&q=q1b', viz: 'latticelab_homeworks.html?hw=hw2&q=q1b', practice: 'exam1.html?mode=mastery&concept=photon',
  },
  {
    id: 'hw2-q1c', source: 'HW2 Q1c · CdS/CdSe + 750/635/470 nm',
    status: 'COMPLETE', existing: 'Per-pair absorb/emit, λemit = 1240/Eg.',
    need: 'Absorption λ ≠ emission λ forced as a trap.',
    learn: 'latticelab_homeworks.html?hw=hw2&q=q1c', viz: 'latticelab_homeworks.html?hw=hw2&q=q1c', practice: 'exam1.html?mode=mastery&concept=photon',
  },
  {
    id: 'hw2-q2a', source: 'HW2 Q2a · p-type dopant in InP',
    status: 'COMPLETE', existing: 'Impurity band diagram, 3kT rule.',
    need: 'Move the level through the gap: donor / acceptor / trap.',
    learn: 'latticelab_homeworks.html?hw=hw2&q=q2a', viz: 'latticelab_homeworks.html?hw=hw2&q=q2a', practice: 'exam1.html?mode=mastery&concept=doping',
  },
  {
    id: 'hw2-q2bi', source: 'HW2 Q2b(i) · CdS impurity 300 K vs 400 K',
    status: 'COMPLETE', existing: 'EI ≈ 90 meV vs 3kT window.',
    need: 'Temperature changes the ruler, not the level’s identity.',
    learn: 'latticelab_homeworks.html?hw=hw2&q=q2bi', viz: 'latticelab_homeworks.html?hw=hw2&q=q2bi', practice: 'exam1.html?mode=mastery&concept=doping',
  },
  {
    id: 'hw2-q2bii', source: 'HW2 Q2b(ii) · why CdS brightens',
    status: 'COMPLETE', existing: 'Ionization → holes → recombination.',
    need: 'Block “hotter is always brighter.”',
    learn: 'latticelab_homeworks.html?hw=hw2&q=q2bii', viz: 'latticelab_homeworks.html?hw=hw2&q=q2bii', practice: 'exam1.html?mode=mastery&concept=doping',
  },
  {
    id: 'hw2-q3', source: 'HW2 Q3(i–iv) · n, p, σ presets',
    status: 'COMPLETE', existing: 'Carriers viz for Si/GaAs doping cases.',
    need: 'Unified state + compensation + “NA ≪ ni is intrinsic.”',
    learn: 'latticelab_homeworks.html?hw=hw2&q=q3i', viz: 'latticelab_homeworks.html?hw=hw2&q=q3i', practice: 'exam1.html?mode=mastery&concept=carriers',
  },
  {
    id: 'hw2-q4', source: 'HW2 Q4(i–v) · band + f(E)',
    status: 'COMPLETE', existing: 'Fermi viz including T = 0 freeze.',
    need: 'EF is not where electrons sit; f is probability.',
    learn: 'latticelab_homeworks.html?hw=hw2&q=q4i', viz: 'latticelab_homeworks.html?hw=hw2&q=q4i', practice: 'exam1.html?mode=mastery&concept=fermi',
  },
  {
    id: 'hw2-q5a', source: 'HW2 Q5a · intrinsic Si vs T',
    status: 'COMPLETE', existing: 'Linearized ni slope −Eg/2k.',
    need: 'Predict slope sign before the line.',
    learn: 'latticelab_homeworks.html?hw=hw2&q=q5a', viz: 'latticelab_homeworks.html?hw=hw2&q=q5a', practice: 'exam1.html?mode=mastery&concept=temperature',
  },
  {
    id: 'hw2-q5b', source: 'HW2 Q5b · n-Si three regimes',
    status: 'COMPLETE', existing: 'Freeze-out / extrinsic / intrinsic curve.',
    need: 'Why the plateau is flat (n pinned to ND).',
    learn: 'latticelab_homeworks.html?hw=hw2&q=q5b', viz: 'latticelab_homeworks.html?hw=hw2&q=q5b', practice: 'exam1.html?mode=mastery&concept=temperature',
  },
  {
    id: 'hw2-q5c', source: 'HW2 Q5c · GaAs vs Si',
    status: 'COMPLETE', existing: 'Overlay, larger Eg delays intrinsic.',
    need: 'Smaller Eg → intrinsic earlier, as a ranking item.',
    learn: 'latticelab_homeworks.html?hw=hw2&q=q5c', viz: 'latticelab_homeworks.html?hw=hw2&q=q5c', practice: 'exam1.html?mode=mastery&concept=temperature',
  },
  {
    id: 'hw2-q5d', source: 'HW2 Q5d · Tmax Ge vs Si',
    status: 'COMPLETE', existing: '10% majority spec, Ge fails first.',
    need: 'Device still exists; doping no longer owns n,p.',
    learn: 'latticelab_homeworks.html?hw=hw2&q=q5d', viz: 'latticelab_homeworks.html?hw=hw2&q=q5d', practice: 'exam1.html?mode=mastery&concept=temperature',
  },

  // —— Equation sheet ——
  {
    id: 'eq-hf', source: 'Sheet · E = hν = hc/λ',
    status: 'COMPLETE', existing: 'EqRel e_hf, e_hc, e_lg.',
    need: 'Full 10-field mastery card + predict λg vs Eg.',
    learn: 'exam1.html?mode=sheet&eq=e_hc', viz: 'eqrel.html', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-fd', source: 'Sheet · Fermi–Dirac f(E)',
    status: 'COMPLETE', existing: 'EqRel e_f + HW1 Fermi viz.',
    need: 'T = 0 step vs smear; f(EF)=1/2.',
    learn: 'exam1.html?mode=sheet&eq=e_f', viz: 'latticelab_homeworks.html?hw=hw1#fermi', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-n', source: 'Sheet · n from NC, Ec, EF and from ni, Ei',
    status: 'COMPLETE', existing: 'EqRel e_n_nc, e_n_ni.',
    need: 'NC formula card; degenerate warning.',
    learn: 'exam1.html?mode=sheet&eq=e_n_ni', viz: 'eqrel.html', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-p', source: 'Sheet · p from NV, Ev, EF and from ni, Ei',
    status: 'COMPLETE', existing: 'EqRel e_p_nv, e_p_ni.',
    need: 'NV formula card.',
    learn: 'exam1.html?mode=sheet&eq=e_p_ni', viz: 'eqrel.html', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-np', source: 'Sheet · ni² = np',
    status: 'COMPLETE', existing: 'EqRel e_np with hold-constant.',
    need: 'Breaks under injection.',
    learn: 'exam1.html?mode=sheet&eq=e_np', viz: 'eqrel.html', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-ni', source: 'Sheet · ni(T), NC, NV',
    status: 'COMPLETE', existing: 'EqRel e_ni. NC/NV formulas not first-class.',
    need: 'NC, NV T^{3/2} cards.',
    learn: 'exam1.html?mode=sheet&eq=e_ni', viz: 'eqrel.html', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-j', source: 'Sheet · J = σE, vd = μE',
    status: 'COMPLETE', existing: 'EqRel e_je, e_vd, e_jn, e_jp.',
    need: 'R = ρL/A card (geometry).',
    learn: 'exam1.html?mode=sheet&eq=e_je', viz: 'eqrel.html', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-sigma', source: 'Sheet · σ = 1/ρ = q(μn n + μp p)',
    status: 'COMPLETE', existing: 'EqRel e_sigma, e_rho.',
    need: 'μ is not n. Heating can raise or lower σ.',
    learn: 'exam1.html?mode=sheet&eq=e_sigma', viz: 'eqrel.html', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-r', source: 'Sheet · R = ρL/A',
    status: 'COMPLETE', existing: 'Not in EqRel.',
    need: 'New mastery card and a length/area ranking question.',
    learn: 'exam1.html?mode=sheet&eq=e_r', viz: 'exam1.html?mode=sheet&eq=e_r', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-mu', source: 'Sheet · μ = qτ/m*',
    status: 'COMPLETE', existing: 'Mentioned in EqRel e_vd story only.',
    need: 'First-class card: scattering time vs effective mass.',
    learn: 'exam1.html?mode=sheet&eq=e_mu', viz: 'index.html', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-poisson', source: 'Sheet · dE/dx = ρ/(εs ε0), E = −dV/dx',
    status: 'COMPLETE', existing: 'PN lab plots ρ, E, V but no mastery card.',
    need: 'Integral story: ρ → E triangle → V parabola.',
    learn: 'exam1.html?mode=sheet&eq=e_poisson', viz: 'pn_lab.html?mode=lab', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-spacecharge', source: 'Sheet · ρ = q(p − n + ND+ − NA−)',
    status: 'COMPLETE', existing: 'EqRel neutrality is the bulk algebraic cousin.',
    need: 'Depletion: p≈n≈0 so ρ ≈ q(ND+ − NA−).',
    learn: 'exam1.html?mode=sheet&eq=e_rhoq', viz: 'pn_lab.html?mode=lab', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-pn', source: 'Sheet · Vbi, xn, xp, W, Shockley',
    status: 'COMPLETE', existing: 'PN lab + story mode. Not in EqRel registry.',
    need: 'Mastery cards + bias causal chain.',
    learn: 'exam1.html?mode=sheet&eq=e_vbi', viz: 'pn_lab.html?mode=lab', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-beer', source: 'Sheet · I = I0 e^{−αx} and ΔI',
    status: 'COMPLETE', existing: 'α(λ) in HW2 optical viz, not Beer’s law.',
    need: 'Exponential, not linear. Double α does not halve I.',
    learn: 'exam1.html?mode=sheet&eq=e_beer', viz: 'latticelab_homeworks.html?hw=hw2&q=q1a', practice: 'exam1.html?mode=challenge',
  },
  {
    id: 'eq-table', source: 'Sheet · constants, material table, crystal labels',
    status: 'COMPLETE', existing: 'HW2 materials.js; catalog labs.',
    need: 'Table as a readable sheet + ranking by Eg, ni, gap type.',
    learn: 'exam1.html?mode=sheet&eq=e_table', viz: 'exam1.html?mode=sheet&eq=e_table', practice: 'exam1.html?mode=challenge',
  },
];

export function coverageByStatus() {
  const out = { COMPLETE: 0, PARTIAL: 0, MISSING: 0 };
  COVERAGE.forEach((row) => { out[row.status] = (out[row.status] || 0) + 1; });
  return out;
}
