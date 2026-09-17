import { muN, muP, rhoN, rhoP, rhoI, PROBE_X, Tof, T_ROOM } from '../physics/wafer-lab.js';

export function drawTx(canvas, xIron, Ttip, pair) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(r.width * dpr));
  canvas.height = Math.max(1, Math.floor(r.height * dpr));
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, w, h);
  const Tmax = Ttip;
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const x = i / 80;
    pts.push({ x, T: Tof(x, xIron, Ttip) });
  }
  ctx.strokeStyle = '#fb923c';
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const X = p.x * w;
    const Y = h - 8 * dpr - ((p.T - T_ROOM) / (Tmax - T_ROOM)) * (h - 20 * dpr);
    if (i === 0) ctx.moveTo(X, Y);
    else ctx.lineTo(X, Y);
  });
  ctx.stroke();
  pair.forEach((idx, k) => {
    const x = PROBE_X[idx];
    const T = Tof(x, xIron, Ttip);
    const X = x * w;
    const Y = h - 8 * dpr - ((T - T_ROOM) / (Tmax - T_ROOM)) * (h - 20 * dpr);
    ctx.fillStyle = k === 0 ? '#38bdf8' : '#f87171';
    ctx.beginPath();
    ctx.arc(X, Y, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`P${idx + 1}`, X + 4 * dpr, 12 * dpr);
  });
}

export class IrvinChart {
  constructor(canvas) {
    const Chart = window.Chart;
    const Ns = [];
    const yn = [];
    const yp = [];
    for (let e = 13; e <= 20.001; e += 0.08) {
      const N = 10 ** e;
      Ns.push(N);
      yn.push(Math.min(rhoN(N), rhoI() * 1.05));
      yp.push(Math.min(rhoP(N), rhoI() * 1.05));
    }
    this.Ns = Ns;
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          { label: 'n-Si  ρ(N_D)', data: Ns.map((N, i) => ({ x: N, y: yn[i] })), borderColor: '#38bdf8', pointRadius: 0, borderWidth: 2 },
          { label: 'p-Si  ρ(N_A)', data: Ns.map((N, i) => ({ x: N, y: yp[i] })), borderColor: '#f87171', pointRadius: 0, borderWidth: 2 },
          { label: 'measured ρ', data: [], borderColor: '#fbbf24', borderDash: [6, 4], pointRadius: 0, borderWidth: 2 },
          { label: 'intersection', data: [], borderColor: '#fde68a', backgroundColor: '#fde68a', pointRadius: 5, showLine: false },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { labels: { color: '#cbd5e1', boxWidth: 10, font: { size: 11 } } },
          tooltip: { backgroundColor: 'rgba(15,23,42,0.95)' },
        },
        scales: {
          x: {
            type: 'logarithmic',
            min: 1e13,
            max: 1e20,
            title: { display: true, text: 'dopant concentration (cm⁻³)', color: '#94a3b8' },
            ticks: { color: '#94a3b8', callback: (v) => Number(v).toExponential(0) },
            grid: { color: 'rgba(148,163,184,0.1)' },
          },
          y: {
            type: 'logarithmic',
            min: 1e-4,
            max: 1e6,
            title: { display: true, text: 'resistivity (Ω·cm)', color: '#94a3b8' },
            ticks: { color: '#94a3b8', callback: (v) => Number(v).toExponential(0) },
            grid: { color: 'rgba(148,163,184,0.1)' },
          },
        },
      },
    });
  }

  update(rho, type, N) {
    this.chart.data.datasets[2].data = [{ x: 1e13, y: rho }, { x: 1e20, y: rho }];
    const hiN = type === 'n';
    this.chart.data.datasets[0].borderWidth = hiN ? 3.2 : 1.2;
    this.chart.data.datasets[1].borderWidth = type === 'p' ? 3.2 : 1.2;
    this.chart.data.datasets[3].data = (type === 'i' || !N) ? [] : [{ x: N, y: rho }];
    this.chart.update('none');
  }
}

export function mobilityOf(type, N) {
  if (type === 'n') return muN(N);
  if (type === 'p') return muP(N);
  return 0.5 * (muN(N) + muP(N));
}
