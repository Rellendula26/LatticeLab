/**
 * Written-response bank. Cues are synonym clusters, not required wording.
 */

function cue(...all) {
  return { all };
}

function near(...all) {
  return { all, near: 36 };
}

function concept(id, pts, label, missing, cues, extra = {}) {
  return { id, pts, label, missing, cues, ...extra };
}

function trap(id, label, cues, extra = {}) {
  return { id, label, cues, ...extra };
}

function W(row) {
  return {
    type: 'written-response',
    equation: row.equation || '',
    intuition: row.intuition || row.model,
    why: row.model,
    ...row,
  };
}

export const WRITTEN = [
  W({
    id: 'w-sc-own', cat: 'crystal', level: 3, kind: 'explain',
    prompt: 'A simple-cubic conventional cell shows eight corner spheres. Explain, without counting spheres as whole atoms, how many atoms this cell actually owns and why.',
    rubric: {
      concepts: [
        concept('share', 3, 'Each corner is shared by eight cells', 'Did not say a corner atom is shared by 8 neighboring cells', [cue('shared', '8'), cue('share', 'eight'), cue('1/8'), cue('one eighth')]),
        concept('n', 3, 'The cell owns 1 atom', 'Did not conclude N = 1', [cue('owns', '1'), cue('n', '1'), cue('one atom'), cue('equals 1')]),
        concept('why', 2, 'Ownership, not visual count, is the rule', 'Did not contrast seeing 8 spheres with owning 1', [cue('own'), cue('ownership'), cue('effective'), cue('not count')]),
      ],
      misconceptions: [
        trap('eight', 'Your answer treats the eight visible spheres as eight owned atoms.', [cue('owns', '8'), cue('eight atoms')], { unless: [cue('not', '8'), cue('not eight')], fix: 'The picture shows 8 corners. This cell owns 1/8 of each.' }),
      ],
    },
    model: 'Each corner atom is shared by eight conventional cells, so this cell owns 1/8 of each corner. Eight corners give N = 1. Counting spheres you can see is not ownership.',
    hw: 'HW1 Q1', module: 'latticelab_homeworks.html?hw=hw1#cell',
    followup: {
      ifMissing: ['why'],
      prompt: 'You have the fraction. Why does “more atoms per cell” still not guarantee a larger mass density?',
      rubric: {
        concepts: [
          concept('a3', 5, 'Density uses N and a³ (and mass)', 'Need N × mass / a³. A larger cell can cancel a larger N.', [cue('a'), cue('volume'), cue('density'), cue('mass')]),
        ],
        misconceptions: [],
      },
    },
  }),

  W({
    id: 'w-n-not-rho', cat: 'crystal', level: 4, kind: 'debug',
    prompt: 'A student says: “Diamond cubic has N = 8 and FCC has N = 4, so diamond is always twice as dense.” Explain whether this is correct and why.',
    rubric: {
      concepts: [
        concept('false', 2, 'The claim is false', 'Need to reject the claim', [cue('false'), cue('incorrect'), cue('wrong'), cue('not')]),
        concept('formula', 4, 'Mass density depends on N, atomic mass, and a³', 'Did not write density as N × mass / a³', [cue('a'), cue('volume'), cue('mass'), cue('density')]),
        concept('a-wins', 2, 'A larger conventional cell can cancel a larger N', 'Did not say a can outweigh N', [cue('larger', 'a'), cue('bigger', 'cell'), cue('cancel'), cue('lattice')]),
      ],
      misconceptions: [
        trap('n-is-rho', 'You treated N as density by itself.', [cue('always denser'), cue('twice as dense', 'true')], { fix: 'N is a count. Density still needs mass and cell volume.' }),
      ],
    },
    model: 'False. Mass density is (N × atomic mass) / (N_A × a³). Diamond Si has N = 8, but a is 5.43 Å. A larger N in a larger cube is not automatically denser than FCC aluminum.',
    hw: 'HW1 Q1, Q3', module: 'latticelab_homeworks.html?hw=hw1#ek',
  }),

  W({
    id: 'w-miller0', cat: 'miller', level: 3, kind: 'explain',
    prompt: 'A plane is parallel to the z-axis. What must l be in (hkl), and explain the reciprocal-intercept reason. What does a negative index mean geometrically?',
    rubric: {
      concepts: [
        concept('l0', 3, 'l = 0 because the z intercept is at infinity', 'Need l = 0 from 1/∞', [cue('l', '0'), cue('zero'), cue('infinity'), cue('never hits')]),
        concept('parallel', 2, 'Index 0 means parallel to that axis, not hitting the origin', 'Did not say 0 means parallel', [cue('parallel'), cue('does not intersect'), cue('never hits')]),
        concept('neg', 3, 'A barred index is a negative intercept, not a negative size', 'Need the geometric meaning of a negative index', [cue('negative', 'intercept'), cue('other side'), cue('opposite'), cue('bar')]),
      ],
      misconceptions: [
        trap('origin', 'You treated index 0 as “the plane hits the origin.”', [cue('hits', 'origin'), cue('intersects', 'zero')], { unless: [cue('not', 'origin')], fix: '0 is 1/∞. The plane never meets that axis.' }),
        trap('size', 'You treated a negative index as a negative size.', [cue('negative', 'size'), cue('smaller')], { fix: 'Negative means the intercept is on the opposite side of the origin.' }),
      ],
    },
    model: 'Parallel to z means the z intercept is at infinity, so l = 1/∞ = 0. A negative index is a negative intercept: the plane (or direction) cuts the axis on the other side of the origin. It is not a negative length.',
    hw: 'HW1 Q2', module: 'latticelab_homeworks.html?hw=hw1#miller',
  }),

  W({
    id: 'w-dir-vs-plane', cat: 'miller', level: 2, kind: 'compare',
    prompt: 'Compare what (hkl) specifies with what [uvw] specifies. Why can a direction have a negative component even when the arrow is drawn inside the conventional cell?',
    rubric: {
      concepts: [
        concept('plane', 3, '(hkl) is a plane from reciprocal intercepts', 'Need planes from intercepts', [cue('plane'), cue('intercept')]),
        concept('dir', 3, '[uvw] is a direction, a vector in the lattice', 'Need directions as vectors', [cue('direction'), cue('vector'), cue('arrow')]),
        concept('shift', 2, 'A negative component shifts the tail so the arrow still fits in the box', 'Need the tail-shift picture', [cue('shift'), cue('tail'), cue('translate'), cue('inside')]),
      ],
      misconceptions: [],
    },
    model: '(hkl) names a plane by reciprocal intercepts. [uvw] names a direction, a lattice vector. A negative w just points −z; we slide the tail by one lattice step so the whole arrow stays inside the conventional cell. The direction did not become [uvw] with the sign flipped.',
    hw: 'HW1 Q2', module: 'latticelab_homeworks.html?hw=hw1#miller',
  }),

  W({
    id: 'w-ek', cat: 'band', level: 3, kind: 'explain',
    prompt: 'On an E–k diagram, what do the vertical and horizontal axes mean? Why is an optical transition drawn almost vertically, and why does Si still need a phonon?',
    rubric: {
      concepts: [
        concept('e', 2, 'Vertical axis is electron energy of a Bloch state', 'Need energy, not height in the chip', [cue('energy'), cue('vertical')]),
        concept('k', 2, 'Horizontal axis is crystal momentum k, not position', 'Need k as crystal momentum', [cue('k'), cue('momentum'), cue('not position')]),
        concept('vert', 3, 'A photon carries energy but almost no crystal momentum', 'Need why the photon is vertical', [cue('photon', 'momentum'), cue('vertical'), cue('tiny', 'k')]),
        concept('si', 3, 'Si is indirect: leftover Δk comes from a phonon', 'Need phonon-assisted Δk in Si', [cue('phonon'), cue('indirect'), cue('x')]),
      ],
      misconceptions: [
        trap('height', 'You treated the top of E–k as physically higher in the crystal.', [cue('higher', 'crystal'), cue('up', 'chip')], { fix: 'E is energy of a state. k is not a street address.' }),
      ],
    },
    model: 'Vertical is energy of a Bloch state. Horizontal is crystal momentum k, not x in the chip. A visible photon pays ΔE but barely changes k, so the arrow is nearly vertical. Si’s CB minimum is near X, so a phonon supplies the leftover Δk. Indirect emission is inefficient, not forbidden by a brick wall.',
    hw: 'HW1 Q4', module: 'latticelab_homeworks.html?hw=hw1#ek',
  }),

  W({
    id: 'w-direct', cat: 'band', level: 2, kind: 'compare',
    prompt: 'Compare a direct gap (GaAs) with an indirect gap (Si). What must be the same, and what is allowed to differ, for a photon-only transition?',
    rubric: {
      concepts: [
        concept('samek', 4, 'Direct: CB min and VB max at the same k (Γ)', 'Need same-k definition', [cue('same', 'k'), cue('gamma'), cue('direct')]),
        concept('si', 3, 'Indirect: extrema at different k, phonon required', 'Need different-k plus phonon', [cue('different', 'k'), cue('phonon'), cue('indirect')]),
        concept('photon', 1, 'The photon is still nearly vertical in both', 'Note the photon itself stays vertical', [cue('vertical'), cue('photon')]),
      ],
      misconceptions: [
        trap('noabs', 'You said an indirect semiconductor cannot absorb light.', [cue('cannot absorb'), cue('no absorption')], { fix: 'Si absorbs with phonon help. α just rises more slowly.' }),
      ],
    },
    model: 'Direct means the CB minimum and VB maximum sit at the same k, usually Γ. A photon can do the whole job. Indirect means those extrema sit at different k. The photon is still vertical; a phonon finishes Δk. Si can absorb. It is just worse at it, and worse at emitting.',
    hw: 'HW1 Q4', module: 'latticelab_homeworks.html?hw=hw1#ek',
  }),

  W({
    id: 'w-mstar', cat: 'band', level: 4, kind: 'explain',
    prompt: 'Explain what effective mass is. How does band curvature set m*, and why do conduction and valence bands typically curve in opposite directions on a teaching E–k sketch?',
    rubric: {
      concepts: [
        concept('resp', 3, 'm* is how the crystal makes a carrier respond to force, not a new rest mass', 'Need response, not a new particle mass', [cue('mstar'), cue('response'), cue('curvature'), cue('accelerate')]),
        concept('curve', 3, 'Sharper curvature means lighter m*', 'Need 1/m* ∝ d²E/dk²', [cue('sharp'), cue('light'), cue('curvature'), cue('second')]),
        concept('opp', 2, 'VB curvature is opposite because a hole is a missing electron; the empty-state branch bends the other way', 'Need why VB curves opposite', [cue('opposite'), cue('hole'), cue('valence')]),
      ],
      misconceptions: [
        trap('rest', 'You treated m* as the electron gaining or losing rest mass.', [cue('rest mass'), cue('heavier electron')], { fix: 'The electron’s rest mass is unchanged. m* absorbs the lattice response.' }),
      ],
    },
    model: 'm* = ħ² / (d²E/dk²). A sharp bend is a light carrier: easy to accelerate, usually higher mobility. The electron rest mass is still m_e. Teaching sketches draw the VB upside-down because a hole is an empty valence state; that branch’s curvature has the opposite sign.',
    hw: 'HW1 Q4 / Core Lab', module: 'index.html',
  }),

  W({
    id: 'w-fd-meaning', cat: 'fermi', level: 3, kind: 'explain',
    prompt: 'What does f(E) physically represent? Why is f(EF) = 1/2 for any T > 0, and why is that not “half an electron sitting at EF”?',
    rubric: {
      concepts: [
        concept('prob', 4, 'f(E) is occupation probability of a state, not a count', 'Need probability, not a particle count', [cue('probability'), cue('occupancy'), cue('chance'), cue('not count')]),
        concept('half', 3, 'At E = EF the exponential is 1, so f = 1/2', 'Need the algebra or the pivot', [cue('1/2'), cue('half'), cue('ef')]),
        concept('not-half-e', 2, 'Number of electrons is DOS × f, not f itself', 'Need DOS × f', [cue('dos'), cue('states'), cue('not half an electron')]),
      ],
      misconceptions: [
        trap('half-e', 'You treated f = 1/2 as half an electron existing at EF.', [cue('half an electron'), cue('half electron')], { fix: 'f is a probability. Count = available states × f.' }),
        trap('avg', 'You treated EF as the average electron energy.', [near('average', 'energy')], { fix: 'EF centers the occupancy curve. Most electrons still sit in the valence band.' }),
      ],
    },
    model: 'f(E) is the chance a state at energy E is occupied. Plug E = EF: the exponential is 1, so f = 1/2 at every T > 0. That is a definition check. Electrons are DOS × f. EF is not where electrons “live,” and f = 1/2 is not half a particle.',
    hw: 'HW1 Q5', module: 'latticelab_homeworks.html?hw=hw1#fermi',
    followup: {
      ifMissing: ['not-half-e'],
      prompt: 'You have f = 1/2. Why does raising T at fixed EF increase the number of electrons above EF without moving the pivot?',
      rubric: {
        concepts: [
          concept('smear', 5, 'Heat smears the step about the same 1/2 pivot', 'Need smearing, not a sliding pivot', [cue('smear'), cue('broaden'), cue('kt'), cue('tail')]),
        ],
        misconceptions: [],
      },
    },
  }),

  W({
    id: 'w-fd-t', cat: 'fermi', level: 4, kind: 'predict',
    prompt: 'Temperature increases from 0 K to 500 K at fixed EF. Predict how the f(E) curve changes, and distinguish that change from a change in carrier concentration.',
    rubric: {
      concepts: [
        concept('step', 2, 'T = 0 is a step: 1 below EF, 0 above', 'Need the T = 0 step', [cue('step'), cue('0 k'), cue('absolute zero')]),
        concept('smear', 3, 'Warming smears the drop over a few kT; pivot stays 1/2', 'Need smear about a fixed pivot', [cue('smear'), cue('broaden'), cue('1/2'), cue('kt')]),
        concept('not-n', 3, 'f is not n. Carriers also need DOS and where EF sits relative to the bands', 'Need f vs concentration', [cue('not', 'conc'), cue('dos'), cue('not n')]),
      ],
      misconceptions: [
        trap('slide', 'You had the whole curve slide up in energy.', [cue('slides up'), cue('moves up')], { fix: 'At fixed EF the pivot stays. The step smears; it does not levitate.' }),
      ],
    },
    model: 'T = 0 is a step. Warming smears it symmetrically about EF. f(EF) stays 1/2. That smear changes occupation tails, but n and p still need the density of states and where EF sits versus Ec and Ev. f is not a concentration.',
    hw: 'HW1 Q5', module: 'latticelab_homeworks.html?hw=hw1#fermi',
  }),

  W({
    id: 'w-ni-0k', cat: 'temperature', level: 2, kind: 'why',
    prompt: 'Why is the intrinsic carrier concentration essentially zero at 0 K?',
    rubric: {
      concepts: [
        concept('no-kt', 4, 'No thermal energy to create pairs across Eg', 'Need “no kT to cross the gap”', [cue('no', 'kt'), cue('no thermal'), cue('cannot cross'), cue('0 k')]),
        concept('pairs', 3, 'ni counts thermally generated electron-hole pairs', 'Need what ni is', [cue('ehpair'), cue('pair'), cue('ni')]),
        concept('exp', 1, 'ni ~ exp(−Eg/2kT) collapses as T → 0', 'The exponential freeze is the math', [cue('exp'), cue('exponential'), cue('eg')]),
      ],
      misconceptions: [
        trap('dopants', 'You blamed missing dopants. Intrinsic means no dopants by definition.', [cue('no dopants'), cue('no nd')], { fix: 'Intrinsic already has ND = NA = 0. The issue is no heat to make pairs.' }),
      ],
    },
    model: 'ni is the density of thermally generated electron-hole pairs. At 0 K there is no kT to pay Eg, so the exponential exp(−Eg/2kT) is zero. Empty of pairs is not the same as “no dopants.”',
    hw: 'HW2 Q5', module: 'latticelab_homeworks.html?hw=hw2&q=q5a',
  }),

  W({
    id: 'w-ni-t', cat: 'temperature', level: 3, kind: 'why',
    prompt: 'Why does increasing temperature increase intrinsic carrier concentration? Trace the mechanism, including holes.',
    rubric: {
      concepts: [
        concept('kt', 2, 'Thermal energy kT increases', 'Need kT rising', [cue('kt'), cue('thermal')]),
        concept('cross', 2, 'Electrons can cross Eg', 'Need crossing the gap', [cue('cross'), cue('eg'), cue('gap')]),
        concept('cb', 2, 'Those electrons occupy the conduction band', 'Need electrons in CB', [cue('cb'), cue('conduction')]),
        concept('vb', 2, 'Holes are left in the valence band', 'Need holes created at the same time', [cue('hole'), cue('vb')]),
        concept('pair', 2, 'This is electron-hole pair generation', 'Name pair generation', [cue('ehpair'), cue('pair'), cue('generation')]),
      ],
      misconceptions: [
        trap('e-only', 'You generated electrons without holes.', [cue('only electrons')], { fix: 'Leaving the VB empty is the hole. Pairs come together.' }),
      ],
    },
    model: 'Heat raises kT. More electrons can pay Eg and enter the conduction band. Each one leaves a hole in the valence band. That pair generation is ni(T). The exponential exp(−Eg/2kT) is the steep part; T^{3/2} from NC NV is the slow prefactor.',
    hw: 'HW2 Q5a', module: 'latticelab_homeworks.html?hw=hw2&q=q5a',
  }),

  W({
    id: 'w-donor', cat: 'doping', level: 3, kind: 'mechanism',
    prompt: 'Explain why donor doping increases the number of conduction electrons. Trace from the impurity level to a mobile carrier. What stays behind?',
    rubric: {
      concepts: [
        concept('level', 2, 'Donor introduces a level near the conduction band', 'Need a donor level near Ec', [cue('near', 'cb'), cue('close', 'cb'), cue('shallow')]),
        concept('extra', 2, 'The donor contributes an extra electron (column-V story)', 'Need the extra electron', [cue('extra', 'electron'), cue('additional', 'electron'), cue('one more')]),
        concept('small', 2, 'Only a small energy (within ~3kT when ionized) is required', 'Need small ionization energy', [cue('small'), cue('kt'), cue('ionize'), cue('little')]),
        concept('mobile', 2, 'That electron enters the CB and becomes mobile', 'Need mobile CB electron', [cue('cb'), cue('mobile'), cue('conduction')]),
        concept('fixed', 2, 'The ionized donor stays fixed in the lattice', 'Need the ion left behind, immobile', [cue('fixed'), cue('immobile'), cue('lattice'), cue('cannot move')]),
      ],
      misconceptions: [
        trap('pair', 'You had the donor create an electron-hole pair.', [cue('ehpair'), near('creates', 'hole')], { fix: 'A donor adds an electron. It does not generate a pair the way heat does.' }),
        trap('mobile-ion', 'Your wording lets the donor atom itself move.', [near('donor', 'moves'), near('donor atom', 'mobile')], { unless: [cue('not', 'move'), cue('fixed')], fix: 'The ion is nailed to a lattice site. Only the donated electron moves.' }),
      ],
    },
    model: 'A substitutional donor (e.g. P on a Si site) has an extra valence electron and a level just below Ec. At device T, if EI is within ~3kT of Ec, that electron ionizes into the CB and becomes mobile. The positive donor ion stays fixed. You did not create a hole pair, and the impurity is not a carrier.',
    hw: 'HW2 Q2, Q4', module: 'latticelab_homeworks.html?hw=hw2&q=q2a',
    followup: {
      ifMissing: ['fixed'],
      prompt: 'You ionized the donor. Why does that positive ion not contribute to current the way the electron does?',
      rubric: {
        concepts: [
          concept('fixed2', 5, 'It is locked on a lattice site, so it cannot drift', 'Need immobile ion vs mobile electron', [cue('fixed'), cue('lattice'), cue('cannot'), cue('immobile')]),
        ],
        misconceptions: [],
      },
    },
  }),

  W({
    id: 'w-acceptor', cat: 'doping', level: 3, kind: 'mechanism',
    prompt: 'Trace what happens when an acceptor in silicon ionizes. Why does this raise p, and why is the acceptor ion not a hole?',
    rubric: {
      concepts: [
        concept('near-v', 2, 'Acceptor level sits near Ev', 'Need near Ev', [cue('near', 'vb'), cue('close', 'vb'), cue('shallow')]),
        concept('steal', 3, 'It accepts a valence electron and leaves a hole', 'Need the stolen VB electron', [cue('accept'), cue('hole'), cue('vb')]),
        concept('fixed', 3, 'The negative acceptor ion stays fixed', 'Need immobile ion', [cue('fixed'), cue('immobile'), cue('lattice')]),
      ],
      misconceptions: [
        trap('ion-is-hole', 'You treated the acceptor atom as the mobile hole.', [near('acceptor', 'moves'), near('ion is', 'hole')], { unless: [cue('not')], fix: 'The hole is the empty VB state. The ion is furniture.' }),
      ],
    },
    model: 'An acceptor (B on a Si site) has a level just above Ev. A valence electron falls into that level, leaving a mobile hole in the VB. The negatively charged acceptor stays on its lattice site. p rises; the ion is not the hole.',
    hw: 'HW2 Q2a', module: 'latticelab_homeworks.html?hw=hw2&q=q2a',
  }),

  W({
    id: 'w-3kt', cat: 'doping', level: 4, kind: 'why',
    prompt: 'The course treats a dopant as ionized when its ionization energy is within about 3kT of the relevant band edge. Why can raising T from 300 K to 400 K turn an ineffective CdS impurity (EI ≈ 90 meV) into an electrically active one, and why is “hotter is brighter” the wrong slogan?',
    rubric: {
      concepts: [
        concept('ruler', 3, '3kT is a thermal ruler that grows with T; the level did not move', 'Need the ruler vs the level', [cue('3kt'), cue('kt'), cue('ruler')]),
        concept('90', 3, '90 meV sits outside ~78 meV at 300 K and inside ~103 meV at 400 K', 'Need the 78 vs 103 comparison', [cue('90'), cue('78'), cue('400'), cue('ionize')]),
        concept('bright', 2, 'Brightness rose because ionization unlocked carriers and recombination, not because heat always makes crystals glow', 'Need the CdS path, not a slogan', [cue('ionize'), cue('recombination'), cue('not always')]),
      ],
      misconceptions: [
        trap('hot', 'You used “hotter is always brighter.”', [cue('always brighter'), cue('always glow')], { fix: 'In many devices heat kills efficiency. Here the new physics is ionization.' }),
      ],
    },
    model: 'EI stayed ~90 meV. 3kT grew from ~78 meV to ~103 meV, so the same near-Ev level became an effective acceptor. More holes, more recombination, more light in this homework story. Heat is not a universal brightness knob.',
    hw: 'HW2 Q2b', module: 'latticelab_homeworks.html?hw=hw2&q=q2bi',
  }),

  W({
    id: 'w-site', cat: 'doping', level: 5, kind: 'explain',
    prompt: 'Silicon in GaAs is amphoteric. Explain why the lattice site a dopant occupies can decide whether it behaves as a donor or an acceptor.',
    rubric: {
      concepts: [
        concept('amp', 3, 'Amphoteric: the same atom can donate or accept depending on site', 'Need site-dependent role', [cue('site'), cue('amphoteric'), cue('depends')]),
        concept('ga', 3, 'On a Ga site Si has an extra electron → donor', 'Need Si_Ga donor', [cue('ga'), cue('donor')]),
        concept('as', 3, 'On an As site Si is electron-deficient → acceptor', 'Need Si_As acceptor', [cue('as'), cue('acceptor')]),
      ],
      misconceptions: [
        trap('element', 'You treated the element’s column as destiny regardless of site.', [cue('always donor')], { fix: 'In a compound, the host atom you replace sets the valence bookkeeping.' }),
      ],
    },
    model: 'GaAs is a compound. Si on a Ga site has one extra valence electron and acts as a donor. Si on an As site is short an electron and acts as an acceptor. The atom is the same. The site writes the charge story. That is why “dopant = column V” is incomplete in III–V crystals.',
    hw: 'Exam 1 sheet / doping', module: 'latticelab_homeworks.html?hw=hw2&q=q2a',
  }),

  W({
    id: 'w-ef-np', cat: 'carriers', level: 4, kind: 'predict',
    prompt: 'EF moves closer to Ec at fixed T. Without calculating, predict what happens to n and to p, and explain using both the carrier equations and Fermi–Dirac occupation. Why can n and p not both rise?',
    rubric: {
      concepts: [
        concept('nup', 3, 'n rises because the CB tail of f(E) fattens', 'Need n up', [cue('n', 'increase'), cue('n', 'rise'), cue('more electrons')]),
        concept('pdown', 3, 'p falls so that np stays ni²', 'Need p down via mass action', [cue('p', 'fall'), cue('p', 'decrease'), cue('massaction'), cue('ni')]),
        concept('fd', 2, 'EF closer to Ec means more occupation above Ec', 'Need the f(E) picture', [cue('occupancy'), cue('fd'), cue('ef')]),
      ],
      misconceptions: [
        trap('both', 'You raised n and p together.', [cue('both rise'), cue('n and p increase')], { fix: 'Equilibrium doping redistributes. Heat makes pairs. Doping does not.' }),
      ],
    },
    model: 'n = ni exp((EF−Ei)/kT) grows as EF approaches Ec. p = ni²/n falls. On the f(E) plot, more of the CB is occupied and more of the VB is filled, so holes vanish. One EF cannot raise both at equilibrium.',
    hw: 'HW2 Q3, Q4', module: 'eqrel.html',
  }),

  W({
    id: 'w-np-mass', cat: 'carriers', level: 3, kind: 'why',
    prompt: 'Why does np = ni² at equilibrium? When does that statement become illegal, and what is wrong with writing n = ND and p = NA in the same crystal?',
    rubric: {
      concepts: [
        concept('one-ef', 3, 'One EF makes the n and p Boltzmann tails multiply to ni²', 'Need one Fermi level', [cue('one', 'ef'), cue('product'), cue('massaction')]),
        concept('inject', 3, 'Under light or forward bias you need two quasi-Fermi levels; np exceeds ni²', 'Need the injection break', [cue('quasi'), cue('injection'), cue('bias'), cue('light')]),
        concept('one-maj', 2, 'n ≈ ND and p ≈ NA describe opposite crystals', 'Need one majority', [cue('one', 'majority'), cue('opposite'), cue('not both')]),
      ],
      misconceptions: [],
    },
    model: 'In equilibrium there is one EF. The electron and hole Boltzmann factors multiply and EF cancels, leaving ni². Injection splits Fn and Fp, so np > ni². n ≈ ND is an n-type shortcut. p ≈ NA is a p-type shortcut. They are not a pair of facts about one sample.',
    hw: 'HW2 Q3', module: 'latticelab_homeworks.html?hw=hw2&q=q3ii',
  }),

  W({
    id: 'w-comp', cat: 'doping', level: 4, kind: 'predict',
    prompt: 'A silicon sample has ND = 1×10¹⁶ cm⁻³ and NA = 1×10¹⁵ cm⁻³ at 300 K. Predict the type, the majority, and what happens to the leftover dopants. When would “ND > NA ⇒ n-type” stop being enough?',
    rubric: {
      concepts: [
        concept('n', 3, 'Net n-type; n ≈ ND − NA', 'Need compensation leftover', [cue('ntype'), cue('nd', 'na'), cue('leftover'), cue('net')]),
        concept('comp', 3, 'Acceptors compensate some donors; they cancel in pairs', 'Need compensation language', [cue('compensat'), cue('cancel')]),
        concept('ni', 2, 'The shortcut fails when |ND−NA| is not ≫ ni, or at high T when ni grows', 'Need when intrinsic wins', [cue('ni'), cue('intrinsic'), cue('high', 't')]),
      ],
      misconceptions: [
        trap('both-on', 'You kept n = ND and p = NA together.', [cue('n = nd', 'p = na')], { fix: 'Compensation leaves one leftover majority. Then mass action.' }),
      ],
    },
    model: 'ND > NA and both beat ni, so the crystal is n-type with n ≈ 9×10¹⁵ cm⁻³. Acceptors eat an equal number of donor electrons. The shortcut dies when |ND−NA| is not large compared with ni, including when heating drives the sample intrinsic.',
    hw: 'HW2 Q3', module: 'latticelab_homeworks.html?hw=hw2&q=q3i',
  }),

  W({
    id: 'w-sigma', cat: 'transport', level: 3, kind: 'explain',
    prompt: 'Write σ = q(μn n + μp p) in words. Two samples have the same n and p; sample A has twice the electron mobility. Which conducts better, and what mistake treats mobility as concentration?',
    rubric: {
      concepts: [
        concept('two', 3, 'Two fluids: electrons contribute q n μn, holes q p μp', 'Need both terms', [cue('electron'), cue('hole'), cue('mu')]),
        concept('a', 3, 'Sample A has larger σ because μn doubled at fixed n', 'Need A wins', [cue('a'), cue('larger'), cue('double')]),
        concept('not-n', 2, 'Mobility is ease of motion, not how many carriers you have', 'Need μ ≠ n', [cue('not', 'conc'), cue('ease'), cue('scatter')]),
      ],
      misconceptions: [
        trap('mu-is-n', 'You treated mobility as another name for concentration.', [cue('mobility', 'number')], { fix: 'μ is how fast they drift at a given field. n is how many.' }),
      ],
    },
    model: 'Conductivity adds two channels. If n and p are fixed and μn doubles, the electron channel doubles, so A wins. Mobility is scattering time over effective mass, not a headcount.',
    hw: 'HW2 Q3 σ', module: 'eqrel.html',
  }),

  W({
    id: 'w-sigma-t', cat: 'transport', level: 4, kind: 'predict',
    prompt: 'A student says heating always decreases semiconductor conductivity. Evaluate that statement across freeze-out, extrinsic, and intrinsic regimes.',
    rubric: {
      concepts: [
        concept('false', 2, 'The claim is too sweeping; σ can rise or fall', 'Need to reject “always”', [cue('not always'), cue('false'), cue('depends')]),
        concept('mu', 2, 'Phonon scattering can lower μ as T rises', 'Need mobility drop', [cue('scatter'), cue('mobility', 'decrease'), cue('phonon')]),
        concept('ni', 3, 'In intrinsic, ni explodes and σ usually rises', 'Need ni winning at high T', [cue('intrinsic'), cue('ni'), cue('increase')]),
        concept('freeze', 1, 'Leaving freeze-out also raises n toward ND', 'Need freeze-out thaw', [cue('freeze'), cue('ionize')]),
      ],
      misconceptions: [],
    },
    model: 'Metals mostly lose σ when heated because μ falls. A semiconductor has three acts. Thawing freeze-out raises n. Extrinsic can go either way (μ falling vs slight ni). Intrinsic usually wins: ni explodes and σ rises. “Always decreases” is a metal slogan.',
    hw: 'HW2 Q5', module: 'latticelab_homeworks.html?hw=hw2&q=q5b',
  }),

  W({
    id: 'w-regimes', cat: 'temperature', level: 4, kind: 'mechanism',
    prompt: 'An n-doped semiconductor is heated from very low T to very high T. Trace freeze-out, extrinsic, and intrinsic. Why does a smaller Eg make the intrinsic takeover happen earlier?',
    rubric: {
      concepts: [
        concept('fo', 2, 'Freeze-out: not enough kT to ionize most donors', 'Need freeze-out', [cue('freeze'), cue('not', 'ionize')]),
        concept('ex', 2, 'Extrinsic: donors ionized and n ≈ ND, a plateau', 'Need the plateau', [cue('extrinsic'), cue('plateau'), cue('nd')]),
        concept('in', 2, 'Intrinsic: ni overtakes ND, n ≈ p ≈ ni', 'Need ni takeover', [cue('intrinsic'), cue('ni')]),
        concept('eg', 2, 'Smaller Eg → ni ~ exp(−Eg/2kT) grows sooner', 'Need Eg in the exponent', [cue('smaller', 'eg'), cue('eg'), cue('sooner')]),
      ],
      misconceptions: [
        trap('dop-owns', 'You kept ND in charge at arbitrarily high T.', [cue('always nd')], { fix: 'The dopants are still there. Pairs swamp them.' }),
      ],
    },
    model: 'Cold: donors hold their electrons. Mid: they ionize and n sits on ND. Hot: pair generation overtakes ND. ni ~ exp(−Eg/2kT), so Ge (small Eg) goes intrinsic at a lower T than Si or GaAs. Device designs that need n ≈ ND die there.',
    hw: 'HW2 Q5b–d', module: 'latticelab_homeworks.html?hw=hw2&q=q5b',
  }),

  W({
    id: 'w-absorb', cat: 'photon', level: 3, kind: 'predict',
    prompt: 'A semiconductor has Eg = 1.9 eV. Explain how you decide whether a photon is absorbed, how λg moves if Eg increases, and why the emitted wavelength after relaxation is not automatically the laser wavelength.',
    rubric: {
      concepts: [
        concept('compare', 3, 'Compare E = hc/λ with Eg. Below: no interband absorption', 'Need E vs Eg', [cue('eg'), cue('hc'), cue('below')]),
        concept('lg', 3, 'Eg up ⇒ λg = hc/Eg down (edge moves blue)', 'Need the inverse', [cue('shorter'), cue('lg'), cue('blue')]),
        concept('emit', 2, 'Emission after thermalization is ~Eg, not the pump λ', 'Need absorb λ ≠ emit λ', [cue('not', 'laser'), cue('relax'), cue('thermal')]),
      ],
      misconceptions: [
        trap('below-abs', 'You absorbed a sub-gap photon and just made slower carriers.', [cue('still absorbed')], { fix: 'Below Eg there is no final CB state. α stays ~0 in the teaching model.' }),
      ],
    },
    model: 'E = 1240/λ. If that is below Eg, the photon cannot buy the jump. If Eg rises, λg shortens and the absorption edge moves blue. Extra photon energy above Eg becomes heat on the way down to Ec. Recombination then emits ~hc/Eg, not the laser color.',
    hw: 'HW2 Q1', module: 'latticelab_homeworks.html?hw=hw2&q=q1a',
  }),

  W({
    id: 'w-beer', cat: 'optics', level: 3, kind: 'why',
    prompt: 'I = I0 e^{−αx}. If α doubles at fixed x, does transmitted intensity halve? Explain the physical meaning of the exponential.',
    rubric: {
      concepts: [
        concept('no', 3, 'No, not in general. Doubling α squares the remaining fraction', 'Need nonlinear', [cue('no'), cue('not half'), cue('square'), cue('exponential')]),
        concept('frac', 3, 'Each slice eats a fraction of what remains, not a fixed chunk of I0', 'Need the remaining-fraction story', [cue('fraction'), cue('remaining'), cue('slice')]),
        concept('special', 1, 'Halving happens only for a special αx', 'Optional special-case', [cue('special'), cue('ln 2'), cue('only if')]),
      ],
      misconceptions: [
        trap('linear', 'You treated absorption as linear in α.', [cue('halves')], { unless: [cue('not')], fix: 'Linear thinking is the trap the exponential exists to block.' }),
      ],
    },
    model: 'dI = −α I dx. The loss is proportional to the light that is still there, so the solution is exponential. Doubling α replaces e^{−αx} by (e^{−αx})². That is 1/2 only if the original transmission was 1/√2.',
    hw: 'Equation sheet', module: 'exam1.html?mode=sheet&eq=e_beer',
  }),

  W({
    id: 'w-pn-vbi-chain', cat: 'pn', level: 5, kind: 'chain',
    prompt: 'Explain how bringing p-type and n-type semiconductor together creates a built-in potential. Write the causal chain, not a list of disconnected facts.',
    rubric: {
      concepts: [
        concept('grad', 1, 'Carrier concentrations differ across the junction', 'Start from the n vs p concentration difference', [cue('difference'), cue('different'), cue('concentration'), cue('more electrons')]),
        concept('diff', 2, 'Electrons diffuse n→p and holes p→n', 'Need diffusion', [cue('diffus')]),
        concept('rec', 1, 'They recombine near the junction', 'Need recombination', [cue('recombin')]),
        concept('ions', 2, 'Exposed fixed donor and acceptor ions remain', 'Need uncovered fixed ions', [cue('fixed'), cue('ion'), cue('uncover'), cue('expose')]),
        concept('rho', 1, 'That is space charge', 'Name space charge', [cue('space charge'), cue('charge')]),
        concept('field', 2, 'The ions create an electric field from n toward p', 'Need field direction n→p', [cue('field'), cue('n', 'p')]),
        concept('drift', 1, 'Drift opposes further diffusion', 'Need drift vs diffusion', [cue('drift'), cue('oppos')]),
        concept('eq', 1, 'Equilibrium when diffusion equals drift', 'Need the balance', [cue('equilibrium'), cue('balance'), cue('equal')]),
        concept('vbi', 1, 'The potential that makes EF flat is Vbi', 'Name built-in potential', [cue('vbi'), cue('potential'), cue('barrier')]),
      ],
      misconceptions: [
        trap('ions-move', 'You let the dopant ions flow to form the field.', [near('ions', 'diffus'), near('ions', 'move')], { unless: [cue('not')], fix: 'Ions stay put. Mobile carriers leave. That is why the charge is uncovered.' }),
      ],
    },
    model: 'n has many electrons, p has many holes. They diffuse across and recombine, uncovering fixed ND+ on the n side and NA− on the p side. That space charge makes a field pointing n→p. Drift then fights diffusion. When the two currents cancel, EF is flat and the barrier is Vbi.',
    hw: 'PN Story Mode', module: 'pn_lab.html?mode=story',
    followup: {
      ifMissing: ['field'],
      prompt: 'You explained how the fixed ions form. Why do those ions create an electric field, and which way does it point?',
      rubric: {
        concepts: [
          concept('poisson', 3, 'Uncovered charge makes E via Poisson: dE/dx = ρ/ε', 'Need charge → field', [cue('field'), cue('charge'), cue('poisson')]),
          concept('dir', 2, 'Field points from positive n-side ions toward negative p-side ions', 'Need n→p', [cue('n'), cue('p')]),
        ],
        misconceptions: [],
      },
    },
  }),

  W({
    id: 'w-fwd', cat: 'pn', level: 4, kind: 'predict',
    prompt: 'Forward bias is increased. Predict, in causal order, what happens to the barrier, the depletion width, carrier injection, and current. Why is the current exponential rather than linear?',
    rubric: {
      concepts: [
        concept('bar', 2, 'Barrier q(Vbi−VA) drops', 'Need barrier down', [cue('barrier'), cue('drop'), cue('lower')]),
        concept('w', 2, 'Depletion width shrinks', 'Need W down', [cue('depletion'), cue('shrink'), cue('narrow')]),
        concept('inj', 2, 'Majority injection rises', 'Need injection', [cue('inject'), cue('majority')]),
        concept('i', 2, 'Current rises exponentially (Shockley)', 'Need exponential I', [cue('exponential'), cue('shockley')]),
      ],
      misconceptions: [
        trap('linear-i', 'You made diode current linear in VA.', [near('linear', 'current')], { fix: 'A linear drop in barrier multiplies the Boltzmann tail. That is exponential I.' }),
      ],
    },
    model: 'VA lowers the barrier, so less length of uncovered charge is needed and W shrinks. More majority carriers climb the leftover barrier (Boltzmann). I = I0(e^{qVA/kT}−1). Linear voltage, exponential tail.',
    hw: 'PN lab / Story', module: 'pn_lab.html?mode=lab',
  }),

  W({
    id: 'w-rev', cat: 'pn', level: 3, kind: 'predict',
    prompt: 'Reverse |VA| increases. What happens to the barrier, W, and majority diffusion? Why does current sit near −I0 instead of exploding?',
    rubric: {
      concepts: [
        concept('bar', 2, 'Barrier rises', 'Need higher barrier', [cue('barrier'), cue('rise'), cue('increase')]),
        concept('w', 2, 'W grows', 'Need wider depletion', [cue('depletion'), cue('wide'), cue('grow')]),
        concept('maj', 2, 'Majority diffusion over the barrier is suppressed', 'Need majority shut off', [cue('majority'), cue('suppress'), cue('cannot')]),
        concept('i0', 2, 'Leftover current is generation / minority, ~ −I0, not e^{+q|VA|/kT}', 'Need −I0, not explosion', [cue('i0'), cue('minority'), cue('not exponential')]),
      ],
      misconceptions: [
        trap('explode', 'You applied the forward exponential in reverse.', [cue('explodes')], { fix: 'The exponential is e^{qVA/kT} with VA positive forward.' }),
      ],
    },
    model: 'Reverse bias adds to Vbi, so the barrier grows and W grows. Majority carriers cannot climb it. The small reverse current is minority generation, about −I0, until breakdown (not Exam 1 arithmetic).',
    hw: 'PN lab', module: 'pn_lab.html?mode=lab',
  }),

  W({
    id: 'w-w-dop', cat: 'pn', level: 4, kind: 'why',
    prompt: 'Why does heavier doping generally narrow the depletion region? A student says the opposite: more charge should need more width. What did they miss?',
    rubric: {
      concepts: [
        concept('rho', 3, 'More uncovered charge per length', 'Need higher ρ', [cue('more charge'), cue('per length'), cue('density')]),
        concept('less-l', 3, 'The same potential drop then needs less length', 'Need less width for same V', [cue('less'), cue('narrow'), cue('shorter')]),
        concept('poisson', 2, 'Poisson / NA xp = ND xn: the light side still owns more of W', 'Need the one-sided picture', [cue('light'), cue('poisson'), cue('xp')]),
      ],
      misconceptions: [
        trap('wider', 'You agreed that more doping widens W.', [cue('wider')], { unless: [cue('not')], fix: 'More charge per meter means you run out of voltage in fewer meters.' }),
      ],
    },
    model: 'W supports Vbi−VA. If NA or ND is larger, each nanometer of depletion holds more uncovered charge, so Poisson reaches the same potential in a shorter distance. The lighter-doped side still takes more of W. More ions is not “more room needed.”',
    hw: 'PN lab', module: 'pn_lab.html?mode=lab',
  }),

  W({
    id: 'w-diode-synth', cat: 'pn', level: 5, kind: 'synthesis',
    prompt: 'Explain how doping ultimately allows a PN junction to behave as a diode: easy current one way, blocked the other. Start from donors and acceptors, not from the circuit symbol.',
    rubric: {
      concepts: [
        concept('dope', 2, 'Doping sets n-side electrons and p-side holes', 'Need the two sides', [cue('nd'), cue('na'), cue('ntype'), cue('ptype')]),
        concept('vbi', 2, 'Contact makes a barrier Vbi', 'Need the barrier', [cue('vbi'), cue('barrier')]),
        concept('fwd', 3, 'Forward lowers the barrier and injects majority carriers', 'Need forward injection', [cue('forward'), cue('inject'), cue('lower')]),
        concept('rev', 3, 'Reverse raises the barrier and shuts majority diffusion', 'Need reverse block', [cue('reverse'), cue('block'), cue('raise')]),
      ],
      misconceptions: [],
    },
    model: 'Donors make an electron-rich n side; acceptors make a hole-rich p side. Joined, diffusion and uncovered ions build Vbi. Forward bias lowers that barrier so majorities inject and current explodes. Reverse bias raises it so majorities cannot cross. That asymmetry is the diode. The symbol is the last drawing, not the first cause.',
    hw: 'PN Story Mode', module: 'pn_lab.html?mode=story',
  }),

  W({
    id: 'w-hole', cat: 'band', level: 2, kind: 'debug',
    prompt: 'A student says: “A hole is a positively charged particle inserted into the lattice.” Evaluate the statement and give the correct picture.',
    rubric: {
      concepts: [
        concept('false', 2, 'The claim is false', 'Reject the inserted-particle story', [cue('false'), cue('incorrect'), cue('wrong')]),
        concept('empty', 4, 'A hole is an empty valence state; the crystal responds as if a + charge moved', 'Need empty VB state', [cue('empty'), cue('missing'), cue('vb'), cue('absence')]),
        concept('not-insert', 2, 'Nothing positive was inserted', 'Need “not inserted”', [cue('not insert'), cue('not a particle'), cue('not added')]),
      ],
      misconceptions: [],
    },
    model: 'False. Nobody dropped a positron into the Si. A valence electron left; the empty state is the hole. The lattice’s response looks like a + charge with its own m* and μp. The acceptor ion that enabled it is a different object, and it does not move.',
    hw: 'HW1 / HW2', module: 'latticelab_homeworks.html?hw=hw2&q=q4i',
  }),

  W({
    id: 'w-indirect-emit', cat: 'photon', level: 4, kind: 'debug',
    prompt: 'A student says: “Si cannot emit light because it has an indirect bandgap.” Evaluate the statement. Separate absorption, emission efficiency, and conservation laws.',
    rubric: {
      concepts: [
        concept('strong', 3, 'Too strong: indirect emission needs a phonon and is inefficient, not forbidden', 'Need inefficient ≠ impossible', [cue('inefficient'), cue('not forbidden'), cue('phonon')]),
        concept('abs', 2, 'Si can still absorb with phonon help', 'Need absorption still happens', [cue('absorb')]),
        concept('k', 3, 'Energy and crystal momentum must both be conserved; the photon cannot supply Δk', 'Need both conservation laws', [cue('momentum'), cue('energy'), cue('photon')]),
      ],
      misconceptions: [
        trap('ban', 'You accepted a total ban on Si photons.', [cue('cannot emit'), cue('never')], { unless: [cue('too strong'), cue('not')], fix: 'Conservation makes it rare, not a legal prohibition in every device.' }),
      ],
    },
    model: 'Too strong. A photon is vertical in k. Si’s leftover Δk needs a phonon, so band-edge emission is weak. Absorption still happens, slowly. LEDs use direct gaps because efficiency, not because Si is legally banned from making a photon.',
    hw: 'HW1 Q4', module: 'latticelab_homeworks.html?hw=hw1#ek',
  }),

  W({
    id: 'w-freeze', cat: 'doping', level: 3, kind: 'predict',
    prompt: 'An n-type sample with ND > 0 is cooled to T = 0 K. Are the donors ionized? Where is EF, and why is n not equal to ND?',
    rubric: {
      concepts: [
        concept('no', 3, 'Donors are frozen; not ionized', 'Need freeze-out', [cue('freeze'), cue('not ionize'), cue('filled')]),
        concept('step', 2, 'f(E) is a step', 'Need the T = 0 step', [cue('step'), cue('0 k')]),
        concept('ef', 3, 'EF sits at the donor level, not at Ei, and n in the bands is ~0', 'Need EF at the donor and empty bands', [cue('donor'), cue('ef'), cue('n', '0')]),
      ],
      misconceptions: [
        trap('ndef', 'You set n = ND because “that is the definition of n-type.”', [cue('n = nd')], { unless: [cue('not')], fix: 'n ≈ ND is an ionized-extrinsic shortcut. T = 0 cancels it.' }),
      ],
    },
    model: 'T = 0 has no kT. Donor electrons stay on the impurity. f is a step. EF pins at the donor level. The bands are empty, so n is not ND. “n-type” is a room-temperature habit, not a T = 0 identity.',
    hw: 'HW2 Q4(i)', module: 'latticelab_homeworks.html?hw=hw2&q=q4i',
  }),

  W({
    id: 'w-white-inas', cat: 'photon', level: 3, kind: 'predict',
    prompt: 'White light hits InAs (Eg ≈ 0.36 eV) and, separately, a 1.9 eV direct gap. Explain what visible leftover you expect in each case. What principle are you using?',
    rubric: {
      concepts: [
        concept('see', 3, 'You see the unabsorbed tail, not the absorbed photons', 'Need leftover = unabsorbed', [cue('unabsorb'), cue('leftover'), cue('transmit')]),
        concept('inas', 3, 'InAs eats the whole visible band; no visible leftover', 'Need InAs black to the eye', [cue('inas'), cue('all'), cue('no visible')]),
        concept('19', 2, '1.9 eV (λg ≈ 653 nm) eats blue-green and can leave red', 'Need the 1.9 leftover', [cue('1.9'), cue('red'), cue('653')]),
      ],
      misconceptions: [
        trap('color-eg', 'You assigned InAs a visible color from 0.36 eV as if that were a green photon.', [cue('green')], { fix: '0.36 eV is infrared. Visible photons are all above that, so they are absorbed.' }),
      ],
    },
    model: 'The eye sees what was not absorbed. Every visible photon has E ≫ 0.36 eV, so InAs leaves no visible tail. A 1.9 eV gap has λg ≈ 653 nm: it can eat the blue-green and transmit redder leftovers. Color is the leftover ticket, not a name for Eg.',
    hw: 'HW2 Q1b', module: 'latticelab_homeworks.html?hw=hw2&q=q1b',
  }),

  W({
    id: 'w-pack', cat: 'crystal', level: 3, kind: 'compare',
    prompt: 'Compare simple-cubic, BCC, and FCC packing. Why is N (atoms owned by the conventional cell) not the packing fraction, and why can FCC still pack more densely than SC even before you quote a numerical APF?',
    rubric: {
      concepts: [
        concept('n', 3, 'N is 1 (SC), 2 (BCC), 4 (FCC) from sharing, not from counting spheres', 'Need the three N values from ownership', [cue('1'), cue('2'), cue('4'), cue('fcc')]),
        concept('apf', 3, 'Packing fraction is occupied volume over a³, so radius vs a also matters', 'Need volume ratio, not N alone', [cue('volume'), cue('radius'), cue('pack'), cue('a')]),
        concept('touch', 2, 'Hard-sphere contact along the close-packed line sets r(a); FCC’s face diagonal is that line', 'Need contact geometry', [cue('diagonal'), cue('touch'), cue('close')]),
      ],
      misconceptions: [
        trap('n-is-pack', 'You treated a larger N as automatically a larger packing fraction.', [cue('n is packing'), cue('more atoms', 'denser')], { unless: [cue('not')], fix: 'N is a count. Packing still needs how much of a³ the spheres actually fill.' }),
      ],
    },
    model: 'SC owns 1, BCC 2, FCC 4. Packing fraction is (N × sphere volume) / a³. The sphere radius is not free: atoms touch along the cube edge (SC), body diagonal (BCC), or face diagonal (FCC). FCC’s contact line is the face diagonal, so more of the cube is atom and less is empty space. N alone is not APF.',
    hw: 'HW1 Q1, Q3', module: 'latticelab_homeworks.html?hw=hw1#cell',
  }),

  W({
    id: 'w-recomb', cat: 'temperature', level: 3, kind: 'explain',
    prompt: 'In an intrinsic semiconductor in the dark at equilibrium, generation and recombination both occur. Explain each process, why they must balance, and what that balance does not freeze.',
    rubric: {
      concepts: [
        concept('gen', 3, 'Generation: a valence electron pays Eg and makes an electron-hole pair', 'Need pair generation', [cue('generation'), cue('ehpair'), cue('eg')]),
        concept('rec', 3, 'Recombination: an electron falls back and a pair disappears', 'Need recombination', [cue('recombin')]),
        concept('bal', 2, 'Equilibrium means rates equal, not that motion stopped', 'Need equal rates, still happening', [cue('equal'), cue('balance'), cue('rate')]),
        concept('ni', 2, 'The balance sets a steady ni, not ni = 0', 'Need a nonzero steady ni', [cue('ni'), cue('steady'), cue('not zero')]),
      ],
      misconceptions: [
        trap('stopped', 'You treated equilibrium as “nothing is happening.”', [cue('nothing happens'), cue('stopped')], { unless: [cue('not')], fix: 'Pairs are still born and die. The counts sit still because the rates match.' }),
      ],
    },
    model: 'Heat creates pairs across Eg. Recombination destroys pairs. In the dark at equilibrium the two rates match, so n = p = ni is steady. Steady is not frozen: the traffic continues. Light or injection breaks the equality and np leaves ni².',
    hw: 'HW2 Q5 / PN story', module: 'latticelab_homeworks.html?hw=hw2&q=q5a',
  }),

  W({
    id: 'w-eq-nd', cat: 'equations', level: 4, kind: 'chain',
    prompt: 'ND increases in an ionized n-type crystal at fixed T (NA ≈ 0). Trace the equation chain from doping to conductivity. Why does p fall even though doping did not “remove holes”?',
    rubric: {
      concepts: [
        concept('ef', 2, 'EF moves toward Ec', 'Need EF toward Ec', [cue('ef'), cue('cb')]),
        concept('n', 2, 'n rises (n ≈ ND in this shortcut)', 'Need n up', [cue('n'), cue('nd')]),
        concept('p', 2, 'p falls because np = ni² at fixed T', 'Need mass action', [cue('p'), cue('massaction'), cue('ni')]),
        concept('sig', 2, 'σ generally rises because the q n μn channel grows', 'Need σ up', [cue('sigma'), cue('conduct')]),
        concept('why-p', 2, 'Holes were not extracted; the product is pinned, so extra n forces p down', 'Need why p falls', [cue('product'), cue('not remove'), cue('trade')]),
      ],
      misconceptions: [
        trap('both', 'You raised n and p together as if doping made pairs.', [cue('both rise'), cue('p increase')], { unless: [cue('not')], fix: 'Heat makes pairs. Doping redistributes a fixed ni² product.' }),
      ],
    },
    model: 'More ionized donors → EF toward Ec → n ≈ ND rises → p = ni²/n falls → σ ≈ q n μn usually rises. μ may sag a little from extra scattering; the first story is still the electron channel. p fell because the product is pinned, not because holes were scooped out.',
    hw: 'HW2 Q3 / EqRel', module: 'eqrel.html',
    followup: {
      ifMissing: ['why-p'],
      prompt: 'You have n up and p down. Say the same thing from the f(E) picture: what happens to valence-band occupation when EF moves toward Ec?',
      rubric: {
        concepts: [
          concept('fill', 5, 'More of the VB is occupied, so empty VB states (holes) become rarer', 'Need fuller VB ⇒ fewer holes', [cue('vb'), cue('occup'), cue('hole')]),
        ],
        misconceptions: [],
      },
    },
  }),

  W({
    id: 'w-eq-nc', cat: 'equations', level: 4, kind: 'debug',
    prompt: 'A student says: “NC is the number of conduction electrons.” Explain what NC actually is, how it differs from f(E) and from n, and why NC grows when T rises.',
    rubric: {
      concepts: [
        concept('dos', 3, 'NC is the conduction-band density of states piled into an equivalent count at Ec', 'Need equivalent DOS, not a headcount', [cue('dos'), cue('states'), cue('equivalent')]),
        concept('not-n', 3, 'n = NC × Boltzmann tail of f; NC is not n', 'Need n = NC × f-like factor', [cue('not', 'n'), cue('boltzmann'), cue('f')]),
        concept('t', 2, 'NC grows as T^{3/2} because the parabolic band’s thermal window widens', 'Need T^{3/2}', [cue('t'), cue('3/2'), cue('widen')]),
      ],
      misconceptions: [
        trap('nc-is-n', 'You accepted NC as the electron concentration.', [cue('nc is n'), cue('nc equals n')], { unless: [cue('not')], fix: 'NC is a state pile. n still needs how full those states are.' }),
      ],
    },
    model: 'NC collapses the conduction-band density of states to one equivalent number sitting at Ec. n = NC exp(−(Ec−EF)/kT) in the nondegenerate limit. f is the occupation probability; NC is not a count of electrons. The T^{3/2} comes from the thermal slice of a parabolic band getting thicker.',
    hw: 'Equation sheet · NC', module: 'exam1.html?mode=sheet&eq=e_nc',
  }),
];

export function writtenByCat(cat) {
  return WRITTEN.filter((q) => q.cat === cat);
}

export function writtenById(id) {
  return WRITTEN.find((q) => q.id === id);
}
