/**
 * Concept-cluster grader for written responses.
 * Hits an idea if any synonym cluster is present. Not an LLM.
 */

const REPLACEMENTS = [
  [/fermi[-\s]?dirac/g, ' fd '],
  [/occupation probability|occupancy probability|occupation chance/g, ' occupancy '],
  [/fermi(?:\s+level|\s+energy)?/g, ' ef '],
  [/intrinsic fermi/g, ' ei '],
  [/conduction band/g, ' cb '],
  [/valence band/g, ' vb '],
  [/band[\s-]?gap|energy gap/g, ' eg '],
  [/electron[\s-]?hole pair|e[\s-]?h pair/g, ' ehpair '],
  [/n[\s-]?type/g, ' ntype '],
  [/p[\s-]?type/g, ' ptype '],
  [/built[\s-]?in (?:potential|voltage|field)/g, ' vbi '],
  [/depletion (?:region|width|layer)/g, ' depletion '],
  [/effective mass/g, ' mstar '],
  [/density of states/g, ' dos '],
  [/carrier concentration|electron concentration|hole concentration/g, ' conc '],
  [/mass[\s-]?action/g, ' massaction '],
  [/miller index|miller indices/g, ' miller '],
  [/unit cell/g, ' cell '],
  [/lattice constant/g, ' a0 '],
  [/ionization energy/g, ' ei_ion '],
  [/thermal energy|k t\b|kt\b/g, ' kt '],
  [/e[_ ]?c\b/g, ' cb '],
  [/e[_ ]?v\b/g, ' vb '],
  [/e[_ ]?g\b/g, ' eg '],
  [/e[_ ]?f\b/g, ' ef '],
  [/e[_ ]?i\b/g, ' ei '],
  [/n[_ ]?d\b|n d\b/g, ' nd '],
  [/n[_ ]?a\b|n a\b/g, ' na '],
  [/n[_ ]?i\b/g, ' ni '],
  [/μ_?n|mu_?n/g, ' mun '],
  [/μ_?p|mu_?p/g, ' mup '],
];

export function normalizeWritten(text) {
  let s = ` ${String(text || '').toLowerCase()} `;
  s = s.replace(/[–—]/g, '-');
  REPLACEMENTS.forEach(([re, to]) => { s = s.replace(re, to); });
  s = s.replace(/[^a-z0-9.+^]+/g, ' ');
  return ` ${s.replace(/\s+/g, ' ').trim()} `;
}

function variants(token) {
  const t = token.trim();
  const out = new Set([t]);
  if (t.length > 3 && t.endsWith('s')) out.add(t.slice(0, -1));
  else if (t.length > 2) out.add(`${t}s`);
  if (t.length > 4 && t.endsWith('ed')) out.add(t.slice(0, -2));
  else if (t.length > 3) out.add(`${t}ed`);
  if (t.length > 5 && t.endsWith('ing')) out.add(t.slice(0, -3));
  return [...out];
}

function hasToken(norm, token) {
  const t = normalizeWritten(token).trim();
  if (!t) return false;
  if (t.includes(' ')) return norm.includes(` ${t} `) || norm.includes(t);
  return variants(t).some((v) => {
    if (norm.includes(` ${v} `)) return true;
    if (v.length >= 5) return new RegExp(` ${v}[a-z]{0,8} `).test(norm);
    return false;
  });
}

function cueHits(norm, cue) {
  if (cue.re) return cue.re.test(norm);
  const need = cue.all || [];
  if (!need.length) return false;
  if (cue.near != null) return nearHits(norm, need, cue.near);
  return need.every((tok) => hasToken(norm, tok));
}

function nearHits(norm, tokens, gap) {
  const parts = tokens.map((t) => normalizeWritten(t).trim()).filter(Boolean);
  if (parts.some((p) => !hasToken(norm, p))) return false;
  if (parts.length < 2) return true;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const win = Number(gap) || 36;
  const a = esc(parts[0]);
  const b = esc(parts[1]);
  return new RegExp(`${a}.{0,${win}}${b}|${b}.{0,${win}}${a}`).test(norm);
}

function itemHits(norm, item) {
  return (item.cues || []).some((cue) => cueHits(norm, cue));
}

function blocked(norm, item) {
  return (item.unless || []).some((cue) => cueHits(norm, cue));
}

export function gradeWritten(q, text) {
  const rubric = q.rubric || {};
  const concepts = rubric.concepts || [];
  const misconceptions = rubric.misconceptions || [];
  const norm = normalizeWritten(text);
  const blank = !String(text || '').trim();

  const hit = [];
  const miss = [];
  let earned = 0;
  let max = 0;

  concepts.forEach((c) => {
    const pts = Number(c.pts) || 1;
    max += pts;
    if (!blank && itemHits(norm, c)) {
      hit.push(c);
      earned += pts;
    } else {
      miss.push(c);
    }
  });

  const traps = blank ? [] : misconceptions.filter((m) => itemHits(norm, m) && !blocked(norm, m));
  const penalty = Math.min(earned, traps.length);
  earned = Math.max(0, earned - penalty);

  const pct = max ? Math.round(100 * earned / max) : 0;
  const passed = !blank && pct >= 70 && traps.length === 0;

  return {
    blank,
    earned,
    max,
    pct,
    passed,
    hit,
    miss,
    traps,
    improve: improveLines(q, miss, traps),
    followup: pickFollowup(q, miss),
  };
}

function improveLines(q, miss, traps) {
  const out = [];
  miss.forEach((c) => out.push(c.improve || c.missing));
  traps.forEach((m) => out.push(m.fix || m.label));
  if (q.improve) q.improve.forEach((line) => {
    if (!out.includes(line)) out.push(line);
  });
  return out;
}

function pickFollowup(q, miss) {
  const fu = q.followup;
  if (!fu) return null;
  const ids = new Set(miss.map((c) => c.id));
  const triggers = fu.ifMissing || [];
  if (triggers.length && !triggers.some((id) => ids.has(id))) return null;
  return fu;
}

export function writtenMax(q) {
  return (q.rubric?.concepts || []).reduce((s, c) => s + (Number(c.pts) || 1), 0);
}

export function isWritten(q) {
  return q && (q.type === 'written-response' || q.type === 'written');
}
