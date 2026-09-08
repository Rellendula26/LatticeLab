/**
 * Homework 1 physics helpers — counting, Miller geometry, Si density, Fermi–Dirac.
 * These are teaching models (conventional cubic cell, schematic bands), not DFT.
 */

export const CrystalMath = {
  CORNERS: [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
  ],
  FACES: [
    [0.5, 0.5, 0], [0.5, 0.5, 1],
    [0.5, 0, 0.5], [0.5, 1, 0.5],
    [0, 0.5, 0.5], [1, 0.5, 0.5],
  ],
  BODY: [[0.5, 0.5, 0.5]],
  DIAMOND_INTERNAL: [
    [0.25, 0.25, 0.25],
    [0.75, 0.75, 0.25],
    [0.75, 0.25, 0.75],
    [0.25, 0.75, 0.75],
  ],
  DIAMOND_BONDS: [
    [[0.25, 0.25, 0.25], [0, 0, 0]],
    [[0.25, 0.25, 0.25], [0.5, 0.5, 0]],
    [[0.25, 0.25, 0.25], [0.5, 0, 0.5]],
    [[0.25, 0.25, 0.25], [0, 0.5, 0.5]],
    [[0.75, 0.75, 0.25], [0.5, 0.5, 0]],
    [[0.75, 0.75, 0.25], [1, 1, 0]],
    [[0.75, 0.75, 0.25], [1, 0.5, 0.5]],
    [[0.75, 0.75, 0.25], [0.5, 1, 0.5]],
    [[0.75, 0.25, 0.75], [0.5, 0, 0.5]],
    [[0.75, 0.25, 0.75], [1, 0, 1]],
    [[0.75, 0.25, 0.75], [1, 0.5, 0.5]],
    [[0.75, 0.25, 0.75], [0.5, 0.5, 1]],
    [[0.25, 0.75, 0.75], [0, 0.5, 0.5]],
    [[0.25, 0.75, 0.75], [0.5, 1, 0.5]],
    [[0.25, 0.75, 0.75], [0, 1, 1]],
    [[0.25, 0.75, 0.75], [0.5, 0.5, 1]],
  ],

  META: {
    sc: {
      n: 1,
      label: 'Simple Cubic',
      latex: String.raw`8\ \text{corners}\times\frac{1}{8}=1\ \text{atom/cell}`,
      note: 'Every corner is shared by 8 cells, so this cell owns only ⅛ of each.',
    },
    bcc: {
      n: 2,
      label: 'Body-Centered Cubic',
      latex: String.raw`8\ \text{corners}\times\frac{1}{8}+1\ \text{body}\times 1=2\ \text{atoms/cell}`,
      note: 'The body-center atom sits entirely inside this cell.',
    },
    fcc: {
      n: 4,
      label: 'Face-Centered Cubic',
      latex: String.raw`8\ \text{corners}\times\frac{1}{8}+6\ \text{faces}\times\frac{1}{2}=4\ \text{atoms/cell}`,
      note: 'Each face atom is shared with one neighbor, so this cell owns ½.',
    },
    diamond: {
      n: 8,
      label: 'Diamond Cubic (Si)',
      latex: String.raw`8\times\frac{1}{8}+6\times\frac{1}{2}+4\ \text{internal}\times 1=8\ \text{atoms/cell}`,
      note: 'Two interpenetrating FCC lattices. Silicon’s conventional cell owns 8 atoms.',
    },
  },

  atomsFor(type) {
    const atoms = CrystalMath.CORNERS.map((p) => ({
      p, kind: 'corner', share: 1 / 8, color: 0xf8fafc, emissive: 0x38bdf8,
      tip: 'Corner atom — shared by 8 unit cells, so this cell owns 1/8.',
    }));
    if (type === 'bcc') {
      atoms.push({
        p: CrystalMath.BODY[0], kind: 'body', share: 1, color: 0x34d399, emissive: 0x059669,
        tip: 'Body-center atom — 100% inside this cell.',
      });
    }
    if (type === 'fcc' || type === 'diamond') {
      CrystalMath.FACES.forEach((p) => {
        atoms.push({
          p, kind: 'face', share: 1 / 2, color: 0x38bdf8, emissive: 0x0284c7,
          tip: 'Face-center atom — shared by 2 cells, so this cell owns 1/2.',
        });
      });
    }
    if (type === 'diamond') {
      CrystalMath.DIAMOND_INTERNAL.forEach((p) => {
        atoms.push({
          p, kind: 'internal', share: 1, color: 0xf87171, emissive: 0x991b1b,
          tip: 'Internal basis atom — wholly owned. Diamond = FCC + 4-atom basis.',
        });
      });
    }
    return atoms;
  },
};

export const MillerMath = {
  parseTriple(raw) {
    const s = String(raw ?? '').trim();
    const compact = s.match(/^[(\[]?\s*(-?\d)(-?\d)(-?\d)\s*[)\]]?$/);
    if (compact) return [Number(compact[1]), Number(compact[2]), Number(compact[3])];
    const m = s.match(/^\s*[(\[]?\s*(-?\d+)\s*[,\s]+(-?\d+)\s*[,\s]+(-?\d+)\s*[)\]]?\s*$/);
    if (!m) return null;
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  },

  bar(n) {
    return n < 0 ? `\\bar{${Math.abs(n)}}` : String(n);
  },

  formatPlane(h, k, l) {
    return `(${[h, k, l].map((n) => (n < 0 ? `\u0305${Math.abs(n)}` : n)).join('')})`;
  },

  formatDir(u, v, w) {
    return `[${[u, v, w].join(' ')}]`;
  },

  intercepts(h, k, l) {
    return {
      x: h === 0 ? Infinity : 1 / h,
      y: k === 0 ? Infinity : 1 / k,
      z: l === 0 ? Infinity : 1 / l,
    };
  },

  /**
   * Intersect hx + ky + lz = C with the unit cube [0,1]³.
   * Index 0 ⇒ plane is parallel to that axis (no intercept).
   */
  intersectPlaneCube(h, k, l, C) {
    const edges = [
      [[0, 0, 0], [1, 0, 0]], [[0, 0, 0], [0, 1, 0]], [[0, 0, 0], [0, 0, 1]],
      [[1, 1, 1], [0, 1, 1]], [[1, 1, 1], [1, 0, 1]], [[1, 1, 1], [1, 1, 0]],
      [[1, 0, 0], [1, 1, 0]], [[1, 0, 0], [1, 0, 1]],
      [[0, 1, 0], [1, 1, 0]], [[0, 1, 0], [0, 1, 1]],
      [[0, 0, 1], [1, 0, 1]], [[0, 0, 1], [0, 1, 1]],
    ];
    const pts = [];
    const push = (p) => {
      const key = p.map((v) => v.toFixed(5)).join(',');
      if (!pts.some((q) => q.key === key)) pts.push({ p, key });
    };
    for (const [a, b] of edges) {
      const fa = h * a[0] + k * a[1] + l * a[2] - C;
      const fb = h * b[0] + k * b[1] + l * b[2] - C;
      if (Math.abs(fa) < 1e-8) push(a);
      if (Math.abs(fb) < 1e-8) push(b);
      if (fa * fb < 0) {
        const t = fa / (fa - fb);
        push([
          a[0] + t * (b[0] - a[0]),
          a[1] + t * (b[1] - a[1]),
          a[2] + t * (b[2] - a[2]),
        ]);
      }
    }
    return pts.map((x) => x.p);
  },

  orderPolygon(points, h, k, l) {
    if (points.length < 3) return points;
    const c = [0, 0, 0];
    points.forEach((p) => { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; });
    c[0] /= points.length; c[1] /= points.length; c[2] /= points.length;
    let ux, uy, uz, vx, vy, vz;
    if (Math.abs(l) >= Math.abs(h) && Math.abs(l) >= Math.abs(k)) {
      ux = 1; uy = 0; uz = 0;
    } else if (Math.abs(k) >= Math.abs(h)) {
      ux = 1; uy = 0; uz = 0;
    } else {
      ux = 0; uy = 1; uz = 0;
    }
    const nx = h, ny = k, nz = l;
    vx = ny * uz - nz * uy;
    vy = nz * ux - nx * uz;
    vz = nx * uy - ny * ux;
    const vlen = Math.hypot(vx, vy, vz) || 1;
    vx /= vlen; vy /= vlen; vz /= vlen;
    const ulen = Math.hypot(ux, uy, uz) || 1;
    ux /= ulen; uy /= ulen; uz /= ulen;
    return points.slice().sort((a, b) => {
      const ax = a[0] - c[0], ay = a[1] - c[1], az = a[2] - c[2];
      const bx = b[0] - c[0], by = b[1] - c[1], bz = b[2] - c[2];
      return Math.atan2(ax * vx + ay * vy + az * vz, ax * ux + ay * uy + az * uz)
        - Math.atan2(bx * vx + by * vy + bz * vz, bx * ux + by * uy + bz * uz);
    });
  },

  planeInCell(h, k, l) {
    if (!h && !k && !l) {
      return { points: [], C: null, note: 'A (000) plane is undefined — at least one index must be nonzero.', intercepts: this.intercepts(0, 0, 0) };
    }
    const intercepts = this.intercepts(h, k, l);
    let points = this.intersectPlaneCube(h, k, l, 1);
    let C = 1;
    let note = '';
    if (points.length < 3) {
      const corners = CrystalMath.CORNERS;
      const vals = corners.map((p) => h * p[0] + k * p[1] + l * p[2]);
      const cmin = Math.min(...vals);
      const cmax = Math.max(...vals);
      const mid = (cmin + cmax) / 2;
      const candidates = [mid, cmin + 0.35 * (cmax - cmin), 0];
      for (const c of candidates) {
        if (Math.abs(cmax - cmin) < 1e-9) break;
        const hit = this.intersectPlaneCube(h, k, l, c);
        if (hit.length >= 3) {
          points = hit;
          C = c;
          note = 'Negative or large indices: this (hkl) family member was slid so it cuts the conventional cell.';
          break;
        }
      }
    }
    if (h === 0 || k === 0 || l === 0) {
      const axes = [h === 0 ? 'x' : null, k === 0 ? 'y' : null, l === 0 ? 'z' : null].filter(Boolean);
      const extra = `Index 0 ⇒ the plane is parallel to ${axes.join(' and ')}.`;
      note = note ? `${note} ${extra}` : extra;
    }
    return { points: this.orderPolygon(points, h, k, l), C, note, intercepts };
  },

  /**
   * Fit [uvw] inside the unit cube.
   * Negative component → shift that origin by +1 so the arrow stays in the cell.
   * |index| > 1 → divide by max |component| (direction unchanged, drawing scale only).
   */
  directionInCell(u, v, w) {
    const raw = [u, v, w];
    if (raw.every((c) => c === 0)) {
      return { start: [0, 0, 0], end: [0, 0, 0], scaleFactor: 1, shifted: false, scaled: false, note: 'A [000] direction is undefined.' };
    }
    const maxAbs = Math.max(Math.abs(u), Math.abs(v), Math.abs(w));
    const scaled = maxAbs > 1 ? raw.map((c) => c / maxAbs) : raw.slice();
    const shifted = u < 0 || v < 0 || w < 0;
    const start = [u < 0 ? 1 : 0, v < 0 ? 1 : 0, w < 0 ? 1 : 0];
    const end = [start[0] + scaled[0], start[1] + scaled[1], start[2] + scaled[2]];
    let note = '';
    if (maxAbs > 1) {
      note = `Indices larger than 1 were divided by ${maxAbs} so the arrow fits in one cell. The crystallographic direction is unchanged — only the drawing scale.`;
    }
    if (shifted) {
      note = (note ? `${note} ` : '') + 'A negative index shifts the tail by one lattice step so the whole arrow stays inside the box.';
    }
    return {
      start, end, scaled: scaled.slice(), scaleFactor: maxAbs > 1 ? maxAbs : 1,
      shifted, didScale: maxAbs > 1, note,
    };
  },
};

export const SiliconMath = {
  A_SI: 5.431,
  ATOMS: 8,

  volumeCm3(aAng) {
    const aCm = aAng * 1e-8;
    return aCm * aCm * aCm;
  },

  densityCm3(aAng) {
    return SiliconMath.ATOMS / SiliconMath.volumeCm3(aAng);
  },
};

export const FermiMath = {
  K_EV: 8.617333262145e-5,
  EV: 0,
  EC: 1.12,
  EI: 0.56,

  kT(T) {
    return FermiMath.K_EV * T;
  },

  occupancy(E, EF, T) {
    if (T <= 0.05) {
      if (E < EF - 1e-12) return 1;
      if (E > EF + 1e-12) return 0;
      return 0.5;
    }
    const x = (E - EF) / FermiMath.kT(T);
    if (x > 40) return 0;
    if (x < -40) return 1;
    return 1 / (1 + Math.exp(x));
  },

  /** Teaching EF: n-type slides toward Ec, p-type toward Ev. Not a full neutrality solve. */
  efFor(doping) {
    if (doping === 'n') return 0.84;
    if (doping === 'p') return 0.28;
    return FermiMath.EI;
  },

  curve(EF, T, n) {
    const steps = n || 220;
    const lo = FermiMath.EV - 0.18;
    const hi = FermiMath.EC + 0.18;
    const E = [];
    const f = [];
    if (T <= 0.05) {
      E.push(lo, EF, EF, hi);
      f.push(1, 1, 0, 0);
      return { E, f };
    }
    for (let i = 0; i <= steps; i++) {
      const e = lo + (hi - lo) * (i / steps);
      E.push(e);
      f.push(FermiMath.occupancy(e, EF, T));
    }
    return { E, f };
  },
};

export function renderKatex(el, tex, display) {
  if (!el) return;
  if (window.katex) {
    window.katex.render(tex, el, { throwOnError: false, displayMode: !!display });
    return;
  }
  el.textContent = tex;
}
