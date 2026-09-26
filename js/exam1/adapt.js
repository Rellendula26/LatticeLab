const KEY = 'latticelab.exam1.v1';

export function loadAdapt() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { cats: {}, seen: {} };
  } catch {
    return { cats: {}, seen: {} };
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
