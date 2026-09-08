import * as THREE from 'three';
import { MillerMath, renderKatex } from './crystal-math.js';
import { HwViewport, makeTextSprite } from './three-viewport.js';

export class MillerSketcher {
  constructor({ mount, tipEl, planeEqEl, dirEqEl, scaleNoteEl }) {
    this.tipEl = tipEl;
    this.planeEqEl = planeEqEl;
    this.dirEqEl = dirEqEl;
    this.scaleNoteEl = scaleNoteEl;
    this.hkl = [2, 1, 0];
    this.uvw = [3, 2, 0];
    this.showPlane = true;
    this.showDir = true;
    this.view = new HwViewport(mount, {
      onHover: (hit) => this._tip(hit),
    });
    this.rebuild();
    this.view.start();
  }

  setPlane(h, k, l) {
    this.hkl = [h, k, l];
    this.rebuild();
  }

  setDirection(u, v, w) {
    this.uvw = [u, v, w];
    this.rebuild();
  }

  setVisibility({ plane, dir }) {
    if (plane != null) this.showPlane = plane;
    if (dir != null) this.showDir = dir;
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
    view.addCellBox(0.04);
    view.addAxes();

    const [h, k, l] = this.hkl;
    const plane = MillerMath.planeInCell(h, k, l);
    this._drawIntercepts(plane.intercepts);
    if (this.showPlane) this._drawPlane(plane, h, k, l);

    const [u, v, w] = this.uvw;
    const dir = MillerMath.directionInCell(u, v, w);
    if (this.showDir) this._drawDirection(dir);

    this._math(plane, dir, h, k, l, u, v, w);
  }

  _drawIntercepts(ints) {
    const { view } = this;
    const marks = [
      { axis: 'x', t: ints.x, color: 0xf87171, label: 'a/h' },
      { axis: 'y', t: ints.y, color: 0x34d399, label: 'b/k' },
      { axis: 'z', t: ints.z, color: 0x38bdf8, label: 'c/l' },
    ];
    marks.forEach(({ axis, t, color, label }) => {
      if (!Number.isFinite(t) || t <= 0) return;
      const p = axis === 'x' ? [t, 0, 0] : axis === 'y' ? [0, t, 0] : [0, 0, t];
      const inside = t <= 1.001;
      const pos = view.toWorld(p[0], p[1], p[2]);
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.045 * view.A, 20, 16),
        new THREE.MeshPhysicalMaterial({
          color, emissive: color, emissiveIntensity: 0.45, roughness: 0.3,
        }),
      );
      ball.position.copy(pos);
      const extra = inside
        ? `Intercept ${label} = ${t.toFixed(3)} on a cell edge.`
        : `Intercept ${label} = ${t.toFixed(3)} lies outside this cell — the shaded polygon uses the cube-edge intersections instead.`;
      ball.userData.tip = extra;
      view.root.add(ball);
      view.addPickable(ball);
      if (t <= 1.15) {
        const a = view.toWorld(0, 0, 0);
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([a, pos]),
          new THREE.LineDashedMaterial({ color, dashSize: 0.08, gapSize: 0.05, transparent: true, opacity: 0.7 }),
        );
        line.computeLineDistances();
        view.root.add(line);
      }
    });
  }

  _drawPlane(plane, h, k, l) {
    const pts = plane.points;
    if (pts.length < 3) return;
    const { view } = this;
    const verts = pts.map((p) => view.toWorld(p[0], p[1], p[2]));
    const c = new THREE.Vector3();
    verts.forEach((v) => c.add(v));
    c.multiplyScalar(1 / verts.length);

    const geo = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 1; i < verts.length - 1; i++) {
      positions.push(c.x, c.y, c.z, verts[i].x, verts[i].y, verts[i].z, verts[i + 1].x, verts[i + 1].y, verts[i + 1].z);
    }
    positions.push(c.x, c.y, c.z, verts[verts.length - 1].x, verts[verts.length - 1].y, verts[verts.length - 1].z, verts[0].x, verts[0].y, verts[0].z);
    positions.push(c.x, c.y, c.z, verts[0].x, verts[0].y, verts[0].z, verts[1].x, verts[1].y, verts[1].z);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();

    const fill = new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      emissive: 0xb45309,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      roughness: 0.35,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, fill);
    mesh.userData.tip = `Plane (${h}${k}${l}): hx + ky + lz = ${plane.C == null ? '?' : Number(plane.C).toPrecision(3)}. Reciprocal intercepts: the plane hits the a-axis at 1/h, and so on. ${plane.note || ''}`;
    view.root.add(mesh);
    view.addPickable(mesh);

    const rimPts = verts.concat([verts[0]]);
    const rim = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(rimPts),
      new THREE.LineBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.95 }),
    );
    view.root.add(rim);
  }

  _drawDirection(dir) {
    const { view } = this;
    const start = view.toWorld(dir.start[0], dir.start[1], dir.start[2]);
    const end = view.toWorld(dir.end[0], dir.end[1], dir.end[2]);
    const delta = end.clone().sub(start);
    const len = delta.length();
    if (len < 1e-6) return;
    const arrow = new THREE.ArrowHelper(delta.clone().normalize(), start, len, 0x22d3ee, 0.18, 0.1);
    arrow.userData.tip = dir.note || 'Direction [uvw] is a real-space arrow, not a plane.';
    view.root.add(arrow);
    arrow.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = new THREE.MeshPhysicalMaterial({
          color: 0x22d3ee,
          emissive: 0x0891b2,
          emissiveIntensity: 0.7,
          roughness: 0.25,
        });
        obj.userData.tip = arrow.userData.tip;
        view.addPickable(obj);
      }
    });
    const glow = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([start, end]),
      new THREE.LineBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.85 }),
    );
    view.root.add(glow);

    if (dir.didScale) {
      const spr = makeTextSprite(`÷${dir.scaleFactor}`, '#fde68a');
      spr.position.copy(end.clone().add(new THREE.Vector3(0.12, 0.12, 0)));
      spr.userData.tip = dir.note;
      view.root.add(spr);
      view.addPickable(spr);
    }
  }

  _math(plane, dir, h, k, l, u, v, w) {
    const ix = plane.intercepts;
    const term = (t, axis) => {
      if (!Number.isFinite(t)) return null;
      const den = t.toFixed(3).replace(/\.?0+$/, '') || '0';
      return String.raw`\dfrac{${axis}}{${den}}`;
    };
    const terms = [term(ix.x, 'x'), term(ix.y, 'y'), term(ix.z, 'z')].filter(Boolean);
    const para = [['x', ix.x], ['y', ix.y], ['z', ix.z]].filter(([, t]) => !Number.isFinite(t)).map(([a]) => a);
    const planeName = `(${[h, k, l].map((n) => (n < 0 ? `\\bar{${-n}}` : n)).join('')})`;
    if (this.planeEqEl) {
      let tex = `${planeName}:\\ ${terms.length ? `${terms.join('+')}=1` : '\\text{undefined}'}`;
      if (para.length) tex += String.raw`\ \parallel ${para.join(',')}`;
      renderKatex(this.planeEqEl, tex, false);
    }
    if (this.dirEqEl) {
      const s = dir.didScale ? String.raw`\ \rightarrow\ \frac{1}{${dir.scaleFactor}}[${u}\ ${v}\ ${w}]` : '';
      renderKatex(this.dirEqEl, String.raw`[${u}\ ${v}\ ${w}]${s}`, false);
    }
    if (this.scaleNoteEl) {
      const bits = [plane.note, dir.note].filter(Boolean);
      this.scaleNoteEl.textContent = bits.join(' ') || 'Presets match the ESE 2180 sketch set: (100), (110), (111), (210) and [320], [0 1 −2].';
      this.scaleNoteEl.classList.toggle('is-warn', dir.didScale || dir.shifted);
    }
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
    this.tipEl.style.left = `${Math.min(host.width - 240, Math.max(8, hit.x - host.left + 12))}px`;
    this.tipEl.style.top = `${Math.min(host.height - 90, Math.max(8, hit.y - host.top + 12))}px`;
  }

  dispose() {
    this.view.dispose();
  }
}
