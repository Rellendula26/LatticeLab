import { BANK, rubricCat } from './bank.js';
import { loadAdapt, weakCats, writtenStats, recurringTraps } from './adapt.js';
import { gradeWritten, isWritten } from './written-grade.js';

export const EXAM_DEFS = {
  1: {
    id: 1, title: 'Practice Exam 1',
    blurb: 'Crystals and optical tickets first, then doping and temperature.',
    ids: [
      'c-sc-n', 'm-zero-l', 'b-photon-k', 'p-eg-lg', 'f-half',
      'd-inp-acc', 'car-ef-n', 'tr-mu-sigma', 't-regimes', 'pn-fwd',
      'o-beer', 'eq-error-student', 'c-n-not-rho', 'p-cds-635',
      'w-donor', 'w-ni-t', 'w-miller0', 'w-fd-meaning', 'w-pn-vbi-chain', 'w-eq-nd',
    ],
  },
  2: {
    id: 2, title: 'Practice Exam 2',
    blurb: 'Fermi meaning, compensation traps, Ge vs Si.',
    ids: [
      'c-fcc-n', 'm-from-ints', 'b-si-emit', 'p-white-inas', 'f-t0',
      'd-na10', 'd-comp', 't-eg-onset', 't-tmax', 'pn-w-dop',
      'eq-chain-nd', 'f-ef-not-home', 'p-cdse-470', 'tr-r',
      'w-ef-np', 'w-indirect-emit', 'w-sigma-t', 'w-comp', 'w-absorb', 'w-eq-nc',
    ],
  },
  3: {
    id: 3, title: 'Practice Exam 3',
    blurb: 'Ionization windows, mass action, reverse bias.',
    ids: [
      'c-diamond-n', 'm-bar', 'm-dir-neg', 'b-direct', 'p-below',
      'f-not-count', 'd-cds-t', 'd-t0-nd', 'car-np-led', 'car-gaas-ni',
      't-plateau', 't-rank-ni', 'pn-side', 'pn-rev', 'eq-light-lg',
      'w-mstar', 'w-fwd', 'w-np-mass', 'w-site', 'w-freeze', 'w-recomb',
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
    const pool = BANK.filter((q) => q.cat === cat && !used.has(q.id) && !isWritten(q));
    shuffle(pool, rng);
    pool.slice(0, n).forEach((q) => {
      used.add(q.id);
      picked.push(q);
    });
  });
  const adapt = loadAdapt();
  const weak = new Set(weakCats(adapt));
  const weakWrite = new Set(writtenStats(adapt).filter((s) => s.max >= 4 && s.pct < 70).map((s) => s.cat));
  const trapIds = new Set(recurringTraps(adapt).map((t) => t.id));
  const written = BANK.filter((q) => isWritten(q) && !used.has(q.id) && (q.level || 1) >= 3);
  pickWeighted(written, 7, rng, (q) => {
    const cat = rubricCat(q.cat);
    let w = 1;
    if (weak.has(cat)) w += 3;
    if (weakWrite.has(cat)) w += 3;
    if ((q.rubric?.misconceptions || []).some((t) => trapIds.has(t.id))) w += 2;
    if ((q.level || 1) >= 4) w += 1;
    return w;
  }).forEach((q) => {
    used.add(q.id);
    picked.push(q);
  });
  shuffle(picked, rng);
  return picked;
}

export function scoreExam(questions, answers) {
  let earned = 0;
  let max = 0;
  let right = 0;
  const byRubric = {};
  const diagnoses = [];
  questions.forEach((q) => {
    const bucket = rubricCat(q.cat);
    if (!byRubric[bucket]) byRubric[bucket] = { right: 0, total: 0, earned: 0, max: 0 };
    byRubric[bucket].total += 1;
    if (isWritten(q)) {
      const ev = gradeWritten(q, answers[q.id]);
      earned += ev.earned;
      max += ev.max;
      byRubric[bucket].earned += ev.earned;
      byRubric[bucket].max += ev.max;
      if (ev.passed) {
        right += 1;
        byRubric[bucket].right += 1;
      } else if (q.diagnosis) {
        diagnoses.push(q.diagnosis);
      }
      ev.traps.forEach((t) => diagnoses.push(t.label));
      return;
    }
    max += 1;
    const got = grade(q, answers[q.id]);
    if (got) {
      right += 1;
      earned += 1;
      byRubric[bucket].right += 1;
      byRubric[bucket].earned += 1;
    } else if (q.diagnosis) {
      diagnoses.push(q.diagnosis);
    }
    byRubric[bucket].max += 1;
  });
  return {
    right,
    total: questions.length,
    earned: Math.round(earned * 10) / 10,
    max,
    pct: max ? Math.round(100 * earned / max) : 0,
    byRubric,
    diagnoses: unique(diagnoses),
  };
}

export function grade(q, ans) {
  if (isWritten(q)) return gradeWritten(q, ans).passed;
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

function pickWeighted(pool, k, rng, weightFn) {
  const left = pool.map((q) => ({ q, w: Math.max(0.2, Number(weightFn(q)) || 1) }));
  const out = [];
  while (out.length < k && left.length) {
    const total = left.reduce((s, x) => s + x.w, 0);
    let r = rng() * total;
    let i = 0;
    for (; i < left.length; i++) {
      r -= left[i].w;
      if (r <= 0) break;
    }
    i = Math.min(i, left.length - 1);
    out.push(left[i].q);
    left.splice(i, 1);
  }
  return out;
}
