/**
 * Stacked ρ, Ex, V, bands on one x-axis, plus Shockley I-V and bulk Fermi sketch.
 */

export class StackPlots {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cursor = 0.5;
    this.samp = null;
    this.state = null;
    this._dpr = 1;
    this.onPick = null;
    this.onCursor = null;
    canvas.addEventListener('pointerdown', (e) => this._ptr(e, true));
    canvas.addEventListener('pointermove', (e) => this._ptr(e, false));
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(r.width * this._dpr));
    this.canvas.height = Math.max(1, Math.floor(r.height * this._dpr));
  }

  _ptr(e, down) {
    const r = this.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    this.cursor = Math.min(0.98, Math.max(0.02, x));
    if (this.onCursor) this.onCursor(this.cursor);
    if (down && this.onPick) {
      const panel = Math.min(3, Math.floor(y * 4));
      this.onPick(['rho', 'field', 'potential', 'bands'][panel]);
    }
    this.draw();
  }

  update(s, samp) {
    this.state = s;
    this.samp = samp;
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const d = this._dpr;
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, w, h);
    const samp = this.samp;
    const s = this.state;
    if (!samp || !s) return;
    const left = 52 * d;
    const right = w - 12 * d;
    const pw = right - left;
    const titles = ['ρ(x)  / q', 'E_x(x)  (kV/cm)', 'V(x)  (V)', 'Energy bands  (eV)'];
    const keys = ['rho', 'Ex', 'V', null];
    for (let p = 0; p < 4; p++) {
      const y0 = (h * p) / 4 + 4 * d;
      const y1 = (h * (p + 1)) / 4 - 8 * d;
      ctx.fillStyle = '#64748b';
      ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(titles[p], left, y0 + 10 * d);
      const padT = 16 * d;
      const box = { x: left, y: y0 + padT, w: pw, h: y1 - y0 - padT };
      ctx.strokeStyle = 'rgba(148,163,184,0.12)';
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      if (p < 3) this._series(ctx, box, samp.xs, samp[keys[p]], p === 0 ? '#fbbf24' : p === 1 ? '#34d399' : '#c4b5fd', p === 0);
      else this._bands(ctx, box, samp, s);
      if (p === 1) this._shadeE(ctx, box, samp, s);
      this._junctionMarks(ctx, box, samp, s);
    }
    const cx = left + this.cursor * pw;
    ctx.strokeStyle = 'rgba(253,230,138,0.85)';
    ctx.setLineDash([4 * d, 3 * d]);
    ctx.beginPath();
    ctx.moveTo(cx, 4 * d);
    ctx.lineTo(cx, h - 6 * d);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${9 * d}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('x (μm)', left + pw / 2, h - 2 * d);
  }

  _xPix(box, xs, x) {
    const lo = xs[0];
    const hi = xs[xs.length - 1];
    return box.x + ((x - lo) / (hi - lo)) * box.w;
  }

  _series(ctx, box, xs, ys, color, stepped) {
    let min = Infinity;
    let max = -Infinity;
    ys.forEach((v) => { if (v < min) min = v; if (v > max) max = v; });
    if (min === max) { min -= 1; max += 1; }
    const span = max - min;
    min -= 0.08 * span;
    max += 0.08 * span;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6 * this._dpr;
    ctx.beginPath();
    xs.forEach((x, i) => {
      const X = this._xPix(box, xs, x);
      const Y = box.y + box.h - ((ys[i] - min) / (max - min)) * box.h;
      if (i === 0) ctx.moveTo(X, Y);
      else if (stepped) { const Xp = this._xPix(box, xs, xs[i - 1]); ctx.lineTo(X, box.y + box.h - ((ys[i - 1] - min) / (max - min)) * box.h); ctx.lineTo(X, Y); }
      else ctx.lineTo(X, Y);
    });
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = `${9 * this._dpr}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(max.toExponential ? (Math.abs(max) > 100 ? max.toExponential(0) : max.toFixed(2)) : String(max), box.x - 4 * this._dpr, box.y + 8 * this._dpr);
    ctx.fillText(min.toExponential ? (Math.abs(min) > 100 ? min.toExponential(0) : min.toFixed(2)) : String(min), box.x - 4 * this._dpr, box.y + box.h);
  }

  _bands(ctx, box, samp, s) {
    const series = [
      { ys: samp.Ec, c: '#22d3ee', lab: 'Ec' },
      { ys: samp.Ei, c: '#94a3b8', lab: 'Ei' },
      { ys: samp.Ev, c: '#f87171', lab: 'Ev' },
    ];
    let min = Infinity;
    let max = -Infinity;
    series.forEach((g) => g.ys.forEach((v) => { if (v < min) min = v; if (v > max) max = v; }));
    const mapY = (v) => box.y + box.h - ((v - min) / (max - min || 1)) * box.h;
    series.forEach((g) => {
      ctx.strokeStyle = g.c;
      ctx.lineWidth = g.lab === 'Ei' ? 1 * this._dpr : 1.7 * this._dpr;
      if (g.lab === 'Ei') ctx.setLineDash([3 * this._dpr, 3 * this._dpr]);
      ctx.beginPath();
      samp.xs.forEach((x, i) => {
        const X = this._xPix(box, samp.xs, x);
        const Y = mapY(g.ys[i]);
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    });
    const EFn = s.EFn;
    const EFp = s.EFn - s.Va;
    ctx.setLineDash([6 * this._dpr, 4 * this._dpr]);
    ctx.strokeStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(box.x, mapY(EFn));
    ctx.lineTo(box.x + box.w, mapY(Math.abs(s.Va) < 0.012 ? EFn : EFp));
    if (Math.abs(s.Va) < 0.012) {
      ctx.stroke();
    } else {
      ctx.stroke();
      ctx.strokeStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(box.x, mapY(EFn));
      ctx.lineTo(box.x + box.w, mapY(EFn));
      ctx.stroke();
      ctx.strokeStyle = '#fb923c';
      ctx.beginPath();
      ctx.moveTo(box.x, mapY(EFp));
      ctx.lineTo(box.x + box.w, mapY(EFp));
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = '#fde68a';
    ctx.font = `${9 * this._dpr}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(Math.abs(s.Va) < 0.012 ? 'EF flat' : 'Fn / Fp split by qVA', box.x + 6 * this._dpr, box.y + 10 * this._dpr);
    ctx.fillText(`q(Vbi − VA) = ${s.psi.toFixed(3)} eV`, box.x + box.w * 0.55, box.y + 10 * this._dpr);
  }

  _shadeE(ctx, box, samp, s) {
    const ys = samp.Ex;
    let min = Infinity;
    let max = -Infinity;
    ys.forEach((v) => { if (v < min) min = v; if (v > max) max = v; });
    const span = max - min || 1;
    min -= 0.08 * span;
    max += 0.08 * span;
    ctx.fillStyle = 'rgba(52,211,153,0.12)';
    ctx.beginPath();
    const y0 = box.y + box.h - ((0 - min) / (max - min)) * box.h;
    samp.xs.forEach((x, i) => {
      const X = this._xPix(box, samp.xs, x);
      const Y = box.y + box.h - ((ys[i] - min) / (max - min)) * box.h;
      if (i === 0) ctx.moveTo(X, y0);
      ctx.lineTo(X, Y);
    });
    ctx.lineTo(this._xPix(box, samp.xs, samp.xs[samp.xs.length - 1]), y0);
    ctx.closePath();
    ctx.fill();
  }

  _junctionMarks(ctx, box, samp, s) {
    const d = this._dpr;
    const xp = this._xPix(box, samp.xs, -s.xp * 1e4);
    const xn = this._xPix(box, samp.xs, s.xn * 1e4);
    const x0 = this._xPix(box, samp.xs, 0);
    ctx.strokeStyle = 'rgba(251,191,36,0.25)';
    ctx.beginPath();
    ctx.moveTo(xp, box.y);
    ctx.lineTo(xp, box.y + box.h);
    ctx.moveTo(xn, box.y);
    ctx.lineTo(xn, box.y + box.h);
    ctx.moveTo(x0, box.y);
    ctx.lineTo(x0, box.y + box.h);
    ctx.stroke();
  }

  readout() {
    const samp = this.samp;
    const s = this.state;
    if (!samp || !s) return '';
    const lo = samp.xs[0];
    const hi = samp.xs[samp.xs.length - 1];
    const xum = lo + this.cursor * (hi - lo);
    const i = Math.round((this.cursor) * (samp.xs.length - 1));
    const xcm = xum / 1e4;
    const reg = xcm < -s.xp ? 'p-bulk' : xcm > s.xn ? 'n-bulk' : 'depletion';
    return `x = ${xum.toFixed(2)} μm  ·  ${reg}  ·  ρ/q = ${samp.rho[i].toExponential(2)} cm⁻³  ·  Ex = ${samp.Ex[i].toFixed(1)} kV/cm  ·  V = ${samp.V[i].toFixed(3)} V  ·  Ec = ${samp.Ec[i].toFixed(3)} eV`;
  }
}

export class IVChart {
  constructor(canvas) {
    const Chart = window.Chart;
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          { label: 'I(V)', data: [], borderColor: '#34d399', pointRadius: 0, borderWidth: 2 },
          { label: 'bias', data: [], borderColor: '#fbbf24', backgroundColor: '#fbbf24', pointRadius: 6, showLine: false },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { labels: { color: '#cbd5e1', boxWidth: 10 } } },
        scales: {
          x: { type: 'linear', min: -2, max: 0.85, title: { display: true, text: 'VA (V)', color: '#94a3b8' }, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
          y: { title: { display: true, text: 'I (A)', color: '#94a3b8' }, ticks: { color: '#94a3b8', callback: (v) => Number(v).toExponential(1) }, grid: { color: 'rgba(148,163,184,0.1)' } },
        },
      },
    });
  }

  update(physics, s) {
    const pts = [];
    for (let v = -2; v <= 0.62; v += 0.02) {
      const st = physics.solve(s.NA, s.ND, v, s.T);
      const { I } = physics.shockley(st);
      pts.push({ x: v, y: I });
    }
    this.chart.data.datasets[0].data = pts;
    const now = physics.shockley(s);
    const Imax = physics.shockley(physics.solve(s.NA, s.ND, 0.55, s.T)).I;
    this.chart.options.scales.y.min = -Math.abs(Imax) * 0.08;
    this.chart.options.scales.y.max = Math.abs(Imax) * 1.08;
    this.chart.data.datasets[1].data = [{ x: s.Va, y: now.I }];
    this.chart.update('none');
    return now;
  }
}

export class FermiView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._dpr = 1;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(r.width * this._dpr));
    this.canvas.height = Math.max(1, Math.floor(r.height * this._dpr));
  }

  draw(s, physics) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const d = this._dpr;
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, w, h);
    const drawSide = (x0, xw, ptype) => {
      const Ei = 0;
      const Ec = 0.56;
      const Ev = -0.56;
      const EF = ptype ? -s.Vt * Math.log(s.NA / s.ni) : s.Vt * Math.log(s.ND / s.ni);
      const yOf = (E) => {
        const t = (Ec + 0.15 - E) / (1.42);
        return 24 * d + t * (h - 48 * d);
      };
      ctx.fillStyle = ptype ? 'rgba(248,113,113,0.08)' : 'rgba(56,189,248,0.08)';
      ctx.fillRect(x0, 12 * d, xw, h - 24 * d);
      [['Ec', Ec, '#22d3ee'], ['Ei', Ei, '#94a3b8'], ['Ev', Ev, '#f87171']].forEach(([lab, E, c]) => {
        ctx.strokeStyle = c;
        ctx.beginPath();
        ctx.moveTo(x0 + 10 * d, yOf(E));
        ctx.lineTo(x0 + xw - 10 * d, yOf(E));
        ctx.stroke();
        ctx.fillStyle = c;
        ctx.font = `${10 * d}px "IBM Plex Sans", sans-serif`;
        ctx.fillText(lab, x0 + 12 * d, yOf(E) - 4 * d);
      });
      ctx.strokeStyle = '#fbbf24';
      ctx.setLineDash([5 * d, 3 * d]);
      ctx.beginPath();
      ctx.moveTo(x0 + 10 * d, yOf(EF));
      ctx.lineTo(x0 + xw - 10 * d, yOf(EF));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fde68a';
      ctx.fillText(ptype ? 'P  EF→Ev' : 'N  EF→Ec', x0 + 12 * d, 22 * d);
      const n = ptype ? (s.ni * s.ni) / s.NA : s.ND;
      const p = ptype ? s.NA : (s.ni * s.ni) / s.ND;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`n ≈ ${n.toExponential(2)}`, x0 + 12 * d, h - 28 * d);
      ctx.fillText(`p ≈ ${p.toExponential(2)}`, x0 + 12 * d, h - 14 * d);
    };
    drawSide(0, w / 2, true);
    drawSide(w / 2, w / 2, false);
  }
}
