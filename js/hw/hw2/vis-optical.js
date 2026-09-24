import { material } from './materials.js';
import {
  lambdaG, ePhoton, absorbs, alphaDirect, wavelengthColor, colorMixTransmitted,
} from './physics.js';
import { sizeCanvas, clear, drawPhoton, spectrumBar } from './draw.js';
import { LASERS, laserRow } from './questions.js';

export class OpticalViz {
  constructor(root, q) {
    this.root = root;
    this.q = q;
    this.hi = null;
    this.lam = 500;
    this.laser = 470;
    this.mat = 'CdS';
    this.phase = 0;
    this.animT = 0;
    this._build();
    this._loop = this._loop.bind(this);
    this.raf = requestAnimationFrame(this._loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.root.innerHTML = '';
  }

  highlight(sym) { this.hi = sym; this.draw(); }

  resize() { this.draw(); }

  _build() {
    const k = this.q.params.kind;
    if (k === 'alpha') this.root.innerHTML = this._alphaHTML();
    else if (k === 'white') this.root.innerHTML = this._whiteHTML();
    else this.root.innerHTML = this._laserHTML();
    this.cv = this.root.querySelector('canvas');
    const sl = this.root.querySelector('[data-lam]');
    if (sl) {
      sl.addEventListener('input', () => {
        this.lam = Number(sl.value);
        this.draw();
        this._readout();
      });
    }
    this.root.querySelectorAll('[data-laser]').forEach((b) => {
      b.addEventListener('click', () => {
        this.laser = Number(b.dataset.laser);
        this.animT = 0;
        this.root.querySelectorAll('[data-laser]').forEach((x) => x.classList.toggle('is-on', x === b));
        this.draw();
        this._table();
      });
    });
    this.root.querySelectorAll('[data-mat]').forEach((b) => {
      b.addEventListener('click', () => {
        this.mat = b.dataset.mat;
        this.animT = 0;
        this.root.querySelectorAll('[data-mat]').forEach((x) => x.classList.toggle('is-on', x === b));
        this.draw();
        this._table();
      });
    });
    this.draw();
    this._readout();
    this._table();
  }

  _alphaHTML() {
    return `
      <div class="hw2-viz-grid">
        <div class="hw2-canvas-wrap"><canvas></canvas></div>
        <aside class="glass rounded-2xl p-4 space-y-3">
          <label class="block text-sm text-slate-300">Wavelength <span data-sym="lam" class="hw2-sym float-right font-mono text-amber-200">500 nm</span>
            <input data-lam type="range" min="350" max="900" step="1" value="500" class="mt-2 w-full" />
          </label>
          <p data-read class="text-sm text-slate-300"></p>
          <div class="hw2-why rounded-xl p-3 text-sm text-slate-300">Photon wavelength → energy → compare to <span data-sym="Eg" class="hw2-sym">Eg</span> → absorb or pass.</div>
          <div class="rounded-xl border border-white/10 p-3">
            <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Sketch this on paper</p>
            <p class="mt-2 text-xs text-slate-400">α up, λ right. Vertical tick at λg = 653 nm. Flat zero for λ &gt; λg. Steep rise for λ &lt; λg. Label “interband” on the left.</p>
          </div>
        </aside>
      </div>`;
  }

  _whiteHTML() {
    return `
      <div class="hw2-canvas-wrap hw2-canvas-tall"><canvas></canvas></div>
      <div class="hw2-why mt-3 rounded-xl p-3 text-sm text-slate-300">
        λ → E = 1240/λ → compare to Eg → <strong>absorbed</strong> vs <strong>transmitted</strong> vs <strong>what you see</strong> (the leftover).
        The homework assumes no reflection and no emission.
      </div>`;
  }

  _laserHTML() {
    return `
      <div class="mb-3 flex flex-wrap gap-2">
        ${['CdS', 'CdSe'].map((id) => `<button type="button" data-mat="${id}" class="hw-chip ${id === 'CdS' ? 'is-on' : ''}">${id} · Eg=${material(id).Eg} eV</button>`).join('')}
      </div>
      <div class="mb-3 flex flex-wrap gap-2">
        ${LASERS.map((l) => `<button type="button" data-laser="${l}" class="hw-chip ${l === 470 ? 'is-on' : ''}">${l} nm</button>`).join('')}
      </div>
      <div class="hw2-canvas-wrap"><canvas></canvas></div>
      <div class="mt-3 overflow-x-auto">
        <table class="hw2-table" data-table></table>
      </div>`;
  }

  _loop(now) {
    this.phase = now / 180;
    this.animT += 0.016;
    this.draw();
    this.raf = requestAnimationFrame(this._loop);
  }

  _readout() {
    const el = this.root.querySelector('[data-read]');
    const lab = this.root.querySelector('[data-sym="lam"]');
    if (lab) lab.textContent = `${this.lam} nm`;
    if (!el) return;
    const Eg = 1.9;
    const E = ePhoton(this.lam);
    const on = absorbs(Eg, this.lam);
    el.innerHTML = `E<sub>photon</sub> = 1240/${this.lam} = <span data-sym="Eph" class="hw2-sym">${E.toFixed(2)} eV</span>.
      ${on ? '≥ Eg → VB → CB excitation.' : '&lt; Eg → photon passes through.'}`;
  }

  _table() {
    const box = this.root.querySelector('[data-table]');
    if (!box) return;
    const rows = ['CdS', 'CdSe'].map((id) => {
      const cells = LASERS.map((lam) => {
        const r = laserRow(id, lam);
        return `<td>${r.Eph.toFixed(2)} eV</td><td>${r.absorbed ? 'yes' : 'no'}</td><td>${r.emit ? 'yes' : 'no'}</td><td>${r.lemit ? r.lemit.toFixed(0) : '—'}</td><td>${r.color}</td>`;
      }).join('');
      return `<tr><th>${id}</th>${LASERS.map((lam) => {
        const r = laserRow(id, lam);
        return `<td colspan="5" class="hw2-subhead">${lam} nm · ${r.Eph.toFixed(2)} eV · ${r.absorbed ? 'absorbed' : 'not absorbed'} · ${r.emit ? `${r.lemit.toFixed(0)} nm ${r.color}` : 'no emission'}</td>`;
      }).join('')}</tr>`;
    });
    box.innerHTML = `
      <thead><tr><th>Wafer</th><th colspan="5">750 nm</th><th colspan="5">635 nm</th><th colspan="5">470 nm</th></tr></thead>
      <tbody>${['CdS', 'CdSe'].map((id) => `<tr>
        <th>${id}<br><span class="text-[10px] font-normal text-slate-500">Eg=${material(id).Eg} eV</span></th>
        ${LASERS.map((lam) => {
          const r = laserRow(id, lam);
          const on = id === this.mat && lam === this.laser;
          return `<td class="${on ? 'is-on' : ''}">${r.Eph.toFixed(2)} eV<br>${r.absorbed ? 'absorbed' : 'passes'}<br>${r.emit ? `${r.lemit.toFixed(0)} nm ${r.color}` : 'no λemit'}</td>`;
        }).join('')}
      </tr>`).join('')}</tbody>`;
  }

  draw() {
    if (!this.cv) return;
    const { w, h, dpr: d } = sizeCanvas(this.cv);
    const ctx = this.cv.getContext('2d');
    clear(ctx, w, h);
    const k = this.q.params.kind;
    if (k === 'alpha') this._drawAlpha(ctx, w, h, d);
    else if (k === 'white') this._drawWhite(ctx, w, h, d);
    else this._drawLaser(ctx, w, h, d);
  }

  _drawAlpha(ctx, w, h, d) {
    const Eg = 1.9;
    const lg = lambdaG(Eg);
    const plot = { x: 52 * d, y: 28 * d, w: w * 0.62, h: h - 70 * d };
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText('α', 16 * d, 24 * d);
    ctx.fillText('λ (nm)', plot.x + plot.w - 40 * d, h - 12 * d);
    const l0 = 350, l1 = 900;
    const xOf = (lam) => plot.x + ((lam - l0) / (l1 - l0)) * plot.w;
    ctx.fillStyle = 'rgba(56,189,248,0.10)';
    ctx.fillRect(plot.x, plot.y, xOf(lg) - plot.x, plot.h);
    ctx.fillStyle = 'rgba(148,163,184,0.08)';
    ctx.fillRect(xOf(lg), plot.y, plot.x + plot.w - xOf(lg), plot.h);
    ctx.fillStyle = this.hi === 'Eg' ? '#fde68a' : '#64748b';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText('E > Eg · interband', plot.x + 8 * d, plot.y + 14 * d);
    ctx.fillText('E < Eg · not enough', xOf(lg) + 8 * d, plot.y + 14 * d);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.4 * d;
    ctx.beginPath();
    for (let lam = l0; lam <= l1; lam += 2) {
      const a = alphaDirect(lam, Eg);
      const x = xOf(lam);
      const y = plot.y + plot.h - a * plot.h * 0.92;
      if (lam === l0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#fbbf24';
    ctx.setLineDash([5 * d, 4 * d]);
    ctx.beginPath();
    ctx.moveTo(xOf(lg), plot.y);
    ctx.lineTo(xOf(lg), plot.y + plot.h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fde68a';
    ctx.fillText(`λg = ${lg.toFixed(0)} nm`, xOf(lg) + 6 * d, plot.y + plot.h - 8 * d);
    const xw = xOf(this.lam);
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(xw, plot.y);
    ctx.lineTo(xw, plot.y + plot.h);
    ctx.stroke();
    this._miniBand(ctx, w * 0.68, 20 * d, w * 0.3, h - 40 * d, d, Eg, this.lam);
  }

  _miniBand(ctx, x, y, W, H, d, Eg, lam) {
    const box = { x, y, w: W, h: H };
    const Ev = y + H * 0.72;
    const Ec = y + H * 0.28;
    ctx.fillStyle = 'rgba(2,132,199,0.16)';
    ctx.fillRect(x, y, W, Ec - y + 10 * d);
    ctx.fillStyle = 'rgba(153,27,27,0.16)';
    ctx.fillRect(x, Ev, W, y + H - Ev);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2 * d;
    ctx.beginPath(); ctx.moveTo(x + 8 * d, Ec); ctx.lineTo(x + W - 8 * d, Ec); ctx.stroke();
    ctx.strokeStyle = '#f87171';
    ctx.beginPath(); ctx.moveTo(x + 8 * d, Ev); ctx.lineTo(x + W - 8 * d, Ev); ctx.stroke();
    ctx.fillStyle = this.hi === 'Eg' ? '#fde68a' : '#94a3b8';
    ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText('Ec', x + 10 * d, Ec - 6 * d);
    ctx.fillText('Ev', x + 10 * d, Ev + 14 * d);
    const on = absorbs(Eg, lam);
    const col = wavelengthColor(lam).css;
    const t = (this.phase % (Math.PI * 2));
    if (on) {
      const u = (0.5 + 0.5 * Math.sin(this.phase * 0.25));
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x + W * 0.5, Ev + (Ec - Ev) * (1 - u), 5 * d, 0, Math.PI * 2);
      ctx.fill();
      drawPhoton(ctx, x + W * 0.78, Ev + (Ec - Ev) * 0.5, col, d, this.phase);
    } else {
      drawPhoton(ctx, x + W * (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(this.phase * 0.4))), (Ev + Ec) / 2, col, d, this.phase);
    }
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(on ? 'absorbed' : 'passes through', x + 10 * d, y + H - 8 * d);
  }

  _drawWhite(ctx, w, h, d) {
    const EgA = 1.9;
    const EgB = material('InAs').Eg;
    const rowH = h * 0.42;
    this._whiteRow(ctx, 16 * d, 16 * d, w - 32 * d, rowH, d, 'Eg = 1.9 eV', EgA);
    this._whiteRow(ctx, 16 * d, 20 * d + rowH, w - 32 * d, rowH, d, 'InAs', EgB);
  }

  _whiteRow(ctx, x, y, W, H, d, title, Eg) {
    const lg = lambdaG(Eg);
    const seen = colorMixTransmitted(Eg);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `${13 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(`${title}   λg = ${lg.toFixed(0)} nm`, x, y + 16 * d);
    spectrumBar(ctx, x, y + 28 * d, W * 0.72, 22 * d, d, lg < 750 && lg > 380 ? lg : null, Math.min(lg, 750));
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText('380 nm', x, y + 64 * d);
    ctx.fillText('750 nm', x + W * 0.62, y + 64 * d);
    const t = 0.5 + 0.5 * Math.sin(this.phase * 0.3);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x, y + 78 * d, 70 * d, 28 * d);
    ctx.fillStyle = '#0f172a';
    ctx.font = `${9 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText('white in', x + 8 * d, y + 96 * d);
    ctx.fillStyle = 'rgba(148,163,184,0.35)';
    ctx.fillRect(x + 90 * d, y + 74 * d, 120 * d, 36 * d);
    ctx.strokeStyle = '#64748b';
    ctx.strokeRect(x + 90 * d, y + 74 * d, 120 * d, 36 * d);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('wafer', x + 128 * d, y + 96 * d);
    ctx.fillStyle = seen.any ? seen.css : '#050608';
    ctx.fillRect(x + 230 * d, y + 78 * d, 70 * d, 28 * d);
    ctx.fillStyle = seen.any ? '#0f172a' : '#e2e8f0';
    ctx.fillText(seen.any ? 'see this' : 'nothing', x + 238 * d, y + 96 * d);
    drawPhoton(ctx, x + (40 + 180 * t) * d, y + 92 * d, t < 0.55 ? '#f8fafc' : (seen.any ? seen.css : '#1e293b'), d, this.phase);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(seen.any
      ? `Absorbed: λ < ${lg.toFixed(0)} nm. Transmitted leftover looks ${seen.name}.`
      : `Every visible photon has E > ${Eg} eV. Nothing visible is transmitted.`,
    x, y + H - 10 * d);
  }

  _drawLaser(ctx, w, h, d) {
    const m = material(this.mat);
    const lam = this.laser;
    const Eph = ePhoton(lam);
    const on = absorbs(m.Eg, lam);
    const le = lambdaG(m.Eg);
    const colIn = wavelengthColor(lam);
    const colOut = wavelengthColor(le);
    const u = (this.animT % 5) / 5;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `${14 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(`${m.name}  Eg=${m.Eg} eV   laser ${lam} nm = ${Eph.toFixed(2)} eV`, 16 * d, 22 * d);
    const Ev = h * 0.72, Ec = h * 0.28;
    ctx.fillStyle = 'rgba(2,132,199,0.14)';
    ctx.fillRect(w * 0.08, 40 * d, w * 0.55, Ec - 20 * d);
    ctx.fillStyle = 'rgba(153,27,27,0.14)';
    ctx.fillRect(w * 0.08, Ev, w * 0.55, h * 0.2);
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2 * d;
    ctx.beginPath(); ctx.moveTo(w * 0.08, Ec); ctx.lineTo(w * 0.63, Ec); ctx.stroke();
    ctx.strokeStyle = '#f87171';
    ctx.beginPath(); ctx.moveTo(w * 0.08, Ev); ctx.lineTo(w * 0.63, Ev); ctx.stroke();
    ctx.fillStyle = this.hi === 'Eg' ? '#fde68a' : '#94a3b8';
    ctx.font = `${11 * d}px "IBM Plex Sans", sans-serif`;
    ctx.fillText('Ec', w * 0.09, Ec - 6 * d);
    ctx.fillText('Ev', w * 0.09, Ev + 14 * d);
    if (!on) {
      drawPhoton(ctx, w * (0.12 + 0.7 * u), (Ec + Ev) / 2, colIn.css, d, this.phase);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('Ephoton < Eg. Laser passes. No emission.', w * 0.66, h * 0.5);
    } else if (u < 0.28) {
      drawPhoton(ctx, w * (0.12 + 1.6 * u), (Ec + Ev) / 2, colIn.css, d, this.phase);
      ctx.fillStyle = '#fde68a';
      ctx.fillText('1 · photon arrives', w * 0.66, h * 0.35);
    } else if (u < 0.5) {
      const v = (u - 0.28) / 0.22;
      const eStart = Ec - Math.min(0.35, (Eph - m.Eg) / m.Eg) * (Ev - Ec) * 0;
      const y = Ev + (Ec - 22 * d - Ev) * v;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(w * 0.36, y, 5 * d, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.fillText('2 · electron in CB (maybe hot)', w * 0.66, h * 0.35);
    } else if (u < 0.72 && Eph > m.Eg + 0.05) {
      const v = (u - 0.5) / 0.22;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(w * 0.36, Ec - 22 * d + 18 * d * (1 - v), 5 * d, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fca5a5';
      ctx.fillText('3 · thermal relaxation to the band edge', w * 0.66, h * 0.35);
      ctx.fillText('λlaser is not λemit', w * 0.66, h * 0.42);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(w * 0.36, Ec + 4 * d, 4 * d, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f87171';
      ctx.beginPath(); ctx.arc(w * 0.36, Ev - 4 * d, 5 * d, 0, Math.PI * 2); ctx.stroke();
      drawPhoton(ctx, w * (0.42 + 0.25 * ((u - 0.72) / 0.28)), (Ec + Ev) / 2, colOut.css, d, this.phase);
      ctx.fillStyle = colOut.css;
      ctx.fillText(`4 · emit ≈ Eg → ${le.toFixed(0)} nm ${colOut.name}`, w * 0.66, h * 0.35);
    }
  }
}
