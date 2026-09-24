/**
 * Equation registry. Components render this; they do not invent physics copy.
 */
export const EQUATIONS = {
  e_hf: {
    id: 'e_hf', name: 'Photon energy', latex: 'E = hf', family: 'photon', viz: 'photon',
    vars: ['Eph', 'freq'],
    story: {
      simple: 'Light arrives in packets. A bluer, faster-oscillating wave sends a more energetic packet.',
      course: 'A photon is one quantum of the electromagnetic wave. Its energy is proportional to how many oscillations happen per second. That is E = hf, with h Planck’s constant.',
      deep: 'Quantizing a harmonic oscillator of frequency f gives energy steps hf. A photon is one such quantum. The wave’s amplitude sets how many photons, not how much energy each one carries.',
    },
    components: [
      { label: 'Physical idea', note: 'Energy comes in packets locked to the oscillation rate.' },
      { label: 'Packet size', latex: 'E = hf', note: 'h converts frequency into energy.' },
    ],
    why: {
      simple: 'Faster oscillation, fatter packet. Frequency belongs in the numerator.',
      course: 'The wave is periodic with period 1/f. Quantum mechanics assigns energy hf to one cycle’s worth of field oscillator. Higher f means more cycles per second, so each photon is more expensive.',
      deep: 'The electromagnetic mode is a harmonic oscillator. The Hamiltonian eigenvalues are (n+1/2)hf. Destroying one quantum drops the energy by hf.',
    },
    derivation: {
      intuition: 'Count oscillations per second. Pay a fixed energy h per oscillation. That is the photon.',
      course: 'Start from the photoelectric observation: a threshold frequency, then kinetic energy linear in f. Einstein wrote K_max = hf − Φ. The absorbed quantum is therefore hf.',
      deep: 'Canonical quantization of the free field: each k-mode is an oscillator at ω = 2πf. The photon is the quantum of that oscillator, energy ħω = hf.',
    },
    use: ['The problem gives frequency or color and asks for photon energy.', 'You are connecting a laser line to whether it can cross Eg.'],
    not: {
      assumptions: ['One photon, monochromatic.', 'E is the energy of a single quantum, not a beam’s total power.'],
      breaks: ['A classical intensity argument. Brightness is photon flux, not a bigger E.', 'Matter waves: electrons use E = hf too, but here f is the photon frequency.'],
    },
    exam: { cues: ['“photon energy”', 'frequency given, energy asked', 'photoelectric threshold'], path: ['freq', 'e_hf', 'Eph'] },
    limits: [
      { if: 'f doubles', then: 'E doubles. Linear, not exponential.', latex: 'E \\propto f' },
    ],
    myths: [
      { wrong: 'A brighter beam means each photon has more energy.', better: 'Brightness is more photons per second. Color (frequency) sets each photon’s energy.' },
    ],
    upstream: [{ id: 'e_cfl', note: 'If you were given λ, convert to f first.' }],
    downstream: [{ id: 'e_hc', note: 'Substitute f = c/λ.' }, { id: 'e_lg', note: 'Compare E with Eg.' }],
    hold: { change: 'freq', held: ['h'], result: 'E rises in exact proportion to f.' },
    units: { parts: ['h (J·s)', 'f (s^{-1})'], result: 'J, or eV after dividing by q.' },
    map: { x: 620, y: 92, kind: 'eq' },
  },

  e_cfl: {
    id: 'e_cfl', name: 'Wave speed', latex: 'c = f\\lambda', family: 'photon', viz: 'photon',
    vars: ['freq', 'lambda'],
    story: {
      simple: 'A wave has to cover distance c in one second. If crests are far apart, few of them pass you each second.',
      course: 'Light in vacuum travels at c. In one second the wave moves a distance c, which must equal (crests per second) × (distance between crests). So c = fλ, or f = c/λ.',
      deep: 'From the dispersion of a massless field, ω = ck. With f = ω/2π and λ = 2π/k you recover c = fλ. In a medium replace c by c/n; LatticeLab uses the vacuum teaching form unless a problem says otherwise.',
    },
    components: [
      { label: 'Physical idea', note: 'Speed is frequency times wavelength.' },
      { label: 'Solve for frequency', latex: 'f = c/\\lambda', note: 'This is why λ later appears in a denominator.' },
    ],
    why: {
      simple: 'Longer stretch between crests means fewer crests per second at fixed speed.',
      course: 'Fix the speed. Then f and λ cannot be independent. Doubling λ halves f. That inverse will be inherited by E = hf.',
      deep: 'The phase condition k·r − ωt is constant on a crest. Phase velocity ω/k = c for light, which is the same statement.',
    },
    derivation: {
      intuition: 'Watch crests go by. Distance per crest times crests per second is how fast the pattern runs.',
      course: 'In time τ = 1/f the wave advances one wavelength. Speed = distance/time = λ/τ = fλ = c.',
      deep: 'Maxwell plane-wave solutions require ω² = c²k² in vacuum.',
    },
    use: ['Convert a quoted wavelength into frequency.', 'First step toward E = hc/λ.'],
    not: {
      assumptions: ['Vacuum, or n ≈ 1 teaching model.', 'A single traveling harmonic wave.'],
      breaks: ['Inside a high-index crystal without replacing c.', 'A pulse with a spread of frequencies.'],
    },
    exam: { cues: ['wavelength and frequency together', '“speed of light”'], path: ['lambda', 'e_cfl', 'freq'] },
    limits: [{ if: 'λ → 0', then: 'f → ∞. The wave oscillates infinitely fast.', latex: 'f = c/\\lambda' }],
    myths: [{ wrong: 'Frequency and wavelength can be chosen independently for light.', better: 'In a given medium they are locked by the speed.' }],
    upstream: [],
    downstream: [{ id: 'e_hc', note: 'Drop f into E = hf.' }],
    hold: { change: 'lambda', held: ['c'], result: 'f falls as 1/λ.' },
    units: { parts: ['f (s^{-1})', 'λ (m)'], result: 'm/s' },
    map: { x: 470, y: 92, kind: 'eq' },
  },

  e_hc: {
    id: 'e_hc', name: 'Photon energy from wavelength', latex: 'E = hc/\\lambda', family: 'photon', viz: 'photon',
    vars: ['Eph', 'lambda'],
    story: {
      simple: 'A short-wavelength photon is a high-frequency photon, so it carries more energy. λ belongs in the denominator.',
      course: 'Start from E = hf and f = c/λ. Substitute: E = h(c/λ) = hc/λ. In the homework units this is the familiar E(eV) = 1240/λ(nm).',
      deep: 'Same substitution in ħω language: E = ħck = 2πħc/λ. The 2π is absorbed into the usual hc convention used on the formula sheet (1240 eV·nm).',
    },
    components: [
      { label: 'Physical idea', note: 'Color (wavelength) sets packet energy.' },
      { label: 'Frequency link', latex: 'f = c/\\lambda' },
      { label: 'Quantum', latex: 'E = hf' },
      { label: 'Together', latex: 'E = hc/\\lambda' },
    ],
    why: {
      simple: 'Shorter λ packs the same speed into more oscillations, so each packet is heavier in energy.',
      course: 'Watch the wave: as λ shrinks, peaks move closer, f = c/λ rises, E = hf rises. The inverse is not a convention. It is two substitutions.',
      deep: 'E ∝ k for a massless photon. k = 2π/λ, so E ∝ 1/λ. A massive particle would not be simply inverse to wavelength.',
    },
    derivation: {
      intuition: 'Blue light wiggles faster than red, so a blue photon pays more.',
      course: 'E = hf and f = c/λ give E = hc/λ. With hc = 1240 eV·nm, a 620 nm photon is 2.00 eV.',
      deep: 'The four-momentum of a photon is lightlike. E = pc and p = h/λ recover E = hc/λ (de Broglie for a massless quantum).',
    },
    use: ['Any λ → E conversion on the formula sheet.', 'Compare a laser line to Eg.'],
    not: {
      assumptions: ['One photon, vacuum hc, the teaching 1240 eV·nm constant.'],
      breaks: ['A beam’s total energy (that needs photon flux).', 'Phonons or massive particles.'],
    },
    exam: { cues: ['λ given, E asked', '“1240 / λ”', 'will this photon be absorbed?'], path: ['lambda', 'e_hc', 'Eph'] },
    limits: [
      { if: 'λ halves', then: 'E doubles.', latex: 'E \\propto 1/\\lambda' },
      { if: 'E = Eg', then: 'You have found the gap wavelength.', latex: '\\lambda_g = hc/E_g' },
    ],
    myths: [{ wrong: 'Energy is proportional to wavelength because red photons “feel longer.”', better: 'Energy is inverse to wavelength. Red is long-λ and therefore low-E.' }],
    upstream: [{ id: 'e_hf', note: 'Quantum piece.' }, { id: 'e_cfl', note: 'Wave piece.' }],
    downstream: [{ id: 'e_lg', note: 'Set E = Eg.' }],
    hold: { change: 'lambda', held: ['h', 'c'], result: 'E falls as 1/λ. The live wave should tighten as E rises.' },
    units: { parts: ['hc (eV·nm)', 'λ (nm)'], result: 'eV' },
    map: { x: 550, y: 168, kind: 'eq' },
  },

  e_lg: {
    id: 'e_lg', name: 'Gap wavelength', latex: '\\lambda_g = hc/E_g', family: 'photon', viz: 'photon',
    vars: ['lg', 'Eg'],
    story: {
      simple: 'The cheapest optical jump across the gap costs Eg. The longest photon that can still pay that bill has wavelength hc/Eg.',
      course: 'A photon is absorbed across the gap only if E_photon ≥ Eg. The threshold is E = Eg. Using E = hc/λ, that threshold wavelength is λg = hc/Eg. Longer than λg: the photon is too cheap and the crystal can look transparent.',
      deep: 'This ignores excitons, phonon-assisted indirect absorption, and Urbach tails. For ESE 2180 the sharp threshold is the teaching model. Indirect gaps still have a λg, but α rises slowly because a phonon must help.',
    },
    components: [
      { label: 'Physical idea', note: 'Eg is the minimum optical bill.' },
      { label: 'Photon energy', latex: 'E = hc/\\lambda' },
      { label: 'Threshold', latex: 'E = E_g \\Rightarrow \\lambda_g = hc/E_g' },
    ],
    why: {
      simple: 'Bigger gap, more expensive jump, so the cutoff photon must be shorter-wavelength.',
      course: 'λg inherits the 1/E from E = hc/λ. Plot λg versus Eg and you get a hyperbola. Si (1.12 eV) has λg ≈ 1107 nm, in the infrared. CdS (2.42 eV) has λg ≈ 512 nm, green.',
      deep: 'Joint density of states for a direct gap opens as √(E−Eg). α is zero below Eg and rises above it. λg is that onset, not a line of maximum absorption.',
    },
    derivation: {
      intuition: 'Ask the longest wave that still has E ≥ Eg.',
      course: 'E = hc/λ ≥ Eg ⇒ λ ≤ hc/Eg. The equality is λg. Homework uses 1240 eV·nm.',
      deep: 'For an indirect gap the optical onset is still ~Eg, but the matrix element requires a phonon. The formula for λg stays; the α(λ) shape changes.',
    },
    use: ['Material given, asked for absorption edge or color.', 'Will 635 nm pass through CdS?'],
    not: {
      assumptions: ['One-electron gap, ignore exciton binding, sharp onset.'],
      breaks: ['Below-gap absorption from defects.', 'Emission wavelength of an LED (that can sit below λg after relaxation).'],
    },
    exam: { cues: ['“longest wavelength absorbed”', '“absorption threshold”', 'Eg table → λ'], path: ['Eg', 'e_lg', 'lg'] },
    limits: [
      { if: 'Eg doubles', then: 'λg halves.', latex: '\\lambda_g \\propto 1/E_g' },
      { if: 'λ < λg', then: 'E > Eg, absorption allowed (direct-gap teaching model).' },
    ],
    myths: [{ wrong: 'A larger bandgap absorbs longer-wavelength light.', better: 'Larger Eg needs more photon energy, which is shorter wavelength.' }],
    upstream: [{ id: 'Eg', note: 'Material gap.' }, { id: 'e_hc', note: 'Photon energy law.' }],
    downstream: [{ id: 'absorption', note: 'Optical consequence of the same Eg that sets ni.' }],
    hold: { change: 'Eg', held: ['hc'], result: 'λg shortens. The absorption mark races toward the blue.' },
    units: { parts: ['1240 eV·nm', 'Eg (eV)'], result: 'nm' },
    map: { x: 780, y: 168, kind: 'eq' },
  },

  e_n_nc: {
    id: 'e_n_nc', name: 'Electrons from Ec', latex: 'n = N_C\\,e^{-(E_C-E_F)/kT}', family: 'carrier', viz: 'boltzmann',
    vars: ['n', 'NC', 'EC', 'EF', 'T'],
    story: {
      simple: 'Conduction electrons live near Ec. If Ec sits well above EF, those states are almost empty. The leftover occupation is a small exponential tail.',
      course: 'In the Boltzmann (nondegenerate) limit, f(E) ≈ exp(−(E−EF)/kT) for E several kT above EF. Pile the conduction density of states into an effective NC at Ec and you get n = NC exp(−(Ec−EF)/kT).',
      deep: 'n = ∫_{Ec}^∞ g_c(E) f(E) dE. For parabolic bands g_c ∝ √(E−Ec). If EF is a few kT below Ec, replace f by the Boltzmann tail and the integral becomes NC(T) times that exponential, with NC ∝ T^{3/2}.',
    },
    components: [
      { label: 'Physical idea', note: 'How close EF is to Ec sets how full the conduction band is.' },
      { label: 'Effective states', latex: 'N_C', note: 'Parabolic-band states piled at Ec.' },
      { label: 'Occupation tail', latex: 'e^{-(E_C-E_F)/kT}' },
    ],
    why: {
      simple: 'States farther above EF are exponentially less likely to be occupied. That is why the exponential appears.',
      course: 'kT is the thermal yardstick. If Ec−EF = 3kT, the tail is e^{-3} ≈ 0.05. If EF moves 60 meV closer to Ec at 300 K (about 2.3 kT), n multiplies by 10. Tiny EF moves, huge n moves.',
      deep: 'The Fermi–Dirac function is 1/(1+e^{x}) with x=(E−EF)/kT. For x ≫ 1 this is e^{−x}. The approximation fails when EF enters the band (degeneracy); then you need Fermi integrals.',
    },
    derivation: {
      intuition: 'EF is the occupation dial. Slide it toward Ec and the conduction band starts to fill.',
      course: 'Boltzmann: f(Ec) ≈ exp(−(Ec−EF)/kT). Multiply by the effective number of states NC.',
      deep: 'Evaluate ∫ g_c(E) exp(−(E−EF)/kT) dE. The Γ(3/2) integral produces NC = 2(2π m_n* kT/h²)^{3/2}.',
    },
    use: ['EF and T given, find n from the band edge.', 'Show the link to the ni form.'],
    not: {
      assumptions: ['Nondegenerate: EF at least ~3kT below Ec.', 'Parabolic conduction band.'],
      breaks: ['Heavy n-type, EF inside the CB (use Fermi integrals).', 'T → 0 with EF below Ec (n → 0, not this smooth exponential).'],
    },
    exam: { cues: ['NC given', 'Ec−EF given', '“Boltzmann approximation”'], path: ['EF', 'e_n_nc', 'n'] },
    limits: [
      { if: 'EF → Ec', then: 'The exponential → 1, but the Boltzmann assumption has already died.', latex: 'n \\to N_C\\ \\text{(invalid)}' },
      { if: 'EF = Ei', then: 'This must recover n = ni.', latex: 'n_i = N_C e^{-(E_C-E_i)/kT}' },
    ],
    myths: [
      { wrong: 'NC is the number of electrons.', better: 'NC is an equivalent state count. n is that count times a usually tiny occupation factor.' },
    ],
    upstream: [{ id: 'e_f', note: 'The tail of f(E).' }, { id: 'NC', note: 'Band-edge DOS.' }],
    downstream: [{ id: 'e_n_ni', note: 'Rewrite using ni and Ei.' }, { id: 'e_sigma', note: 'n then enters conductivity.' }],
    hold: { change: 'EF', held: ['T', 'NC', 'Ec'], result: 'n grows as exp(+(EF)/kT) while Ec is fixed.' },
    units: { parts: ['NC (cm^{-3})', 'dimensionless exponential'], result: 'cm^{-3}' },
    map: { x: 478, y: 328, kind: 'eq' },
  },

  e_p_nv: {
    id: 'e_p_nv', name: 'Holes from Ev', latex: 'p = N_V\\,e^{-(E_F-E_V)/kT}', family: 'carrier', viz: 'boltzmann',
    vars: ['p', 'NV', 'EF', 'EV', 'T'],
    story: {
      simple: 'A hole is a missing valence electron. If EF sits well above Ev, almost every valence state is full, so holes are rare.',
      course: 'The hole occupation is 1−f(E). In the Boltzmann limit that is exp(−(EF−E)/kT). Pile valence states into NV at Ev and p = NV exp(−(EF−Ev)/kT).',
      deep: 'p = ∫_{-∞}^{Ev} g_v(E) [1−f(E)] dE. Parabolic valence band plus Boltzmann empty-state tail produces NV ∝ T^{3/2} and the exponential in (EF−Ev).',
    },
    components: [
      { label: 'Physical idea', note: 'Distance from EF down to Ev sets how empty the valence band is.' },
      { label: 'Effective states', latex: 'N_V' },
      { label: 'Empty-state tail', latex: 'e^{-(E_F-E_V)/kT}' },
    ],
    why: {
      simple: 'Raising EF fills the valence band more completely, so p falls exponentially.',
      course: 'Notice the sign: (EF−Ev) grows when EF rises, so the exponential shrinks. That is the partner of n = NC exp(−(Ec−EF)/kT), where the same EF rise makes n grow.',
      deep: '1−1/(1+e^{x}) = 1/(1+e^{−x}). For states well below EF, x is large and negative, and 1−f ≈ e^{x} = exp((E−EF)/kT). At E = Ev that is exp(−(EF−Ev)/kT).',
    },
    derivation: {
      intuition: 'Holes are the complementary emptiness of the same f(E).',
      course: '1−f(Ev) ≈ exp(−(EF−Ev)/kT), times NV.',
      deep: 'Same Γ(3/2) integral as NC, with m_p*.',
    },
    use: ['EF known, find p from the valence edge.', 'Pair with the NC form to get np = NC NV exp(−Eg/kT).'],
    not: {
      assumptions: ['Nondegenerate: EF at least ~3kT above Ev.'],
      breaks: ['Degenerate p-type, EF inside the VB.', 'Freeze-out where neutrality, not this formula, is the hard part.'],
    },
    exam: { cues: ['NV given', 'EF−Ev given'], path: ['EF', 'e_p_nv', 'p'] },
    limits: [
      { if: 'EF = Ei', then: 'p = ni.', latex: 'n_i = N_V e^{-(E_i-E_V)/kT}' },
    ],
    myths: [{ wrong: 'Holes are a second species of electron added by doping.', better: 'Holes are missing valence electrons. Doping shifts EF, which changes how many are missing.' }],
    upstream: [{ id: 'e_f', note: 'Empty-state side of f(E).' }],
    downstream: [{ id: 'e_p_ni', note: 'Rewrite from Ei.' }, { id: 'e_np', note: 'Multiply by n.' }],
    hold: { change: 'EF', held: ['T', 'NV', 'Ev'], result: 'p falls exponentially as EF rises.' },
    units: { parts: ['NV (cm^{-3})', 'dimensionless exponential'], result: 'cm^{-3}' },
    map: { x: 830, y: 328, kind: 'eq' },
  },

  e_n_ni: {
    id: 'e_n_ni', name: 'Electrons from Ei', latex: 'n = n_i\\,e^{(E_F-E_i)/kT}', family: 'carrier', viz: 'boltzmann',
    vars: ['n', 'ni', 'EF', 'Ei', 'T'],
    story: {
      simple: 'When the crystal is undoped, n = ni and EF sits at Ei. Doping slides EF. Each kT that EF climbs above Ei multiplies n by e.',
      course: 'Write n = NC exp(−(Ec−EF)/kT) and ni = NC exp(−(Ec−Ei)/kT). Divide: n/ni = exp((EF−Ei)/kT). So n = ni exp((EF−Ei)/kT). Same electrons, friendlier reference.',
      deep: 'Ei is defined so that n = p = ni when EF = Ei. The two Boltzmann forms are therefore the same function, translated from the band edge to midgap (or the true Ei if NC ≠ NV).',
    },
    components: [
      { label: 'Physical idea', note: 'Measure EF from the intrinsic level instead of from Ec.' },
      { label: 'Intrinsic scale', latex: 'n_i' },
      { label: 'EF shift', latex: 'e^{(E_F-E_i)/kT}' },
    ],
    why: {
      simple: 'The exponential is still the Boltzmann tail. We just moved the zero of energy to Ei.',
      course: 'n = NC e^{-(Ec−EF)/kT} and ni = NC e^{-(Ec−Ei)/kT} share NC. Their ratio cancels NC and leaves exp((EF−Ei)/kT). These are not two unrelated formulas.',
      deep: 'If NC ≠ NV, Ei is not exactly midgap: Ei = (Ec+Ev)/2 + (1/2)kT ln(NV/NC). The ni form still holds by construction of Ei.',
    },
    derivation: {
      intuition: 'Undoped: n = ni. Doped: multiply by how far EF walked from Ei, in units of kT.',
      course: 'n/ni = exp((EF−Ei)/kT) from dividing the two NC forms.',
      deep: 'Same ratio follows from n = ∫ g_c f and the definition ni² = NC NV e^{−Eg/kT}.',
    },
    use: ['Band-diagram problems that quote EF relative to Ei.', 'Live EF slider on this portal.'],
    not: {
      assumptions: ['Equilibrium, Boltzmann, a well-defined Ei.'],
      breaks: ['Quasi-Fermi levels under strong injection (then n = ni exp((Fn−Ei)/kT)).', 'Degenerate statistics.'],
    },
    exam: { cues: ['EF − Ei given', '“intrinsic Fermi level”', 'find n from a sketched band diagram'], path: ['EF', 'e_n_ni', 'n'] },
    limits: [
      { if: 'EF = Ei', then: 'n = ni.', latex: 'n = n_i' },
      { if: 'EF rises by kT ln 10', then: 'n × 10.', latex: '\\Delta E_F = 2.3\\,kT' },
    ],
    myths: [{ wrong: 'This is a different n than n = NC exp(−(Ec−EF)/kT).', better: 'Algebraic rewrite of the same Boltzmann electron count.' }],
    upstream: [{ id: 'e_n_nc', note: 'Band-edge form.' }, { id: 'ni', note: 'Prefactor.' }, { id: 'EF', note: 'The dial.' }],
    downstream: [{ id: 'e_np', note: 'Multiply by the hole partner.' }, { id: 'e_sigma', note: 'n feeds conductivity.' }],
    hold: { change: 'EF', held: ['T', 'ni', 'material'], result: 'n increases exponentially. p will fall if equilibrium is enforced.' },
    units: { parts: ['ni (cm^{-3})', 'dimensionless exponential'], result: 'cm^{-3}' },
    map: { x: 478, y: 438, kind: 'eq' },
  },

  e_p_ni: {
    id: 'e_p_ni', name: 'Holes from Ei', latex: 'p = n_i\\,e^{(E_i-E_F)/kT}', family: 'carrier', viz: 'boltzmann',
    vars: ['p', 'ni', 'Ei', 'EF', 'T'],
    story: {
      simple: 'The hole story is the electron story with the exponent flipped. Raise EF and holes vanish exponentially.',
      course: 'p = NV exp(−(EF−Ev)/kT) and ni = NV exp(−(Ei−Ev)/kT) divide to p/ni = exp((Ei−EF)/kT). Partner of n = ni exp((EF−Ei)/kT).',
      deep: 'The two exponents are exact negatives. That is the algebraic seed of np = ni². It is not an extra law. It is this pair multiplied.',
    },
    components: [
      { label: 'Physical idea', note: 'EF above Ei starves the valence band of holes.' },
      { label: 'Intrinsic scale', latex: 'n_i' },
      { label: 'Flipped exponent', latex: 'e^{(E_i-E_F)/kT}' },
    ],
    why: {
      simple: 'Whatever multiplies n must divide p if the product is to stay at ni².',
      course: 'Compare exponents: (EF−Ei) versus (Ei−EF). They cancel in a product. The exponential form is required by Boltzmann occupation, and the flip is required by 1−f.',
      deep: 'Under illumination you would write p = ni exp((Ei−Fp)/kT) with a hole quasi-Fermi level. Mass action then fails because Fn ≠ Fp.',
    },
    derivation: {
      intuition: 'Flip the electron exponent. That is a hole.',
      course: 'Divide the two NV forms.',
      deep: 'From 1−f in the valence band, or from p = ni²/n once n is known.',
    },
    use: ['EF below Ei on a band diagram.', 'Minority holes in n-type once n is known (or use mass action).'],
    not: {
      assumptions: ['Equilibrium Boltzmann statistics.'],
      breaks: ['Quasi-Fermi split.', 'Degenerate p-type.'],
    },
    exam: { cues: ['Ei − EF given', 'p from a band sketch'], path: ['EF', 'e_p_ni', 'p'] },
    limits: [
      { if: 'EF = Ei', then: 'p = ni.' },
      { if: 'EF rises', then: 'p falls by the exact inverse factor that n rose.' },
    ],
    myths: [{ wrong: 'n and p both rise when you dope.', better: 'At equilibrium one rises and the other falls. Their product is pinned.' }],
    upstream: [{ id: 'e_p_nv', note: 'Band-edge form.' }, { id: 'EF', note: 'The dial.' }],
    downstream: [{ id: 'e_np', note: 'Multiply by n.' }],
    hold: { change: 'EF', held: ['T', 'ni'], result: 'p decreases exponentially.' },
    units: { parts: ['ni (cm^{-3})', 'dimensionless exponential'], result: 'cm^{-3}' },
    map: { x: 830, y: 438, kind: 'eq' },
  },

  e_np: {
    id: 'e_np', name: 'Mass action', latex: 'np = n_i^2', family: 'carrier', viz: 'mass-action',
    vars: ['n', 'p', 'ni'],
    story: {
      simple: 'At equilibrium you may trade electrons for holes, but you cannot change their product. Doping slides the balance. Temperature and the material set the product.',
      course: 'Generation and recombination balance at equilibrium. Shifting EF makes more of one carrier and fewer of the other. Using the two Boltzmann forms, the EF exponentials cancel and np = ni².',
      deep: 'From detailed balance, the product of electron and hole concentrations in equilibrium equals the product of the thermally generated pair densities. Quasi-Fermi levels replace this by np = ni² exp((Fn−Fp)/kT) when the system is driven.',
    },
    components: [
      { label: 'Physical idea', note: 'EF redistributes n versus p. It does not create pairs.' },
      { label: 'Electron Boltzmann', latex: 'n = n_i e^{(E_F-E_i)/kT}' },
      { label: 'Hole Boltzmann', latex: 'p = n_i e^{(E_i-E_F)/kT}' },
      { label: 'Product', latex: 'np = n_i^2', note: 'The exponents cancel.' },
    ],
    why: {
      simple: 'Move EF up: n explodes, p collapses by the same factor. The product cannot notice EF.',
      course: 'n p = ni² exp((EF−Ei)/kT) exp((Ei−EF)/kT) = ni² exp(0) = ni². Inevitable once both carriers share one EF. Temperature still matters because ni(T) does.',
      deep: 'np = NC NV exp(−Eg/kT) = ni². The EF dependence cancelled, the gap dependence did not. That is why a wider-gap crystal has a much smaller equilibrium product.',
    },
    derivation: {
      intuition: 'One Fermi level. Two opposite Boltzmann tails. Their product forgets EF.',
      course: 'Multiply n = ni e^{(EF−Ei)/kT} by p = ni e^{(Ei−EF)/kT}.',
      deep: 'Or multiply n = NC e^{-(Ec−EF)/kT} by p = NV e^{-(EF−Ev)/kT}. The EF terms cancel and Ec−Ev = Eg, so np = NC NV e^{−Eg/kT} ≡ ni².',
    },
    use: ['Equilibrium, one carrier known, find the other.', 'p-type Si: p ≈ NA, then n = ni²/p.', 'After a neutrality solve, check n p equals ni².'],
    not: {
      assumptions: ['Thermal equilibrium (one EF).', 'Boltzmann statistics.', 'No large quasi-Fermi split.'],
      breaks: ['Forward-biased diode (np ≫ ni² in the injection region).', 'Light-generated pairs if recombination has not restored equilibrium.', 'T → 0 formal limit (ni → 0; freeze-out needs a different bookkeeping).'],
    },
    exam: {
      cues: ['NA or ND and ni given, asked for the minority', '“thermal equilibrium” + find n or p'],
      path: ['NA', 'e_p_na', 'p', 'e_np', 'n'],
    },
    limits: [
      { if: 'EF moves at fixed T', then: 'n and p trade; np stays ni². Drag the slider.', latex: 'np = n_i^2' },
      { if: 'T rises', then: 'ni rises, so the product rises. Mass action is not “np is always 10^{20}.”' },
    ],
    myths: [
      { wrong: 'Doping creates carriers without affecting the other type.', better: 'At equilibrium, extra majority carriers suppress the minority so np stays ni².' },
      { wrong: 'np = ni² always, even in a working LED.', better: 'Only at equilibrium. Injection is the point of an LED: np exceeds ni².' },
    ],
    upstream: [{ id: 'e_n_ni', note: 'Electron Boltzmann.' }, { id: 'e_p_ni', note: 'Hole Boltzmann.' }, { id: 'ni', note: 'The product scale.' }],
    downstream: [{ id: 'e_sigma', note: 'Once n and p are known, conductivity follows.' }, { id: 'e_neut', note: 'Mass action is the second equation in the neutrality solve.' }],
    hold: { change: 'EF', held: ['T', 'material', 'ni'], result: 'n rises, p falls, n×p stays ni².' },
    units: { parts: ['n (cm^{-3})', 'p (cm^{-3})', 'ni² (cm^{-6})'], result: 'both sides cm^{-6}' },
    map: { x: 654, y: 508, kind: 'eq' },
  },

  e_f: {
    id: 'e_f', name: 'Fermi–Dirac occupancy', latex: 'f(E)=\\dfrac{1}{1+e^{(E-E_F)/kT}}', family: 'fermi', viz: 'fermi',
    vars: ['f', 'E', 'EF', 'T'],
    story: {
      simple: 'Pick an energy. f tells you the chance that a state sitting there is occupied. It does not count how many states exist.',
      course: 'Electrons are fermions. In equilibrium the occupation of a state at energy E is the Fermi–Dirac function. f(EF) = 1/2 at any T > 0. Temperature smears the drop from 1 to 0 over a few kT.',
      deep: 'Grand-canonical ensemble for fermions: f = 1/(e^{(E−μ)/kT}+1) with μ = EF. At T = 0 this is a step. The Boltzmann tail is the x ≫ 1 limit. Carrier numbers still need a density of states: n = ∫ DOS(E) f(E) dE.',
    },
    components: [
      { label: 'Physical idea', note: 'Occupation probability versus energy.' },
      { label: 'Distance to EF', latex: '(E-E_F)/kT', note: 'The only combination that enters.' },
      { label: 'Fermi function', latex: '1/(1+e^{x})' },
    ],
    why: {
      simple: 'kT sets how sharply occupation falls through EF. Cold: a step. Hot: a smear.',
      course: 'Why this fraction? Fermions cannot share a state. The grand partition function of a single state is 1 + exp(−(E−EF)/kT). Average occupancy is the FD function. The exponential is the Boltzmann factor for adding one electron to that state.',
      deep: 'Derive from maximizing entropy at fixed N and U, or from the Fermi–Dirac distribution of noninteracting fermions. Degeneracy pressure is the T = 0 leftover of the same function.',
    },
    derivation: {
      intuition: 'States below EF want to be full. States above want to be empty. Heat blurs the border.',
      course: 'f = 1/(1+exp((E−EF)/kT)). At E = EF, f = 1/2. At E = EF+3kT, f ≈ 0.047.',
      deep: 'Z_1 = 1 + e^{−β(E−μ)}, ⟨n⟩ = (1/β) ∂ln Z_1/∂μ = f_FD.',
    },
    use: ['Any occupancy or “probability a state is filled” question.', 'Reading a band diagram together with T.'],
    not: {
      assumptions: ['Equilibrium (one EF).', 'Single-particle states.'],
      breaks: ['Two quasi-Fermi levels under bias or light.', 'Using f(E) as if it were a carrier density.'],
    },
    exam: { cues: ['“occupation probability”', 'T = 0 K step', 'f(EF) = ?'], path: ['E', 'EF', 'T', 'e_f', 'f'] },
    limits: [
      { if: 'T = 0', then: 'Step: 1 below EF, 0 above, 1/2 at EF.', latex: 'f = \\Theta(E_F-E)' },
      { if: 'E−EF ≫ kT', then: 'f ≈ e^{−(E−EF)/kT} (Boltzmann).' },
    ],
    myths: [
      { wrong: 'f(E) tells me how many electrons are at E.', better: 'It is the probability an available state is occupied. Number = available states × f.' },
      { wrong: 'EF is where the electrons are.', better: 'EF is the chemical-potential-like energy that centers f(E). Most electrons still sit in the valence band.' },
    ],
    upstream: [{ id: 'EF', note: 'Centers the curve.' }, { id: 'T', note: 'Smears it.' }],
    downstream: [{ id: 'e_n_nc', note: 'Conduction integral uses f(E).' }, { id: 'occupancy', note: 'The concept this equation is.' }],
    hold: { change: 'T', held: ['EF', 'E'], result: 'The step smears. f(EF) stays 1/2.' },
    units: { parts: ['E, EF, kT all energy'], result: 'dimensionless probability' },
    map: { x: 1220, y: 108, kind: 'eq' },
  },

  e_vd: {
    id: 'e_vd', name: 'Drift velocity', latex: 'v_d = \\mu \\mathcal{E}', family: 'transport', viz: 'drift',
    vars: ['vd', 'mun', 'Efield'],
    story: {
      simple: 'A field tugs on a carrier. Scattering stops it from accelerating forever. The leftover average speed is proportional to the field.',
      course: 'In the linear-response (low-field) limit the extra velocity is vd = μE. Mobility μ already hides the scattering time: μ = qτ/m*.',
      deep: 'The Boltzmann transport equation in the relaxation-time approximation yields a drift term qτE/m*. High-field velocity saturation (vd → vsat) is the first thing this equation drops.',
    },
    components: [
      { label: 'Physical idea', note: 'Average extra speed from a field.' },
      { label: 'Proportional response', latex: 'v_d = \\mu\\mathcal{E}' },
    ],
    why: {
      simple: 'Twice the field, twice the tug between collisions, twice the drift.',
      course: 'Between collisions a carrier accelerates a = qE/m*. Over a mean time τ the gained speed is (qτ/m*)E. That prefactor is μ. Multiplication is “response is linear.”',
      deep: 'Ohmic transport is the first moment of the perturbed distribution f0 + δf. Saturation appears when τ or the energy-loss rate depends on E.',
    },
    derivation: {
      intuition: 'Accelerate, smash, repeat. The average leftover speed tracks E.',
      course: 'm* dv/dt = qE − m*v/τ ⇒ steady vd = (qτ/m*)E = μE.',
      deep: 'Same from ⟨v⟩ = ∫ v δf d³k with δf = qτE·v (−∂f0/∂E).',
    },
    use: ['Low-field drift problems.', 'First step toward J = qnvd.'],
    not: {
      assumptions: ['Low field, constant μ, one scattering time.'],
      breaks: ['Velocity saturation.', 'Ballistic short channels.'],
    },
    exam: { cues: ['mobility and field given', 'drift velocity'], path: ['mun', 'Efield', 'e_vd', 'vd'] },
    limits: [{ if: 'E = 0', then: 'vd = 0. Only random thermal motion remains.' }],
    myths: [{ wrong: 'Carriers keep speeding up in a DC field.', better: 'Scattering balances the field. A constant average drift remains.' }],
    upstream: [{ id: 'mun', note: 'Material / scattering.' }, { id: 'Efield', note: 'The force.' }],
    downstream: [{ id: 'e_jn', note: 'Current uses this speed.' }],
    hold: { change: 'Efield', held: ['mun'], result: 'vd rises linearly.' },
    units: { parts: ['μ (cm²/V·s)', 'E (V/cm)'], result: 'cm/s' },
    map: { x: 300, y: 820, kind: 'eq' },
  },

  e_jn: {
    id: 'e_jn', name: 'Electron drift current', latex: 'J_n = qn\\mu_n\\mathcal{E}', family: 'transport', viz: 'drift',
    vars: ['J', 'q', 'n', 'mun', 'Efield'],
    story: {
      simple: 'Current is charge crossing a plane. More electrons, more charge per electron, or faster electrons: more current.',
      course: 'A density n of electrons each carrying charge q at drift speed vd gives current density J = q n vd. Put vd = μn E and Jn = q n μn E.',
      deep: 'This is the drift piece only. Diffusion current q n μn ∇(EF/q) or q Dn ∇n is a separate term. LatticeLab’s conductivity family is the uniform-field drift story.',
    },
    components: [
      { label: 'Physical idea', note: 'Moving electrons are a current.' },
      { label: 'Count × charge × speed', latex: 'J_n = qn v_d' },
      { label: 'Ohmic drift', latex: 'v_d = \\mu_n\\mathcal{E}' },
      { label: 'Together', latex: 'J_n = qn\\mu_n\\mathcal{E}' },
    ],
    why: {
      simple: 'Three multiplications because three independent knobs: how much charge per carrier, how many carriers, how fast they go.',
      course: 'If any one of q, n, μn doubles and the others stay put, Jn doubles. That is what “linear in each factor” means. Hold-constant is doing real work here.',
      deep: 'J = ρv in continuum electrodynamics. ρ_electron = −qn (sign conventions make Jn the conventional current of electrons moving opposite E).',
    },
    derivation: {
      intuition: 'Charge per volume, times velocity, is charge per area per time.',
      course: 'Jn = q n vd = q n μn E.',
      deep: 'From the first moment of the Boltzmann equation in a uniform field.',
    },
    use: ['n-type drift current.', 'Building σ from pieces.'],
    not: {
      assumptions: ['Uniform n, drift only, constant μn.'],
      breaks: ['Diffusion-dominated regions (neutral diffusion, depletion edges).'],
    },
    exam: { cues: ['find electron current density', 'n, μn, E given'], path: ['n', 'mun', 'Efield', 'e_jn', 'J'] },
    limits: [{ if: 'n = 0', then: 'Jn = 0 even if μn is huge.' }],
    myths: [{ wrong: 'Current needs a complete circuit of electrons only.', better: 'Holes carry conventional current too. That is the next equation.' }],
    upstream: [{ id: 'e_vd', note: 'The speed.' }, { id: 'n', note: 'The count.' }],
    downstream: [{ id: 'e_sigma', note: 'Add holes, divide by E.' }],
    hold: { change: 'n', held: ['q', 'mun', 'Efield'], result: 'Jn rises in exact proportion to n.' },
    units: { parts: ['q (C)', 'n (cm^{-3})', 'μ (cm²/V·s)', 'E (V/cm)'], result: 'A/cm²' },
    map: { x: 500, y: 820, kind: 'eq' },
  },

  e_jp: {
    id: 'e_jp', name: 'Hole drift current', latex: 'J_p = qp\\mu_p\\mathcal{E}', family: 'transport', viz: 'drift',
    vars: ['J', 'q', 'p', 'mup', 'Efield'],
    story: {
      simple: 'Holes are +q and they drift with the field. They add a second current channel.',
      course: 'Same construction as electrons: Jp = q p vd,p = q p μp E. Conventional current from holes points with E, same as the conventional electron current (electrons move against E).',
      deep: 'A hole is a missing valence electron. The remaining sea shifting against the field is equivalent to a +q particle drifting with the field. That is why the signs add in J = Jn + Jp.',
    },
    components: [
      { label: 'Physical idea', note: 'Missing valence electrons also move charge.' },
      { label: 'Hole channel', latex: 'J_p = qp\\mu_p\\mathcal{E}' },
    ],
    why: {
      simple: 'Holes add, they do not cancel electrons, because both produce conventional current in the same direction.',
      course: 'Electrons: negative charge, velocity against E, product J with E. Holes: positive charge, velocity with E, product J with E. Addition is a sign story, not a coincidence.',
      deep: 'The valence-band group velocity of a missing electron is opposite the filled-sea contribution, producing +q behavior.',
    },
    derivation: {
      intuition: 'Copy the electron argument. Change n→p and μn→μp.',
      course: 'Jp = q p μp E.',
      deep: 'Same Boltzmann first-moment argument on the valence band.',
    },
    use: ['p-type current.', 'Why intrinsic conductivity still has two terms.'],
    not: {
      assumptions: ['Drift only, uniform p.'],
      breaks: ['Recombination-generation currents defined another way in a depletion region.'],
    },
    exam: { cues: ['hole current density'], path: ['p', 'mup', 'Efield', 'e_jp', 'J'] },
    limits: [{ if: 'p ≪ n and μp is not huge', then: 'Jp is a correction. Electrons own J.' }],
    myths: [{ wrong: 'Electron and hole currents subtract.', better: 'Both add to conventional J.' }],
    upstream: [{ id: 'p', note: 'Hole count.' }],
    downstream: [{ id: 'e_sigma', note: 'The second term inside σ.' }],
    hold: { change: 'p', held: ['q', 'mup', 'Efield'], result: 'Jp rises linearly with p.' },
    units: { parts: ['q p μp E'], result: 'A/cm²' },
    map: { x: 680, y: 820, kind: 'eq' },
  },

  e_je: {
    id: 'e_je', name: 'Ohm’s law (local)', latex: 'J = \\sigma\\mathcal{E}', family: 'transport', viz: 'resistivity',
    vars: ['J', 'sigma', 'Efield'],
    story: {
      simple: 'A material that conducts well gives a lot of current for a little field. That ratio is σ.',
      course: 'In a linear isotropic conductor, J and E point together and the ratio is the conductivity. This is the local form of Ohm’s law. Resistance of a bar is the geometry-dressed version of the same idea.',
      deep: 'J_i = σ_{ij} E_j in a crystal. Cubic semiconductors are treated as scalars in ESE 2180. The inverse tensor is resistivity.',
    },
    components: [
      { label: 'Physical idea', note: 'Current density tracks electric field.' },
      { label: 'Definition of σ', latex: 'J = \\sigma\\mathcal{E}' },
    ],
    why: {
      simple: 'If every microscopic current piece is linear in E, the total is linear in E.',
      course: 'Jn + Jp = q(nμn+pμp)E. The thing multiplying E is σ. So J = σE is not a new law. It is the transport family packaged.',
      deep: 'Linear response: J(ω) = σ(ω)E(ω). DC homework uses the ω = 0 value.',
    },
    derivation: {
      intuition: 'Add the two carrier currents. Factor E.',
      course: 'J = q(nμn+pμp)E = σE.',
      deep: 'Kubo formula in the DC limit, far beyond the course.',
    },
    use: ['Given σ and E, find J.', 'Connect to ρ through E = ρJ.'],
    not: {
      assumptions: ['Linear, local, isotropic, steady drift.'],
      breaks: ['Breakdown, velocity saturation, displacement current in capacitors.'],
    },
    exam: { cues: ['J and E', 'conductivity given'], path: ['sigma', 'Efield', 'e_je', 'J'] },
    limits: [{ if: 'σ → 0', then: 'You need a huge E for any J. That is an insulator.' }],
    myths: [{ wrong: 'Ohm’s law is V = IR only for metals.', better: 'J = σE is the local statement. V = IR follows for a uniform bar.' }],
    upstream: [{ id: 'e_sigma', note: 'What σ is.' }],
    downstream: [{ id: 'e_rho', note: 'Invert the same relation.' }],
    hold: { change: 'Efield', held: ['sigma'], result: 'J rises linearly.' },
    units: { parts: ['σ (S/cm)', 'E (V/cm)'], result: 'A/cm²' },
    map: { x: 860, y: 880, kind: 'eq' },
  },

  e_sigma: {
    id: 'e_sigma', name: 'Conductivity', latex: '\\sigma = q(n\\mu_n+p\\mu_p)', family: 'transport', viz: 'conductivity',
    vars: ['sigma', 'q', 'n', 'mun', 'p', 'mup'],
    story: {
      simple: 'A semiconductor conducts because mobile electrons and holes move in a field. Electrons contribute some current. Holes contribute some current. Total conductivity is the sum.',
      course: 'Electron contribution = q n μn. Hole contribution = q p μp. Therefore σ = q(nμn + pμp). T is not written here, but T can change n, p, and the mobilities, so σ still depends on temperature indirectly.',
      deep: 'σ = q ∑_i n_i μ_i over every mobile species. In a compensated crystal both terms can matter. In a good metal the hole term is dropped and n is huge.',
    },
    components: [
      { label: 'Physical idea', note: 'Two parallel fluids of charge.' },
      { label: 'Electron channel', latex: 'q n \\mu_n' },
      { label: 'Hole channel', latex: 'q p \\mu_p' },
      { label: 'Add', latex: '\\sigma = q(n\\mu_n+p\\mu_p)' },
    ],
    why: {
      simple: 'Multiply because charge, count, and ease of motion each scale the current. Add because both carriers help conventional current.',
      course: 'From Jn = qnμnE and Jp = qpμpE, J = (qnμn+qpμp)E. The factor in front of E is σ. Visualize the three multipliers separately, then the sum.',
      deep: 'Each species contributes qniμi from its own relaxation time. Matthiessen’s rule may mix scattering into μ(T, doping). That is why μ is not a true constant when T changes.',
    },
    derivation: {
      intuition: 'How much charge, how many pieces, how easily they slide. Then add holes.',
      course: 'J = Jn + Jp = q(nμn+pμp)E ⇒ σ = J/E = q(nμn+pμp).',
      deep: 'Drude for two carriers. Same algebra.',
    },
    use: ['n, p, μ known, find σ or later ρ.', 'Intrinsic: n = p = ni so σ = q ni (μn+μp).'],
    not: {
      assumptions: ['Both carriers free, low-field μ, uniform sample.'],
      breaks: ['Using only qnμn in a p-type sample.', 'Ignoring that μ itself falls as doping or T rises.'],
    },
    exam: {
      cues: ['n, p, μn, μp given, resistivity or conductivity asked'],
      path: ['n', 'p', 'mun', 'mup', 'e_sigma', 'sigma'],
    },
    limits: [
      { if: 'n ≫ p', then: 'σ ≈ q n μn', latex: '\\sigma \\approx qn\\mu_n' },
      { if: 'p ≫ n', then: 'σ ≈ q p μp', latex: '\\sigma \\approx qp\\mu_p' },
      { if: 'n = p = ni', then: 'σ = q ni (μn+μp)' },
      { if: 'μn ≫ μp', then: 'Electrons can dominate σ even when n is only somewhat larger than p.' },
    ],
    myths: [
      { wrong: 'σ does not depend on temperature because T is not in the formula.', better: 'T is an indirect cause: it moves n, p, and μ, which move σ.' },
      { wrong: 'Only electrons conduct.', better: 'Holes are a second term. In p-type they are the term.' },
    ],
    upstream: [
      { id: 'e_n_ni', note: 'EF → n.' }, { id: 'e_p_ni', note: 'EF → p.' },
      { id: 'e_neut', note: 'Doping → n, p.' }, { id: 'mun', note: 'Material table.' },
    ],
    downstream: [{ id: 'e_rho', note: 'ρ = 1/σ.' }, { id: 'e_je', note: 'J = σE.' }],
    hold: { change: 'n', held: ['p', 'mun', 'mup', 'q'], result: 'Only the electron channel grows. σ rises linearly with that n.' },
    units: { parts: ['q (C)', 'n (cm^{-3})', 'μ (cm²/V·s)'], result: 'S/cm  (A/V·cm)' },
    map: { x: 860, y: 760, kind: 'eq' },
  },

  e_rho: {
    id: 'e_rho', name: 'Resistivity', latex: '\\rho = 1/\\sigma', family: 'transport', viz: 'resistivity',
    vars: ['rho', 'sigma'],
    story: {
      simple: 'Conductivity says how much current a field produces. Resistivity says how much field a current requires. Same material, inverted sentence.',
      course: 'J = σE and E = ρJ describe the same linear material. Therefore ρ = 1/σ. A wafer data sheet usually quotes Ω·cm, which is ρ, not σ.',
      deep: 'For a tensor, ρ = σ^{-1} as matrices. In 1D homework they are ordinary reciprocals. Series and parallel combinations of bars use ρ with geometry, not this scalar inverse alone.',
    },
    components: [
      { label: 'Physical idea', note: 'Easy flow versus hard flow.' },
      { label: 'Current form', latex: 'J = \\sigma\\mathcal{E}' },
      { label: 'Field form', latex: '\\mathcal{E} = \\rho J' },
      { label: 'Therefore', latex: '\\rho = 1/\\sigma' },
    ],
    why: {
      simple: 'If twice the current falls out of the same field, you needed only half the field for a given current. That is half the resistivity.',
      course: 'Solve J = σE for E: E = (1/σ) J. The definition of ρ is E = ρJ, so ρ = 1/σ. Visualize the same bar: large σ is a steep J–E line; large ρ is a steep E–J line.',
      deep: 'The inverse is algebraic, not a new scattering mechanism. All the physics already sat in σ.',
    },
    derivation: {
      intuition: 'Invert the slope of the J–E line.',
      course: 'J = σE ⇒ E = J/σ ⇒ ρ = 1/σ.',
      deep: 'Invert the conductivity tensor when anisotropy matters.',
    },
    use: ['After σ, homework almost always wants ρ.', 'Four-point probe data.'],
    not: {
      assumptions: ['Scalar linear medium.'],
      breaks: ['Writing ρ = 1/(qnμn) in a sample where holes matter.', 'Confusing resistivity with resistance (R = ρ L/A).'],
    },
    exam: { cues: ['find resistivity', 'Ω·cm'], path: ['e_sigma', 'sigma', 'e_rho', 'rho'] },
    limits: [
      { if: 'σ → ∞', then: 'ρ → 0, a perfect conductor.' },
      { if: 'σ → 0', then: 'ρ → ∞, an insulator.' },
    ],
    myths: [{ wrong: 'High resistivity means many carriers.', better: 'High resistivity means small σ: few carriers, sluggish carriers, or both.' }],
    upstream: [{ id: 'e_sigma', note: 'Compute σ first.' }],
    downstream: [{ id: 'rho', note: 'Device resistance R = ρL/A.' }],
    hold: { change: 'sigma', held: [], result: 'ρ is exactly the reciprocal. Nothing else is hiding.' },
    units: { parts: ['σ (S/cm)'], result: 'Ω·cm' },
    map: { x: 1160, y: 760, kind: 'eq' },
  },

  e_ni: {
    id: 'e_ni', name: 'Intrinsic concentration vs T', latex: 'n_i \\propto T^{3/2} e^{-E_g/(2kT)}', family: 'temperature', viz: 'niT',
    vars: ['ni', 'T', 'Eg'],
    story: {
      simple: 'Heat tries to throw electrons across the gap. A bigger gap, or a colder crystal, makes that exponentially rare. There is also a milder T^{3/2} from “more states.”',
      course: 'ni² = NC NV exp(−Eg/kT) and NC, NV ∝ T^{3/2}, so ni ∝ T^{3/2} exp(−Eg/(2kT)). The exponential owns the plot. The teaching model in this lab is ni(T) = ni(300)(T/300)^{3/2} exp[(Eg/2k)(1/300−1/T)].',
      deep: 'The 1/2 in the exponent is a square root: ni = sqrt(NC NV) e^{−Eg/2kT}. Eg itself shrinks slowly with T (Varshni). ESE 2180 usually holds Eg fixed, as this portal does.',
    },
    components: [
      { label: 'Physical idea', note: 'Thermal pair generation across Eg.' },
      { label: 'State-count piece', latex: 'T^{3/2}', note: 'NC and NV grow with T.' },
      { label: 'Activation piece', latex: 'e^{-E_g/(2kT)}', note: 'The expensive jump.' },
    ],
    why: {
      simple: 'You must pay Eg to make one pair. Split across two carriers, each looks like it paid Eg/2. That is the 2 in the exponent.',
      course: 'np = NC NV e^{−Eg/kT}. At intrinsic, n = p = ni, so ni² = NC NV e^{−Eg/kT}. Take the square root: ni = √(NC NV) e^{−Eg/2kT}. The T^{3/2} is √(T³) from the two effective densities of states.',
      deep: 'Why exp(−Eg/kT) in the product? Creating a pair costs Eg in the Boltzmann factor. Why not Eg in ni itself? Because ni is the geometric mean of the two carriers.',
    },
    derivation: {
      intuition: 'Pairs cost Eg. The typical carrier therefore carries an activation Eg/2.',
      course: 'ni = √(NC NV) exp(−Eg/2kT), NC,NV ∝ T^{3/2}. LatticeLab scales from the table’s ni(300 K).',
      deep: 'From ni² = NC NV e^{−Eg/kT} after the EF terms cancelled in mass action.',
    },
    use: ['Any T ≠ 300 K carrier problem.', 'Why Ge is intrinsic sooner than Si.'],
    not: {
      assumptions: ['Fixed Eg, parabolic bands, equilibrium.', 'The homework ni(300) as the anchor.'],
      breaks: ['Using 300 K ni at 400 K.', 'Expecting the T^{3/2} to beat the exponential (it never does in this course’s range).'],
    },
    exam: { cues: ['ni at another temperature', '“increases with T”', 'Tmax before the majority approximation dies'], path: ['T', 'Eg', 'e_ni', 'ni'] },
    limits: [
      { if: 'T → 0', then: 'ni → 0. No thermal pairs.', latex: 'n_i \\to 0' },
      { if: 'Eg larger', then: 'ni collapses. CdS versus InAs on the same T slider.' },
    ],
    myths: [
      { wrong: 'ni doubles when T doubles.', better: 'The exponential in 1/T dominates. 300 K to 400 K in Si is far more than a 4/3 factor.' },
    ],
    upstream: [{ id: 'T', note: 'Thermal scale.' }, { id: 'Eg', note: 'The bill.' }],
    downstream: [{ id: 'e_np', note: 'ni² is the product.' }, { id: 'e_n_ni', note: 'Prefactor of the EF forms.' }],
    hold: { change: 'T', held: ['Eg', 'material'], result: 'ni rises, slowly from T^{3/2}, violently from the exponential.' },
    units: { parts: ['T^{3/2}', 'dimensionless exp', 'anchor ni(300)'], result: 'cm^{-3}' },
    map: { x: 1400, y: 400, kind: 'eq' },
  },

  e_n_nd: {
    id: 'e_n_nd', name: 'n-type majority approximation', latex: 'n \\approx N_D', family: 'doping', viz: 'neutrality',
    vars: ['n', 'ND'],
    story: {
      simple: 'A donor that is ionized donates one electron. If donors outnumber acceptors and intrinsic pairs, those donated electrons are almost the whole n.',
      course: 'Complete ionization, ND ≫ NA, ND ≫ ni: charge neutrality collapses to n ≈ ND − NA ≈ ND. Then p = ni²/n is tiny. This is an approximation with a checklist, not a law.',
      deep: 'The exact solve is n = (ND−NA)/2 + sqrt(((ND−NA)/2)²+ni²). The approximation is the ND ≫ ni edge of that quadratic. Freeze-out (T small, ED > 3kT) knocks it down because ND is not ionized.',
    },
    components: [
      { label: 'Physical idea', note: 'Ionized donors supply the electrons.' },
      { label: 'Checklist', note: 'ionized · uncompensated · extrinsic' },
      { label: 'Result', latex: 'n \\approx N_D' },
    ],
    why: {
      simple: 'Each ionized donor adds one mobile electron and one fixed + charge. Neutrality then wants n ≈ ND.',
      course: 'n + NA− = p + ND+. With NA ≈ 0, NA− ≈ 0, p ≈ 0, ND+ ≈ ND, you get n ≈ ND. Drop any one of those and the shortcut dies.',
      deep: 'The quadratic’s large-net-doping expansion is n = Nnet + ni²/Nnet + … so the relative error is (ni/ND)², not ni/ND.',
    },
    derivation: {
      intuition: 'Donated electrons have nowhere else to come from if ni is tiny.',
      course: 'Neutrality + mass action → quadratic. Limit ND ≫ ni.',
      deep: 'n = Nnet/2 + sqrt((Nnet/2)²+ni²) ∼ Nnet when |Nnet| ≫ ni.',
    },
    use: ['Strong n-type, 300 K, shallow donors, “find n”.', 'Then minority p = ni²/ND.'],
    not: {
      assumptions: ['Complete ionization.', 'ND ≫ NA.', 'ND ≫ ni.', 'Equilibrium.'],
      breaks: ['Compensation comparable to ND.', 'Intrinsic regime (hot, or tiny doping).', 'Freeze-out.', 'Photo-generation comparable to ND.'],
    },
    exam: { cues: ['n-type, ND given, 300 K Si or GaAs', 'then find the minority'], path: ['ND', 'e_n_nd', 'n', 'e_np', 'p'] },
    limits: [
      { if: 'ni approaches ND', then: 'Use the full quadratic. n is larger than ND.' },
      { if: 'T → 0', then: 'Donors freeze. n → 0, not ND.' },
    ],
    myths: [{ wrong: 'n = ND is the definition of n-type.', better: 'It is a majority approximation. Intrinsic and compensated crystals are still well-defined without it.' }],
    upstream: [{ id: 'ND', note: 'Doping knob.' }, { id: 'T', note: 'Ionization and ni.' }],
    downstream: [{ id: 'e_np', note: 'Get the minority.' }, { id: 'e_sigma', note: 'n then sets σ.' }],
    hold: { change: 'ND', held: ['T', 'NA≈0', 'ionization'], result: 'n tracks ND only while the checklist holds. Watch the live warning.' },
    units: { parts: ['ND (cm^{-3})'], result: 'n (cm^{-3})' },
    map: { x: 260, y: 448, kind: 'eq' },
  },

  e_p_na: {
    id: 'e_p_na', name: 'p-type majority approximation', latex: 'p \\approx N_A', family: 'doping', viz: 'neutrality',
    vars: ['p', 'NA'],
    story: {
      simple: 'An ionized acceptor has stolen an electron from the valence band and left a hole. If acceptors dominate, p ≈ NA.',
      course: 'Mirror of n ≈ ND. Complete ionization, NA ≫ ND, NA ≫ ni ⇒ p ≈ NA − ND ≈ NA, then n = ni²/p.',
      deep: 'Same quadratic with the sign of net doping flipped. The error is again (ni/NA)² relative, until freeze-out or compensation.',
    },
    components: [
      { label: 'Physical idea', note: 'Ionized acceptors supply holes.' },
      { label: 'Checklist', note: 'ionized · uncompensated · extrinsic' },
      { label: 'Result', latex: 'p \\approx N_A' },
    ],
    why: {
      simple: 'Each A− is a hole that was pulled from the valence band.',
      course: 'Neutrality n + NA− = p + ND+ with n ≈ 0, ND ≈ 0, NA− ≈ NA gives p ≈ NA.',
      deep: 'p = |Nnet|/2 + sqrt((Nnet/2)²+ni²) for Nnet = ND−NA < 0.',
    },
    derivation: {
      intuition: 'Stolen valence electrons become the hole population.',
      course: 'Quadratic limit NA ≫ ni.',
      deep: 'Same expansion as the donor case.',
    },
    use: ['p-type exam lines: “NA = 10^{16} cm^{-3}, find n”.'],
    not: {
      assumptions: ['Ionized, NA ≫ ND, NA ≫ ni.'],
      breaks: ['NA = 10 cm^{-3} in Si (homework trap: that is ≪ ni).', 'Compensation.', 'Freeze-out.'],
    },
    exam: { cues: ['p-type, NA given', 'find electron concentration'], path: ['NA', 'e_p_na', 'p', 'e_np', 'n'] },
    limits: [
      { if: 'NA ≪ ni', then: 'p ≈ ni, not NA. The crystal is intrinsic.' },
    ],
    myths: [{ wrong: 'Always write p = NA when the word p-type appears.', better: 'Check NA against ni and against ND first.' }],
    upstream: [{ id: 'NA', note: 'Doping knob.' }],
    downstream: [{ id: 'e_np', note: 'Minority electrons.' }],
    hold: { change: 'NA', held: ['T', 'ND≈0'], result: 'p tracks NA only on the checklist.' },
    units: { parts: ['NA (cm^{-3})'], result: 'p (cm^{-3})' },
    map: { x: 110, y: 448, kind: 'eq' },
  },

  e_neut: {
    id: 'e_neut', name: 'Charge neutrality', latex: 'n + N_A^- = p + N_D^+', family: 'doping', viz: 'neutrality',
    vars: ['n', 'p', 'NA', 'ND'],
    story: {
      simple: 'A bulk semiconductor does not keep a net charge. Every mobile charge is balanced by an opposite mobile or ionized-impurity charge.',
      course: 'With complete ionization, NA− = NA and ND+ = ND, so n + NA = p + ND. Together with np = ni² this is a quadratic for n: n = (ND−NA)/2 + sqrt(((ND−NA)/2)² + ni²).',
      deep: 'This is macroscopic neutrality, not a local Poisson statement. In a depletion region Poisson’s equation replaces this algebraic constraint and n, p are no longer the neutrality pair.',
    },
    components: [
      { label: 'Physical idea', note: 'Bulk charge adds to zero.' },
      { label: 'Negative pieces', latex: 'n + N_A^-' },
      { label: 'Positive pieces', latex: 'p + N_D^+' },
      { label: 'Plus mass action', latex: 'p = n_i^2/n' },
    ],
    why: {
      simple: 'If the crystal charged up, a huge electric field would pull carriers until it neutralized.',
      course: 'Two unknowns n and p need two equations: neutrality (charge) and mass action (equilibrium statistics). Neither alone is enough. That is why exam paths look like NA, ND, ni → quadratic → n, p.',
      deep: 'The quadratic is the positive root of n − (ND−NA) − ni²/n = 0. Choosing the +sqrt keeps n > 0.',
    },
    derivation: {
      intuition: 'Count minus charges, count plus charges, set them equal. Use np = ni² to eliminate p.',
      course: 'n + NA = ni²/n + ND. Multiply by n: n² − (ND−NA)n − ni² = 0. Quadratic formula, positive root.',
      deep: 'Incomplete ionization replaces NA by NA f_A(EF,T) and the algebra becomes transcendental in EF.',
    },
    use: ['Both NA and ND given.', 'Compensation.', 'ni comparable to net doping.', 'Anytime n = ND feels illegal.'],
    not: {
      assumptions: ['Neutral bulk, equilibrium, usually complete ionization.'],
      breaks: ['Depletion region (space charge is the point).', 'Surface charge, 2D gases.', 'Strong injection where quasi-neutrality uses Δn ≈ Δp instead.'],
    },
    exam: { cues: ['NA and ND both given', 'compensated', 'find n and p, not just the majority shortcut'], path: ['NA', 'ND', 'ni', 'e_neut', 'n', 'p'] },
    limits: [
      { if: 'ND−NA ≫ ni', then: 'n ≈ ND−NA, p ≈ ni²/n.' },
      { if: 'NA = ND', then: 'n = p = ni (compensation back to intrinsic carriers).' },
    ],
    myths: [{ wrong: 'Charge neutrality means n = p.', better: 'n = p only if there is no net ionized doping. Neutrality includes the impurity ions.' }],
    upstream: [{ id: 'NA', note: 'Acceptors.' }, { id: 'ND', note: 'Donors.' }, { id: 'e_np', note: 'Second equation.' }],
    downstream: [{ id: 'EF', note: 'n places EF.' }, { id: 'e_sigma', note: 'n and p place σ.' }],
    hold: { change: 'ND', held: ['NA', 'T', 'ni'], result: 'Net doping slides n up the quadratic. p falls through mass action.' },
    units: { parts: ['every term a concentration'], result: 'cm^{-3} = cm^{-3}' },
    map: { x: 186, y: 548, kind: 'eq' },
  },
};

export const PATHS = [
  {
    id: 'na-ni-n',
    known: ['NA', 'ni'],
    find: 'n',
    steps: [
      { id: 'e_p_na', note: 'Strong p-type checklist: p ≈ NA.' },
      { id: 'e_np', note: 'Equilibrium: n = ni²/p.' },
    ],
  },
  {
    id: 'nd-ni-p',
    known: ['ND', 'ni'],
    find: 'p',
    steps: [
      { id: 'e_n_nd', note: 'Strong n-type checklist: n ≈ ND.' },
      { id: 'e_np', note: 'p = ni²/n.' },
    ],
  },
  {
    id: 'eg-lg',
    known: ['Eg'],
    find: 'lg',
    steps: [
      { id: 'e_hc', note: 'Photon energy is hc/λ.' },
      { id: 'e_lg', note: 'Set E = Eg. λg = hc/Eg.' },
    ],
  },
  {
    id: 'lam-e',
    known: ['lambda'],
    find: 'Eph',
    steps: [{ id: 'e_hc', note: 'E = hc/λ (1240/λ in eV and nm).' }],
  },
  {
    id: 'doping-rho',
    known: ['NA', 'ND', 'ni', 'mun', 'mup'],
    find: 'rho',
    steps: [
      { id: 'e_neut', note: 'Neutrality + mass action fix n and p.' },
      { id: 'e_sigma', note: 'σ = q(nμn+pμp).' },
      { id: 'e_rho', note: 'ρ = 1/σ.' },
    ],
  },
  {
    id: 'ef-n',
    known: ['EF', 'ni', 'T'],
    find: 'n',
    steps: [{ id: 'e_n_ni', note: 'n = ni exp((EF−Ei)/kT).' }],
  },
  {
    id: 'n-p-sigma',
    known: ['n', 'p', 'mun', 'mup'],
    find: 'sigma',
    steps: [{ id: 'e_sigma', note: 'Multiply charge, count, mobility. Add channels.' }],
  },
  {
    id: 't-ni',
    known: ['T', 'Eg'],
    find: 'ni',
    steps: [{ id: 'e_ni', note: 'ni ∝ T^{3/2} exp(−Eg/2kT), anchored at the table’s 300 K value.' }],
  },
];

export function equation(id) {
  return EQUATIONS[id];
}

export function equationsInFamily(fam) {
  return Object.values(EQUATIONS).filter((e) => e.family === fam);
}

export function findPath(known, find) {
  const have = new Set(known);
  const hit = PATHS.find((p) => p.find === find && p.known.every((k) => have.has(k)));
  if (hit) return hit;
  const loose = PATHS.find((p) => p.find === find && p.known.every((k) => have.has(k) || k === 'ni' || k === 'T'));
  return loose || null;
}
