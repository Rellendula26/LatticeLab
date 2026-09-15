import { UnitCellRenderer } from './unit-cell.js';
import { MillerSketcher } from './miller-sketcher.js';
import { SiliconEkLab } from './silicon-ek.js';
import { FermiDiracViz } from './fermi-hw.js';
import { MillerMath } from './crystal-math.js';

const HOMEWORKS = [
  { id: 'hw1', title: 'Homework 1', blurb: 'Crystallography & Carrier Statistics', live: true },
  { id: 'hw2', title: 'Homework 2', blurb: 'Transport & scattering — coming soon', live: false },
  { id: 'hw3', title: 'Homework 3', blurb: 'Junctions & devices — coming soon', live: false },
];

const PLANE_PRESETS = [
  { h: 1, k: 0, l: 0, label: '(100)' },
  { h: 1, k: 1, l: 0, label: '(110)' },
  { h: 1, k: 1, l: 1, label: '(111)' },
  { h: 2, k: 1, l: 0, label: '(210)' },
];

const DIR_PRESETS = [
  { u: 1, v: 0, w: 0, label: '[100]' },
  { u: 1, v: 1, w: 0, label: '[110]' },
  { u: 1, v: 1, w: 1, label: '[111]' },
  { u: 2, v: 1, w: 0, label: '[210]' },
  { u: 3, v: 2, w: 0, label: '[320]' },
  { u: 0, v: 1, w: -2, label: '[01-2]' },
  { u: 1, v: 2, w: 0, label: '[120]' },
];

class HomeworkPortal {
  constructor() {
    this.hw = 'hw1';
    this.tab = 'cell';
    this.cell = null;
    this.miller = null;
    this.ek = null;
    this.fermi = null;
    this._bindShell();
    this._bindCell();
    this._bindMiller();
    this._ensureTab('cell');
  }

  _bindShell() {
    document.querySelectorAll('[data-hw]').forEach((btn) => {
      btn.addEventListener('click', () => this.setHomework(btn.dataset.hw));
    });
    document.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => this.setTab(btn.dataset.tab));
    });
    window.addEventListener('resize', () => this._resizeVisible());
  }

  setHomework(id) {
    this.hw = id;
    document.querySelectorAll('[data-hw]').forEach((b) => b.classList.toggle('is-on', b.dataset.hw === id));
    document.getElementById('hw-live').classList.toggle('hidden', id !== 'hw1');
    document.getElementById('hw-soon').classList.toggle('hidden', id === 'hw1');
    const meta = HOMEWORKS.find((h) => h.id === id);
    document.getElementById('hw-soon-title').textContent = meta ? meta.title : id;
    document.getElementById('hw-soon-blurb').textContent = meta ? meta.blurb : '';
    if (id === 'hw1') this._ensureTab(this.tab);
    else {
      this.cell && this.cell.hide();
      this.miller && this.miller.hide();
    }
  }

  setTab(id) {
    this.tab = id;
    document.querySelectorAll('[data-tab]').forEach((b) => {
      const on = b.dataset.tab === id;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-panel]').forEach((p) => {
      p.classList.toggle('hidden', p.dataset.panel !== id);
    });
    this._ensureTab(id);
    this._resizeVisible();
  }

  _ensureTab(id) {
    if (id === 'cell' && !this.cell) {
      this.cell = new UnitCellRenderer({
        mount: document.getElementById('cell-mount'),
        formulaEl: document.getElementById('cell-formula'),
        noteEl: document.getElementById('cell-note'),
        tipEl: document.getElementById('cell-tip'),
      });
    }
    if (id === 'miller' && !this.miller) {
      this.miller = new MillerSketcher({
        mount: document.getElementById('miller-mount'),
        tipEl: document.getElementById('miller-tip'),
        planeEqEl: document.getElementById('miller-plane-eq'),
        dirEqEl: document.getElementById('miller-dir-eq'),
        scaleNoteEl: document.getElementById('miller-scale-note'),
      });
      this._pushMillerFromInputs();
    }
    if (id === 'ek' && !this.ek) {
      this.ek = new SiliconEkLab({
        aInput: document.getElementById('si-a'),
        aLabel: document.getElementById('si-a-lab'),
        volEq: document.getElementById('si-vol-eq'),
        densEq: document.getElementById('si-dens-eq'),
        volNote: document.getElementById('si-vol-note'),
        densNote: document.getElementById('si-dens-note'),
        siPlot: document.getElementById('ek-si'),
        gaPlot: document.getElementById('ek-gaas'),
        exciteBtn: document.getElementById('ek-excite'),
        resetBtn: document.getElementById('ek-reset'),
        status: document.getElementById('ek-status'),
      });
    }
    if (id === 'fermi' && !this.fermi) {
      this.fermi = new FermiDiracViz({
        plot: document.getElementById('fd-plot'),
        tSlider: document.getElementById('fd-t'),
        tLabel: document.getElementById('fd-t-lab'),
        dopWrap: document.getElementById('fd-dop'),
        eq: document.getElementById('fd-eq'),
        story: document.getElementById('fd-story'),
        efTick: document.getElementById('fd-ef-tick'),
        nCloud: document.getElementById('fd-n-cloud'),
        pCloud: document.getElementById('fd-p-cloud'),
        efRead: document.getElementById('fd-ef-read'),
        nRead: document.getElementById('fd-n-read'),
        pRead: document.getElementById('fd-p-read'),
      });
    }

    this.cell && (id === 'cell' ? this.cell.show() : this.cell.hide());
    this.miller && (id === 'miller' ? this.miller.show() : this.miller.hide());
  }

  _resizeVisible() {
    requestAnimationFrame(() => {
      if (this.tab === 'cell' && this.cell) this.cell.view.resize();
      if (this.tab === 'miller' && this.miller) this.miller.view.resize();
      if (this.tab === 'ek' && this.ek) this.ek.resize();
      if (this.tab === 'fermi' && this.fermi) this.fermi.resize();
    });
  }

  _bindCell() {
    document.querySelectorAll('[data-lat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-lat]').forEach((b) => b.classList.toggle('is-on', b === btn));
        this.cell && this.cell.setType(btn.dataset.lat);
      });
    });
    document.getElementById('cell-cuts').addEventListener('change', (e) => {
      this.cell && this.cell.setCuts(e.target.checked);
    });
    document.getElementById('cell-reset').addEventListener('click', () => this.cell && this.cell.resetView());
  }

  _bindMiller() {
    const read = (id) => Number(document.getElementById(id).value);
    const apply = () => this._pushMillerFromInputs();
    ['h', 'k', 'l', 'u', 'v', 'w'].forEach((id) => {
      document.getElementById(`m-${id}`).addEventListener('input', apply);
    });
    document.getElementById('m-show-plane').addEventListener('change', (e) => {
      this.miller && this.miller.setVisibility({ plane: e.target.checked });
    });
    document.getElementById('m-show-dir').addEventListener('change', (e) => {
      this.miller && this.miller.setVisibility({ dir: e.target.checked });
    });
    document.getElementById('miller-reset').addEventListener('click', () => this.miller && this.miller.resetView());

    const planeBox = document.getElementById('plane-presets');
    PLANE_PRESETS.forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hw-chip';
      b.textContent = p.label;
      b.addEventListener('click', () => {
        document.getElementById('m-h').value = p.h;
        document.getElementById('m-k').value = p.k;
        document.getElementById('m-l').value = p.l;
        apply();
      });
      planeBox.appendChild(b);
    });
    const dirBox = document.getElementById('dir-presets');
    DIR_PRESETS.forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hw-chip';
      b.textContent = p.label;
      b.addEventListener('click', () => {
        document.getElementById('m-u').value = p.u;
        document.getElementById('m-v').value = p.v;
        document.getElementById('m-w').value = p.w;
        apply();
      });
      dirBox.appendChild(b);
    });

    document.getElementById('m-paste').addEventListener('change', (e) => {
      const trip = MillerMath.parseTriple(e.target.value);
      if (!trip) return;
      const kind = document.getElementById('m-paste-kind').value;
      if (kind === 'plane') {
        document.getElementById('m-h').value = trip[0];
        document.getElementById('m-k').value = trip[1];
        document.getElementById('m-l').value = trip[2];
      } else {
        document.getElementById('m-u').value = trip[0];
        document.getElementById('m-v').value = trip[1];
        document.getElementById('m-w').value = trip[2];
      }
      apply();
    });
  }

  _pushMillerFromInputs() {
    if (!this.miller) return;
    this.miller.setPlane(
      Number(document.getElementById('m-h').value) || 0,
      Number(document.getElementById('m-k').value) || 0,
      Number(document.getElementById('m-l').value) || 0,
    );
    this.miller.setDirection(
      Number(document.getElementById('m-u').value) || 0,
      Number(document.getElementById('m-v').value) || 0,
      Number(document.getElementById('m-w').value) || 0,
    );
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__hwPortal = new HomeworkPortal();
});
