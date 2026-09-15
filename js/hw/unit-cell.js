import * as THREE from 'three';
import { CrystalMath, renderKatex } from './crystal-math.js';
import { HwViewport } from './three-viewport.js';

const R = 0.22;

export class UnitCellRenderer {
  constructor({ mount, formulaEl, noteEl, tipEl }) {
    this.formulaEl = formulaEl;
    this.noteEl = noteEl;
    this.tipEl = tipEl;
    this.type = 'fcc';
    this.cuts = false;
    this.view = new HwViewport(mount, {
      onHover: (hit) => this._tip(hit),
    });
    this.rebuild();
    this.view.start();
  }

  setType(type) {
    this.type = type;
    this.rebuild();
  }

  setCuts(on) {
    this.cuts = !!on;
    this.rebuild();
  }

  resetView() {
    this.view.resetCamera();
  }

  show() {
    this.view.resize();
    this.view.start();
  }

  hide() {
    this.view.stop();
  }

  rebuild() {
    const { view } = this;
    view.clearRoot();
    view.addCellBox(this.cuts ? 0.045 : 0.07);
    view.addAxes();

    const planes = view.cellClipPlanes();
    const atoms = CrystalMath.atomsFor(this.type);
    const sphere = new THREE.SphereGeometry(R * view.A, 48, 32);

    atoms.forEach((atom) => {
      const pos = view.toWorld(atom.p[0], atom.p[1], atom.p[2]);
      const mat = new THREE.MeshPhysicalMaterial({
        color: atom.color,
        emissive: atom.emissive,
        emissiveIntensity: 0.22,
        roughness: 0.28,
        metalness: 0.12,
        clearcoat: 0.45,
        transparent: !this.cuts,
        opacity: this.cuts ? 1 : 0.96,
        clippingPlanes: this.cuts ? planes : [],
        clipShadows: true,
      });
      const mesh = new THREE.Mesh(sphere.clone(), mat);
      mesh.position.copy(pos);
      mesh.userData.tip = atom.tip;
      view.root.add(mesh);
      view.addPickable(mesh);

      if (this.cuts && atom.kind !== 'body' && atom.kind !== 'internal') {
        const ghost = new THREE.Mesh(
          sphere.clone(),
          new THREE.MeshBasicMaterial({
            color: atom.color,
            wireframe: true,
            transparent: true,
            opacity: 0.18,
          }),
        );
        ghost.position.copy(pos);
        ghost.userData.tip = `${atom.tip} The wireframe is the rest of the atom sitting in neighboring cells.`;
        view.root.add(ghost);
        view.addPickable(ghost);
      }
    });

    sphere.dispose();

    if (this.type === 'diamond') {
      const pts = [];
      CrystalMath.DIAMOND_BONDS.forEach(([a, b]) => {
        pts.push(view.toWorld(a[0], a[1], a[2]), view.toWorld(b[0], b[1], b[2]));
      });
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const lines = new THREE.LineSegments(
        geo,
        new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.55 }),
      );
      lines.userData.tip = 'Tetrahedral Si–Si bonds. Each internal atom has four neighbors.';
      view.root.add(lines);
    }

    const meta = CrystalMath.META[this.type];
    if (this.formulaEl) renderKatex(this.formulaEl, meta.latex, true);
    if (this.noteEl) this.noteEl.textContent = meta.note;
  }

  _tip(hit) {
    if (!this.tipEl) return;
    if (!hit) {
      this.tipEl.classList.add('hidden');
      return;
    }
    this.tipEl.textContent = hit.tip;
    this.tipEl.classList.remove('hidden');
    const host = this.view.container.getBoundingClientRect();
    this.tipEl.style.left = `${Math.min(host.width - 220, Math.max(8, hit.x - host.left + 12))}px`;
    this.tipEl.style.top = `${Math.min(host.height - 80, Math.max(8, hit.y - host.top + 12))}px`;
  }

  dispose() {
    this.view.dispose();
  }
}
