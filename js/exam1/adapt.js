const KEY = 'latticelab.exam1.v1';

export function loadAdapt() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { cats: {}, seen: {}, written: { concepts: {}, traps: {} } };
  } catch {
    return { cats: {}, seen: {}, written: { concepts: {}, traps: {} } };
  }
}

export function recordResult(cat, ok) {
  const data = loadAdapt();
  if (!data.cats[cat]) data.cats[cat] = { right: 0, total: 0 };
  data.cats[cat].total += 1;
  if (ok) data.cats[cat].right += 1;
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

export function markSeen(id) {
  const data = loadAdapt();
  data.seen[id] = (data.seen[id] || 0) + 1;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function weakCats(data) {
  return Object.entries(data.cats || {})
    .filter(([, v]) => v.total >= 2 && v.right / v.total < 0.6)
    .sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total)
    .map(([k]) => k);
}

export function recordWritten(cat, ev) {
  const data = loadAdapt();
  if (!data.written) data.written = { concepts: {}, traps: {} };
  if (!data.written.concepts[cat]) data.written.concepts[cat] = { earned: 0, max: 0 };
  data.written.concepts[cat].earned += ev.earned;
  data.written.concepts[cat].max += ev.max;
  (ev.traps || []).forEach((t) => {
    if (!data.written.traps[t.id]) data.written.traps[t.id] = { n: 0, label: t.label };
    data.written.traps[t.id].n += 1;
    data.written.traps[t.id].label = t.label;
  });
  localStorage.setItem(KEY, JSON.stringify(data));
  recordResult(cat, ev.passed);
  return data;
}

export function writtenStats(data) {
  return Object.entries((data.written || {}).concepts || {})
    .map(([cat, v]) => ({
      cat,
      earned: v.earned,
      max: v.max,
      pct: v.max ? Math.round(100 * v.earned / v.max) : 0,
    }))
    .sort((a, b) => a.pct - b.pct);
}

export function recurringTraps(data) {
  return Object.values((data.written || {}).traps || {})
    .filter((t) => t.n >= 2)
    .sort((a, b) => b.n - a.n);
}
