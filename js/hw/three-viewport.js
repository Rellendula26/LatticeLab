import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Shared WebGL viewport: resize, orbit, lights, crystal→world basis, picking.
 * Crystal: +x forward, +y right, +z up  →  world: (y, z, x).
 */
export class HwViewport {
  constructor(container, opts = {}) {
    this.container = container;
    this.A = opts.cellSize ?? 2;
    this.onHover = opts.onHover || null;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1220);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.08, 80);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.localClippingEnabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = 'hw-canvas';
    this.renderer.domElement.setAttribute('tabindex', '0');
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 1.4;
    this.controls.maxDistance = 12;

    this.root = new THREE.Group();
    this.scene.add(this.root);

    const hemi = new THREE.HemisphereLight(0xb8e0ff, 0x1e293b, 0.85);
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(2.4, 3.2, 1.6);
    const fill = new THREE.DirectionalLight(0x38bdf8, 0.28);
    fill.position.set(-2.2, 0.6, -1.4);
    this.scene.add(hemi, key, fill);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pickables = [];
    this.running = false;
    this._raf = 0;

    this._onPointer = (e) => this._pick(e);
    this._onLeave = () => this.onHover && this.onHover(null);
    this.renderer.domElement.addEventListener('pointermove', this._onPointer);
    this.renderer.domElement.addEventListener('pointerleave', this._onLeave);

    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(container);
    this.resize();
    this.resetCamera();
  }

  toWorld(cx, cy, cz, target = new THREE.Vector3()) {
    return target.set(cy * this.A, cz * this.A, cx * this.A);
  }

  cellCenter(target = new THREE.Vector3()) {
    return this.toWorld(0.5, 0.5, 0.5, target);
  }

  cellClipPlanes() {
    const A = this.A;
    return [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), A),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), A),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), A),
    ];
  }

  resetCamera() {
    const c = this.cellCenter();
    this.camera.position.set(c.x + 2.15, c.y + 1.65, c.z + 2.55);
    this.controls.target.copy(c);
    this.controls.update();
  }

  clearRoot() {
    const dispose = (obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    };
    while (this.root.children.length) {
      const child = this.root.children[0];
      child.traverse(dispose);
      this.root.remove(child);
    }
    this.pickables = [];
  }

  addPickable(mesh) {
    this.pickables.push(mesh);
  }

  addCellBox(opacity = 0.07) {
    const A = this.A;
    const geo = new THREE.BoxGeometry(A, A, A);
    const fill = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity,
      roughness: 0.15,
      metalness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const box = new THREE.Mesh(geo, fill);
    box.position.copy(this.cellCenter());
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.85 }),
    );
    edges.position.copy(box.position);
    this.root.add(box, edges);
    return { box, edges };
  }

  addAxes() {
    const L = this.A * 1.18;
    const o = new THREE.Vector3(0, 0, 0);
    const add = (dirWorld, color, label, tip) => {
      const arrow = new THREE.ArrowHelper(dirWorld.clone().normalize(), o, L, color, 0.16, 0.09);
      arrow.userData.tip = tip;
      this.root.add(arrow);
      const spr = makeTextSprite(label, `#${color.toString(16).padStart(6, '0')}`);
      spr.position.copy(dirWorld.clone().multiplyScalar(L * 1.06));
      spr.userData.tip = tip;
      this.root.add(spr);
      this.addPickable(spr);
    };
    add(new THREE.Vector3(0, 0, 1), 0xf87171, 'x', 'Crystal +x points forward (out of the page toward you when the cell is in the standard sketch).');
    add(new THREE.Vector3(1, 0, 0), 0x34d399, 'y', 'Crystal +y points right.');
    add(new THREE.Vector3(0, 1, 0), 0x38bdf8, 'z', 'Crystal +z points up. Right-handed: x × y = z.');
  }

  resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  start() {
    if (this.running) return;
    this.running = true;
    const tick = () => {
      if (!this.running) return;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this._raf = requestAnimationFrame(tick);
    };
    tick();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this._raf);
  }

  _pick(event) {
    if (!this.onHover || !this.pickables.length) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, true);
    if (!hits.length) {
      this.onHover(null);
      return;
    }
    let obj = hits[0].object;
    while (obj && !obj.userData.tip) obj = obj.parent;
    this.onHover(obj ? { tip: obj.userData.tip, x: event.clientX, y: event.clientY } : null);
  }

  dispose() {
    this.stop();
    this._ro.disconnect();
    this.renderer.domElement.removeEventListener('pointermove', this._onPointer);
    this.renderer.domElement.removeEventListener('pointerleave', this._onLeave);
    this.clearRoot();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

export function makeTextSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 128);
  ctx.font = '700 52px "IBM Plex Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(15,23,42,0.9)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  spr.scale.set(0.42, 0.21, 1);
  return spr;
}
