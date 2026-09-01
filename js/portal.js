    const NA = 6.02214076e23;
    const kB = 8.617333262145e-5; // eV/K
    const PLOTLY_BG = 'rgba(0,0,0,0)';
    const FONT = { family: 'IBM Plex Sans, sans-serif', color: '#cbd5e1', size: 12 };

    const kickers = {
      lattice: '3D Geometry',
      density: 'Computation',
      waves: 'Wave–Particle Duality',
      bandgap: 'Band Physics',
      fermi: 'Statistics',
      led: 'Photonics',
      diode: 'Devices',
      lab: 'Core Concepts',
    };

    const catalogView = document.getElementById('catalog-view');
    const workspaceView = document.getElementById('workspace-view');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const inited = {};
    let activeSim = null;
    let absorbTimer = 0;
    let latticeRaf = 0;
    let latticeAngle = 0.85;
    let latticeOrbiting = true;
    let latticeGrabUntil = 0;
    let waveRaf = 0;
    let waveT = 0;
    let wavePlaying = true;
    let waveReady = false;
    let fermiSweepRaf = 0;
    let ledTimer = 0;
    let ledAnim = null;

    (function splitWordmark() {
      const el = document.getElementById('wordmark');
      if (!el || reduceMotion) return;
      el.innerHTML = el.textContent.split('').map((ch, i) =>
        '<span class="wm-letter" style="animation-delay:' + (i * 48) + 'ms">' + ch + '</span>'
      ).join('');
    })();

    document.querySelectorAll('[data-accordion]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const art = btn.closest('article');
        const open = art.classList.toggle('accordion-open');
        btn.setAttribute('aria-expanded', String(open));
      });
    });

    document.querySelectorAll('[data-launch]').forEach((btn) => {
      btn.addEventListener('click', () => launch(btn.dataset.launch));
    });

    document.getElementById('back-btn').addEventListener('click', backToCatalog);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !workspaceView.classList.contains('hidden')) backToCatalog();
    });

    function stopLoops() {
      cancelAnimationFrame(latticeRaf);
      cancelAnimationFrame(waveRaf);
      cancelAnimationFrame(fermiSweepRaf);
      latticeRaf = waveRaf = fermiSweepRaf = 0;
      clearTimeout(absorbTimer);
      clearTimeout(ledTimer);
      ledAnim = null;
      if (typeof stopDiode === 'function') stopDiode();
      if (typeof stopLab === 'function') stopLab();
    }

    function launch(id) {
      stopLoops();
      activeSim = id;
      catalogView.style.opacity = '0';
      catalogView.style.transition = 'opacity 280ms ease';
      setTimeout(() => {
        catalogView.classList.add('hidden');
        catalogView.style.opacity = '';
        catalogView.style.transition = '';
        workspaceView.classList.remove('hidden');
        document.getElementById('workspace-kicker').textContent = kickers[id];
        document.querySelectorAll('.sim-panel').forEach((p) => p.classList.add('hidden'));
        document.getElementById('panel-' + id).classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        requestAnimationFrame(() => {
          if (id === 'lattice') initLattice();
          if (id === 'density') initDensity();
          if (id === 'waves') initWaves();
          if (id === 'bandgap') initBandgap();
          if (id === 'fermi') initFermi();
          if (id === 'led') initLed();
          if (id === 'diode') initDiode();
          if (id === 'lab') initLab();
          resizeVisible();
        });
      }, 260);
    }

    function backToCatalog() {
      stopLoops();
      activeSim = null;
      workspaceView.classList.add('hidden');
      catalogView.classList.remove('hidden');
      catalogView.style.opacity = '0';
      requestAnimationFrame(() => {
        catalogView.style.transition = 'opacity 280ms ease';
        catalogView.style.opacity = '1';
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resizeVisible() {
      document.querySelectorAll('.js-plot').forEach((el) => {
        if (el.offsetParent !== null && el.data) Plotly.Plots.resize(el);
      });
    }
    window.addEventListener('resize', resizeVisible);

    function baseLayout(extra) {
      return Object.assign({
        paper_bgcolor: PLOTLY_BG,
        plot_bgcolor: 'rgba(15, 23, 42, 0.35)',
        font: FONT,
        margin: { l: 55, r: 20, t: 30, b: 50 },
        hovermode: 'closest',
      }, extra);
    }

    function sciHTML(n, digits) {
      if (!isFinite(n) || n === 0) return '0';
      const sign = n < 0 ? '-' : '';
      const abs = Math.abs(n);
      const exp = Math.floor(Math.log10(abs));
      const man = abs / Math.pow(10, exp);
      return sign + man.toFixed(digits) + ' × 10<sup>' + exp + '</sup>';
    }

    /* ========== SIM 1: Lattice ========== */
    const CUBE_EDGES = [
      [0,0,0,1,0,0],[1,0,0,1,1,0],[1,1,0,0,1,0],[0,1,0,0,0,0],
      [0,0,1,1,0,1],[1,0,1,1,1,1],[1,1,1,0,1,1],[0,1,1,0,0,1],
      [0,0,0,0,0,1],[1,0,0,1,0,1],[1,1,0,1,1,1],[0,1,0,0,1,1],
    ];

    const DIAMOND_BONDS = [
      [[0.25,0.25,0.25],[0,0,0]],
      [[0.25,0.25,0.25],[0.5,0.5,0]],
      [[0.25,0.25,0.25],[0.5,0,0.5]],
      [[0.25,0.25,0.25],[0,0.5,0.5]],
      [[0.75,0.75,0.25],[0.5,0.5,0]],
      [[0.75,0.75,0.25],[1,1,0]],
      [[0.75,0.75,0.25],[1,0.5,0.5]],
      [[0.75,0.75,0.25],[0.5,1,0.5]],
      [[0.75,0.25,0.75],[0.5,0,0.5]],
      [[0.75,0.25,0.75],[1,0,1]],
      [[0.75,0.25,0.75],[1,0.5,0.5]],
      [[0.75,0.25,0.75],[0.5,0.5,1]],
      [[0.25,0.75,0.75],[0,0.5,0.5]],
      [[0.25,0.75,0.75],[0.5,1,0.5]],
      [[0.25,0.75,0.75],[0,1,1]],
      [[0.25,0.75,0.75],[0.5,0.5,1]],
    ];

    const LATTICE_META = {
      sc: { n: 1, note: '8 corners × ⅛ = 1 atom inside the conventional cell.' },
      bcc: { n: 2, note: '8 corners × ⅛ + 1 body center = 2 atoms.' },
      fcc: { n: 4, note: '8 corners × ⅛ + 6 faces × ½ = 4 atoms.' },
      diamond: { n: 8, note: 'Two interpenetrating FCC lattices (4 + 4) = 8 atoms. Silicon’s basis.' },
    };

    function corners(a) {
      return [[0,0,0],[a,0,0],[a,a,0],[0,a,0],[0,0,a],[a,0,a],[a,a,a],[0,a,a]];
    }
    function faces(a) {
      const h = a / 2;
      return [[h,h,0],[h,h,a],[h,0,h],[h,a,h],[0,h,h],[a,h,h]];
    }

    function lineTrace(x, y, z, color, width, name) {
      return {
        type: 'scatter3d', mode: 'lines', x, y, z, name,
        line: { color, width },
        hoverinfo: 'skip',
        showlegend: false,
      };
    }

    function cubeWire(a) {
      const x = [], y = [], z = [];
      CUBE_EDGES.forEach((e) => {
        x.push(e[0]*a, e[3]*a, null);
        y.push(e[1]*a, e[4]*a, null);
        z.push(e[2]*a, e[5]*a, null);
      });
      return lineTrace(x, y, z, 'rgba(148,163,184,0.55)', 3, 'cell');
    }

    function renderLattice() {
      const type = document.getElementById('lattice-type').value;
      const a = Number(document.getElementById('lattice-a').value);
      document.getElementById('lattice-a-label').textContent = a.toFixed(2) + ' Å';
      const meta = LATTICE_META[type];
      document.getElementById('lattice-neff').textContent = String(meta.n);
      document.getElementById('lattice-neff-note').textContent = meta.note;
      document.getElementById('lattice-legend').classList.toggle('hidden', type !== 'diamond');

      const traces = [cubeWire(a)];
      const c = corners(a);
      const f = faces(a);

      function atoms(pts, color, name, size) {
        traces.push({
          type: 'scatter3d',
          mode: 'markers',
          x: pts.map((p) => p[0]),
          y: pts.map((p) => p[1]),
          z: pts.map((p) => p[2]),
          name,
          marker: { size: size || 9, color, opacity: 0.95, line: { color: '#e0f2fe', width: 0.6 } },
        });
      }

      if (type === 'sc') {
        atoms(c, '#f8fafc', 'corners (×⅛)');
      } else if (type === 'bcc') {
        atoms(c, '#0284c7', 'corners');
        atoms([[a/2, a/2, a/2]], '#38bdf8', 'body center', 11);
      } else if (type === 'fcc') {
        atoms(c, '#0284c7', 'corners');
        atoms(f, '#38bdf8', 'face centers', 10);
      } else {
        atoms(c.concat(f), '#0284c7', 'FCC A');
        const b = [
          [0.25,0.25,0.25],[0.75,0.75,0.25],[0.75,0.25,0.75],[0.25,0.75,0.75],
        ].map((p) => [p[0]*a, p[1]*a, p[2]*a]);
        atoms(b, '#e11d48', 'FCC B (a/4)');
        const bx = [], by = [], bz = [];
        DIAMOND_BONDS.forEach(([p, q]) => {
          bx.push(p[0]*a, q[0]*a, null);
          by.push(p[1]*a, q[1]*a, null);
          bz.push(p[2]*a, q[2]*a, null);
        });
        traces.push(lineTrace(bx, by, bz, 'rgba(251, 191, 36, 0.55)', 3, 'bonds'));
      }

      if (document.getElementById('lattice-share') && document.getElementById('lattice-share').checked) {
        for (const ox of [-a, 0]) for (const oy of [-a, 0]) for (const oz of [-a, 0]) {
          if (!ox && !oy && !oz) continue;
          const x = [], y = [], z = [];
          CUBE_EDGES.forEach((e) => {
            x.push(ox + e[0] * a, ox + e[3] * a, null);
            y.push(oy + e[1] * a, oy + e[4] * a, null);
            z.push(oz + e[2] * a, oz + e[5] * a, null);
          });
          traces.push({ type: 'scatter3d', mode: 'lines', x, y, z, line: { color: 'rgba(100,116,139,0.3)', width: 2 }, hoverinfo: 'skip', showlegend: false });
        }
        atoms([[0, 0, 0]], '#fbbf24', 'origin corner · 8 cells share it', 13);
      }

      const millerIn = document.getElementById('lattice-miller');
      if (millerIn && typeof parseMiller === 'function') {
        const idx = parseMiller(millerIn.value);
        const kind = document.getElementById('lattice-miller-kind').value;
        if (idx) {
          if (kind === 'plane' && typeof millerPlanePoints === 'function') {
            const P = millerPlanePoints(idx, a, 14);
            if (P.x.length) {
              traces.push({ type: 'scatter3d', mode: 'markers', name: 'Miller plane', x: P.x, y: P.y, z: P.z, marker: { size: 2.2, color: '#fbbf24', opacity: 0.5 } });
            }
          } else {
            const len = Math.hypot(idx[0], idx[1], idx[2]) || 1;
            const s = a * 1.2 / len;
            traces.push({ type: 'scatter3d', mode: 'lines', name: 'direction', x: [0, idx[0]*s], y: [0, idx[1]*s], z: [0, idx[2]*s], line: { color: '#fbbf24', width: 8 } });
          }
        }
      }

      const densEl = document.getElementById('lattice-dens');
      if (densEl) {
        const aCm = a * 1e-8;
        const n = meta.n / Math.pow(aCm, 3);
        densEl.innerHTML = (n / 1e22).toFixed(2) + ' × 10<sup>22</sup> cm<sup>−3</sup>';
      }

      const sharing = document.getElementById('lattice-share') && document.getElementById('lattice-share').checked;
      const lo = sharing ? -a * 1.15 : -0.3;
      const hi = sharing ? a * 1.35 : 7;
      const r = 2.35;
      const layout = baseLayout({
        margin: { l: 0, r: 0, t: 10, b: 0 },
        showlegend: true,
        uirevision: 'lattice-orbit',
        legend: { orientation: 'h', y: -0.02, font: { color: '#94a3b8', size: 11 } },
        scene: {
          bgcolor: 'rgba(15,23,42,0.2)',
          xaxis: { title: 'x (Å)', range: [lo, hi], gridcolor: '#1e293b', zerolinecolor: '#334155', color: '#94a3b8' },
          yaxis: { title: 'y (Å)', range: [lo, hi], gridcolor: '#1e293b', zerolinecolor: '#334155', color: '#94a3b8' },
          zaxis: { title: 'z (Å)', range: [lo, hi], gridcolor: '#1e293b', zerolinecolor: '#334155', color: '#94a3b8' },
          aspectmode: 'cube',
        },
      });
      if (!document.getElementById('plot-lattice').data) {
        layout.scene.camera = {
          eye: { x: r * Math.cos(latticeAngle), y: r * Math.sin(latticeAngle), z: 1.15 },
        };
      }

      Plotly.react('plot-lattice', traces, layout, { responsive: true, displaylogo: false });
    }

    function tickLattice(ts) {
      if (activeSim !== 'lattice' || reduceMotion) return;
      if (latticeOrbiting && ts > latticeGrabUntil) {
        latticeAngle += 0.006;
        const r = 2.35;
        Plotly.relayout('plot-lattice', {
          'scene.camera.eye': {
            x: r * Math.cos(latticeAngle),
            y: r * Math.sin(latticeAngle),
            z: 1.15,
          },
        });
      }
      latticeRaf = requestAnimationFrame(tickLattice);
    }

    function initLattice() {
      if (!inited.lattice) {
        document.getElementById('lattice-type').addEventListener('change', () => {
          const w = document.getElementById('lattice-why');
          if (w) w.textContent = 'Cell type changed the ownership count (1/2/4/8). Density n = N/a³ moved even if a did not.';
          renderLattice();
        });
        document.getElementById('lattice-a').addEventListener('input', () => {
          const w = document.getElementById('lattice-why');
          if (w) w.textContent = 'Larger a → a³ grows fast → fewer atoms per cm³. Watch the number under Atomic density.';
          renderLattice();
        });
        const share = document.getElementById('lattice-share');
        if (share) share.addEventListener('change', () => { renderLattice(); });
        const miller = document.getElementById('lattice-miller');
        if (miller) miller.addEventListener('input', renderLattice);
        const mk = document.getElementById('lattice-miller-kind');
        if (mk) mk.addEventListener('change', renderLattice);
        document.querySelectorAll('[data-lat-miller]').forEach((b) => {
          b.addEventListener('click', () => {
            document.getElementById('lattice-miller').value = b.dataset.latMiller;
            document.getElementById('lattice-miller-kind').value = b.dataset.kind;
            renderLattice();
          });
        });
        const si = document.getElementById('lattice-si');
        if (si) si.addEventListener('click', () => {
          document.getElementById('lattice-type').value = 'diamond';
          document.getElementById('lattice-a').value = '5.431';
          const w = document.getElementById('lattice-why');
          if (w) w.textContent = 'Silicon: diamond cubic, a = 5.431 Å, 8 atoms/cell. Density should land near 5.00 × 10²² cm⁻³.';
          renderLattice();
        });
        const plot = document.getElementById('plot-lattice');
        plot.addEventListener('mousedown', () => { latticeGrabUntil = performance.now() + 5000; });
        plot.addEventListener('touchstart', () => { latticeGrabUntil = performance.now() + 5000; }, { passive: true });
        inited.lattice = true;
      }
      renderLattice();
      if (!reduceMotion) {
        cancelAnimationFrame(latticeRaf);
        latticeRaf = requestAnimationFrame(tickLattice);
      }
    }

    /* ========== SIM 2: Density ========== */
    const MATERIALS = {
      Si: { name: 'Silicon (Si)', a: 5.43, N: 8, structure: 'Diamond', mass: 28.085, massLabel: 'Atomic mass' },
      GaAs: { name: 'Gallium Arsenide (GaAs)', a: 5.65, N: 8, structure: 'Zinc-blende', mass: 72.64, massLabel: 'Average mass' },
      Ge: { name: 'Germanium (Ge)', a: 5.64, N: 8, structure: 'Diamond', mass: 72.63, massLabel: 'Atomic mass' },
    };

    function renderDensity() {
      const m = MATERIALS[document.getElementById('density-material').value];
      const aCm = m.a * 1e-8;
      const V = Math.pow(aCm, 3);
      const n = m.N / V;
      const rho = (m.N * m.mass) / (NA * V);

      document.getElementById('density-specs').innerHTML = [
        ['Structure', m.structure],
        ['Atoms / cell <span class="eq italic">N</span>', String(m.N)],
        ['Lattice constant <span class="eq italic">a</span>', m.a.toFixed(2) + ' Å = ' + aCm.toExponential(2) + ' cm'],
        [m.massLabel, m.mass.toFixed(3) + ' g/mol'],
        ['N<sub>A</sub>', '6.022 × 10<sup>23</sup> mol<sup>−1</sup>'],
      ].map(([k, v]) => '<div class="flex justify-between gap-3 border-b border-white/5 py-1.5"><dt class="text-slate-400">' + k + '</dt><dd class="text-right font-mono text-slate-200">' + v + '</dd></div>').join('');

      document.getElementById('density-steps').innerHTML = [
        {
          t: '1. Volume of the cubic unit cell',
          eq: '<span class="eq italic">V</span><sub>cell</sub> = <span class="eq italic">a</span><sup>3</sup>',
          n: m.a.toFixed(2) + ' Å → ' + aCm.toExponential(3) + ' cm, so <span class="eq italic">V</span><sub>cell</sub> = (' + aCm.toExponential(3) + ')<sup>3</sup> = <strong>' + sciHTML(V, 3) + ' cm<sup>3</sup></strong>',
        },
        {
          t: '2. Volume density of atoms',
          eq: '<span class="eq italic">n</span> = <span class="eq italic">N</span><sub>atoms</sub> / <span class="eq italic">V</span><sub>cell</sub>',
          n: n.toExponential(3) + ' cm<sup>−3</sup>  →  <strong>' + sciHTML(n, 2) + ' atoms/cm<sup>3</sup></strong>' + (m.name.indexOf('Silicon') >= 0 ? ' <span class="text-sky-300">(Si textbook value ≈ 5 × 10<sup>22</sup>)</span>' : ''),
        },
        {
          t: '3. Mass density',
          eq: '<span class="eq italic">ρ</span> = (<span class="eq italic">N</span><sub>atoms</sub> × molar mass) / (N<sub>A</sub> × <span class="eq italic">V</span><sub>cell</sub>)',
          n: '(' + m.N + ' × ' + m.mass + ') / (N<sub>A</sub> × <span class="eq italic">V</span><sub>cell</sub>) = <strong>' + rho.toFixed(3) + ' g/cm<sup>3</sup></strong>',
        },
      ].map((s, i) => '<li class="step-card rounded-xl border border-white/10 bg-slate-950/40 p-4" style="animation-delay:' + (i * 140) + 'ms"><p class="text-xs font-semibold uppercase tracking-wider text-slate-400">' + s.t + '</p><p class="mt-2 text-lg text-sky-100">' + s.eq + '</p><p class="mt-2 text-sm leading-relaxed text-slate-300">' + s.n + '</p></li>').join('');

      document.getElementById('density-n').innerHTML = sciHTML(n, 2);
      document.getElementById('density-rho').textContent = rho.toFixed(3);
      document.getElementById('density-v').innerHTML = sciHTML(V, 2);
    }

    function initDensity() {
      if (!inited.density) {
        document.getElementById('density-material').addEventListener('change', renderDensity);
        inited.density = true;
      }
      renderDensity();
    }

    /* ========== SIM 3: Waves ========== */
    function linspace(a, b, n) {
      const out = new Array(n);
      const step = (b - a) / (n - 1);
      for (let i = 0; i < n; i++) out[i] = a + i * step;
      return out;
    }

    function waveLayout(titleY) {
      return baseLayout({
        margin: { l: 50, r: 16, t: 16, b: 48 },
        legend: { orientation: 'h', y: 1.12, font: { size: 11 } },
        xaxis: { title: 'x (arb.)', gridcolor: '#1e293b', zeroline: false, color: '#94a3b8' },
        yaxis: { title: titleY, gridcolor: '#1e293b', zeroline: false, color: '#94a3b8', range: [-1.7, 1.7] },
      });
    }

    const waveX = linspace(0, 16, 420);
    const waveZero = waveX.map(() => 0);

    function waveValues() {
      const k = Number(document.getElementById('wave-k').value);
      const a = Number(document.getElementById('wave-a').value);
      const V0 = 0.85;
      const plane = waveX.map((xi) => Math.cos(k * xi - waveT));
      const u = waveX.map((xi) => Math.cos(2 * Math.PI * xi / a));
      const bloch = waveX.map((xi, i) => u[i] * Math.cos(k * xi - waveT));
      const V = waveX.map((xi) => -V0 * Math.cos(2 * Math.PI * xi / a));
      return { k, a, plane, bloch, V };
    }

    function renderWaves() {
      const { k, a, plane, bloch, V } = waveValues();
      document.getElementById('wave-k-label').textContent = k.toFixed(2);
      document.getElementById('wave-a-label').textContent = a.toFixed(2);

      const planeTraces = [
        { x: waveX, y: waveZero, name: 'V(x) = 0', line: { color: 'rgba(148,163,184,0.7)', width: 2, dash: 'dash' } },
        { x: waveX, y: plane, name: 'Ψ(x,t) = A cos(kx − ωt)', line: { color: '#38bdf8', width: 2.6 } },
      ];
      const blochTraces = [
        { x: waveX, y: V, name: 'V(x) = −V₀ cos(2πx/a)', fill: 'tozeroy', fillcolor: 'rgba(153,27,27,0.18)', line: { color: '#f87171', width: 1.6 } },
        { x: waveX, y: bloch, name: 'Ψ(x,t) = u(x) cos(kx − ωt)', line: { color: '#7dd3fc', width: 2.6 } },
      ];

      Plotly.react('plot-plane', planeTraces, waveLayout('Ψ, V'), { responsive: true, displaylogo: false });
      Plotly.react('plot-bloch', blochTraces, waveLayout('Ψ, V'), { responsive: true, displaylogo: false });
      waveReady = true;
    }

    function updateWaveTraces() {
      if (!waveReady) return;
      const { plane, bloch } = waveValues();
      Plotly.restyle('plot-plane', { y: [plane] }, [1]);
      Plotly.restyle('plot-bloch', { y: [bloch] }, [1]);
    }

    let waveLast = 0;
    function tickWaves(ts) {
      if (activeSim !== 'waves' || !wavePlaying || reduceMotion) return;
      if (ts - waveLast > 32) {
        waveLast = ts;
        waveT += 0.11;
        updateWaveTraces();
      }
      waveRaf = requestAnimationFrame(tickWaves);
    }

    function setWaveToggle() {
      const btn = document.getElementById('wave-toggle');
      btn.innerHTML = wavePlaying
        ? '<i class="fa-solid fa-pause mr-2"></i>Pause'
        : '<i class="fa-solid fa-play mr-2"></i>Propagate';
    }

    function initWaves() {
      if (!inited.waves) {
        document.getElementById('wave-k').addEventListener('input', () => {
          document.getElementById('wave-k-label').textContent =
            Number(document.getElementById('wave-k').value).toFixed(2);
          if (!wavePlaying) renderWaves();
        });
        document.getElementById('wave-a').addEventListener('input', renderWaves);
        document.getElementById('wave-toggle').addEventListener('click', () => {
          wavePlaying = !wavePlaying;
          setWaveToggle();
          if (wavePlaying) {
            cancelAnimationFrame(waveRaf);
            waveRaf = requestAnimationFrame(tickWaves);
          }
        });
        inited.waves = true;
      }
      wavePlaying = !reduceMotion;
      setWaveToggle();
      renderWaves();
      if (wavePlaying) {
        cancelAnimationFrame(waveRaf);
        waveRaf = requestAnimationFrame(tickWaves);
      }
    }

    /* ========== SIM 4: Bandgap ========== */
    const Ev0 = 0;
    const Ec0 = 1.42;
    const mh = 0.45;
    const me = 0.38;
    let gapMode = 'direct';
    let absorbState = { e: [0, Ev0], photon: null, phonon: null };
    let absorbGen = 0;

    function kOffset() {
      return gapMode === 'direct' ? 0 : 1.5;
    }

    function Ev(k) { return Ev0 - (k * k) / (2 * mh); }
    function Ec(k) { return Ec0 + Math.pow(k - kOffset(), 2) / (2 * me); }

    function setGapMsg(text, kind) {
      const el = document.getElementById('bandgap-msg');
      el.textContent = text;
      el.classList.remove('status-ok', 'status-warn');
      if (kind) el.classList.add(kind);
    }

    function bandgapTraces() {
      const k = linspace(-2.2, 2.8, 400);
      const traces = [
        { x: k, y: k.map(Ev), name: 'Valence band', line: { color: '#ef4444', width: 3 } },
        { x: k, y: k.map(Ec), name: 'Conduction band', line: { color: '#38bdf8', width: 3 } },
        {
          x: [absorbState.e[0]],
          y: [absorbState.e[1]],
          name: 'Electron',
          mode: 'markers',
          marker: { size: 14, color: '#7dd3fc', line: { color: '#e0f2fe', width: 2 } },
        },
      ];
      return traces;
    }

    function bandgapLayout() {
      const annotations = [
        { x: 0, y: Ev0 - 0.15, text: 'VB max', showarrow: false, font: { color: '#fca5a5', size: 11 } },
        { x: kOffset(), y: Ec0 + 0.18, text: 'CB min', showarrow: false, font: { color: '#7dd3fc', size: 11 } },
      ];
      if (absorbState.photon) {
        annotations.push({
          x: absorbState.photon[0], y: absorbState.photon[1],
          ax: absorbState.photon[2], ay: absorbState.photon[3],
          axref: 'x', ayref: 'y', showarrow: true, arrowhead: 3, arrowwidth: 3,
          arrowcolor: '#fbbf24', text: '  ħω (photon)', font: { color: '#fde68a', size: 12 },
        });
      }
      if (absorbState.phonon) {
        annotations.push({
          x: absorbState.phonon[0], y: absorbState.phonon[1],
          ax: absorbState.phonon[2], ay: absorbState.phonon[3],
          axref: 'x', ayref: 'y', showarrow: true, arrowhead: 3, arrowwidth: 3,
          arrowcolor: '#fb7185', text: '  phonon ħΩ', font: { color: '#fda4af', size: 12 },
        });
      }
      return baseLayout({
        margin: { l: 60, r: 20, t: 24, b: 50 },
        legend: { orientation: 'h', y: 1.08 },
        annotations,
        shapes: [
          { type: 'line', x0: 0, x1: 0, y0: -1.6, y1: 3.2, line: { color: 'rgba(148,163,184,0.25)', dash: 'dot' } },
        ],
        xaxis: { title: 'Crystal momentum k (arb.)', gridcolor: '#1e293b', zeroline: false, range: [-2.3, 2.9] },
        yaxis: { title: 'Energy E (eV, schematic)', gridcolor: '#1e293b', zeroline: false, range: [-1.6, 3.2] },
      });
    }

    function renderBandgap() {
      Plotly.react('plot-bandgap', bandgapTraces(), bandgapLayout(), { responsive: true, displaylogo: false });
    }

    function resetAbsorb() {
      absorbGen += 1;
      clearTimeout(absorbTimer);
      absorbState = { e: [0, Ev0], photon: null, phonon: null };
      document.getElementById('absorb-btn').disabled = false;
      setGapMsg('Valence electron sits at k = 0. A photon supplies energy Eg with essentially zero momentum — the arrow is vertical.');
      renderBandgap();
    }

    function sleep(ms) {
      return new Promise((resolve) => { absorbTimer = setTimeout(resolve, ms); });
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    async function slideElectron(from, to, ms, onTick) {
      const steps = 22;
      const dt = ms / steps;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        absorbState.e = [lerp(from[0], to[0], t), lerp(from[1], to[1], t)];
        if (onTick) onTick(t);
        renderBandgap();
        await sleep(dt);
      }
    }

    async function runAbsorb() {
      const gen = ++absorbGen;
      clearTimeout(absorbTimer);
      const btn = document.getElementById('absorb-btn');
      btn.disabled = true;
      const off = kOffset();
      absorbState = { e: [0, Ev0], photon: null, phonon: null };
      renderBandgap();
      setGapMsg('Photon incident: vertical transition, Δk ≈ 0, energy Eg = Ec0 − Ev0.');

      await slideElectron([0, Ev0], [0, Ec0], 520, (t) => {
        absorbState.photon = [0, lerp(Ev0, Ec0, t), 0, Ev0];
      });
      if (gen !== absorbGen) return;

      if (gapMode === 'direct') {
        setGapMsg('Transition Successful! Fast & efficient. The photon lands on the conduction-band minimum (same k).', 'status-ok');
      } else {
        setGapMsg('The photon hits a forbidden gap state at k = 0 — that is not the Si CB minimum.');
        await sleep(280);
        if (gen !== absorbGen) return;
        await slideElectron([0, Ec0], [off, Ec0], 640, (t) => {
          absorbState.phonon = [lerp(0, off, t), Ec0, 0, Ec0];
        });
        if (gen !== absorbGen) return;
        setGapMsg('Phonon Required to Conserve Momentum! Slow transition, energy lost as heat.', 'status-warn');
      }
      btn.disabled = false;
    }

    function initBandgap() {
      if (!inited.bandgap) {
        document.querySelectorAll('.gap-mode').forEach((b) => {
          b.addEventListener('click', () => {
            gapMode = b.dataset.gap;
            document.querySelectorAll('.gap-mode').forEach((x) => {
              x.classList.remove('bg-electron', 'text-white');
              x.classList.add('text-slate-300');
            });
            b.classList.add('bg-electron', 'text-white');
            b.classList.remove('text-slate-300');
            resetAbsorb();
          });
        });
        document.getElementById('absorb-btn').addEventListener('click', runAbsorb);
        document.getElementById('reset-absorb').addEventListener('click', resetAbsorb);
        inited.bandgap = true;
      }
      resetAbsorb();
    }

    /* ========== SIM 5: Fermi ========== */
    const EvF = 0;
    const EcF = 1.12;
    const Ei = 0.56;

    function fermi(E, EF, T) {
      const x = (E - EF) / (kB * T);
      if (x > 80) return 0;
      if (x < -80) return 1;
      return 1 / (1 + Math.exp(x));
    }

    function Nc(E) { return E > EcF ? Math.sqrt(E - EcF) : 0; }
    function Nv(E) { return E < EvF ? Math.sqrt(EvF - E) : 0; }

    function trapz(y, dx) {
      let s = 0;
      for (let i = 1; i < y.length; i++) s += 0.5 * (y[i] + y[i - 1]) * dx;
      return s;
    }

    function energyAxisLayout(xtitle, xrange) {
      return baseLayout({
        margin: { l: 52, r: 12, t: 20, b: 46 },
        showlegend: false,
        xaxis: { title: xtitle, gridcolor: '#1e293b', zeroline: false, range: xrange },
        yaxis: { title: 'Energy E (eV)', gridcolor: '#1e293b', zeroline: false, range: [-1.15, 2.25] },
      });
    }

    function bandShapes(EF) {
      return [
        { type: 'rect', xref: 'paper', x0: 0, x1: 1, y0: EvF, y1: EcF, fillcolor: 'rgba(15,23,42,0.35)', line: { width: 0 } },
        { type: 'line', xref: 'paper', x0: 0, x1: 1, y0: EcF, y1: EcF, line: { color: '#38bdf8', width: 1.4, dash: 'dash' } },
        { type: 'line', xref: 'paper', x0: 0, x1: 1, y0: EvF, y1: EvF, line: { color: '#f87171', width: 1.4, dash: 'dash' } },
        { type: 'line', xref: 'paper', x0: 0, x1: 1, y0: EF, y1: EF, line: { color: '#fbbf24', width: 2 } },
      ];
    }

    function renderFermi() {
      const T = Number(document.getElementById('fermi-t').value);
      const d = Number(document.getElementById('fermi-d').value);
      document.getElementById('fermi-t-label').textContent = T + ' K';

      const EF = Ei + d * 0.52;
      let dtype = 'Intrinsic';
      let dclass = 'text-amber-300';
      if (d > 0.12) { dtype = 'N-type · EF → Ec'; dclass = 'text-sky-300'; }
      else if (d < -0.12) { dtype = 'P-type · EF → Ev'; dclass = 'text-red-300'; }
      const lab = document.getElementById('fermi-d-label');
      lab.textContent = dtype;
      lab.className = 'font-mono ' + dclass;

      const E = linspace(-1.1, 2.2, 500);
      const dx = E[1] - E[0];
      const nc = E.map(Nc);
      const nv = E.map(Nv);
      const f = E.map((e) => fermi(e, EF, T));
      const nf = E.map((e, i) => nc[i] * f[i]);
      const pf = E.map((e, i) => nv[i] * (1 - f[i]));

      document.getElementById('fermi-ef').textContent = EF.toFixed(3) + ' eV';
      document.getElementById('fermi-n').textContent = trapz(nf, dx).toExponential(2);
      document.getElementById('fermi-p').textContent = trapz(pf, dx).toExponential(2);

      const annot = (text, y, color) => ({ x: 1, y, xref: 'paper', xanchor: 'right', text, showarrow: false, font: { color, size: 10 } });

      const dosLayout = energyAxisLayout('N(E) (arb.)', [0, 1.35]);
      dosLayout.shapes = bandShapes(EF);
      dosLayout.annotations = [annot('Ec', EcF + 0.08, '#7dd3fc'), annot('Ev', EvF - 0.12, '#fca5a5'), annot('EF', EF + 0.08, '#fde68a')];

      const fdLayout = energyAxisLayout('f(E)', [-0.05, 1.08]);
      fdLayout.shapes = bandShapes(EF);

      const npLayout = energyAxisLayout('occupation × DOS', [0, 0.55]);
      npLayout.shapes = bandShapes(EF);
      npLayout.showlegend = true;
      npLayout.legend = { orientation: 'h', y: 1.12, font: { size: 10 } };

      Plotly.react('plot-dos', [
        { x: nc, y: E, name: 'Nc', fill: 'tozerox', fillcolor: 'rgba(2,132,199,0.25)', line: { color: '#38bdf8', width: 2 } },
        { x: nv, y: E, name: 'Nv', fill: 'tozerox', fillcolor: 'rgba(153,27,27,0.28)', line: { color: '#f87171', width: 2 } },
      ], dosLayout, { responsive: true, displaylogo: false });

      Plotly.react('plot-fd', [
        { x: f, y: E, name: 'f(E)', line: { color: '#fbbf24', width: 2.8 } },
      ], fdLayout, { responsive: true, displaylogo: false });

      Plotly.react('plot-np', [
        { x: nf, y: E, name: 'n(E) = Nc f', fill: 'tozerox', fillcolor: 'rgba(2,132,199,0.45)', line: { color: '#38bdf8', width: 2 } },
        { x: pf, y: E, name: 'p(E) = Nv (1−f)', fill: 'tozerox', fillcolor: 'rgba(153,27,27,0.5)', line: { color: '#e11d48', width: 2 } },
      ], npLayout, { responsive: true, displaylogo: false });
    }

    function initFermi() {
      if (!inited.fermi) {
        document.getElementById('fermi-t').addEventListener('input', renderFermi);
        document.getElementById('fermi-d').addEventListener('input', renderFermi);
        document.getElementById('fermi-sweep').addEventListener('click', sweepFermi);
        inited.fermi = true;
      }
      renderFermi();
    }

    function sweepFermi() {
      if (reduceMotion) return;
      cancelAnimationFrame(fermiSweepRaf);
      const slider = document.getElementById('fermi-d');
      let d = -1;
      slider.value = String(d);
      renderFermi();
      const start = performance.now();
      function step(ts) {
        if (activeSim !== 'fermi') return;
        const t = Math.min(1, (ts - start) / 4200);
        d = -1 + 2 * t;
        slider.value = d.toFixed(2);
        renderFermi();
        if (t < 1) fermiSweepRaf = requestAnimationFrame(step);
      }
      fermiSweepRaf = requestAnimationFrame(step);
    }

    /* ========== SIM 6: LED ========== */
    const HC_EV_NM = 1239.84193;
    const LED_MATS = [
      { id: 'GaAs', label: 'GaAs', eg: 1.42, gap: 'direct', hint: 'IR' },
      { id: 'AlGaInP', label: 'AlGaInP', eg: 2.00, gap: 'direct', hint: 'red–amber' },
      { id: 'GaP', label: 'GaP', eg: 2.26, gap: 'indirect', hint: 'green' },
      { id: 'InGaN', label: 'InGaN', eg: 2.70, gap: 'direct', hint: 'blue' },
      { id: 'GaN', label: 'GaN', eg: 3.39, gap: 'direct', hint: 'near-UV' },
    ];
    let ledDirect = true;
    let ledGen = 0;
    let ledState = { eK: 0, eE: 1.9, hole: true, photon: null, phonon: null };

    function wavelengthColor(nm) {
      let r = 0, g = 0, b = 0, name = 'infrared', zone = 'ir';
      if (nm < 380) { r = 90; g = 0; b = 160; name = 'near-UV'; zone = 'uv'; }
      else if (nm < 440) { r = Math.round(255 * (440 - nm) / 60); b = 255; name = nm < 420 ? 'violet' : 'blue-violet'; zone = 'vis'; }
      else if (nm < 490) { g = Math.round(255 * (nm - 440) / 50); b = 255; name = 'blue'; zone = 'vis'; }
      else if (nm < 510) { g = 255; b = Math.round(255 * (510 - nm) / 20); name = 'cyan'; zone = 'vis'; }
      else if (nm < 580) { r = Math.round(255 * (nm - 510) / 70); g = 255; name = nm < 560 ? 'green' : 'yellow-green'; zone = 'vis'; }
      else if (nm < 645) { r = 255; g = Math.round(255 * (645 - nm) / 65); name = nm < 600 ? 'yellow' : (nm < 625 ? 'orange' : 'red-orange'); zone = 'vis'; }
      else if (nm <= 750) { r = 255; g = Math.round(40 * (750 - nm) / 105); name = 'red'; zone = 'vis'; }
      else { r = 90; g = 16; b = 16; name = 'infrared'; zone = 'ir'; }
      if (nm >= 380 && nm < 420) { const f = (nm - 380) / 40; r = Math.round(r * (0.35 + 0.65 * f)); g = Math.round(g * (0.35 + 0.65 * f)); b = Math.round(b * (0.35 + 0.65 * f)); }
      if (nm > 700 && nm <= 750) { const f = (750 - nm) / 50; r = Math.round(r * (0.35 + 0.65 * f)); }
      return { r, g, b, name, zone, css: 'rgb(' + r + ',' + g + ',' + b + ')' };
    }

    function ledOptics() {
      const Eg = Number(document.getElementById('led-eg').value);
      const lam = HC_EV_NM / Eg;
      return { Eg, lam, col: wavelengthColor(lam) };
    }

    function setLedGapMode(mode) {
      ledDirect = mode === 'direct';
      document.querySelectorAll('.led-gap-mode').forEach((b) => {
        const on = b.dataset.ledGap === mode;
        b.classList.toggle('bg-electron', on);
        b.classList.toggle('text-white', on);
        b.classList.toggle('text-slate-300', !on);
      });
    }

    function resetLedCarriers() {
      const { Eg } = ledOptics();
      ledState = { eK: ledDirect ? 0 : 1.45, eE: Eg, hole: true, photon: null, phonon: null };
    }

    function renderLedReadout() {
      const { Eg, lam, col } = ledOptics();
      document.getElementById('led-eg-label').textContent = Eg.toFixed(2) + ' eV';
      document.getElementById('led-eg-read').textContent = Eg.toFixed(2) + ' eV';
      document.getElementById('led-eph-read').textContent = Eg.toFixed(2) + ' eV';
      document.getElementById('led-lam-read').textContent = lam.toFixed(0) + ' nm';
      document.getElementById('led-color-read').textContent = col.name;
      document.getElementById('led-vf-read').textContent = '≈ ' + Eg.toFixed(2) + ' V';
      document.getElementById('led-vf-bar-label').textContent = Eg.toFixed(2) + ' V';
      document.getElementById('led-vf-bar').style.width = Math.min(100, (Eg / 3.5) * 100) + '%';
      document.getElementById('led-vf-bar').style.background = col.css;

      const bulb = document.getElementById('led-bulb');
      const weak = !ledDirect;
      bulb.classList.toggle('is-ir', col.zone === 'ir');
      bulb.classList.toggle('is-uv', col.zone === 'uv');
      bulb.classList.toggle('is-weak', weak);
      bulb.style.background = col.css;
      const glow = weak || col.zone === 'ir' ? 18 : 42;
      bulb.style.boxShadow = '0 0 ' + glow + 'px ' + col.css + ', 0 0 ' + (glow * 2) + 'px ' + col.css;
      document.getElementById('led-bulb-cap').textContent =
        (weak ? 'dim · inefficient  ·  ' : '') + lam.toFixed(0) + ' nm · ' + col.name;
    }

    function drawLedBands() {
      const { Eg, col } = ledOptics();
      const svg = document.getElementById('led-bands');
      const Emin = -1.2, Emax = 4.4;
      const xmin = 68, xmax = 500, ymin = 28, ymax = 308;
      const kmin = -2.15, kmax = 2.55;
      const koff = ledDirect ? 0 : 1.45;
      const xk = (k) => xmin + (k - kmin) / (kmax - kmin) * (xmax - xmin);
      const yE = (E) => ymax - (E - Emin) / (Emax - Emin) * (ymax - ymin);
      const Ev = (k) => -0.2 * k * k;
      const Ec = (k) => Eg + 0.2 * Math.pow(k - koff, 2);

      function pathOf(fn) {
        const pts = [];
        for (let i = 0; i <= 80; i++) {
          const k = kmin + (kmax - kmin) * i / 80;
          pts.push((i ? 'L' : 'M') + xk(k).toFixed(1) + ',' + yE(fn(k)).toFixed(1));
        }
        return pts.join(' ');
      }

      const e = ledState;
      const photon = e.photon;
      let extra = '';
      if (e.phonon) {
        extra += '<line x1="' + xk(1.45) + '" y1="' + yE(Eg) + '" x2="' + xk(e.phonon) + '" y2="' + yE(Eg) + '" stroke="#fb7185" stroke-width="2.4" marker-end="url(#led-arr-ph)"/>';
        extra += '<text x="' + xk((1.45 + e.phonon) / 2) + '" y="' + (yE(Eg) - 10) + '" fill="#fda4af" font-size="11" text-anchor="middle" font-family="IBM Plex Sans, sans-serif">phonon ħΩ</text>';
      }
      if (photon) {
        extra += '<circle cx="' + xk(photon.k) + '" cy="' + yE(photon.E) + '" r="7" fill="' + col.css + '" stroke="#fff7ed" stroke-width="1.2" opacity="' + photon.a + '"/>';
        extra += '<text x="' + (xk(photon.k) + 12) + '" y="' + (yE(photon.E) - 8) + '" fill="' + col.css + '" font-size="12" font-family="IBM Plex Serif, serif" font-style="italic">ħω ≈ Eg</text>';
      }

      svg.innerHTML = [
        '<defs><marker id="led-arr-ph" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#fb7185"/></marker></defs>',
        '<text x="16" y="22" fill="#94a3b8" font-size="11" font-family="IBM Plex Sans, sans-serif">E</text>',
        '<line x1="' + xmin + '" y1="' + ymin + '" x2="' + xmin + '" y2="' + ymax + '" stroke="#334155" stroke-width="1.2"/>',
        '<line x1="' + xmin + '" y1="' + ymax + '" x2="' + xmax + '" y2="' + ymax + '" stroke="#334155" stroke-width="1.2"/>',
        '<text x="' + (xmin + xmax) / 2 + '" y="332" fill="#64748b" font-size="11" text-anchor="middle" font-family="IBM Plex Sans, sans-serif">crystal momentum k</text>',
        '<line x1="' + xk(0) + '" y1="' + ymin + '" x2="' + xk(0) + '" y2="' + ymax + '" stroke="rgba(148,163,184,0.18)" stroke-dasharray="3 5"/>',
        '<path d="' + pathOf(Ev) + '" fill="none" stroke="#ef4444" stroke-width="3"/>',
        '<path d="' + pathOf(Ec) + '" fill="none" stroke="#38bdf8" stroke-width="3"/>',
        '<line x1="' + (xmin + 8) + '" y1="' + yE(0) + '" x2="' + (xmin + 8) + '" y2="' + yE(Eg) + '" stroke="' + col.css + '" stroke-width="2" stroke-dasharray="4 3"/>',
        '<text x="' + (xmin + 14) + '" y="' + yE(Eg / 2) + '" fill="' + col.css + '" font-size="12" font-family="IBM Plex Serif, serif" font-style="italic">Eg</text>',
        '<text x="' + (xk(koff) + 8) + '" y="' + (yE(Eg) - 12) + '" fill="#7dd3fc" font-size="11" font-family="IBM Plex Sans, sans-serif">CB min</text>',
        '<text x="' + (xk(0) + 8) + '" y="' + (yE(0) + 16) + '" fill="#fca5a5" font-size="11" font-family="IBM Plex Sans, sans-serif">VB max</text>',
        extra,
        e.hole ? '<circle cx="' + xk(0) + '" cy="' + yE(0) + '" r="8" fill="none" stroke="#e11d48" stroke-width="2.5"/><circle cx="' + xk(0) + '" cy="' + yE(0) + '" r="3" fill="#e11d48"/>' : '',
        '<circle cx="' + xk(e.eK) + '" cy="' + yE(e.eE) + '" r="8" fill="#7dd3fc" stroke="#e0f2fe" stroke-width="1.6"/>',
      ].join('');
    }

    function renderLed() {
      renderLedReadout();
      drawLedBands();
    }

    function setLedMsg(text, kind) {
      const el = document.getElementById('led-msg');
      el.textContent = text;
      el.classList.remove('status-ok', 'status-warn');
      if (kind) el.classList.add(kind);
    }

    function ledSleep(ms) {
      return new Promise((resolve) => { ledTimer = setTimeout(resolve, ms); });
    }

    async function runLedRecombine() {
      const gen = ++ledGen;
      const btn = document.getElementById('led-recombine');
      btn.disabled = true;
      resetLedCarriers();
      renderLed();
      const { Eg, col } = ledOptics();
      const steps = 22;

      if (!ledDirect) {
        setLedMsg('Indirect gap: the CB minimum is offset in k. A phonon must supply Δk before a photon can be emitted — usually the energy just heats the lattice.');
        for (let i = 1; i <= steps; i++) {
          if (gen !== ledGen) return;
          const t = i / steps;
          ledState.phonon = 1.45 * (1 - t);
          ledState.eK = 1.45 * (1 - t);
          ledState.eE = Eg;
          drawLedBands();
          await ledSleep(22);
        }
      } else {
        setLedMsg('Direct gap: electron and hole already share k. The energy difference can leave as a single photon.');
        await ledSleep(180);
      }
      if (gen !== ledGen) return;

      for (let i = 1; i <= steps; i++) {
        if (gen !== ledGen) return;
        const t = i / steps;
        ledState.eK = 0;
        ledState.eE = Eg * (1 - t);
        ledState.photon = { k: 0.15 + t * 0.9, E: Eg * (0.55 + 0.7 * t), a: 0.3 + 0.7 * t };
        drawLedBands();
        await ledSleep(20);
      }
      if (gen !== ledGen) return;

      ledState.hole = false;
      const bulb = document.getElementById('led-bulb');
      bulb.classList.remove('led-flash');
      void bulb.offsetWidth;
      bulb.classList.add('led-flash');
      if (ledDirect && col.zone === 'vis') {
        setLedMsg('Recombination released ≈ ' + Eg.toFixed(2) + ' eV as a ' + col.name + ' photon (λ = ' + (HC_EV_NM / Eg).toFixed(0) + ' nm).', 'status-ok');
      } else if (!ledDirect) {
        setLedMsg('A photon is possible but rare. Indirect recombination is slow; most events dump energy as phonons — heat, not light.', 'status-warn');
      } else if (col.zone === 'ir') {
        setLedMsg('The photon is real — just not for your eye. GaAs-like gaps land in the near infrared.');
      } else {
        setLedMsg('Near-UV: the photon is higher energy than the violet edge of vision.');
      }
      renderLed();
      await ledSleep(700);
      if (gen !== ledGen) return;
      resetLedCarriers();
      renderLed();
      btn.disabled = false;
    }

    function initLed() {
      if (!inited.led) {
        const box = document.getElementById('led-presets');
        LED_MATS.forEach((m) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'preset-btn cursor-pointer rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5';
          b.textContent = m.label;
          b.title = m.hint + ' · ' + m.eg.toFixed(2) + ' eV';
          b.addEventListener('click', () => {
            document.getElementById('led-eg').value = String(m.eg);
            setLedGapMode(m.gap);
            document.querySelectorAll('#led-presets .preset-btn').forEach((x) => x.classList.remove('active'));
            b.classList.add('active');
            ledGen += 1;
            document.getElementById('led-recombine').disabled = false;
            resetLedCarriers();
            renderLed();
            setLedMsg(m.label + ' · E_g ≈ ' + m.eg.toFixed(2) + ' eV (' + m.hint + '). Alloy fraction and well design still move the real LED peak.');
          });
          box.appendChild(b);
        });
        document.getElementById('led-eg').addEventListener('input', () => {
          document.querySelectorAll('#led-presets .preset-btn').forEach((x) => x.classList.remove('active'));
          ledGen += 1;
          document.getElementById('led-recombine').disabled = false;
          resetLedCarriers();
          renderLed();
          setLedMsg('Larger E_g → larger photon energy → shorter λ. The LED color is the gap, read in nanometers.');
        });
        document.querySelectorAll('.led-gap-mode').forEach((b) => {
          b.addEventListener('click', () => {
            setLedGapMode(b.dataset.ledGap);
            ledGen += 1;
            document.getElementById('led-recombine').disabled = false;
            resetLedCarriers();
            renderLed();
          });
        });
        document.getElementById('led-recombine').addEventListener('click', runLedRecombine);
        inited.led = true;
      }
      setLedGapMode(ledDirect ? 'direct' : 'indirect');
      resetLedCarriers();
      renderLed();
      setLedMsg('An injected electron sits in the conduction band. Recombination can release that gap energy as a photon.');
    }
