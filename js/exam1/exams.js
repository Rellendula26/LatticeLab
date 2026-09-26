import { BANK, rubricCat } from './bank.js';

export const EXAM_DEFS = {
  1: {
    id: 1, title: 'Practice Exam 1',
    blurb: 'Crystals and optical tickets first, then doping and temperature.',
    ids: [
      'c-sc-n', 'm-zero-l', 'b-photon-k', 'p-eg-lg', 'f-half',
      'd-inp-acc', 'car-ef-n', 'tr-mu-sigma', 't-regimes', 'pn-fwd',
      'o-beer', 'eq-error-student', 'c-n-not-rho', 'p-cds-635',
    ],
  },
  2: {
    id: 2, title: 'Practice Exam 2',
    blurb: 'Fermi meaning, compensation traps, Ge vs Si.',
    ids: [
      'c-fcc-n', 'm-from-ints', 'b-si-emit', 'p-white-inas', 'f-t0',
      'd-na10', 'd-comp', 't-eg-onset', 't-tmax', 'pn-w-dop',
      'eq-chain-nd', 'f-ef-not-home', 'p-cdse-470', 'tr-r',
    ],
  },
  3: {
    id: 3, title: 'Practice Exam 3',
    blurb: 'Ionization windows, mass action, reverse bias.',
    ids: [
      'c-diamond-n', 'm-bar', 'm-dir-neg', 'b-direct', 'p-below',
      'f-not-count', 'd-cds-t', 'd-t0-nd', 'car-np-led', 'car-gaas-ni',
      't-plateau', 't-rank-ni', 'pn-side', 'pn-rev', 'eq-light-lg',
    ],
  },
};

const QUOTA = [
  ['crystal', 1], ['miller', 1], ['band', 1], ['photon', 2],
  ['fermi', 2], ['doping', 2], ['carriers', 2], ['transport', 1],
  ['temperature', 2], ['pn', 1], ['optics', 1], ['equations', 1],
];

export function questionsForExam(id) {
  const def = EXAM_DEFS[id];
  if (!def) return [];
  return def.ids.map((qid) => BANK.find((q) => q.id === qid)).filter(Boolean);
}

export function generateExam(seed) {
  const rng = mulberry(seed >>> 0);
  const picked = [];
  const used = new Set();
  QUOTA.forEach(([cat, n]) => {
    const pool = BANK.filter((q) => q.cat === cat && !used.has(q.id));
    shuffle(pool, rng);
    pool.slice(0, n).forEach((q) => {
      used.add(q.id);
      picked.push(q);
    });
  });
  shuffle(picked, rng);
  return picked;
}

export function scoreExam(questions, answers) {
  let right = 0;
  const byRubric = {};
  const diagnoses = [];
  questions.forEach((q) => {
    const got = grade(q, answers[q.id]);
    const bucket = rubricCat(q.cat);
    if (!byRubric[bucket]) byRubric[bucket] = { right: 0, total: 0 };
    byRubric[bucket].total += 1;
    if (got) {
      right += 1;
      byRubric[bucket].right += 1;
    } else if (q.diagnosis) {
      diagnoses.push(q.diagnosis);
    }
  });
  return {
    right,
    total: questions.length,
    pct: questions.length ? Math.round(100 * right / questions.length) : 0,
    byRubric,
    diagnoses: unique(diagnoses),
  };
}

export function grade(q, ans) {
  if (ans == null || ans === '') return false;
  if (q.type === 'ms') {
    const want = [...q.correct].map(String).sort();
    const got = (Array.isArray(ans) ? ans : String(ans).split(',')).map(String).sort();
    return want.length === got.length && want.every((v, i) => v === got[i]);
  }
  if (q.type === 'rank' || q.type === 'chain') {
    const want = q.correct;
    const got = Array.isArray(ans) ? ans : String(ans).split(',');
    if (want.length !== got.length) return false;
    return want.every((v, i) => String(v) === String(got[i]));
  }
  return String(ans) === String(q.correct);
}

function unique(arr) {
  return [...new Set(arr)];
}

function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
