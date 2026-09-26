/** Conceptual drawing checks — features, not pixels. */

export const DRAW_TASKS = [
  {
    id: 'd-fd', cat: 'fermi', title: 'Fermi–Dirac at three temperatures',
    prompt: 'Place the 1/2 pivot and choose how wide the smear is at this T.',
    kind: 'fermi',
  },
  {
    id: 'd-lg', cat: 'photon', title: 'Absorption edge',
    prompt: 'A 1.9 eV direct gap. Place λg on the wavelength axis, then say which side absorbs.',
    kind: 'edge',
  },
  {
    id: 'd-reg', cat: 'temperature', title: 'Three temperature regimes',
    prompt: 'An n-doped crystal. Assign freeze-out, extrinsic, and intrinsic to low / mid / high T.',
    kind: 'regimes',
  },
  {
    id: 'd-ek', cat: 'band', title: 'Photon on E–k',
    prompt: 'For GaAs (direct) vs Si (indirect), should the photon arrow be vertical?',
    kind: 'ek',
  },
  {
    id: 'd-miller', cat: 'miller', title: 'Zero index',
    prompt: 'Which axis is (110) parallel to?',
    kind: 'miller',
  },
  {
    id: 'd-n', cat: 'crystal', title: 'Atoms per conventional cell',
    prompt: 'Assign N for SC, BCC, FCC, and diamond cubic.',
    kind: 'cell',
  },
  {
    id: 'd-imp', cat: 'doping', title: 'Impurity in the gap',
    prompt: 'A level sits 40 meV below Ec at 300 K (3kT ≈ 78 meV). What is it?',
    kind: 'impurity',
  },
];

export function gradeDraw(task, payload) {
  if (task.kind === 'fermi') {
    const t = Number(payload.T);
    const smear = payload.smear;
    const want = t < 20 ? 'none' : t < 400 ? 'narrow' : 'wide';
    const pivotOk = payload.pivot === 'half';
    return {
      ok: pivotOk && smear === want,
      notes: [
        pivotOk ? 'Pivot at f = 1/2 is correct.' : 'The pivot is always f = 1/2.',
        smear === want ? 'Smear width matches kT.' : `At ${t} K the smear should be ${want}.`,
      ],
    };
  }
  if (task.kind === 'edge') {
    const lam = Number(payload.lg);
    const side = payload.side;
    const okLam = Math.abs(lam - 653) <= 40;
    const okSide = side === 'short';
    return {
      ok: okLam && okSide,
      notes: [
        okLam ? 'λg ≈ 653 nm.' : 'λg = 1240/1.9 ≈ 653 nm.',
        okSide ? 'Short λ (high E) absorbs.' : 'Absorption is λ < λg, not the red side.',
      ],
    };
  }
  if (task.kind === 'regimes') {
    const ok = payload.low === 'freeze' && payload.mid === 'ext' && payload.high === 'int';
    return {
      ok,
      notes: [ok ? 'Low freeze-out, mid extrinsic, high intrinsic.' : 'Order is freeze-out → extrinsic plateau → intrinsic takeover.'],
    };
  }
  if (task.kind === 'ek') {
    const ok = payload.gaas === 'vert' && payload.si === 'vert-plus-phonon';
    return {
      ok,
      notes: [ok ? 'Both photons are vertical. Si adds a horizontal phonon.' : 'A photon is still nearly vertical in Si. The phonon supplies Δk.'],
    };
  }
  if (task.kind === 'miller') {
    const ok = payload.axis === 'z';
    return {
      ok,
      notes: [ok ? 'l = 0 ⇒ parallel to z.' : '(110) never hits z.'],
    };
  }
  if (task.kind === 'cell') {
    const ok = payload.sc === '1' && payload.bcc === '2' && payload.fcc === '4' && payload.dia === '8';
    return {
      ok,
      notes: [ok ? 'SC 1, BCC 2, FCC 4, diamond 8. Density still needs a and mass.' : 'Ownership: corners 1/8, faces 1/2, body and diamond internals 1.'],
    };
  }
  if (task.kind === 'impurity') {
    const ok = payload.role === 'donor';
    return {
      ok,
      notes: [ok ? 'Near Ec and inside 3kT: effective donor.' : '40 meV below Ec is a shallow donor, not an acceptor or a midgap trap.'],
    };
  }
  return { ok: false, notes: ['Unknown task.'] };
}
