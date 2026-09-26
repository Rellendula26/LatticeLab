import { COVERAGE, coverageByStatus } from './coverage.js';
import { SHEET, SHEET_ORDER, CHAINS, sheetEq } from './sheet.js';
import { TRAPS } from './traps.js';
import { BANK, CATS, questionById, bankByCat, rubricCat } from './bank.js';
import { EXAM_DEFS, questionsForExam, generateExam, scoreExam, grade } from './exams.js';
import { loadAdapt, recordResult, markSeen, weakCats } from './adapt.js';
import { DRAW_TASKS, gradeDraw } from './draw.js';

const RUBRIC_LABEL = {
  crystal: 'Crystal structures & Miller indices',
  band: 'Band structure',
  photon: 'Photon/bandgap physics',
  fermi: 'Fermi–Dirac',
  doping: 'Doping & impurity physics',
  carriers: 'Carrier concentration',
  transport: 'Transport',
  temperature: 'Temperature dependence',
  pn: 'PN-junction physics',
  equations: 'Equation relationships',
};

const CONCEPTS = [
  { id: 'crystal', title: 'Crystal counting', cats: ['crystal'] },
  { id: 'miller', title: 'Miller indices', cats: ['miller'] },
  { id: 'band', title: 'E–k and gaps', cats: ['band'] },
  { id: 'photon', title: 'Bandgap ↔ wavelength', cats: ['photon', 'optics'] },
  { id: 'fermi', title: 'Temperature ↔ Fermi–Dirac', cats: ['fermi'] },
  { id: 'doping', title: 'Impurity depth ↔ ionization', cats: ['doping'] },
  { id: 'carriers', title: 'EF ↔ n, p', cats: ['carriers'] },
  { id: 'transport', title: 'n, p, μ ↔ σ', cats: ['transport'] },
  { id: 'temperature', title: 'T ↔ ni and regimes', cats: ['temperature'] },
  { id: 'pn', title: 'Bias ↔ depletion', cats: ['pn'] },
  { id: 'equations', title: 'Equation relationships', cats: ['equations'] },
];

function params() {
  return new URLSearchParams(location.search);
}

function katex(el, tex, display) {
  if (!el) return;
  if (window.katex && tex) {
    window.katex.render(tex, el, { throwOnError: false, displayMode: !!display });
    return;
  }
  if (tex) el.textContent = tex;
}

function go(query) {
  const next = new URL(location.href);
  next.search = query.startsWith('?') ? query : `?${query}`;
  history.pushState({}, '', next);
  boot();
}

function mount() {
  return document.getElementById('exam-root');
}

function sessionKey(id) {
  return `latticelab.exam1.sit.${id}`;
}

export function boot() {
  const q = params();
  const mode = q.get('mode') || 'hub';
  setNav(mode);
  if (mode === 'exam') return renderExam(q);
  if (mode === 'review') return renderReview(q);
  if (mode === 'sheet') return renderSheet(q);
  if (mode === 'challenge') return renderChallenge();
  if (mode === 'traps') return renderTraps();
  if (mode === 'mastery') return renderMastery(q);
  if (mode === 'draw') return renderDraw();
  if (mode === 'chains') return renderChains();
  if (mode === 'audit') return renderAudit();
  return renderHub();
}

function setNav(mode) {
  document.querySelectorAll('[data-examnav]').forEach((a) => {
    a.classList.toggle('is-on', a.dataset.examnav === mode);
  });
}

function renderHub() {
  const adapt = loadAdapt();
  const weak = weakCats(adapt);
  mount().innerHTML = `
    <section class="ex-hero glass rounded-2xl p-5 sm:p-6">
      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/90">ESE 2180 · Exam 1</p>
      <h2 class="mt-1 text-2xl font-bold text-white sm:text-3xl">Conceptual study environment</h2>
      <p class="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">Minimal arithmetic. If you can explain every HW1/HW2 idea and every sheet equation, you are ready. If you only memorized symbols, these exams will feel unfair — that is the point.</p>
    </section>
    <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      ${card('Practice exams', 'Three fixed papers plus a generator. Answers hidden until submit.', 'exam', 'Open exams')}
      ${card('Formula sheet', 'Every sheet equation in words, cause/effect, traps.', 'sheet', 'Open the sheet')}
      ${card('Can you explain it?', 'One random equation. Predict before the reveal.', 'challenge', 'Start challenge')}
      ${card('Conceptual traps', 'Plausible. Wrong. Predict first.', 'traps', 'Open traps')}
      ${card('Concept mastery', '5–10 questions, one relationship, several representations.', 'mastery', 'Drill a concept')}
      ${card('Relationship chains', 'Change the first quantity. Predict the rest.', 'chains', 'Walk a chain')}
      ${card('Drawing practice', 'Grade features, not pixels.', 'draw', 'Sketch')}
      ${card('Coverage audit', 'HW1, HW2, and the sheet, each with Learn / Visualize / Practice.', 'audit', 'Open audit')}
    </div>
    ${weak.length ? `<p class="mt-5 text-sm text-amber-200">Adaptive note: you are shaky on ${weak.map((c) => RUBRIC_LABEL[c] || c).join(', ')}. Mastery and Generate New Exam will lean that way.</p>` : ''}
  `;
  mount().querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
}

function card(title, copy, mode, cta) {
  return `<article class="glass-card flex flex-col rounded-2xl p-5">
    <h3 class="text-lg font-semibold text-white">${title}</h3>
    <p class="mt-2 flex-1 text-sm text-slate-400">${copy}</p>
    <button type="button" data-go="mode=${mode}" class="launch-btn mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-white">${cta}</button>
  </article>`;
}

function renderExam(q) {
  const which = q.get('id') || '';
  if (!which) {
    mount().innerHTML = `
      <h2 class="text-2xl font-bold text-white">Exam 1 Practice Exams</h2>
      <p class="mt-2 text-sm text-slate-400">No hints in exam mode. Flag anything you want to revisit. The sheet button is the real sheet, not an answer key.</p>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        ${[1, 2, 3].map((n) => {
          const d = EXAM_DEFS[n];
          return `<article class="glass-card rounded-2xl p-5">
            <h3 class="text-lg font-semibold text-white">${d.title}</h3>
            <p class="mt-2 text-sm text-slate-400">${d.blurb}</p>
            <p class="mt-1 text-xs text-slate-500">${d.ids.length} questions</p>
            <button type="button" data-go="mode=exam&id=${n}" class="launch-btn mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-white">Begin</button>
          </article>`;
        }).join('')}
        <article class="glass-card rounded-2xl p-5">
          <h3 class="text-lg font-semibold text-white">Generate New Exam</h3>
          <p class="mt-2 text-sm text-slate-400">Same scope, different draw. Weak categories from local practice get extra weight next time you drill mastery.</p>
          <button type="button" id="ex-gen" class="launch-btn mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-white">Generate</button>
        </article>
      </div>`;
    mount().querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
    document.getElementById('ex-gen').addEventListener('click', () => {
      const seed = Date.now() & 0xffff;
      go(`mode=exam&id=gen&seed=${seed}`);
    });
    return;
  }
  const questions = which === 'gen'
    ? generateExam(Number(q.get('seed') || 1))
    : questionsForExam(Number(which));
  const sit = loadSit(q.get('id') + (q.get('seed') || ''), questions);
  paintExam(sit);
}

function loadSit(id, questions) {
  const raw = sessionStorage.getItem(sessionKey(id));
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  const sit = {
    id, i: 0, flagged: {}, answers: {}, started: Date.now(),
    timerOn: false, elapsed: 0, questions: questions.map((q) => q.id),
  };
  sessionStorage.setItem(sessionKey(id), JSON.stringify(sit));
  return sit;
}

function saveSit(sit) {
  sessionStorage.setItem(sessionKey(sit.id), JSON.stringify(sit));
}

function paintExam(sit) {
  const questions = sit.questions.map(questionById).filter(Boolean);
  const q = questions[sit.i];
  const n = questions.length;
  mount().innerHTML = `
    <div class="ex-exam-bar">
      <p class="text-xs text-slate-400">Question ${sit.i + 1} / ${n}</p>
      <div class="ex-progress"><span style="width:${((sit.i + 1) / n) * 100}%"></span></div>
      <label class="ex-flag"><input type="checkbox" id="ex-flag" ${sit.flagged[q.id] ? 'checked' : ''}/> Flag</label>
      <button type="button" id="ex-sheet" class="ex-chip">Equation sheet</button>
      <label class="ex-flag"><input type="checkbox" id="ex-timer" ${sit.timerOn ? 'checked' : ''}/> Timer</label>
      <span id="ex-clock" class="font-mono text-xs text-slate-500"></span>
    </div>
    <article class="glass rounded-2xl p-5 mt-4" data-live>
      ${renderPrompt(q, sit.answers[q.id], false)}
    </article>
    <div class="mt-4 flex flex-wrap gap-2">
      <button type="button" id="ex-prev" class="ex-chip" ${sit.i === 0 ? 'disabled' : ''}>Previous</button>
      <button type="button" id="ex-next" class="ex-chip" ${sit.i === n - 1 ? 'disabled' : ''}>Next</button>
      <button type="button" id="ex-submit" class="launch-btn ml-auto rounded-xl px-4 py-2 text-sm font-semibold text-white">Submit exam</button>
    </div>
    <dialog id="ex-sheet-dlg" class="ex-dlg">
      <form method="dialog"><button class="ex-chip">Close</button></form>
      <div class="ex-sheet-mini">${SHEET_ORDER.map((id) => {
        const e = SHEET[id];
        return `<p class="mt-3 text-sm text-slate-200"><strong>${e.name}.</strong> <span class="eq" data-tex="${esc(e.latex)}"></span> — ${e.words}</p>`;
      }).join('')}</div>
    </dialog>`;
  bindPrompt(q, (val) => {
    sit.answers[q.id] = val;
    saveSit(sit);
  }, sit.answers[q.id]);
  document.getElementById('ex-flag').addEventListener('change', (e) => {
    sit.flagged[q.id] = e.target.checked;
    saveSit(sit);
  });
  document.getElementById('ex-prev').addEventListener('click', () => { sit.i -= 1; saveSit(sit); paintExam(sit); });
  document.getElementById('ex-next').addEventListener('click', () => { sit.i += 1; saveSit(sit); paintExam(sit); });
  document.getElementById('ex-submit').addEventListener('click', () => finishExam(sit));
  document.getElementById('ex-sheet').addEventListener('click', () => {
    const dlg = document.getElementById('ex-sheet-dlg');
    dlg.showModal();
    dlg.querySelectorAll('[data-tex]').forEach((el) => katex(el, el.dataset.tex, false));
  });
  const clock = document.getElementById('ex-clock');
  const tick = () => {
    if (!sit.timerOn) { clock.textContent = ''; return; }
    const s = Math.floor((Date.now() - sit.started) / 1000);
    clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  document.getElementById('ex-timer').addEventListener('change', (e) => {
    sit.timerOn = e.target.checked;
    if (sit.timerOn && !sit.started) sit.started = Date.now();
    saveSit(sit);
    tick();
  });
  tick();
}

function finishExam(sit) {
  const questions = sit.questions.map(questionById).filter(Boolean);
  const score = scoreExam(questions, sit.answers);
  questions.forEach((q) => recordResult(rubricCat(q.cat), grade(q, sit.answers[q.id])));
  sit.done = true;
  sit.score = score;
  saveSit(sit);
  go(`mode=review&id=${encodeURIComponent(sit.id)}`);
}

function renderReview(q) {
  const sit = JSON.parse(sessionStorage.getItem(sessionKey(q.get('id'))) || 'null');
  if (!sit || !sit.done) {
    mount().innerHTML = `<p class="text-slate-400">No submitted exam in this tab. <button class="ex-chip" data-go="mode=exam">Back to exams</button></p>`;
    mount().querySelector('[data-go]')?.addEventListener('click', () => go('mode=exam'));
    return;
  }
  const questions = sit.questions.map(questionById).filter(Boolean);
  const s = sit.score;
  const rub = Object.entries(s.byRubric).map(([k, v]) =>
    `<li>${RUBRIC_LABEL[k] || k}: ${v.right}/${v.total}</li>`).join('');
  const diags = s.diagnoses.map((d) => `<li>${d}</li>`).join('');
  mount().innerHTML = `
    <h2 class="text-2xl font-bold text-white">Results · ${s.right}/${s.total} (${s.pct}%)</h2>
    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <div class="glass rounded-2xl p-4">
        <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Conceptual breakdown</p>
        <ul class="mt-2 space-y-1 text-sm text-slate-300">${rub}</ul>
      </div>
      <div class="glass rounded-2xl p-4">
        <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Why errors happened</p>
        <ul class="mt-2 space-y-2 text-sm text-amber-100">${diags || '<li>No repeating diagnosis. Read each review card anyway.</li>'}</ul>
      </div>
    </div>
    <div class="mt-6 space-y-4">${questions.map((qq) => reviewCard(qq, sit.answers[qq.id])).join('')}</div>`;
  afterTex();
}

function reviewCard(q, ans) {
  const ok = grade(q, ans);
  const yours = formatAns(q, ans);
  const right = formatAns(q, q.correct);
  const wrongs = Object.entries(q.whyWrong || {}).map(([k, v]) =>
    `<li><span class="text-slate-500">${k}.</span> ${v}</li>`).join('');
  return `<article class="glass rounded-2xl p-5 ${ok ? 'ex-ok' : 'ex-bad'}">
    <p class="text-[11px] uppercase tracking-[0.16em] ${ok ? 'text-emerald-300' : 'text-rose-300'}">${ok ? 'Correct' : 'Missed'} · ${q.hw}</p>
    <p class="mt-2 text-sm text-slate-200">${q.prompt}</p>
    <p class="mt-3 text-sm"><span class="text-slate-500">Your answer.</span> ${yours || '<em>blank</em>'}</p>
    <p class="mt-1 text-sm"><span class="text-slate-500">Correct.</span> ${right}</p>
    <p class="mt-3 text-sm text-slate-300">${q.why}</p>
    ${wrongs ? `<ul class="mt-2 space-y-1 text-xs text-slate-400">${wrongs}</ul>` : ''}
    <p class="mt-3 text-xs text-sky-200">Equation. <span class="eq" data-tex="${esc(q.equation)}"></span></p>
    <p class="mt-1 text-xs text-slate-400">Intuition. ${q.intuition}</p>
    <p class="mt-1 text-xs text-slate-500">Related HW. ${q.hw}</p>
    <p class="mt-3"><a class="launch-btn inline-flex rounded-xl px-3 py-2 text-xs font-semibold text-white" href="${q.module}">Practice this concept</a></p>
  </article>`;
}

function formatAns(q, ans) {
  if (ans == null || ans === '') return '';
  if (Array.isArray(ans) || q.type === 'ms' || q.type === 'rank' || q.type === 'chain') {
    const arr = Array.isArray(ans) ? ans : String(ans).split(',');
    return arr.map((id) => {
      const c = (q.choices || []).find((x) => x.id === id);
      return c ? c.text : id;
    }).join(' → ');
  }
  const c = (q.choices || []).find((x) => x.id === String(ans));
  return c ? c.text : String(ans);
}

function renderPrompt(q, current, reveal) {
  const body = (() => {
    if (q.type === 'ms') {
      return (q.choices || []).map((c) =>
        `<label class="ex-choice"><input type="checkbox" value="${c.id}" ${has(current, c.id) ? 'checked' : ''}/> ${c.text}</label>`).join('');
    }
    if (q.type === 'rank' || q.type === 'chain') {
      const order = Array.isArray(current) ? current : (q.choices || []).map((c) => c.id);
      return `<p class="text-xs text-slate-500 mb-2">Click to cycle order. Top is first.</p>
        <ol class="ex-rank" data-rank>${order.map((id) => {
          const c = q.choices.find((x) => x.id === id);
          return `<li data-id="${id}" class="ex-choice">${c ? c.text : id}</li>`;
        }).join('')}</ol>`;
    }
    return (q.choices || []).map((c) =>
      `<label class="ex-choice"><input type="radio" name="q-${q.id}" value="${c.id}" ${String(current) === c.id ? 'checked' : ''}/> ${c.text}</label>`).join('');
  })();
  const pred = q.type === 'predict' ? '<p class="ex-pred">Predict before you peek at a graph elsewhere.</p>' : '';
  return `<p class="text-[11px] uppercase tracking-[0.16em] text-slate-500">${q.cat} · ${q.type}</p>
    ${pred}
    <p class="mt-2 text-base text-slate-100">${q.prompt}</p>
    <div class="mt-4 space-y-2" data-choices>${body}</div>
    ${reveal ? `<p class="mt-4 text-sm text-slate-300">${q.why}</p>` : ''}`;
}

function has(current, id) {
  if (Array.isArray(current)) return current.includes(id);
  return String(current || '').split(',').includes(id);
}

function bindPrompt(q, onChange, current) {
  const box = mount().querySelector('[data-choices]');
  if (!box) return;
  if (q.type === 'ms') {
    box.querySelectorAll('input').forEach((inp) => inp.addEventListener('change', () => {
      const val = [...box.querySelectorAll('input:checked')].map((i) => i.value);
      onChange(val);
    }));
    return;
  }
  if (q.type === 'rank' || q.type === 'chain') {
    const ol = box.querySelector('[data-rank]');
    ol.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      const next = li.nextElementSibling;
      if (next) ol.insertBefore(next, li);
      else ol.insertBefore(li, ol.firstChild);
      onChange([...ol.querySelectorAll('li')].map((n) => n.dataset.id));
    });
    return;
  }
  box.querySelectorAll('input').forEach((inp) => inp.addEventListener('change', () => onChange(inp.value)));
}

function renderSheet(q) {
  const id = q.get('eq') || SHEET_ORDER[0];
  const e = sheetEq(id) || SHEET[SHEET_ORDER[0]];
  mount().innerHTML = `
    <div class="ex-split">
      <aside class="ex-side">
        ${SHEET_ORDER.map((sid) => `<button type="button" class="ex-nav ${sid === e.id ? 'is-on' : ''}" data-eq="${sid}">${SHEET[sid].name}</button>`).join('')}
      </aside>
      <article class="glass rounded-2xl p-5">${sheetCard(e)}</article>
    </div>`;
  mount().querySelectorAll('[data-eq]').forEach((b) => b.addEventListener('click', () => go(`mode=sheet&eq=${b.dataset.eq}`)));
  afterTex();
}

function sheetCard(e) {
  return `
    <p class="text-[11px] uppercase tracking-[0.16em] text-violet-300/80">${e.family}</p>
    <h2 class="text-2xl font-bold text-white">${e.name}</h2>
    <div class="eq mt-3 text-sky-100" data-tex="${esc(e.latex)}" data-display="1"></div>
    <h3 class="ex-h">1 · What it says</h3><p>${e.words}</p>
    <h3 class="ex-h">2 · Variables</h3>
    <ul>${e.vars.map((v) => `<li><span class="text-sky-300">${v.s}</span> — ${v.m}${v.u ? ` · ${v.u}` : ''}</li>`).join('')}</ul>
    <h3 class="ex-h">3 · Cause / effect</h3><p>${e.cause}</p>
    <h3 class="ex-h">4 · Graph</h3><p>${e.graph}</p>
    <h3 class="ex-h">5 · Physical story</h3><p>${e.story}</p>
    <h3 class="ex-h">6 · Assumptions</h3><p>${e.valid}</p>
    <h3 class="ex-h">7 · Connections</h3><p>${e.chain}</p>
    <h3 class="ex-h">8 · Common trap</h3><p>${e.trap}</p>
    <h3 class="ex-h">9 · Concept check</h3><p>${e.check}</p>
    <h3 class="ex-h">10 · Homework</h3><p>${e.hw}</p>
    <p class="mt-4"><a class="launch-btn inline-flex rounded-xl px-3 py-2 text-xs font-semibold text-white" href="${e.module}">Open the visualizer</a></p>`;
}

function renderChallenge() {
  const id = SHEET_ORDER[Math.floor(Math.random() * SHEET_ORDER.length)];
  const e = SHEET[id];
  mount().innerHTML = `
    <h2 class="text-2xl font-bold text-white">Can you explain the formula sheet?</h2>
    <p class="mt-2 text-sm text-slate-400">No numbers yet. Answer the seven prompts, then reveal.</p>
    <article class="glass rounded-2xl p-5 mt-4">
      <div class="eq text-sky-100" data-tex="${esc(e.latex)}" data-display="1"></div>
      <ol class="ex-ask">
        <li>What does this equation physically describe?</li>
        <li>If the first important variable increases, what happens to the result?</li>
        <li>What must be held constant for that statement?</li>
        <li>What graph shape does the relationship imply?</li>
        <li>When would this equation not be appropriate?</li>
        <li>Which other equation(s) connect to it?</li>
        <li>Where did this appear in HW1/HW2?</li>
      </ol>
      <button type="button" id="ch-rev" class="launch-btn mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-white">Reveal explanation</button>
      <div id="ch-out" class="hidden mt-4">${sheetCard(e)}</div>
    </article>
    <button type="button" class="ex-chip mt-4" data-go="mode=challenge">Another equation</button>`;
  afterTex();
  document.getElementById('ch-rev').addEventListener('click', () => {
    document.getElementById('ch-out').classList.remove('hidden');
    afterTex();
  });
  mount().querySelector('[data-go]').addEventListener('click', () => go('mode=challenge'));
}

function renderTraps() {
  let i = 0;
  const paint = () => {
    const t = TRAPS[i];
    mount().innerHTML = `
      <h2 class="text-2xl font-bold text-white">Conceptual traps</h2>
      <p class="text-sm text-slate-400 mt-1">${i + 1} / ${TRAPS.length} · Predict first. Then the diagram and the model.</p>
      <article class="glass rounded-2xl p-5 mt-4">
        <p class="text-lg text-slate-100">“${t.claim}”</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" data-v="true" class="ex-chip">Sounds true</button>
          <button type="button" data-v="false" class="ex-chip">False</button>
        </div>
        <div id="tr-out" class="hidden mt-4 text-sm text-slate-300">
          <p class="font-semibold ${t.answer ? 'text-emerald-300' : 'text-rose-300'}">${t.answer ? 'The claim is true.' : 'The claim is false.'}</p>
          <p class="mt-2">${t.why}</p>
          <p class="mt-2 text-amber-100">Mental model. ${t.model}</p>
          <p class="mt-2 text-sky-200">Equation. ${t.eq}</p>
          <p class="mt-2 text-slate-500">${t.hw}</p>
          <a class="launch-btn inline-flex mt-3 rounded-xl px-3 py-2 text-xs font-semibold text-white" href="${t.module}">Open the visualizer</a>
        </div>
      </article>
      <div class="mt-4 flex gap-2">
        <button type="button" id="tr-prev" class="ex-chip">Previous</button>
        <button type="button" id="tr-next" class="ex-chip">Next trap</button>
      </div>`;
    mount().querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => {
      document.getElementById('tr-out').classList.remove('hidden');
      recordResult(t.cat, (b.dataset.v === 'true') === t.answer);
    }));
    document.getElementById('tr-prev').addEventListener('click', () => { i = (i + TRAPS.length - 1) % TRAPS.length; paint(); });
    document.getElementById('tr-next').addEventListener('click', () => { i = (i + 1) % TRAPS.length; paint(); });
  };
  paint();
}

function renderMastery(q) {
  const concept = q.get('concept') || '';
  if (!concept) {
    mount().innerHTML = `
      <h2 class="text-2xl font-bold text-white">Concept mastery</h2>
      <p class="mt-2 text-sm text-slate-400">A concept is not mastered from one multiple-choice click. Each set mixes verbal, graph, equation, and scenario items when the bank has them.</p>
      <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        ${CONCEPTS.map((c) => `<button type="button" class="glass-card rounded-2xl p-4 text-left" data-c="${c.id}"><h3 class="font-semibold text-white">${c.title}</h3></button>`).join('')}
      </div>`;
    mount().querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => go(`mode=mastery&concept=${b.dataset.c}`)));
    return;
  }
  const meta = CONCEPTS.find((c) => c.id === concept) || CONCEPTS[0];
  const weak = weakCats(loadAdapt());
  const pool = BANK.filter((qq) => meta.cats.includes(qq.cat));
  const types = ['tf', 'mc', 'predict', 'scenario', 'chain', 'calc'];
  const picked = [];
  types.forEach((ty) => {
    const hit = pool.find((qq) => qq.type === ty && !picked.includes(qq));
    if (hit) picked.push(hit);
  });
  pool.forEach((qq) => {
    if (picked.length >= 8) return;
    if (!picked.includes(qq)) picked.push(qq);
  });
  if (weak.includes(rubricCat(meta.cats[0]))) {
    const extra = bankByCat(meta.cats[0]).filter((qq) => !picked.includes(qq));
    if (extra[0]) picked.push(extra[0]);
  }
  let i = 0;
  const answers = {};
  const paint = () => {
    const qq = picked[i];
    markSeen(qq.id);
    mount().innerHTML = `
      <p class="text-xs text-slate-500">${meta.title} · ${i + 1}/${picked.length}</p>
      <article class="glass rounded-2xl p-5 mt-3">${renderPrompt(qq, answers[qq.id], false)}</article>
      <div class="mt-4 flex gap-2">
        <button type="button" id="ms-check" class="launch-btn rounded-xl px-4 py-2 text-sm font-semibold text-white">Check</button>
        <button type="button" id="ms-next" class="ex-chip">Next</button>
      </div>
      <div id="ms-rev" class="hidden mt-4">${reviewCard(qq, answers[qq.id])}</div>`;
    bindPrompt(qq, (val) => { answers[qq.id] = val; }, answers[qq.id]);
    document.getElementById('ms-check').addEventListener('click', () => {
      const ok = grade(qq, answers[qq.id]);
      recordResult(rubricCat(qq.cat), ok);
      const box = document.getElementById('ms-rev');
      box.classList.remove('hidden');
      box.innerHTML = reviewCard(qq, answers[qq.id]);
      afterTex();
    });
    document.getElementById('ms-next').addEventListener('click', () => {
      i = Math.min(picked.length - 1, i + 1);
      paint();
    });
  };
  paint();
}

function renderDraw() {
  let i = 0;
  const paint = () => {
    const t = DRAW_TASKS[i];
    mount().innerHTML = `
      <h2 class="text-2xl font-bold text-white">Drawing / graph practice</h2>
      <p class="text-sm text-slate-400 mt-1">${t.title}. We grade axes, trends, and labels — not handwriting.</p>
      <article class="glass rounded-2xl p-5 mt-4">
        <p>${t.prompt}</p>
        <div class="mt-4" id="dw">${drawUI(t)}</div>
        <button type="button" id="dw-g" class="launch-btn mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white">Check features</button>
        <div id="dw-o" class="hidden mt-3 text-sm text-slate-300"></div>
      </article>
      <div class="mt-4 flex gap-2">
        <button type="button" id="dw-p" class="ex-chip">Previous</button>
        <button type="button" id="dw-n" class="ex-chip">Next sketch</button>
      </div>`;
    document.getElementById('dw-g').addEventListener('click', () => {
      const payload = readDraw(t);
      const g = gradeDraw(t, payload);
      recordResult(t.cat, g.ok);
      const o = document.getElementById('dw-o');
      o.classList.remove('hidden');
      o.innerHTML = `<p class="${g.ok ? 'text-emerald-300' : 'text-rose-300'}">${g.ok ? 'Features match.' : 'A feature is off.'}</p>${g.notes.map((n) => `<p class="mt-1">${n}</p>`).join('')}`;
    });
    document.getElementById('dw-p').addEventListener('click', () => { i = (i + DRAW_TASKS.length - 1) % DRAW_TASKS.length; paint(); });
    document.getElementById('dw-n').addEventListener('click', () => { i = (i + 1) % DRAW_TASKS.length; paint(); });
  };
  paint();
}

function drawUI(t) {
  if (t.kind === 'fermi') {
    return `<label class="block text-sm">T <input id="dw-T" type="range" min="0" max="600" value="300" class="w-full"/> <span id="dw-Tl">300 K</span></label>
      <p class="mt-3 text-sm">Pivot</p>
      <label class="ex-choice"><input type="radio" name="pv" value="half" checked/> f = 1/2 at EF</label>
      <label class="ex-choice"><input type="radio" name="pv" value="one"/> f = 1 at EF</label>
      <p class="mt-3 text-sm">Smear</p>
      <label class="ex-choice"><input type="radio" name="sm" value="none"/> None (step)</label>
      <label class="ex-choice"><input type="radio" name="sm" value="narrow" checked/> Narrow (~300 K)</label>
      <label class="ex-choice"><input type="radio" name="sm" value="wide"/> Wide (~500 K+)</label>`;
  }
  if (t.kind === 'edge') {
    return `<label class="block text-sm">λg (nm) <input id="dw-lg" type="number" value="500" class="field rounded-md px-2 py-1 text-white"/></label>
      <p class="mt-3 text-sm">Which side absorbs?</p>
      <label class="ex-choice"><input type="radio" name="sd" value="short" checked/> λ &lt; λg (shorter / bluer)</label>
      <label class="ex-choice"><input type="radio" name="sd" value="long"/> λ &gt; λg (longer / redder)</label>`;
  }
  if (t.kind === 'regimes') {
    return ['low', 'mid', 'high'].map((k) =>
      `<label class="block mt-2 text-sm">${k} T
        <select id="dw-${k}" class="field rounded-md px-2 py-1 text-white">
          <option value="freeze">freeze-out</option>
          <option value="ext">extrinsic</option>
          <option value="int">intrinsic</option>
        </select></label>`).join('');
  }
  if (t.kind === 'ek') {
    return `<p class="text-sm">GaAs photon</p>
      <label class="ex-choice"><input type="radio" name="ga" value="vert" checked/> Vertical</label>
      <label class="ex-choice"><input type="radio" name="ga" value="slant"/> Slanted to X</label>
      <p class="mt-3 text-sm">Si photon + leftover Δk</p>
      <label class="ex-choice"><input type="radio" name="si" value="vert-plus-phonon" checked/> Vertical photon, then horizontal phonon</label>
      <label class="ex-choice"><input type="radio" name="si" value="slant"/> One slanted photon does both</label>`;
  }
  if (t.kind === 'cell') {
    return ['sc', 'bcc', 'fcc', 'dia'].map((k, i) => {
      const name = ['SC', 'BCC', 'FCC', 'Diamond'][i];
      return `<label class="block mt-2 text-sm">${name}
        <select id="dw-${k}" class="field rounded-md px-2 py-1 text-white">
          <option value="1">N = 1</option>
          <option value="2">N = 2</option>
          <option value="4">N = 4</option>
          <option value="8">N = 8</option>
        </select></label>`;
    }).join('');
  }
  if (t.kind === 'impurity') {
    return `<label class="ex-choice"><input type="radio" name="role" value="donor" checked/> Effective donor</label>
      <label class="ex-choice"><input type="radio" name="role" value="acc"/> Effective acceptor</label>
      <label class="ex-choice"><input type="radio" name="role" value="trap"/> Deep trap</label>`;
  }
  return `<p class="text-sm">(110) is parallel to</p>
    <label class="ex-choice"><input type="radio" name="ax" value="x"/> x</label>
    <label class="ex-choice"><input type="radio" name="ax" value="y"/> y</label>
    <label class="ex-choice"><input type="radio" name="ax" value="z" checked/> z</label>`;
}

function readDraw(t) {
  if (t.kind === 'fermi') {
    return {
      T: document.getElementById('dw-T').value,
      pivot: document.querySelector('[name=pv]:checked').value,
      smear: document.querySelector('[name=sm]:checked').value,
    };
  }
  if (t.kind === 'edge') {
    return { lg: document.getElementById('dw-lg').value, side: document.querySelector('[name=sd]:checked').value };
  }
  if (t.kind === 'regimes') {
    return {
      low: document.getElementById('dw-low').value,
      mid: document.getElementById('dw-mid').value,
      high: document.getElementById('dw-high').value,
    };
  }
  if (t.kind === 'ek') {
    return {
      gaas: document.querySelector('[name=ga]:checked').value,
      si: document.querySelector('[name=si]:checked').value,
    };
  }
  if (t.kind === 'cell') {
    return {
      sc: document.getElementById('dw-sc').value,
      bcc: document.getElementById('dw-bcc').value,
      fcc: document.getElementById('dw-fcc').value,
      dia: document.getElementById('dw-dia').value,
    };
  }
  if (t.kind === 'impurity') {
    return { role: document.querySelector('[name=role]:checked').value };
  }
  return { axis: document.querySelector('[name=ax]:checked').value };
}

function renderChains() {
  let i = 0;
  let revealed = false;
  const paint = () => {
    const c = CHAINS[i];
    mount().innerHTML = `
      <h2 class="text-2xl font-bold text-white">Equation relationship chains</h2>
      <p class="text-sm text-slate-400 mt-1">Change the first quantity. Predict downstream effects, then reveal.</p>
      <article class="glass rounded-2xl p-5 mt-4">
        <p class="text-[11px] uppercase tracking-[0.16em] text-amber-200/80">Start</p>
        <p class="text-xl text-white mt-1">${c.start}</p>
        <p class="mt-2 text-xs text-slate-500">Held constant: ${c.hold}</p>
        <p class="mt-4 text-sm text-slate-300">In your head: write the next 2–4 consequences in causal order.</p>
        <button type="button" id="ch-r" class="launch-btn mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white">${revealed ? 'Hide' : 'Reveal chain'}</button>
        <ol class="mt-4 space-y-2 text-sm text-slate-200 ${revealed ? '' : 'hidden'}" id="ch-l">
          ${c.steps.map((s, n) => `<li><span class="text-sky-300">${n + 1}.</span> ${s}</li>`).join('')}
        </ol>
      </article>
      <div class="mt-4 flex gap-2">
        <button type="button" id="ch-p" class="ex-chip">Previous</button>
        <button type="button" id="ch-n" class="ex-chip">Next chain</button>
      </div>`;
    document.getElementById('ch-r').addEventListener('click', () => { revealed = !revealed; paint(); });
    document.getElementById('ch-p').addEventListener('click', () => { i = (i + CHAINS.length - 1) % CHAINS.length; revealed = false; paint(); });
    document.getElementById('ch-n').addEventListener('click', () => { i = (i + 1) % CHAINS.length; revealed = false; paint(); });
  };
  paint();
}

function renderAudit() {
  const tally = coverageByStatus();
  mount().innerHTML = `
    <h2 class="text-2xl font-bold text-white">Exam 1 coverage audit</h2>
    <p class="mt-2 text-sm text-slate-400">COMPLETE needs learn + visualize + conceptual practice. Counts: ${tally.COMPLETE} complete, ${tally.PARTIAL} partial, ${tally.MISSING} missing.</p>
    <div class="mt-4 overflow-x-auto">
      <table class="ex-table">
        <thead><tr><th>Source</th><th>Status</th><th>Existing</th><th>Added here</th><th>Learn</th><th>Visualize</th><th>Practice</th></tr></thead>
        <tbody>
          ${COVERAGE.map((r) => `<tr>
            <td>${r.source}</td>
            <td><span class="ex-st ${r.status.toLowerCase()}">${r.status}</span></td>
            <td>${r.existing}</td>
            <td>${r.need}</td>
            <td><a href="${r.learn}">Learn</a></td>
            <td><a href="${r.viz}">Visualize</a></td>
            <td><a href="${r.practice}">Practice</a></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function afterTex() {
  mount().querySelectorAll('[data-tex]').forEach((el) => katex(el, el.dataset.tex, el.dataset.display === '1'));
}

function esc(s) {
  return String(s || '').replace(/"/g, '&quot;');
}

window.addEventListener('popstate', boot);
window.addEventListener('DOMContentLoaded', boot);

// live T label on draw if present later
document.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'dw-T') {
    const lab = document.getElementById('dw-Tl');
    if (lab) lab.textContent = `${e.target.value} K`;
  }
});
