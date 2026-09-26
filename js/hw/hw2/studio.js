import { TREE, QUESTIONS, question } from './questions.js';

const PREDICT = {
  q1a: { ask: 'Eg = 1.9 eV. If Eg rose, which way would the absorption edge move?', a: 'Shorter λ (bluer)', b: 'Longer λ (redder)', ok: 'a', why: 'λg = hc/Eg. A larger gap needs a more expensive photon, so λg shortens and the edge slides left.' },
  q1b: { ask: 'White light on InAs (Eg ≈ 0.36 eV). What visible color is left?', a: 'White leftover', b: 'No visible leftover', ok: 'b', why: 'Every visible photon has E ≫ 0.36 eV. InAs eats the whole visible band. You see the unabsorbed tail, which is none of the visible.' },
  q1c: { ask: 'CdS, Eg = 2.42 eV, laser 635 nm. Absorbed?', a: 'Yes, then emits 635 nm', b: 'No. E(635 nm) < Eg', ok: 'b', why: 'E ≈ 1240/635 ≈ 1.95 eV, below 2.42 eV. No excitation, so no band-edge emission from this photon. Absorption λ is not emission λ.' },
  q2a: { ask: 'An impurity sits near Ev in InP. Donor, acceptor, or trap?', a: 'Acceptor if EI is within ~3kT of Ev', b: 'Always a donor because it is “in the gap”', ok: 'a', why: 'Near Ev it can accept a valence electron and leave a hole. Near Ec it donates. Midgap it is a deep trap: recombination, not doping.' },
  q2bi: { ask: 'EI ≈ 90 meV. At 300 K, 3kT ≈ 78 meV. At 400 K?', a: 'Still deep; T does not change EI', b: '3kT grows, so the same level can ionize', ok: 'b', why: 'The level did not move. The thermal ruler 3kT grew past 90 meV, so the impurity becomes electrically active.' },
  q2bii: { ask: 'Why can CdS get brighter from 300 K to 400 K here?', a: 'Hotter crystals always glow more', b: 'More ionized impurities → more recombination paths', ok: 'b', why: 'Brightness rose because ionization unlocked carriers and recombination, not because “hot = bright.” In other devices heat kills efficiency.' },
  q3i: { ask: 'If ND > NA and both ≫ ni, what is the type?', a: 'n-type, n ≈ ND − NA', b: 'Always intrinsic because both dopants are present', ok: 'a', why: 'Compensation: leftover donors set the majority. The shortcut fails when |ND − NA| is not large compared with ni.' },
  q4i: { ask: 'At T = 0 with ND > 0, are the donors ionized?', a: 'Yes, n = ND', b: 'No. Freeze-out. f is a step and impurities stay filled', ok: 'b', why: 'T = 0 has no thermal energy. Donors are not “already in the conduction band.”' },
  q5a: { ask: 'On a plot of ln(ni) vs 1/T, what is the slope sign?', a: 'Negative, set by −Eg/2k', b: 'Positive, because heat always makes more carriers', ok: 'a', why: 'ni ~ T^{3/2} exp(−Eg/2kT). Against 1/T the exponential falls. Smaller Eg is a shallower (less steep) drop.' },
  q5b: { ask: 'Why is the middle of n(T) a plateau for n-Si?', a: 'n is pinned to ionized ND', b: 'ni is constant', ok: 'a', why: 'Extrinsic: dopants are ionized and still beat ni. Freeze-out is the cold rise. Intrinsic is the hot takeoff when ni overtakes ND.' },
  q5c: { ask: 'Same ND. Who goes intrinsic first, GaAs or Si?', a: 'Si, smaller Eg so ni grows earlier', b: 'GaAs, because it is direct', ok: 'a', why: 'ni ~ exp(−Eg/2kT). Smaller gap (Si vs GaAs) means the intrinsic takeover happens at lower T. Direct vs indirect is not this plot.' },
  q5d: { ask: 'A device needs n ≈ ND. Why does high T break that?', a: 'Dopants evaporate', b: 'ni becomes comparable to ND, so n ≈ ni', ok: 'b', why: 'The dopants are still there. Thermally generated pairs swamp ND, so n ≈ p ≈ ni and the “n ≈ ND, p ≈ NA” design rule dies. Ge fails first because Eg is smaller.' },
};
import { OpticalViz } from './vis-optical.js';
import { DopantViz } from './vis-dopants.js';
import { CarrierViz } from './vis-carriers.js';
import { FermiViz } from './vis-fermi.js';
import { TempViz } from './vis-temp.js';

export class Homework2Studio {
  constructor() {
    this.id = 'q1a';
    this.mode = 'guided';
    this.viz = null;
    this.guideStep = 0;
    this._nav();
    const q = new URLSearchParams(location.search).get('q');
    this.open(QUESTIONS[q] ? q : 'q1a');
  }

  _nav() {
    const box = document.getElementById('hw2-tree');
    box.innerHTML = TREE.map((g) => `
      <div class="mb-3">
        <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">${g.title}</p>
        <p class="mb-1 text-[11px] text-slate-500">${g.blurb}</p>
        <div class="flex flex-wrap gap-1.5">
          ${g.kids.map((k) => `<button type="button" data-q="${k.id}" class="hw-chip">${k.label}</button>`).join('')}
        </div>
      </div>`).join('');
    box.querySelectorAll('[data-q]').forEach((b) => {
      b.addEventListener('click', () => this.open(b.dataset.q));
    });
    document.querySelectorAll('[data-hw2mode]').forEach((b) => {
      b.addEventListener('click', () => this.setMode(b.dataset.hw2mode));
    });
  }

  setMode(mode) {
    this.mode = mode;
    document.querySelectorAll('[data-hw2mode]').forEach((b) => b.classList.toggle('is-on', b.dataset.hw2mode === mode));
    const ans = document.getElementById('hw2-answer');
    if (mode === 'answer') ans.open = true;
    this._paint();
  }

  open(id) {
    this.id = id;
    this.guideStep = 0;
    document.querySelectorAll('#hw2-tree [data-q]').forEach((b) => b.classList.toggle('is-on', b.dataset.q === id));
    this._mountViz();
    this._paint();
  }

  _mountViz() {
    const q = question(this.id);
    const mount = document.getElementById('hw2-viz');
    if (this.viz && this.viz.destroy) this.viz.destroy();
    const onPreset = (pid) => this.open(pid);
    if (q.viz === 'optical') this.viz = new OpticalViz(mount, q);
    else if (q.viz === 'dopants') this.viz = new DopantViz(mount, q);
    else if (q.viz === 'carriers') this.viz = new CarrierViz(mount, q, onPreset);
    else if (q.viz === 'fermi') this.viz = new FermiViz(mount, q, onPreset);
    else this.viz = new TempViz(mount, q);
    this._bindSyms(document.getElementById('hw2-studio'));
  }

  _bindSyms(root) {
    root.querySelectorAll('[data-sym]').forEach((el) => {
      el.addEventListener('pointerenter', () => this.viz && this.viz.highlight(el.dataset.sym));
      el.addEventListener('pointerleave', () => this.viz && this.viz.highlight(null));
    });
  }

  _paint() {
    const q = question(this.id);
    document.getElementById('hw2-kicker').textContent = q.q;
    document.getElementById('hw2-title').textContent = q.title;
    document.getElementById('hw2-given').innerHTML = q.given.map((g) => `<li>${g}</li>`).join('');
    document.getElementById('hw2-find').innerHTML = q.find.map((g) => `<li>${g}</li>`).join('');
    this._paintPredict();
    document.getElementById('hw2-intuit').innerHTML = q.intuition;
    document.getElementById('hw2-calc').innerHTML = this.mode === 'guided' && this.guideStep < q.steps.length
      ? `<p class="text-slate-400">Guided mode hides the algebra until you step through. Use Next, or switch to Answer mode.</p>`
      : q.calcLines().map((l) => `<li>${l}</li>`).join('');
    const steps = document.getElementById('hw2-steps');
    steps.innerHTML = q.steps.map((s, i) => `
      <li class="${i <= this.guideStep ? 'is-open' : ''}">
        <button type="button" data-gs="${i}" class="hw2-step-btn">${i + 1}. ${s.t}</button>
        <p class="hw2-step-hint ${this.mode === 'answer' || i <= this.guideStep ? '' : 'hidden'}">${s.hint}</p>
      </li>`).join('');
    steps.querySelectorAll('[data-gs]').forEach((b) => {
      b.addEventListener('click', () => {
        this.guideStep = Number(b.dataset.gs);
        this._paint();
      });
    });
    const ans = q.answer;
    document.getElementById('hw2-ans-num').innerHTML = ans.numbers;
    document.getElementById('hw2-ans-dia').textContent = ans.diagram;
    document.getElementById('hw2-ans-prose').textContent = ans.prose;
    if (this.mode === 'guided') document.getElementById('hw2-answer').open = false;
    this._bindSyms(document.getElementById('hw2-studio'));
  }

  _paintPredict() {
    const box = document.getElementById('hw2-predict');
    if (!box) return;
    const p = PREDICT[this.id] || (this.id.startsWith('q3') ? PREDICT.q3i : this.id.startsWith('q4') ? PREDICT.q4i : this.id.startsWith('q5') ? PREDICT.q5b : null);
    if (!p) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    box.classList.remove('hidden');
    box.innerHTML = `
      <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/80">Predict before the picture</p>
      <p class="mt-2 text-sm text-slate-200">${p.ask}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button type="button" data-pred="a" class="hw-chip">${p.a}</button>
        <button type="button" data-pred="b" class="hw-chip">${p.b}</button>
      </div>
      <p id="hw2-pred-why" class="mt-3 hidden text-sm text-slate-300"></p>`;
    box.querySelectorAll('[data-pred]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const why = document.getElementById('hw2-pred-why');
        why.classList.remove('hidden');
        why.textContent = (btn.dataset.pred === p.ok ? 'Yes. ' : 'Not that. ') + p.why;
      });
    });
  }

  resize() {
    if (this.viz && this.viz.resize) this.viz.resize();
  }
}

export function bootHomework2() {
  return new Homework2Studio();
}
