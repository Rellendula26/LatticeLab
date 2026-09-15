const FONT = { family: 'IBM Plex Sans, system-ui, sans-serif', size: 11, color: '#94a3b8' };

function baseOptions(yTitle, extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: '#cbd5e1', boxWidth: 10, font: { size: 11 } } },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(56,189,248,0.25)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: 'x (μm)', color: '#94a3b8' },
        ticks: { color: '#94a3b8', maxTicksLimit: 8 },
        grid: { color: 'rgba(148,163,184,0.10)' },
      },
      y: {
        title: { display: true, text: yTitle, color: '#94a3b8' },
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148,163,184,0.10)' },
      },
      ...extra,
    },
  };
}

function line(label, color, data, extra = {}) {
  return { label, data, borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: 0, tension: 0.12, ...extra };
}

export class JunctionPlots {
  constructor({ bands, field, carriers }) {
    const Chart = window.Chart;
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = FONT.family;
    Chart.defaults.borderColor = 'rgba(148,163,184,0.12)';

    this.bands = new Chart(bands, {
      type: 'line',
      data: { datasets: [] },
      options: {
        ...baseOptions('Energy (eV)'),
        plugins: {
          ...baseOptions('Energy (eV)').plugins,
          tooltip: {
            ...baseOptions('Energy (eV)').plugins.tooltip,
            callbacks: {
              afterBody(items) {
                const l = items[0]?.dataset?.label || '';
                if (l.includes('E_F') || l.includes('Fn') || l.includes('Fp')) {
                  return 'At equilibrium one Fermi level. Under bias they split by qV_a.';
                }
                if (l.includes('E_c')) return 'Conduction-band edge. Electrons live above this line.';
                if (l.includes('E_v')) return 'Valence-band edge. Holes live below this line.';
                return 'Intrinsic level — midgap.';
              },
            },
          },
        },
      },
    });

    this.field = new Chart(field, {
      type: 'line',
      data: { datasets: [] },
      options: {
        ...baseOptions('ρ / q  (cm⁻³)'),
        scales: {
          ...baseOptions('ρ / q  (cm⁻³)').scales,
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'ρ / q  (cm⁻³)', color: '#fbbf24' },
            ticks: { color: '#fbbf24', callback: (v) => v === 0 ? '0' : Number(v).toExponential(0) },
            grid: { color: 'rgba(148,163,184,0.10)' },
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: '|ℰ|  (kV/cm)', color: '#34d399' },
            ticks: { color: '#34d399' },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });

    this.carriers = new Chart(carriers, {
      type: 'line',
      data: { datasets: [] },
      options: {
        ...baseOptions('n, p  (cm⁻³)'),
        scales: {
          ...baseOptions('n, p  (cm⁻³)').scales,
          y: {
            type: 'logarithmic',
            title: { display: true, text: 'n, p  (cm⁻³)', color: '#94a3b8' },
            ticks: { color: '#94a3b8', callback: (v) => Number(v).toExponential(0) },
            grid: { color: 'rgba(148,163,184,0.10)' },
          },
        },
      },
    });
  }

  update(s, samp) {
    const xy = (arr) => samp.xs.map((x, i) => ({ x, y: arr[i] }));
    const EFn = s.EFn;
    const EFp = s.EFn - s.Va;
    const lo = -s.L * 1e4;
    const hi = s.L * 1e4;

    const fermi = Math.abs(s.Va) < 0.012
      ? [line('E_F', '#fbbf24', [{ x: lo, y: EFn }, { x: hi, y: EFn }], { borderDash: [6, 4], borderWidth: 2.2 })]
      : [
        line('E_{Fn}', '#22d3ee', [{ x: lo, y: EFn }, { x: hi, y: EFn }], { borderDash: [6, 4] }),
        line('E_{Fp}', '#fb923c', [{ x: lo, y: EFp }, { x: hi, y: EFp }], { borderDash: [6, 4] }),
      ];

    this.bands.data.datasets = [
      line('E_c', '#22d3ee', xy(samp.Ec)),
      line('E_i', '#94a3b8', xy(samp.Ei), { borderDash: [3, 3], borderWidth: 1.4 }),
      line('E_v', '#f87171', xy(samp.Ev)),
      ...fermi,
    ];
    this.bands.options.scales.x.min = lo;
    this.bands.options.scales.x.max = hi;
    this.bands.update('none');

    this.field.data.datasets = [
      line('ρ / q', '#fbbf24', xy(samp.rho), { yAxisID: 'y', stepped: 'middle', fill: false }),
      line('|ℰ|', '#34d399', xy(samp.E), { yAxisID: 'y1', tension: 0 }),
    ];
    this.field.options.scales.x.min = lo;
    this.field.options.scales.x.max = hi;
    this.field.update('none');

    this.carriers.data.datasets = [
      line('p(x)', '#f87171', xy(samp.pC)),
      line('n(x)', '#38bdf8', xy(samp.nC)),
    ];
    this.carriers.options.scales.x.min = lo;
    this.carriers.options.scales.x.max = hi;
    this.carriers.update('none');
  }

  resize() {
    this.bands.resize();
    this.field.resize();
    this.carriers.resize();
  }
}
