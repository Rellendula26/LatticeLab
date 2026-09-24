import { material } from './materials.js';
import {
  lambdaG, ePhoton, absorbs, wavelengthColor, colorMixTransmitted,
  niOf, carriers, dopingKind, majorityWhy, sigmaOf, efMinusEi, bandEdges,
  threeKT, impurityRole, nVsT, findTmax, sci, sciHtml, niLimit10pct,
} from './physics.js';

export const TREE = [
  {
    id: 'q1', title: 'Question 1', blurb: 'Optical absorption & emission',
    kids: [
      { id: 'q1a', label: 'Q1a' },
      { id: 'q1b', label: 'Q1b' },
      { id: 'q1c', label: 'Q1c' },
    ],
  },
  {
    id: 'q2', title: 'Question 2', blurb: 'Dopants, traps & ionization',
    kids: [
      { id: 'q2a', label: 'Q2a' },
      { id: 'q2bi', label: 'Q2b(i)' },
      { id: 'q2bii', label: 'Q2b(ii)' },
    ],
  },
  {
    id: 'q3', title: 'Question 3', blurb: 'Carrier concentration & conductivity',
    kids: [
      { id: 'q3i', label: 'Q3(i)' },
      { id: 'q3ii', label: 'Q3(ii)' },
      { id: 'q3iii', label: 'Q3(iii)' },
      { id: 'q3iv', label: 'Q3(iv)' },
    ],
  },
  {
    id: 'q4', title: 'Question 4', blurb: 'Band diagrams & Fermi–Dirac',
    kids: [
      { id: 'q4i', label: 'Q4(i)' },
      { id: 'q4ii', label: 'Q4(ii)' },
      { id: 'q4iii', label: 'Q4(iii)' },
      { id: 'q4iv', label: 'Q4(iv)' },
      { id: 'q4v', label: 'Q4(v)' },
    ],
  },
  {
    id: 'q5', title: 'Question 5', blurb: 'Temperature dependence',
    kids: [
      { id: 'q5a', label: 'Q5a' },
      { id: 'q5b', label: 'Q5b' },
      { id: 'q5c', label: 'Q5c' },
      { id: 'q5d', label: 'Q5d' },
    ],
  },
];

function q3(id, label, matId, NA, ND, T) {
  const m = material(matId);
  const ni = niOf(m, T);
  const { n, p } = carriers(NA, ND, ni);
  const kind = dopingKind(NA, ND, ni);
  const why = majorityWhy(NA, ND, ni);
  const sig = sigmaOf(n, p, m.mun, m.mup);
  const dEi = efMinusEi(n, ni, T);
  const atEi = Math.abs(dEi) < 0.008;
  const edges = bandEdges(m.Eg);
  const EF = edges.Ei + dEi;
  return {
    id, q: label, title: `${label} · ${m.name}`, viz: 'carriers',
    given: [
      `${m.name}, T = ${T} K`,
      `NA = ${sciHtml(NA)} cm<sup>−3</sup>`,
      `ND = ${sciHtml(ND)} cm<sup>−3</sup>`,
      `ni = ${sciHtml(m.ni300)} cm<sup>−3</sup> (given at 300 K; used as stated)`,
      `μn = ${m.mun} cm<sup>2</sup>/V·s, μp = ${m.mup} cm<sup>2</sup>/V·s`,
    ],
    find: ['E–k diagram with EC, EV, EF, Ei', 'n and p', 'σ in S·cm<sup>−1</sup>'],
    params: { matId, NA, ND, T },
    steps: [
      { t: 'Compare NA, ND, ni', hint: 'Which number actually sets the majority?' },
      { t: 'Name the type', hint: kind },
      { t: 'Majority, then np = ni²', hint: why },
      { t: 'σ = q(n μn + p μp)', hint: `Electrons ${sciHtml(sig.elec)} + holes ${sciHtml(sig.hole)}` },
    ],
    intuition: why,
    calcLines() {
      return [
        `Type: ${kind}`,
        `n = ${sciHtml(n)} cm<sup>−3</sup>`,
        `p = ${sciHtml(p)} cm<sup>−3</sup>`,
        `σ<sub>n</sub> = ${sciHtml(sig.elec)} S/cm, σ<sub>p</sub> = ${sciHtml(sig.hole)} S/cm`,
        `σ = ${sciHtml(sig.total)} S·cm<sup>−1</sup>`,
        `EF − Ei = ${atEi ? '≈ 0' : `${dEi.toFixed(3)} eV`}`,
        `${m.name} is ${m.gap}.`,
      ];
    },
    answer: {
      numbers: `n = ${sciHtml(n)} cm<sup>−3</sup>, p = ${sciHtml(p)} cm<sup>−3</sup>, σ = ${sciHtml(sig.total)} S·cm<sup>−1</sup>. ${kind}. EF is ${atEi ? 'at Ei' : `${dEi >= 0 ? 'above' : 'below'} Ei by ${Math.abs(dEi).toFixed(3)} eV`}.`,
      diagram: `${m.gap} E–k. Mark Ec, Ev, Ei at midgap, EF ${atEi ? 'on Ei' : (dEi >= 0 ? 'up toward Ec' : 'down toward Ev')}.`,
      prose: `${why} Then σ = q(nμn + pμp). ${m.name} is ${m.gap}, so the conduction-band minimum sits ${m.gap === 'direct' ? 'at the same k as the valence maximum' : 'off Γ'}.`,
    },
  };
}

function q4(id, label, matId, NA, ND, T) {
  const m = material(matId);
  const ni = T <= 0.5 ? 0 : niOf(m, T);
  const edges = bandEdges(m.Eg);
  let kind, EF, note, n, p;
  if (T <= 0.5) {
    kind = ND > NA ? 'n-type at 0 K (frozen)' : NA > ND ? 'p-type at 0 K (frozen)' : 'intrinsic at 0 K';
    EF = ND > NA ? edges.Ec - m.ED : NA > ND ? edges.Ev + m.EA : edges.Ei;
    n = 0;
    p = 0;
    note = 'T = 0 K. Do not use n ≈ ND. Donors are not thermally ionized. Mobile band populations are empty. f(E) is a step. EF sits at the impurity level (here the donor, slightly below Ec).';
  } else {
    ({ n, p } = carriers(NA, ND, ni));
    kind = dopingKind(NA, ND, ni);
    const dEi = efMinusEi(n, ni, T);
    EF = edges.Ei + dEi;
    note = majorityWhy(NA, ND, ni);
  }
  return {
    id, q: label, title: `${label} · ${m.name} at ${T} K`, viz: 'fermi',
    given: [
      `${m.name}`,
      `NA = ${sciHtml(NA)} cm<sup>−3</sup>`,
      `ND = ${sciHtml(ND)} cm<sup>−3</sup>`,
      `T = ${T} K`,
      T > 0.5 ? `ni(${m.id}) = ${sciHtml(m.ni300)} cm<sup>−3</sup> at 300 K` : 'T = 0 K: no thermal generation',
    ],
    find: ['E–k / band diagram: EC, EV, Ei, EF', 'Fermi–Dirac f(E) on the same energy axis'],
    params: { matId, NA, ND, T, EF0: EF },
    steps: [
      { t: 'Type?', hint: kind },
      { t: 'Where is EF relative to Ei?', hint: T <= 0.5 ? 'At the donor level, not at Ei.' : (EF >= edges.Ei ? 'Above Ei (more electrons).' : 'Below Ei (more holes).') },
      { t: 'What does T do to f(E)?', hint: T <= 0.5 ? 'A perfect step. f(EF)=1/2 still, but there is no smear.' : 'The step smears symmetrically about EF. f(EF)=1/2 always.' },
    ],
    intuition: note,
    calcLines() {
      return [
        kind,
        T <= 0.5 ? 'n ≈ 0, p ≈ 0 in the bands' : `n = ${sciHtml(n)} cm<sup>−3</sup>, p = ${sciHtml(p)} cm<sup>−3</sup>`,
        `EF = ${EF.toFixed(3)} eV (Ev = 0, Ec = ${m.Eg} eV)`,
        `f(EF) = 1/2`,
        note,
      ];
    },
    answer: {
      numbers: T <= 0.5
        ? `T = 0 K. EF at the donor, Ec − ${m.ED} eV. f(E) is a step. No mobile n or p.`
        : `${kind}. EF − Ei = ${(EF - edges.Ei).toFixed(3)} eV. f(EF)=1/2.`,
      diagram: 'Same energy scale: bands on the left, f(E) on the right. Horizontal line from EF to f=0.5.',
      prose: note + ' f(E) is an occupancy probability for an available state, not a count of electrons.',
    },
  };
}

const LASERS = [750, 635, 470];

function laserRow(matId, lam) {
  const m = material(matId);
  const Eph = ePhoton(lam);
  const on = absorbs(m.Eg, lam);
  const le = lambdaG(m.Eg);
  const col = wavelengthColor(le);
  return {
    laser: lam, Eph, absorbed: on, emit: on, lemit: on ? le : null, color: on ? col.name : 'none',
  };
}

export const QUESTIONS = {
  q1a: {
    id: 'q1a', q: 'Q1a', title: 'Absorption coefficient vs wavelength', viz: 'optical',
    params: { kind: 'alpha', Eg: 1.9 },
    given: ['Direct-gap semiconductor', 'Eg = 1.9 eV', 'Room temperature'],
    find: ['Sketch α(λ)', 'Mark λg = hc/Eg'],
    steps: [
      { t: 'Compute λg', hint: 'λg = 1240 / 1.9 = 653 nm' },
      { t: 'Which side absorbs?', hint: 'λ < λg means Ephoton > Eg.' },
      { t: 'Why is the onset sharp?', hint: 'Direct gap: no phonon required, so α rises steeply.' },
    ],
    intuition: 'A photon is absorbed only if it can pay Eg. Wavelength is just the energy written backwards: E = 1240/λ.',
    calcLines() {
      const lg = lambdaG(1.9);
      return [
        `λg = 1240 / 1.9 = ${lg.toFixed(0)} nm`,
        `E(700 nm) = ${(1240 / 700).toFixed(2)} eV < 1.9 eV → transparent`,
        `E(500 nm) = ${(1240 / 500).toFixed(2)} eV > 1.9 eV → absorbed`,
      ];
    },
    answer: {
      numbers: `λg = 653 nm. α = 0 for λ > 653 nm. α rises sharply for λ < 653 nm.`,
      diagram: 'α vertical, λ horizontal. Vertical mark at 653 nm. Zero to the right, steep climb to the left.',
      prose: 'Direct gap: once Ephoton exceeds Eg the valence electron can go vertically in k-space. Below Eg there is no final state, so α stays ~0.',
    },
  },
  q1b: {
    id: 'q1b', q: 'Q1b', title: 'White light on 1.9 eV vs InAs', viz: 'optical',
    params: { kind: 'white', EgA: 1.9, matB: 'InAs' },
    given: ['Same white light (~380–750 nm)', 'Sample A: Eg = 1.9 eV, direct', 'Sample B: InAs', 'No reflection, no emission'],
    find: ['What you see through each wafer', 'Why, from λ → E → Eg'],
    steps: [
      { t: 'λg for 1.9 eV', hint: '653 nm, in the red' },
      { t: 'λg for InAs', hint: `${lambdaG(material('InAs').Eg).toFixed(0)} nm, far infrared` },
      { t: 'What leaves the wafer?', hint: 'Only wavelengths that were not absorbed.' },
    ],
    intuition: 'You see the transmitted leftover, not the absorbed part. The homework forbids reflection and emission, so color is only “what was not eaten.”',
    calcLines() {
      const a = colorMixTransmitted(1.9);
      const b = colorMixTransmitted(material('InAs').Eg);
      return [
        `1.9 eV: λg = 653 nm. Visible λ < 653 nm absorbed. Leftover is deep red.`,
        `Observed A: ${a.name}`,
        `InAs: Eg = 0.36 eV, λg = ${lambdaG(0.36).toFixed(0)} nm. Every visible photon has E ≫ Eg.`,
        `Observed B: ${b.name}`,
      ];
    },
    answer: {
      numbers: `1.9 eV wafer: deep red transmitted (λ ≳ 653 nm). InAs: no visible transmission (black / opaque).`,
      diagram: 'Visible bar. Mark 653 nm on the first. Mark λg of InAs far off-scale to the infrared. Shade absorbed vs leftover.',
      prose: 'White light is every visible λ. Each λ is a photon energy. Keep it only if E < Eg. 1.9 eV cuts the spectrum in the red, so the leftover looks red. InAs’s gap is 0.36 eV, so the entire visible band is absorbed and nothing visible comes through.',
    },
  },
  q1c: {
    id: 'q1c', q: 'Q1c', title: 'CdS / CdSe + three lasers', viz: 'optical',
    params: { kind: 'lasers', mats: ['CdS', 'CdSe'], lasers: LASERS },
    given: ['Lasers: 750 nm, 635 nm, 470 nm', 'Wafers: CdS and CdSe', 'Emission, if any, is near-band-edge'],
    find: ['For each pair: absorbed? emitted? λemit and color'],
    steps: [
      { t: 'Convert each laser to eV', hint: 'E = 1240/λ' },
      { t: 'Compare to Eg', hint: `CdS ${material('CdS').Eg} eV, CdSe ${material('CdSe').Eg} eV` },
      { t: 'If absorbed, what comes out?', hint: 'The electron relaxes to the band edge. λemit = 1240/Eg, not λlaser.' },
    ],
    intuition: 'The input wavelength is the ticket in. The output wavelength is the gap. Extra energy is dumped as heat on the way down to Ec.',
    calcLines() {
      const lines = [];
      ['CdS', 'CdSe'].forEach((id) => {
        LASERS.forEach((lam) => {
          const r = laserRow(id, lam);
          lines.push(`${id} · ${lam} nm: E=${r.Eph.toFixed(2)} eV, ${r.absorbed ? 'absorbed' : 'transmitted'}, emit ${r.emit ? `${r.lemit.toFixed(0)} nm (${r.color})` : 'none'}`);
        });
      });
      return lines;
    },
    answer: {
      numbers: [
        'CdS (Eg=2.42 eV, λemit=512 nm, green): 750 no, 635 no, 470 yes → 512 nm green.',
        'CdSe (Eg=1.74 eV, λemit=713 nm, red): 750 no (1.65 < 1.74), 635 yes → 713 nm red, 470 yes → 713 nm red.',
      ].join(' '),
      diagram: 'For each absorbed case: VB→CB, relax to Ec, then photon of 1240/Eg.',
      prose: 'Absorption needs Ephoton ≥ Eg. Emission, after thermalization, is set by the gap. A 470 nm laser on CdSe is blue going in and red coming out.',
    },
  },
  q2a: {
    id: 'q2a', q: 'Q2a', title: 'p-type dopant in InP', viz: 'dopants',
    params: { kind: 'inp', matId: 'InP', T: 300 },
    given: ['InP at 300 K', 'Need an effective p-type dopant', 'Course rule: ionized if EI ≤ 3kT'],
    find: ['Band diagram: EC, EV, Ei, impurity, EI', 'What happens to EF'],
    steps: [
      { t: 'What is p-type, microscopically?', hint: 'A hole in the valence band. Not a mobile plus-charge you poured in.' },
      { t: 'Where must the level sit?', hint: `Within 3kT = ${(threeKT(300) * 1000).toFixed(0)} meV of EV.` },
      { t: 'EF?', hint: 'Acceptors pull EF down toward EV.' },
    ],
    intuition: 'An acceptor wants an electron. It takes one from the valence band and leaves a mobile hole behind.',
    calcLines() {
      const m = material('InP');
      return [
        `Eg(InP) = ${m.Eg} eV, Ei at midgap = ${(m.Eg / 2).toFixed(3)} eV`,
        `3kT(300 K) = ${(threeKT(300) * 1000).toFixed(1)} meV`,
        `Place EI = Eimp − EV ≲ 78 meV`,
        'EF moves down toward EV',
      ];
    },
    answer: {
      numbers: 'Acceptor within ≈ 78 meV of EV. EI = Eimp − EV. EF drops toward EV.',
      diagram: 'Ec, Ei, Ev. Short acceptor dash just above Ev. Arrow EI. EF below Ei.',
      prose: 'p-type doping does not add mobile positive particles. It creates holes in the valence band. The impurity must be close enough to Ev that 300 K can ionize it. That pulls EF down.',
    },
  },
  q2bi: {
    id: 'q2bi', q: 'Q2b(i)', title: 'CdS impurity at 300 K vs 400 K', viz: 'dopants',
    params: { kind: 'cds-split', matId: 'CdS', EI: 0.090, Tlo: 300, Thi: 400 },
    given: ['CdS emissive layer', 'Impurity near the valence band', 'Fully ionized only if EI ≤ 3kT', '300 K: dim. 400 K: much brighter'],
    find: ['Band diagram with EI', 'Donor, acceptor, or trap at each T'],
    steps: [
      { t: '3kT at 300 K', hint: `${(threeKT(300) * 1000).toFixed(1)} meV` },
      { t: '3kT at 400 K', hint: `${(threeKT(400) * 1000).toFixed(1)} meV` },
      { t: 'Is EI inside the window?', hint: 'The homework story needs EI between those two numbers.' },
    ],
    intuition: 'Near Ev means acceptor-like if it ionizes, trap if it does not. Temperature only changes the 3kT ruler.',
    calcLines() {
      const EI = 0.090;
      return [
        `Place EI ≈ 90 meV above EV so the two temperatures disagree.`,
        `300 K: 3kT = ${(threeKT(300) * 1000).toFixed(1)} meV < 90 meV → trap (not ionized)`,
        `400 K: 3kT = ${(threeKT(400) * 1000).toFixed(1)} meV > 90 meV → acceptor (ionized)`,
      ];
    },
    answer: {
      numbers: 'At 300 K: trap. At 400 K: acceptor. EI ≈ 90 meV above EV is a placement that matches the brightness change.',
      diagram: 'Same CdS gap twice. Bracket of height 3kT from Ev. Impurity inside the 400 K bracket, outside the 300 K bracket.',
      prose: 'The level is near Ev, so it is acceptor-shaped. At 300 K it sits outside 3kT and holds charge (trap). At 400 K the thermal window covers it and it ionizes as an acceptor.',
    },
  },
  q2bii: {
    id: 'q2bii', q: 'Q2b(ii)', title: 'Why the CdS device brightens', viz: 'dopants',
    params: { kind: 'cds-bright', matId: 'CdS', EI: 0.090, Tlo: 300, Thi: 400 },
    given: ['Same impurity as Q2b(i)', 'Emission needs electrons and holes meeting'],
    find: ['Why brightness jumps from 300 K to 400 K'],
    steps: [
      { t: 'What changes at 400 K?', hint: 'The impurity ionizes. Mobile holes appear.' },
      { t: 'Why more light?', hint: 'More holes × leftover electrons = more recombination.' },
    ],
    intuition: 'Light is recombination. Recombination needs both carrier types. Ionizing an acceptor supplies holes that were locked on the impurity at 300 K.',
    calcLines() {
      return [
        '300 K: impurity is a trap. Few mobile holes. Weak emission.',
        '400 K: impurity is an ionized acceptor. Holes free. Emission rises.',
      ];
    },
    answer: {
      numbers: 'Brighter at 400 K because the near-Ev impurity ionizes and supplies mobile holes.',
      diagram: '300 K: filled trap, dim photon. 400 K: hole in VB, electron in CB, bright photon ≈ Eg.',
      prose: 'At 300 K the level is a trap: it parks charge and does not feed the bands. At 400 K it ionizes. Those extra holes raise the recombination rate, so the CdS layer emits more.',
    },
  },
  q3i: q3('q3i', 'Q3(i)', 'Si', 10, 0, 300),
  q3ii: q3('q3ii', 'Q3(ii)', 'Si', 1e16, 1000, 300),
  q3iii: q3('q3iii', 'Q3(iii)', 'Si', 1e16, 1e5, 300),
  q3iv: q3('q3iv', 'Q3(iv)', 'GaAs', 1e11, 0, 300),
  q4i: q4('q4i', 'Q4(i)', 'Si', 0, 1e8, 0),
  q4ii: q4('q4ii', 'Q4(ii)', 'Si', 1e17, 0, 300),
  q4iii: q4('q4iii', 'Q4(iii)', 'Si', 1e17, 1e8, 450),
  q4iv: q4('q4iv', 'Q4(iv)', 'InAs', 1e17, 1e12, 300),
  q4v: q4('q4v', 'Q4(v)', 'Ge', 1e10, 0, 450),
  q5a: {
    id: 'q5a', q: 'Q5a', title: 'Intrinsic Si vs temperature', viz: 'temp',
    params: { kind: 'intrinsic', matId: 'Si' },
    given: ['Intrinsic Si', 'ni ∝ T^{3/2} exp(−Eg / 2kT)'],
    find: ['Linearized plot of electron density vs T', 'Slope of the intrinsic line'],
    steps: [
      { t: 'What is being linearized?', hint: 'ln(ni / T^{3/2}) vs 1/T is a straight line.' },
      { t: 'What is the slope?', hint: '−Eg / (2k) = −1.12 / (2 × 8.617e−5) K' },
    ],
    intuition: 'The exponential in 1/T dominates. The T^{3/2} prefactor only bends the curve a little, which is why we divide it out.',
    calcLines() {
      const slope = -material('Si').Eg / (2 * 8.617333262145e-5);
      return [
        `Slope of ln(ni/T^{3/2}) vs 1/T is −Eg/(2k) = ${slope.toFixed(0)} K`,
        `At 300 K, ni = 1×10<sup>10</sup> cm<sup>−3</sup>`,
      ];
    },
    answer: {
      numbers: `Linearized slope = −Eg/(2k) ≈ −6500 K. Vertical: ln(n/T^{3/2}). Horizontal: 1/T (or 1000/T).`,
      diagram: 'Straight line, negative slope, labeled −Eg/(2k).',
      prose: 'Intrinsic electrons come from breaking bonds across Eg. Half the gap sits in the exponent, so the linearized slope is −Eg/(2k), not −Eg/k.',
    },
  },
  q5b: {
    id: 'q5b', q: 'Q5b', title: 'n-doped Si, ND = 10^{17} cm^{−3}', viz: 'temp',
    params: { kind: 'doped', matId: 'Si', ND: 1e17 },
    given: ['Si', 'ND = 1×10<sup>17</sup> cm<sup>−3</sup>', 'Same axes idea as Q5a'],
    find: ['Three regimes', 'Why the middle is flat', 'Intrinsic-regime slope'],
    steps: [
      { t: 'Freeze-out', hint: 'Electrons still bound to donors.' },
      { t: 'Extrinsic', hint: 'Donors ionized. n ≈ ND. Horizontal line.' },
      { t: 'Intrinsic', hint: 'ni(T) overtakes ND. Slope returns to −Eg/(2k).' },
    ],
    intuition: 'The plateau is not “temperature stopped mattering.” It is n pinned to a fixed number of donors.',
    calcLines() {
      const pts = [80, 200, 300, 500, 800].map((T) => {
        const r = nVsT('Si', 1e17, T);
        return `${T} K: n ≈ ${sciHtml(r.n)} (${r.regime})`;
      });
      return pts;
    },
    answer: {
      numbers: 'Freeze-out (low T), extrinsic plateau at n = 10^{17} cm^{−3}, then intrinsic with slope −Eg/(2k).',
      diagram: 'ln n vs 1/T. Shade three bands. Horizontal ND line through the middle.',
      prose: 'Once every donor has given up its electron, raising T does not create more doping electrons. n stays ≈ ND until ni(T) grows past ND and pair generation takes over.',
    },
  },
  q5c: {
    id: 'q5c', q: 'Q5c', title: 'n-doped GaAs vs Si', viz: 'temp',
    params: { kind: 'compare', matId: 'GaAs', otherId: 'Si', ND: 1e17 },
    given: ['GaAs, ND = 1×10<sup>17</sup> cm<sup>−3</sup>', 'Compare with the Si curve from Q5b'],
    find: ['Three GaAs regimes', 'Why they do not line up with Si'],
    steps: [
      { t: 'Which gap is larger?', hint: 'GaAs 1.42 eV vs Si 1.12 eV' },
      { t: 'What does a larger Eg do to ni(T)?', hint: 'exp(−Eg/2kT) is smaller. Intrinsic takeover needs more heat.' },
    ],
    intuition: 'Same ND. Different bond strength. The intrinsic takeover is a generation problem, not a doping problem.',
    calcLines() {
      return [
        `Eg(Si)=1.12 eV, Eg(GaAs)=1.42 eV`,
        `ni(300 K): Si 1e10, GaAs 1e6 — GaAs starts much further below ND`,
        'GaAs stays extrinsic to a higher T because breaking its gap is harder.',
      ];
    },
    answer: {
      numbers: 'Same three regimes. GaAs intrinsic onset is at higher T. Intrinsic slope is steeper (−1.42/2k vs −1.12/2k).',
      diagram: 'Overlay Si and GaAs. Same ND line. GaAs leaves the plateau later.',
      prose: 'ND is identical, so the plateau height matches. ni ∝ exp(−Eg/2kT). GaAs has the larger gap, so thermal pair generation stays small until a higher T. The curves split because of Eg, not because GaAs “likes” doping more.',
    },
  },
  q5d: {
    id: 'q5d', q: 'Q5d', title: 'Maximum operating temperature', viz: 'temp',
    params: { kind: 'tmax', NA: 1e17, ND: 1e17 },
    given: [
      'Ge device: p-side NA = 10<sup>17</sup> cm<sup>−3</sup>, n-side ND = 10<sup>17</sup> cm<sup>−3</sup>',
      'Need p within 10% of NA and n within 10% of ND',
      'Then switch the crystal to Si',
    ],
    find: ['Tmax for Ge in K and °C', 'Tmax for Si'],
    steps: [
      { t: 'When does p leave the 10% band?', hint: 'p = NA/2 + sqrt((NA/2)² + ni²). Set p = 1.1 NA → ni = NA√0.11.' },
      { t: 'Ge vs Si', hint: 'Ge’s smaller Eg grows ni much faster.' },
    ],
    intuition: 'The junction still exists. The doping no longer owns n and p. Intrinsic pairs swamp the designed concentrations.',
    calcLines() {
      const tGe = findTmax('Ge', 1e17);
      const tSi = findTmax('Si', 1e17);
      return [
        `ni must stay ≤ ${sciHtml(niLimit10pct(1e17))} cm<sup>−3</sup>`,
        `Ge Tmax = ${tGe.toFixed(0)} K = ${(tGe - 273).toFixed(0)} °C`,
        `Si Tmax = ${tSi.toFixed(0)} K = ${(tSi - 273).toFixed(0)} °C`,
      ];
    },
    answer: (() => {
      const tGe = findTmax('Ge', 1e17);
      const tSi = findTmax('Si', 1e17);
      return {
        numbers: `Ge: ${tGe.toFixed(0)} K (${(tGe - 273).toFixed(0)} °C). Si: ${tSi.toFixed(0)} K (${(tSi - 273).toFixed(0)} °C).`,
        diagram: 'P | junction | N. Gauges for p vs NA and n vs ND. Mark Tmax on the slider.',
        prose: 'p and n rise above the doping as ni(T) grows. The 10% spec fails when ni ≈ 0.332 NA. Ge’s 0.66 eV gap hits that ni at a much lower T than Si’s 1.12 eV gap.',
      };
    })(),
  },
};

export function question(id) {
  return QUESTIONS[id];
}

export { laserRow, LASERS };
