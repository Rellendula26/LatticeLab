const FONT = { family: 'IBM Plex Sans, system-ui, sans-serif', size: 11 };

export function themeChart() {
  const Chart = window.Chart;
  if (!Chart || Chart._pdThemed) return;
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = FONT.family;
  Chart.defaults.font.size = FONT.size;
  Chart.defaults.borderColor = 'rgba(148,163,184,0.12)';
  Chart._pdThemed = true;
}

export function makeLineChart(canvas, yTitle) {
  themeChart();
  const Chart = window.Chart;
  return new Chart(canvas, {
    type: 'line',
    data: { datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { labels: { boxWidth: 10, color: '#cbd5e1' } },
        tooltip: { backgroundColor: '#0f172a' },
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: '', color: '#94a3b8' },
          grid: { color: 'rgba(148,163,184,0.08)' },
        },
        y: {
          title: { display: true, text: yTitle || '', color: '#94a3b8' },
          grid: { color: 'rgba(148,163,184,0.08)' },
        },
      },
    },
  });
}

export function setXY(chart, xTitle, yTitle, datasets, extra = {}) {
  chart.options.scales.x.title.text = xTitle;
  chart.options.scales.y.title.text = yTitle;
  if (extra.yMin != null) chart.options.scales.y.min = extra.yMin;
  else delete chart.options.scales.y.min;
  if (extra.yMax != null) chart.options.scales.y.max = extra.yMax;
  else delete chart.options.scales.y.max;
  chart.data.datasets = datasets.map((d) => ({
    showLine: true,
    pointRadius: d.pointRadius ?? 0,
    borderWidth: d.borderWidth ?? 2,
    tension: 0.05,
    ...d,
  }));
  chart.update('none');
}

export function scatter(x, y, color, label, extra = {}) {
  return {
    label,
    data: x.map((xi, i) => ({ x: xi, y: y[i] })),
    borderColor: color,
    backgroundColor: color,
    ...extra,
  };
}
