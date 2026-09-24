import { TREE, QUESTIONS, question } from './questions.js';
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

  resize() {
    if (this.viz && this.viz.resize) this.viz.resize();
  }
}

export function bootHomework2() {
  return new Homework2Studio();
}
